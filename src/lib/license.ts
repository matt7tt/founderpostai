import crypto from 'crypto';

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no I/L/O/0/1 — safe to read aloud

export function generateLicenseKey(plan: 'pro' | 'agency'): string {
  const prefix = plan === 'agency' ? 'AISA' : 'AISP';
  const groups = [4, 4, 4].map((len) =>
    Array.from(crypto.randomBytes(len))
      .map((b) => ALPHABET[b % ALPHABET.length])
      .join('')
  );
  return `${prefix}-${groups.join('-')}`;
}

// Live Stripe price IDs → plan
export const PRICE_TO_PLAN: Record<string, 'pro' | 'agency'> = {
  [process.env.STRIPE_PRICE_PRO || 'price_1TydYcCedoFOFPt25QaKxUuf']: 'pro',
  [process.env.STRIPE_PRICE_AGENCY || 'price_1TydYcCedoFOFPt2doH7eHdM']: 'agency',
};

export const PLAN_LABELS: Record<string, string> = {
  pro: 'AI Suite SEO Pro',
  agency: 'AI Suite Agency',
};
