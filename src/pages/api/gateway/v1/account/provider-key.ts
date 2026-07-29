import type { NextApiRequest, NextApiResponse } from 'next';
import { getJSON, setJSON, redis } from '@/lib/gateway/redis';
import { authedSite, accountFor } from '@/lib/gateway/store';
import { encrypt } from '@/lib/gateway/crypto';

export const config = { api: { bodyParser: false } };

async function rawBody(req: NextApiRequest): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks).toString('utf8');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const raw = req.method === 'POST' ? await rawBody(req) : '';

  if (req.method === 'DELETE') {
    const site = await authedSite(req, res, '');
    if (!site) return;
    await redis('DEL', `pkey:${site.site_id}`);
    return res.status(200).json(await accountFor(site));
  }

  if (req.method !== 'POST') return res.status(405).end();
  const site = await authedSite(req, res, raw);
  if (!site) return;

  const { provider, key } = JSON.parse(raw || '{}');
  if (provider !== 'anthropic' || !key) {
    return res.status(400).json({ error: 'Only provider=anthropic is supported right now' });
  }

  // Verify with the cheapest possible live call before storing.
  const check = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1,
      messages: [{ role: 'user', content: 'hi' }],
    }),
  });
  if (!check.ok) {
    const e = await check.json().catch(() => ({}));
    return res.status(422).json({
      error: e?.error?.message || 'That key was rejected by Anthropic. Check it in your provider console.',
    });
  }

  await setJSON(`pkey:${site.site_id}`, {
    provider,
    encrypted: encrypt(key),
    last4: key.slice(-4),
    verified_at: new Date().toISOString(),
  });

  return res.status(200).json(await accountFor(site));
}
