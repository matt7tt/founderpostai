import type { NextApiRequest, NextApiResponse } from 'next';
import { authedSite, accountFor } from '@/lib/gateway/store';

export const config = { api: { bodyParser: false } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  const site = await authedSite(req, res, '');
  if (!site) return;
  return res.status(200).json(await accountFor(site));
}
