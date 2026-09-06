import type { NextApiRequest, NextApiResponse } from 'next';
import { PLAN_LABELS } from '@/lib/license';
import { fulfillPluginCheckout, PurchaseError, subscriptionActive } from '@/lib/plugin-purchases';
import { proDownloadUrl } from '@/lib/download-token';
import { redis } from '@/lib/gateway/redis';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Referrer-Policy', 'no-referrer');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (typeof req.query.session_id !== 'string') return res.status(400).json({ error: 'A checkout reference is required.' });
  try {
    const purchase = await fulfillPluginCheckout(req.query.session_id);
    const active = subscriptionActive(purchase.subscription);
    return res.status(200).json({
      plan: purchase.plan, planLabel: PLAN_LABELS[purchase.plan], licenseKey: purchase.licenseKey,
      active, downloadUrl: active ? proDownloadUrl(purchase.subscription.id) : null,
      licensedSite: purchase.plan === 'pro' ? await redis('GET', `license-seat:${purchase.licenseKey}`) : null,
    });
  } catch (error: any) {
    if (error instanceof PurchaseError) return res.status(error.status).json({ error: error.message });
    if (error?.code === 'resource_missing') return res.status(404).json({ error: 'Checkout reference not found.' });
    console.error('License retrieval failed', { code: error?.code || 'unavailable' });
    return res.status(503).json({ error: 'We could not prepare your license yet. Please retry in a moment.' });
  }
}
