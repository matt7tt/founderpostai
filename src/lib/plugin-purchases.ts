import type Stripe from 'stripe';
import { stripe } from './stripe';
import { generateLicenseKey, PRICE_TO_PLAN } from './license';
import { getJSON, redis, setJSON } from './gateway/redis';
import { recordUniqueFunnelEventSafely } from './funnel';
import { preparePurchaseEmail } from './purchase-email';

export const LICENSE_PATTERN = /^AIS[PA]-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/;
export type PluginPlan = 'pro' | 'agency';
export interface LicenseRecord {
  plan: PluginPlan;
  status: Stripe.Subscription.Status;
  subscription_id: string;
  customer_id: string;
  verified_at: string;
}
export class PurchaseError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export const stripeId = (value: string | { id: string } | null): string =>
  typeof value === 'string' ? value : value?.id || '';
export const subscriptionActive = (subscription: Stripe.Subscription): boolean =>
  ['active', 'trialing'].includes(subscription.status);

export function subscriptionPlan(subscription: Stripe.Subscription): PluginPlan | undefined {
  // Prices, not customer-editable metadata, are the product authority.
  return subscription.items.data.map(item => PRICE_TO_PLAN[item.price.id]).find(Boolean);
}

/** Shared by verified webhooks and receipt lookup. Latest Stripe state wins over event order. */
export async function syncPluginSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const plan = subscriptionPlan(subscription);
  if (!plan) return null; // Leave the separate legacy SaaS subscription alone.
  let licenseKey = subscription.metadata.license_key;
  const prefix = plan === 'agency' ? 'AISA-' : 'AISP-';
  if (!LICENSE_PATTERN.test(licenseKey || '') || !licenseKey.startsWith(prefix)) {
    licenseKey = generateLicenseKey(plan, subscription.id);
    await stripe.subscriptions.update(subscription.id, { metadata: { plan, license_key: licenseKey } });
  }
  const record: LicenseRecord = {
    plan, status: subscription.status, subscription_id: subscription.id,
    customer_id: stripeId(subscription.customer), verified_at: new Date().toISOString(),
  };
  await setJSON(`license:${licenseKey}`, record);
  return { subscription, plan, licenseKey, record };
}

export async function fulfillPluginCheckout(sessionId: string) {
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) throw new PurchaseError(400, 'Invalid checkout reference.');
  const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['line_items'] });
  const plan = session.line_items?.data.map(item => PRICE_TO_PLAN[item.price?.id || '']).find(Boolean);
  if (!plan || !stripeId(session.subscription)) throw new PurchaseError(400, 'This checkout is not an AI Suite purchase.');
  if (session.status !== 'complete' || !['paid', 'no_payment_required'].includes(session.payment_status)) {
    throw new PurchaseError(402, 'Payment has not been confirmed. Check your Stripe receipt before trying again.');
  }
  const purchase = await syncPluginSubscription(stripeId(session.subscription));
  if (!purchase) throw new PurchaseError(400, 'The subscription product could not be verified.');
  await recordUniqueFunnelEventSafely('purchase_completed', purchase.subscription.id);
  const emailId = await preparePurchaseEmail({
    sessionId: session.id, subscriptionId: purchase.subscription.id,
    email: session.customer_details?.email || session.customer_email || '',
    licenseKey: purchase.licenseKey, plan: purchase.plan,
  });
  return { ...purchase, session, emailId };
}

export function canonicalLicenseSite(siteUrl: string): string {
  const url = new URL(siteUrl);
  if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Invalid site URL');
  return `${url.host.toLowerCase()}${url.pathname.replace(/\/+$/, '')}`;
}

export async function licenseForSite(licenseKey: string, siteUrl: string) {
  if (!LICENSE_PATTERN.test(licenseKey)) return { active: false, reason: 'Enter a valid license key.' };
  const indexed = await getJSON<LicenseRecord>(`license:${licenseKey}`);
  if (!indexed?.subscription_id) return { active: false, reason: 'License not found. Open your purchase page to recover it.' };
  const purchase = await syncPluginSubscription(indexed.subscription_id);
  if (!purchase || purchase.licenseKey !== licenseKey || !subscriptionActive(purchase.subscription)) {
    return { active: false, reason: 'Your subscription is inactive. Manage billing to renew.' };
  }
  const site = canonicalLicenseSite(siteUrl);
  if (purchase.plan === 'pro') {
    const seatKey = `license-seat:${licenseKey}`;
    await redis('SET', seatKey, site, 'NX');
    if (await redis('GET', seatKey) !== site) {
      return { active: false, reason: 'This one-site license is active on another site. Remove the old key, then release its site from your purchase page.' };
    }
  }
  return { active: true, reason: '', subscriptionId: purchase.subscription.id };
}
