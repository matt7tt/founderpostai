import type { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '@/lib/stripe';
import { generateLicenseKey, PRICE_TO_PLAN, PLAN_LABELS } from '@/lib/license';

// Called by /thanks after a Payment Link redirect (?session_id=cs_...).
// Verifies the session is paid, then returns the subscription's license key,
// generating and storing one on first call. Idempotent — refreshing the page
// always shows the same key.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sessionId = req.query.session_id as string;
  if (!sessionId || !sessionId.startsWith('cs_')) {
    return res.status(400).json({ error: 'Invalid session_id' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items'],
    });

    if (session.payment_status !== 'paid') {
      return res.status(402).json({ error: 'Payment not completed' });
    }

    const priceId = session.line_items?.data?.[0]?.price?.id;
    const plan = priceId ? PRICE_TO_PLAN[priceId] : undefined;
    const subscriptionId = session.subscription as string;

    if (!plan || !subscriptionId) {
      return res.status(400).json({ error: 'Unknown product on this session' });
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    if (!['active', 'trialing'].includes(subscription.status)) {
      return res.status(402).json({ error: 'Subscription is not active' });
    }

    let licenseKey = subscription.metadata?.license_key;
    const licensePattern =
      plan === 'agency'
        ? /^AISA-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/
        : /^AISP-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/;
    if (!licenseKey || !licensePattern.test(licenseKey)) {
      // Deterministic per subscription: concurrent success-page requests cannot
      // mint two different keys and show the customer the one Stripe did not keep.
      licenseKey = generateLicenseKey(plan, subscriptionId);
      await stripe.subscriptions.update(subscriptionId, {
        metadata: { plan, license_key: licenseKey, license_status: 'active' },
      });
      console.info(`License issued: plan=${plan} subscription=${subscriptionId}`);
    }

    // The receipt is only useful if the update service can resolve its key.
    // Stripe metadata is already durable, so a retry safely repairs Redis.
    try {
      const { setJSON } = await import('@/lib/gateway/redis');
      await setJSON(`license:${licenseKey}`, {
        plan,
        status: subscription.status === 'active' ? 'active' : subscription.status,
        subscription_id: subscriptionId,
      });
    } catch (e) {
      console.error(`License index failed for subscription ${subscriptionId}:`, e);
      return res.status(503).json({ error: 'License is being prepared. Refresh in a moment.' });
    }

    return res.status(200).json({
      plan,
      planLabel: PLAN_LABELS[plan],
      licenseKey,
      email: session.customer_details?.email,
    });
  } catch (error: any) {
    if (error?.code === 'resource_missing') {
      return res.status(404).json({ error: 'Session not found' });
    }
    console.error('License endpoint error:', error);
    return res.status(500).json({ error: 'Failed to retrieve license' });
  }
}
