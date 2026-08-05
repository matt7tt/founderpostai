import type { NextApiRequest, NextApiResponse } from 'next';
import { getJSON, setJSON } from '@/lib/gateway/redis';
import { authedSite } from '@/lib/gateway/store';
import { stripe } from '@/lib/stripe';

const LATEST = {
  version: '1.0.4',
  url: 'https://founderpostai.com/downloads/aisuite-seo-pro-1.0.4.zip',
  tested: '7.0',
};

// GET /v1/updates/check?slug=&version=&license=
// Premium only: a valid, active license gets the package URL; lapsed gets metadata only.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const site = await authedSite(req, res, '');
  if (!site) return;

  if (req.query.slug !== 'aisuite-seo-pro') {
    return res.status(400).json({ error: 'Unknown plugin slug' });
  }

  const license = req.headers['x-aisuite-license'];
  if (typeof license !== 'string' || !/^AIS[PA]-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(license)) {
    return res.status(200).json({
      version: LATEST.version,
      tested: LATEST.tested,
      package: null,
      url: 'https://founderpostai.com',
      sections: { changelog: 'Enter a valid license key to receive updates.' },
    });
  }

  const rec = license ? await getJSON<any>(`license:${license}`) : null;

  let active = false;
  if (
    rec &&
    (rec.plan === 'pro' || rec.plan === 'agency') &&
    typeof rec.subscription_id === 'string'
  ) {
    try {
      // Redis is a lookup index, not the billing authority. Re-check Stripe so
      // cancelled and unpaid subscriptions cannot receive updates forever.
      const subscription = await stripe.subscriptions.retrieve(rec.subscription_id);
      active = ['active', 'trialing'].includes(subscription.status);
      await setJSON(`license:${license}`, {
        ...rec,
        status: subscription.status,
        verified_at: new Date().toISOString(),
      });
    } catch {
      active = false;
    }
  }
  return res.status(200).json({
    version: LATEST.version,
    tested: LATEST.tested,
    package: active ? LATEST.url : null,
    url: 'https://founderpostai.com',
    sections: {
      description: 'AI Suite SEO Pro — bulk, scheduling, and auto-apply.',
      changelog: active ? '' : 'License lapsed — renew to receive updates.',
    },
  });
}
