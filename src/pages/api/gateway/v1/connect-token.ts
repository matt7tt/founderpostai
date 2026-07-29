import type { NextApiRequest, NextApiResponse } from 'next';
import { setJSON, redis } from '@/lib/gateway/redis';
import { randomId } from '@/lib/gateway/crypto';

// Public: mint a single-use connect token (shown on the /connect page).
// Rate-limited per IP — this is the free-tier front door.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 'unknown';
  const key = `rl:ctoken:${ip}`;
  const count = await redis('INCR', key);
  if (count === 1) await redis('EXPIRE', key, 3600);
  if (count > 5) {
    return res.status(429).json({ error: 'Too many tokens requested. Try again in an hour.' });
  }

  const connect_token = randomId('ct');
  await setJSON(`ctoken:${connect_token}`, { created: Date.now(), used: false }, 900);
  return res.status(200).json({ connect_token, expires_in: 900 });
}
