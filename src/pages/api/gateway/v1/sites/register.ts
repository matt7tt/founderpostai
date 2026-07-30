import type { NextApiRequest, NextApiResponse } from 'next';
import { getJSON, setJSON, redis } from '@/lib/gateway/redis';
import { randomId, outboundHeaders } from '@/lib/gateway/crypto';
import { saveSite, accountFor, Site } from '@/lib/gateway/store';
import { validateSiteUrls } from '@/lib/gateway/url';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { site_url, admin_email, wp_version, php_version, plugin_version, connect_token, callback_url } = req.body || {};

  if (!site_url || !admin_email || !connect_token || !callback_url) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (
    typeof connect_token !== 'string' ||
    !/^ct_[a-f0-9]{24}$/.test(connect_token) ||
    typeof admin_email !== 'string' ||
    admin_email.length > 254
  ) {
    return res.status(400).json({ error: 'Invalid registration fields' });
  }

  // Connect token: single-use, 15-minute expiry.
  const token = await getJSON<any>(`ctoken:${connect_token}`);
  if (!token || token.used || Date.now() - token.created > 15 * 60 * 1000) {
    return res.status(403).json({ error: 'Invalid or expired connect token' });
  }

  // Serialize token use. A GET followed later by SET allowed two concurrent
  // registration requests to redeem the same token and mint two free sites.
  const claimed = await redis('SET', `ctoken-claim:${connect_token}`, '1', 'NX', 'EX', 30);
  if (!claimed) {
    return res.status(409).json({ error: 'This connect token is already being used' });
  }

  let urls: { siteUrl: string; callbackUrl: string };
  try {
    urls = await validateSiteUrls(site_url, callback_url);
  } catch (error: any) {
    await redis('DEL', `ctoken-claim:${connect_token}`);
    return res.status(400).json({ error: error.message || 'Invalid site URL' });
  }

  // Verify the site is real and reachable before returning success.
  try {
    const ping = await fetch(urls.callbackUrl.replace(/\/callback$/, '/ping'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
      signal: AbortSignal.timeout(8000),
    });
    if (!ping.ok) throw new Error(`ping returned ${ping.status}`);
  } catch (e: any) {
    await redis('DEL', `ctoken-claim:${connect_token}`);
    return res.status(400).json({
      error: `Could not reach your site (${e.message}). Check that /wp-json/ is publicly accessible.`,
    });
  }

  await setJSON(`ctoken:${connect_token}`, { ...token, used: true }, 900);

  const site: Site = {
    site_id: randomId('site'),
    site_secret: randomId('whsec'),
    site_url: urls.siteUrl,
    admin_email,
    callback_url: urls.callbackUrl,
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
