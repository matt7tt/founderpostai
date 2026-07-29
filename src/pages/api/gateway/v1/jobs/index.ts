import type { NextApiRequest, NextApiResponse } from 'next';
import { getJSON, setJSON, redis } from '@/lib/gateway/redis';
import { randomId, outboundHeaders, decrypt } from '@/lib/gateway/crypto';
import { authedSite, saveJob, accountFor, Job, Site } from '@/lib/gateway/store';

export const config = { api: { bodyParser: false } };
export const maxDuration = 60;

async function rawBody(req: NextApiRequest): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c);
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
  const json = JSON.parse(text.replace(/```json|```/g, '').trim());
  const validIds = new Set((p.link_targets || []).map((t: any) => t.id));
  return (json.suggestions || []).map((s: any) => {
    if (s.field === 'internal_links') {
      s.value = (s.value || []).filter(
        (l: any) => validIds.has(l.target_id) && p.content.includes(l.anchor)
      );
    }
    return s;
  });
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
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: buildPrompt(payload, brand) }],
    }),
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
    await fetch(site.callback_url, {
      method: 'POST',
      headers: outboundHeaders(site.site_secret, raw, site.site_id),
      body: raw,
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    // Firewalled sites use the GET /v1/jobs/{id} reconcile poll — job record is terminal.
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const raw = await rawBody(req);
  const site = await authedSite(req, res, raw);
  if (!site) return;

  let body: any;
  try {
    body = JSON.parse(raw || '{}');
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const { type, payload, idempotency_key, callback_url, brand_context } = body;
  if (type !== 'seo.analyze_post') return res.status(400).json({ error: `Unknown job type: ${type}` });
  if (!idempotency_key) return res.status(400).json({ error: 'Missing idempotency_key' });

  // Idempotency: a duplicate submit returns the existing job, no double charge.
  const existing = await getJSON<string>(`idem:${site.site_id}:${idempotency_key}`);
  if (existing) {
    return res.status(202).json({ job_id: existing, estimated_credits: 1, duplicate: true });
  }

  const anthropic = await getAnthropicKey(site);
  if (!anthropic) {
    return res.status(402).json({ error: 'No AI provider key on file. Add one or switch to managed credits.' });
  }

  if (!anthropic.byok) {
    const remaining = parseInt((await redis('GET', `credits:${site.site_id}`)) ?? '0', 10);
    if (remaining < 1) {
      return res.status(402).json({ error: 'Out of credits for this period. Upgrade or add your own provider key.' });
    }
  }

  const job: Job = {
    job_id: randomId('job'),
    site_id: site.site_id,
    type,
    status: 'processing',
    idempotency_key,
    callback_url: callback_url || site.callback_url,
    credits_charged: 0,
    created_at: new Date().toISOString(),
  };
  await saveJob(job);
  await setJSON(`idem:${site.site_id}:${idempotency_key}`, job.job_id, 60 * 60 * 24 * 7);

  // Process inline (MVP): fast enough for single posts, and the reconcile poll
  // always finds a terminal state even if the callback is blocked.
  try {
    job.result = await runAnalysis(payload, brand_context, anthropic.key);
    job.status = 'completed';
    job.credits_charged = 1;
    if (anthropic.byok) {
      await redis('INCR', `actions:${site.site_id}`);
    } else {
      await redis('DECR', `credits:${site.site_id}`);
    }
  } catch (e: any) {
    job.status = 'failed';
    job.error = e.message || 'Analysis failed';
    await saveJob(job);
    await deliverCallback(site, {
      idempotency_key,
      job_id: job.job_id,
      type,
      status: 'failed',
      credits_charged: 0,
      error: job.error,
      account: await accountFor(site),
    });
    if (e.status === 429) return res.status(429).json({ job_id: job.job_id, error: job.error });
    if (e.status === 402 || e.status === 401) return res.status(402).json({ job_id: job.job_id, error: job.error });
    return res.status(202).json({ job_id: job.job_id, estimated_credits: 1 });
  }

  await saveJob(job);
  await deliverCallback(site, {
    idempotency_key,
    job_id: job.job_id,
    type,
    status: 'completed',
    credits_charged: job.credits_charged,
    result: job.result,
    account: await accountFor(site),
  });

  return res.status(202).json({ job_id: job.job_id, estimated_credits: 1 });
}
