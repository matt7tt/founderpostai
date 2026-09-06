import type { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '@/lib/stripe';
import { fulfillPluginCheckout, PurchaseError } from '@/lib/plugin-purchases';
import { redis } from '@/lib/gateway/redis';

// A verified Checkout reference is the receipt's bearer credential.
// Never accept a customer ID or redirect destination supplied by the browser.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'POST') return res.status(405).end();
  if (typeof req.body?.session_id !== 'string') return res.status(400).json({ error: 'A checkout reference is required.' });
  try {
    const purchase = await fulfillPluginCheckout(req.body.session_id);
    if (req.body.action === 'release_site') {
      await redis('DEL', `license-seat:${purchase.licenseKey}`);
      return res.status(200).json({ released: true });
    }
    if (req.body.action !== 'billing') return res.status(400).json({ error: 'Unknown action' });
    const portal = await stripe.billingPortal.sessions.create({
      customer: purchase.record.customer_id,
      ...(process.env.STRIPE_PLUGIN_PORTAL_CONFIG ? { configuration: process.env.STRIPE_PLUGIN_PORTAL_CONFIG.trim() } : {}),
      return_url: `https://founderpostai.com/thanks?session_id=${encodeURIComponent(purchase.session.id)}`,
    });
    return res.status(200).json({ url: portal.url });
  } catch (error: any) {
    if (error instanceof PurchaseError) return res.status(error.status).json({ error: error.message });
    return res.status(503).json({ error: 'Account management is temporarily unavailable. Please retry or contact support.' });
  }
}
