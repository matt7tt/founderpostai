import type { NextApiRequest, NextApiResponse } from 'next';
import { authedSite } from '@/lib/gateway/store';
import { disconnectGsc } from '@/lib/gateway/search-console';

export const config = { api: { bodyParser: false } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') return res.status(405).end();
  const site = await authedSite(req, res, '');
  if (!site) return;
  await disconnectGsc(site.site_id);
  return res.status(200).json({ disconnected: true });
}
