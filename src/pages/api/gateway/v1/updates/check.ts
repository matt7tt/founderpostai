import type { NextApiRequest, NextApiResponse } from 'next';
import { authedSite } from '@/lib/gateway/store';
import { licenseForSite } from '@/lib/plugin-purchases';
import { proDownloadUrl } from '@/lib/download-token';
import { AI_SUITE_PRODUCTS } from '@/lib/products';

const latest = AI_SUITE_PRODUCTS.find(product => product.id === 'ai-suite-seo-pro')!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const site = await authedSite(req, res, '');
    if (!site) return;
    if (req.query.slug !== 'aisuite-seo-pro') return res.status(400).json({ error: 'Unknown plugin slug' });
    const license = req.headers['x-aisuite-license'];
    const entitlement = await licenseForSite(typeof license === 'string' ? license : '', site.site_url);
    return res.status(200).json({
      version: latest.version, tested: '7.0', active: entitlement.active,
      package: entitlement.active && entitlement.subscriptionId ? proDownloadUrl(entitlement.subscriptionId) : null,
      url: 'https://founderpostai.com/ai-suite', reason: entitlement.reason,
      sections: { description: 'AI Suite SEO Pro — bulk, scheduling, and auto-apply.', changelog: entitlement.reason },
    });
  } catch {
    // An outage is not an inactive license. Clients retain a bounded last-known-good grace period.
    return res.status(503).json({ error: 'License verification is temporarily unavailable. Please retry.' });
  }
}
