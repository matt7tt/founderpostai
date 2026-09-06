import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'node:crypto';
import { retryEmails } from '@/lib/transactional-email';

export const maxDuration = 60;
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'GET') return res.status(405).end();
  const secret = process.env.CRON_SECRET;
  const supplied = req.headers.authorization;
  if (!secret || typeof supplied !== 'string') return res.status(401).end();
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(supplied);
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) return res.status(401).end();
  try { return res.status(200).json(await retryEmails()); }
  catch { return res.status(503).json({ error: 'Email retry is temporarily unavailable.' }); }
}
