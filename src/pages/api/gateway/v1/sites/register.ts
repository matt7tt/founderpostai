import type { NextApiRequest, NextApiResponse } from 'next';
import { getJSON, setJSON, redis } from '@/lib/gateway/redis';
import { randomId, outboundHeaders } from '@/lib/gateway/crypto';
import { saveSite, accountFor, Site } from '@/lib/gateway/store';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { site_url, admin_email, wp_version, php_version, plugin_version, connect_token, callback_url } = req.body || {};

  if (!site_url || !admin_email || !connect_token || !callback_url) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Connect token: single-use, 15-minute expiry.
  const token = await getJSON<any>(`ctoken:${connect_token}`);
  if (!token || token.used || Date.now() - token.created > 15 * 60 * 1000) {
    return res.status(403).json({ error: 'Invalid or expired connect token' });
  }

  // Verify the site is real and reachable before returning success.
  try {
    const ping = await fetch(callback_url.replace(/\/callback$/, '/ping'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
      signal: AbortSignal.timeout(8000),
    });
    if (!ping.ok) throw new Error(`ping returned ${ping.status}`);
  } catch (e: any) {
    return res.status(400).json({
      error: `Could not reach your site (${e.message}). Check that /wp-json/ is publicly accessible.`,
    });
  }

  await setJSON(`ctoken:${connect_token}`, { ...token, used: true }, 900);

  const site: Site = {
    site_id: randomId('site'),
    site_secret: randomId('whsec'),
    site_url,
    admin_email,
    callback_url,
    billing_mode: 'managed',
    plan: 'Starter',
    credits_included: 400,
    created_at: new Date().toISOString(),
  };
  await saveSite(site);
  await redis('SET', `credits:${site.site_id}`, site.credits_included);

  const account = await accountFor(site);
  return res.status(200).json({
    site_id: site.site_id,
    site_secret: site.site_secret,
    account,
  });
}
