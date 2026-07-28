import { track as vaTrack } from '@vercel/analytics';

// Stripe Payment Links (see .env.example)
export const PAYMENT_LINKS = {
  pro: process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_PRO || '#pricing',
  agency: process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_AGENCY || '#pricing',
};

export type DesignVariant = 'editorial' | 'studio';

export function track(event: string, props: Record<string, string>) {
  try {
    vaTrack(event, props);
  } catch {
    // analytics unavailable (dev/adblock) — never break UX
  }
}
