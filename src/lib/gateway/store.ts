import { NextApiRequest, NextApiResponse } from 'next';
import { getJSON, setJSON, redis } from './redis';
import { canonicalRequestPath, verifyInbound } from './crypto';

export interface Site {
  site_id: string;
  site_secret: string;
  site_url: string;
  admin_email: string;
  callback_url: string;
  billing_mode: 'managed' | 'byok';
  plan: string;
  credits_included: number;
  created_at: string;
}

export interface Job {
  job_id: string;
  site_id: string;
  type: string;
  status: 'processing' | 'completed' | 'failed';
  idempotency_key: string;
  callback_url: string;
  result?: any;
  error?: string;
  credits_charged: number;
  created_at: string;
  credit_reserved?: boolean;
  credit_period?: string;
}

export const getSite = (id: string) => getJSON<Site>(`site:${id}`);
export const saveSite = (s: Site) => setJSON(`site:${s.site_id}`, s);
export const getJob = (id: string) => getJSON<Job>(`job:${id}`);
export const saveJob = (j: Job) => setJSON(`job:${j.job_id}`, j, 60 * 60 * 24 * 30);

export async function periodEnd(): Promise<string> {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString();
}

export async function ensureAccountPeriod(site: Site): Promise<void> {
  const now = new Date();
  const period = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const script = `
    if redis.call('GET', KEYS[1]) ~= ARGV[1] then
      redis.call('SET', KEYS[1], ARGV[1])
      redis.call('SET', KEYS[2], ARGV[2])
      redis.call('SET', KEYS[3], 0)
    end
    return 1
  `;
  await redis(
    'EVAL',
    script,
    3,
    `account-period:${site.site_id}`,
    `credits:${site.site_id}`,
    `actions:${site.site_id}`,
    period,
    site.credits_included
  );
}

export async function accountFor(site: Site): Promise<any> {
  await ensureAccountPeriod(site);
  const base = { plan: site.plan, period_end: await periodEnd() };
  if (site.billing_mode === 'byok') {
    const key = await getJSON<any>(`pkey:${site.site_id}`);
    const used = (await redis('GET', `actions:${site.site_id}`)) || 0;
    return {
      ...base,
      billing_mode: 'byok',
      actions_used: parseInt(used, 10),
      provider_key: key
        ? { present: true, provider: key.provider, last4: key.last4, verified_at: key.verified_at, error: '' }
        : { present: false },
    };
  }
  const remaining = parseInt((await redis('GET', `credits:${site.site_id}`)) ?? '', 10);
  return {
    ...base,
    billing_mode: 'managed',
    credits_included: site.credits_included,
    credits_remaining: Number.isNaN(remaining) ? site.credits_included : remaining,
  };
}

// Auth helper: resolves the site from headers and verifies the signature.
export async function authedSite(
  req: NextApiRequest,
  res: NextApiResponse,
  rawBody: string
): Promise<Site | null> {
  const siteId = req.headers['x-aisuite-site'] as string;
  const site = siteId ? await getSite(siteId) : null;
  if (!site) {
    res.status(401).json({ error: 'Unknown site' });
    return null;
  }
  const err = verifyInbound(
    req.headers as any,
    rawBody,
    site.site_secret,
    req.method || '',
    canonicalRequestPath(req.url)
  );
  if (err) {
    res.status(401).json({ error: err });
    return null;
  }
  return site;
}
