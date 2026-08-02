import crypto from 'crypto';
import type { NextApiRequest, NextApiResponse } from 'next';
import {
  createFeedbackAdminSession,
  feedbackAdminConfigured,
  feedbackAdminCookie,
  isSameOrigin,
  passwordMatches,
} from '@/lib/feedback-admin';
import { redis } from '@/lib/gateway/redis';

function redirect(res: NextApiResponse, location: string) {
  res.statusCode = 303;
  res.setHeader('Location', location);
  res.end();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!feedbackAdminConfigured()) return res.status(503).send('Feedback admin is not configured.');
  if (!isSameOrigin(req)) return res.status(403).end('Forbidden');

  const forwarded = req.headers['x-forwarded-for'];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded || req.socket.remoteAddress || '')
    .split(',')[0]
    .trim();
  const ipHash = crypto.createHash('sha256').update(ip).digest('hex').slice(0, 24);
  const rateKey = `feedback-admin-login:${ipHash}`;
  const attempts = Number(await redis('INCR', rateKey));
  if (attempts === 1) await redis('EXPIRE', rateKey, 15 * 60);
  if (attempts > 10) return res.status(429).send('Too many attempts. Try again later.');

  if (!passwordMatches(req.body?.password)) {
    return redirect(res, '/feedback-review?error=1');
  }

  await redis('DEL', rateKey);
  res.setHeader('Set-Cookie', feedbackAdminCookie(createFeedbackAdminSession()));
  return redirect(res, '/feedback-review');
}
