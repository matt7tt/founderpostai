import type { NextApiRequest, NextApiResponse } from 'next';
import { emailDigest, normalizedEmail, deliverEmail } from '@/lib/transactional-email';
import { prepareRecoveryEmail } from '@/lib/purchase-email';
import { redis } from '@/lib/gateway/redis';

export const config = { api: { bodyParser: { sizeLimit: '4kb' } } };
const MESSAGE = 'If a purchase matches that checkout email, we’ll email its private purchase links. Check your inbox and spam folder; delivery may be delayed while our sender is being verified.';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'POST') return res.status(405).end();
  const email = normalizedEmail(req.body?.email);
  if (!email) return res.status(400).json({ error: 'Enter the email address used at checkout.' });
  try {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress) || 'unknown';
    const limited = await redis('EVAL', `
      local ip = redis.call('INCR', KEYS[1]); if ip == 1 then redis.call('EXPIRE', KEYS[1], 3600) end
      local email = redis.call('INCR', KEYS[2]); if email == 1 then redis.call('EXPIRE', KEYS[2], 3600) end
      return (ip > 5 or email > 3) and 1 or 0
    `, 2, `recovery-rate:ip:${emailDigest(ip)}`, `recovery-rate:email:${emailDigest(email)}`);
    if (limited) return res.status(429).json({ error: 'Too many requests. Please try again in an hour.' });
    const id = await prepareRecoveryEmail(email);
    // The browser never receives a customer ID, license, or whether the address matched.
    if (id) await deliverEmail(id).catch(() => undefined);
    return res.status(202).json({ message: MESSAGE });
  } catch {
    return res.status(503).json({ error: 'Recovery is temporarily unavailable. Please try again shortly.' });
  }
}
