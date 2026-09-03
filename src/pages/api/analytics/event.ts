import type { NextApiRequest, NextApiResponse } from 'next';
import { isSameOrigin } from '@/lib/feedback-admin';
import {
  isFunnelEvent,
  recordFunnelEventSafely,
  type FunnelEvent,
} from '@/lib/funnel';

export const config = {
  api: {
    bodyParser: { sizeLimit: '2kb' },
  },
};

const BROWSER_EVENTS = new Set<FunnelEvent>([
  'page_view',
  'core_install_click',
  'seo_download_click',
  'pro_checkout_click',
  'agency_checkout_click',
]);

function looksLikeBot(userAgent: string): boolean {
  return /bot|crawler|spider|headless|lighthouse|pagespeed|preview|monitor/i.test(userAgent);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  if (req.method !== 'POST') return res.status(405).end();
  if (!isSameOrigin(req)) return res.status(403).end();

  const { event, path } = req.body || {};
  if (!isFunnelEvent(event) || !BROWSER_EVENTS.has(event)) {
    return res.status(400).json({ error: 'Invalid analytics event' });
  }

  const userAgent = Array.isArray(req.headers['user-agent'])
    ? req.headers['user-agent'][0]
    : req.headers['user-agent'] || '';
  if (!looksLikeBot(userAgent)) {
    await recordFunnelEventSafely(event, path);
  }

  return res.status(204).end();
}
