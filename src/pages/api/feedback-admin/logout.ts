import type { NextApiRequest, NextApiResponse } from 'next';
import {
  feedbackAdminCookie,
  isFeedbackAdminRequest,
  isSameOrigin,
} from '@/lib/feedback-admin';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!isFeedbackAdminRequest(req) || !isSameOrigin(req)) return res.status(403).end('Forbidden');
  res.setHeader('Set-Cookie', feedbackAdminCookie('', 0));
  res.statusCode = 303;
  res.setHeader('Location', '/feedback-review');
  return res.end();
}
