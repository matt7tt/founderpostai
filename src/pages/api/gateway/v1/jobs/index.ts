import type { NextApiRequest, NextApiResponse } from 'next';
import { getJSON, redis } from '@/lib/gateway/redis';
import { randomId, outboundHeaders, decrypt } from '@/lib/gateway/crypto';
import {
  authedSite,
  saveJob,
  getJob,
  accountFor,
  ensureAccountPeriod,
  Job,
  Site,
} from '@/lib/gateway/store';
import { validateSiteUrls } from '@/lib/gateway/url';

export const config = { api: { bodyParser: false } };
export const maxDuration = 60;

async function rawBody(req: NextApiRequest): Promise<string> {
  const chunks: Buffer[] = [];
  let length = 0;
  for await (const c of req) {
    length += c.length;
    if (length > 1024 * 1024) throw new Error('REQUEST_TOO_LARGE');
    chunks.push(c);
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function getAnthropicKey(site: Site): Promise<{ key: string; byok: boolean } | null> {
  if (site.billing_mode === 'byok') {
    const rec = await getJSON<any>(`pkey:${site.site_id}`);
    if (!rec) return null;
    return { key: decrypt(rec.encrypted), byok: true };
  }
  const key = process.env.ANTHROPIC_API_KEY;
  return key ? { key, byok: false } : null;
}

function buildPrompt(p: any, brand: any): string {
  return `You are an SEO assistant for a WordPress site. Analyze this post and return ONLY JSON.

Post title: ${p.title}
Post content: ${p.content}
Excerpt: ${p.excerpt || '(none)'}
Current meta title: ${p.current_meta?.title || '(none)'}
Current meta description: ${p.current_meta?.description || '(none)'}
Possible internal link targets (closed set, ONLY use these ids): ${JSON.stringify((p.link_targets || []).map((t: any) => ({ id: t.id, title: t.title })))}
Brand context: ${JSON.stringify(brand || {})}

Return JSON with exactly this shape:
{"suggestions":[
  {"field":"title","value":"...","rationale":"one sentence about the reader"},
  {"field":"description","value":"...","rationale":"one sentence about the reader"},
  {"field":"internal_links","value":[{"target_id":<id>,"anchor":"<exact phrase from the post body>"}],"rationale":"one sentence"}
]}
Rules: title max 60 chars, description max 155 chars, anchor must appear VERBATIM in the post content, target_id must be from the closed set (pick 0-2 links), rationale is one plain sentence about the reader (never mention keyword density).`;
}

function parseSuggestions(text: string, p: any) {
  let json: any;
  try {
    json = JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch {
    const error: any = new Error('The AI provider returned malformed JSON.');
    error.status = 502;
    throw error;
  }
  const validIds = new Set((p.link_targets || []).map((t: any) => t.id));
  if (!Array.isArray(json.suggestions)) {
    const error: any = new Error('The AI provider returned an invalid suggestion list.');
    error.status = 502;
    throw error;
  }

  const suggestions = json.suggestions
    .filter((s: any) => s && ['title', 'description', 'internal_links'].includes(s.field))
    .slice(0, 3)
    .map((s: any) => {
      if (s.field === 'internal_links') {
        return {
          field: s.field,
          value: (Array.isArray(s.value) ? s.value : [])
            .filter(
              (l: any) =>
                l &&
                validIds.has(l.target_id) &&
                typeof l.anchor === 'string' &&
                l.anchor.length <= 200 &&
                p.content.includes(l.anchor)
            )
            .slice(0, 2),
          rationale: typeof s.rationale === 'string' ? s.rationale.slice(0, 500) : '',
        };
      }
      return {
        field: s.field,
        value: typeof s.value === 'string' ? s.value : '',
        rationale: typeof s.rationale === 'string' ? s.rationale.slice(0, 500) : '',
      };
    });

  if (
    !suggestions.some(
      (suggestion: any) =>
        (suggestion.field === 'title' || suggestion.field === 'description') &&
        typeof suggestion.value === 'string' &&
        suggestion.value.trim() !== ''
    )
  ) {
    const error: any = new Error('The AI provider returned no usable metadata suggestions.');
    error.status = 502;
    throw error;
  }

  return suggestions;
}

async function runAnalysis(payload: any, brand: any, apiKey: string): Promise<any> {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: buildPrompt(payload, brand) }],
    }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    const err: any = new Error(e?.error?.message || `Provider error ${r.status}`);
    err.status = r.status;
    throw err;
  }
  const d = await r.json();
  return { suggestions: parseSuggestions(d.content?.[0]?.text || '{}', payload) };
}

