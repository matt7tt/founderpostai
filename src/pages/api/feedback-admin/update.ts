import type { NextApiRequest, NextApiResponse } from 'next';
import { updateFeedback } from '@/lib/feedback';
import { requireFeedbackAdmin } from '@/lib/feedback-admin';
import { FEEDBACK_STATUSES, type FeedbackStatus } from '@/lib/feedback-shared';

function isFeedbackStatus(value: string): value is FeedbackStatus {
  return (FEEDBACK_STATUSES as readonly string[]).includes(value);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!requireFeedbackAdmin(req, res)) return;

  const id = typeof req.body?.id === 'string' ? req.body.id : '';
  const status = typeof req.body?.status === 'string' ? req.body.status : '';
  const notes = typeof req.body?.admin_notes === 'string' ? req.body.admin_notes : '';

  if (!/^fb_[a-f0-9]{24}$/.test(id) || !isFeedbackStatus(status)) {
    return res.status(400).send('Invalid feedback update.');
  }

  const updated = await updateFeedback(id, status, notes);
  if (!updated) return res.status(404).send('Feedback not found.');

  res.statusCode = 303;
  res.setHeader('Location', `/feedback-review?updated=1#${encodeURIComponent(id)}`);
  res.end();
}
