import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

// The legacy LinkedIn subscription has its own price, separate from SEO Pro.
export const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID || '';

export async function createCheckoutSession(
  customerId: string | undefined,
  userId: string,
  userEmail: string
): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer: customerId,
    customer_email: customerId ? undefined : userEmail,
    line_items: [
      {
        price: PRO_PRICE_ID,
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/dashboard?upgraded=true`,
    cancel_url: `${baseUrl}/dashboard?canceled=true`,
    metadata: {
      userId,
    },
    subscription_data: {
      metadata: {
        userId,
      },
    },
  });

  return session.url || '';
}

export async function createBillingPortalSession(
  customerId: string
): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${baseUrl}/dashboard`,
  });

  return session.url;
}
