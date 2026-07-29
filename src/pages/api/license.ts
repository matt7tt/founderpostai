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

    let licenseKey = subscription.metadata?.license_key;
    if (!licenseKey) {
      licenseKey = generateLicenseKey(plan);
      await stripe.subscriptions.update(subscriptionId, {
        metadata: { plan, license_key: licenseKey, license_status: 'active' },
      });
      console.log(`License issued: plan=${plan} key=${licenseKey} email=${session.customer_details?.email}`);
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
