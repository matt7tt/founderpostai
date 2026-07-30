import type { NextApiRequest, NextApiResponse } from 'next';
import { authedSite } from '@/lib/gateway/store';
import { outboundHeaders } from '@/lib/gateway/crypto';
import { validateSiteUrls } from '@/lib/gateway/url';

export const config = { api: { bodyParser: false } };

async function rawBody(req: NextApiRequest): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks).toString('utf8');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const raw = await rawBody(req);
  const site = await authedSite(req, res, raw);
  if (!site) return;

  const body = JSON.stringify({ test: true });

  try {
    // Stored hostnames are revalidated on use in case their DNS changed after
    // registration and now points at a private network.
    const { callbackUrl } = await validateSiteUrls(site.site_url, site.callback_url);
    const url = callbackUrl.replace(/\/callback$/, '/ping');
    const r = await fetch(url, {
      method: 'POST',
      headers: outboundHeaders(site.site_secret, body, site.site_id),
      body,
      signal: AbortSignal.timeout(8000),
    });
    return res.status(200).json({ callback_reachable: r.ok, error: r.ok ? '' : `HTTP ${r.status}` });
  } catch (e: any) {
    return res.status(200).json({
      callback_reachable: false,
      error: `${e.message}. Results will arrive via the slower reconcile poll instead.`,
    });
  }
}
