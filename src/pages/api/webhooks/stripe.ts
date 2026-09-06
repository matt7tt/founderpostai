import type { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '@/lib/stripe';
import { getUserByStripeCustomerId, updateUser, createSubscriptionEvent } from '@/lib/db';
import Stripe from 'stripe';
import { fulfillPluginCheckout, PurchaseError, stripeId, syncPluginSubscription } from '@/lib/plugin-purchases';

export const maxDuration = 60;

export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > 1024 * 1024) { reject(new Error('Webhook body too large')); return; }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return res.status(400).json({ error: 'Missing signature or webhook secret' });
  }

  let event: Stripe.Event;

  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch {
    console.warn('Webhook signature verification failed');
    return res.status(400).json({ error: 'Invalid signature' });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session;
        try {
          await fulfillPluginCheckout(session.id);
        } catch (error) {
          // Other products and payments still settling are not fulfillment failures.
          if (!(error instanceof PurchaseError && [400, 402].includes(error.status))) throw error;
        }
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        const userId = session.metadata?.userId;

        if (userId && customerId) {
          updateUser(userId, {
            tier: 'pro',
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
          });
          createSubscriptionEvent(userId, 'subscription_created', subscriptionId);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await syncPluginSubscription(subscription.id);
        const customerId = subscription.customer as string;
        const user = getUserByStripeCustomerId(customerId);

        if (user) {
          updateUser(user.id, { tier: 'free', stripeSubscriptionId: undefined });
          createSubscriptionEvent(user.id, 'subscription_cancelled', subscription.id);
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await syncPluginSubscription(subscription.id);
        const customerId = subscription.customer as string;
        const user = getUserByStripeCustomerId(customerId);

        if (user) {
          const isActive = subscription.status === 'active';
          updateUser(user.id, {
            tier: isActive ? 'pro' : 'free',
          });
          createSubscriptionEvent(user.id, `subscription_${subscription.status}`, subscription.id);
        }
        break;
      }

      case 'invoice.paid':
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if (stripeId(invoice.subscription)) await syncPluginSubscription(stripeId(invoice.subscription));
        const customerId = invoice.customer as string;
        const user = getUserByStripeCustomerId(customerId);

        if (user) {
          createSubscriptionEvent(user.id, event.type === 'invoice.paid' ? 'payment_received' : 'payment_failed');
        }
        break;
      }
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler failed', { type: event.type, code: error?.code || 'unavailable' });
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
}
