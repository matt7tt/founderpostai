import type { NextApiRequest, NextApiResponse } from 'next';
import { authedSite, saveSite, accountFor } from '@/lib/gateway/store';

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

  let mode: unknown;
  try {
    ({ mode } = JSON.parse(raw || '{}'));
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  if (mode !== 'managed' && mode !== 'byok') {
    return res.status(400).json({ error: 'mode must be managed or byok' });
  }
  site.billing_mode = mode;
  await saveSite(site);
  return res.status(200).json(await accountFor(site));
}
