import type { NextApiRequest, NextApiResponse } from 'next';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { verifyDownloadToken } from '@/lib/download-token';
import { syncPluginSubscription, subscriptionActive } from '@/lib/plugin-purchases';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Referrer-Policy', 'no-referrer');
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const subscriptionId = typeof req.query.token === 'string' ? verifyDownloadToken(req.query.token) : null;
    if (!subscriptionId) return res.status(403).json({ error: 'Download link expired or invalid. Reopen your purchase page or check for updates in WordPress.' });
    const purchase = await syncPluginSubscription(subscriptionId);
    if (!purchase || !subscriptionActive(purchase.subscription)) return res.status(403).json({ error: 'An active subscription is required.' });
    const file = await readFile(path.join(process.cwd(), 'private/downloads/aisuite-seo-pro.zip'));
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', 'attachment; filename="aisuite-seo-pro.zip"');
    return res.status(200).send(file);
  } catch {
    return res.status(503).json({ error: 'Downloads are temporarily unavailable. Please retry.' });
  }
}
