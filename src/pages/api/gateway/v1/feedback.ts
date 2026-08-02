import type { NextApiRequest, NextApiResponse } from 'next';
import {
  createFeedback,
  FeedbackRateLimitError,
  FeedbackValidationError,
  validateFeedbackInput,
} from '@/lib/feedback';
import { authedSite } from '@/lib/gateway/store';

export const config = { api: { bodyParser: false } };

async function rawBody(req: NextApiRequest): Promise<string> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buffer = Buffer.from(chunk);
    size += buffer.length;
    if (size > 32 * 1024) throw new FeedbackValidationError('Feedback payload is too large.');
    chunks.push(buffer);
  }
  return Buffer.concat(chunks).toString('utf8');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const raw = await rawBody(req);
    const site = await authedSite(req, res, raw);
    if (!site) return;

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw || '{}');
    } catch {
      throw new FeedbackValidationError('Invalid JSON.');
    }

    const feedback = await createFeedback(site, validateFeedbackInput(parsed));
    return res.status(201).json({ id: feedback.id, status: feedback.status });
  } catch (error) {
    if (error instanceof FeedbackValidationError) {
      return res.status(400).json({ error: error.message });
    }
    if (error instanceof FeedbackRateLimitError) {
      return res.status(429).json({ error: error.message });
    }
    console.error('Feedback submission failed:', error);
    return res.status(500).json({ error: 'Feedback could not be saved. Please try again.' });
  }
}