async function deliverCallback(site: Site, body: any) {
  const raw = JSON.stringify(body);
  try {
    // Re-resolve before every outbound request. A domain that was public when
    // it registered must not become an SSRF route to a private service later.
    const { callbackUrl } = await validateSiteUrls(site.site_url, site.callback_url);
    const response = await fetch(callbackUrl, {
      method: 'POST',
      headers: outboundHeaders(site.site_secret, raw, site.site_id),
      body: raw,
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error: any) {
    console.warn(
      `Callback delivery failed: site=${site.site_id} job=${body?.job_id || 'unknown'} error=${error?.message || 'unknown'}`
    );
    // Firewalled sites use the GET /v1/jobs/{id} reconcile poll — job record is terminal.
  }
}

async function duplicateJobResponse(jobId: string, site: Site, res: NextApiResponse) {
  const job = await getJob(jobId);
  if (!job || job.site_id !== site.site_id) {
    return res.status(202).json({ job_id: jobId, estimated_credits: 1, duplicate: true });
  }
  return res.status(202).json({
    job_id: job.job_id,
    status: job.status,
    result: job.result,
    error: job.error,
    credits_charged: job.credits_charged,
    account:
      job.status === 'completed' || job.status === 'failed'
        ? await accountFor(site)
        : undefined,
    estimated_credits: 1,
    duplicate: true,
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  let raw: string;
  try {
    raw = await rawBody(req);
  } catch (error: any) {
    return res.status(error.message === 'REQUEST_TOO_LARGE' ? 413 : 400).json({ error: 'Request body is too large' });
  }
  const site = await authedSite(req, res, raw);
  if (!site) return;

  let body: any;
  try {
    body = JSON.parse(raw || '{}');
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const { type, payload, idempotency_key, brand_context } = body;
  if (type !== 'seo.analyze_post') return res.status(400).json({ error: `Unknown job type: ${type}` });
  if (
    typeof idempotency_key !== 'string' ||
    !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(idempotency_key)
  ) {
    return res.status(400).json({ error: 'Invalid idempotency_key' });
  }
  if (
    !payload ||
    typeof payload !== 'object' ||
    typeof payload.title !== 'string' ||
    typeof payload.content !== 'string' ||
    payload.content.length > 500_000 ||
    !Array.isArray(payload.link_targets) ||
    payload.link_targets.length > 100 ||
    (brand_context !== undefined && (brand_context === null || typeof brand_context !== 'object'))
  ) {
    return res.status(400).json({ error: 'Invalid job payload' });
  }

  // Idempotency: a duplicate submit returns the existing job, no double charge.
  const idemKey = `idem:${site.site_id}:${idempotency_key}`;
  const existing = await getJSON<string>(idemKey);
  if (existing) {
    return duplicateJobResponse(existing, site, res);
  }

  let anthropic: Awaited<ReturnType<typeof getAnthropicKey>>;
  try {
    anthropic = await getAnthropicKey(site);
  } catch {
    return res.status(422).json({
      error: 'The stored provider key could not be read. Remove it and add it again.',
    });
  }
  if (!anthropic) {
    if (site.billing_mode === 'byok') {
      return res.status(422).json({ error: 'No AI provider key on file. Add one or switch to managed credits.' });
    }
    return res.status(503).json({ error: 'Managed AI processing is temporarily unavailable.' });
  }

  await ensureAccountPeriod(site);

  const jobId = randomId('job');
  const claimed = await redis('SET', idemKey, JSON.stringify(jobId), 'NX', 'EX', 600);
  if (!claimed) {
    const concurrent = await getJSON<string>(idemKey);
    if (concurrent) return duplicateJobResponse(concurrent, site, res);
    return res.status(503).json({ error: 'Could not resolve the concurrent job. Please retry.' });
  }

  let creditReserved = false;
  if (!anthropic.byok) {
    const remaining = parseInt(await redis('DECR', `credits:${site.site_id}`), 10);
    if (remaining < 0) {
      await redis('INCR', `credits:${site.site_id}`);
      await redis('DEL', idemKey);
      return res.status(402).json({ error: 'Out of credits for this period. Upgrade or add your own provider key.' });
    }
    creditReserved = true;
  }

  const job: Job = {
    job_id: jobId,
    site_id: site.site_id,
    type,
    status: 'processing',
    idempotency_key,
    callback_url: site.callback_url,
    credits_charged: 0,
    created_at: new Date().toISOString(),
  };
  try {
    await saveJob(job);
    await redis('EXPIRE', idemKey, 60 * 60 * 24 * 7);
  } catch (error) {
    if (creditReserved) await redis('INCR', `credits:${site.site_id}`);
    await redis('DEL', idemKey);
    throw error;
  }

  // Process inline (MVP): fast enough for single posts, and the reconcile poll
  // always finds a terminal state even if the callback is blocked.
  try {
    job.result = await runAnalysis(payload, brand_context, anthropic.key);
    job.status = 'completed';
    job.credits_charged = 1;
  } catch (e: any) {
    if (creditReserved) {
      await redis('INCR', `credits:${site.site_id}`);
      creditReserved = false;
    }
    job.status = 'failed';
    job.error = e.message || 'Analysis failed';
    try {
      await saveJob(job);
    } catch {
      await redis('DEL', idemKey);
      return res.status(503).json({ error: 'Could not persist the failed job. Please retry.' });
    }

    // Let the WordPress queue retry rate limits and provider outages. Keeping
    // the idempotency record would only return this failed job forever.
    if (e.status === 429 || e.status >= 500 || e.name === 'TimeoutError') {
      await redis('DEL', idemKey);
      return res.status(e.status === 429 ? 429 : 503).json({ error: job.error });
    }

    const account = await accountFor(site);
    await deliverCallback(site, {
      idempotency_key,
      job_id: job.job_id,
      type,
      status: 'failed',
      credits_charged: 0,
      error: job.error,
      account,
    });
    if ([401, 402, 403].includes(e.status)) {
      return res.status(422).json({ job_id: job.job_id, error: job.error });
    }
    return res.status(202).json({
      job_id: job.job_id,
      status: 'failed',
      error: job.error,
      credits_charged: 0,
      account,
      estimated_credits: 1,
    });
  }

  try {
    await saveJob(job);
  } catch {
    if (creditReserved) {
      await redis('INCR', `credits:${site.site_id}`);
    }
    await redis('DEL', idemKey);
    return res.status(503).json({ error: 'Could not persist the completed job. Please retry.' });
  }
  if (anthropic.byok) {
    try {
      await redis('INCR', `actions:${site.site_id}`);
    } catch {
      // The completed result is already durable. A usage-counter outage must
      // not delete idempotency and cause the customer's model call to repeat.
    }
  }
  const account = await accountFor(site);
  await deliverCallback(site, {
    idempotency_key,
    job_id: job.job_id,
    type,
    status: 'completed',
    credits_charged: job.credits_charged,
    result: job.result,
    account,
  });

  return res.status(202).json({
    job_id: job.job_id,
    status: 'completed',
    result: job.result,
    credits_charged: job.credits_charged,
    account,
    estimated_credits: 1,
  });
}
