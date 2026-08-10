import type { NextApiRequest, NextApiResponse } from 'next';
import { authedSite } from '@/lib/gateway/store';
import { gscStatus } from '@/lib/gateway/search-console';

export const config = { api: { bodyParser: false } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  const site = await authedSite(req, res, '');
  if (!site) return;
  try {
    return res.status(200).json(await gscStatus(site.site_id));
  } catch (error: any) {
    return res.status(422).json({ error: error?.message || 'Could not read Search Console access.' });
  }
}
