import crypto from 'crypto';

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no I/L/O/0/1 — safe to read aloud

export function generateLicenseKey(plan: 'pro' | 'agency', subscriptionId = ''): string {
  const prefix = plan === 'agency' ? 'AISA' : 'AISP';
  const kmsKey = process.env.GATEWAY_KMS_KEY || '';
  if (subscriptionId && !/^[a-f0-9]{64}$/i.test(kmsKey)) {
    throw new Error('GATEWAY_KMS_KEY must be configured before issuing licenses');
  }
  const bytes =
    subscriptionId
      ? crypto.createHmac('sha256', kmsKey).update(`license:${subscriptionId}`).digest()
      : crypto.randomBytes(12);
  let offset = 0;
  const groups = [4, 4, 4].map((len) =>
    Array.from(bytes.subarray(offset, (offset += len)))
      .map((b) => ALPHABET[b % ALPHABET.length])
      .join('')
  );
  return `${prefix}-${groups.join('-')}`;
}

// Live Stripe price IDs → plan. Missing configuration fails closed in the
// license endpoint instead of silently accepting a price from another account.
export const PRICE_TO_PLAN: Record<string, 'pro' | 'agency'> = {};
if (process.env.STRIPE_PRICE_PRO) PRICE_TO_PLAN[process.env.STRIPE_PRICE_PRO] = 'pro';
if (process.env.STRIPE_PRICE_AGENCY) PRICE_TO_PLAN[process.env.STRIPE_PRICE_AGENCY] = 'agency';

export const PLAN_LABELS: Record<string, string> = {
  pro: 'AI Suite SEO Pro',
  agency: 'AI Suite Agency',
};
