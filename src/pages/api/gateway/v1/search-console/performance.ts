import type { NextApiRequest, NextApiResponse } from 'next';
import { authedSite } from '@/lib/gateway/store';
import { gscPerformance } from '@/lib/gateway/search-console';
import { readGatewayBody } from '@/lib/gateway/request';

export const config = { api: { bodyParser: false } };
export const maxDuration = 30;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  let raw: string;
  try {
    raw = await readGatewayBody(req);
  } catch (error: any) {
    return res.status(error?.status || 400).json({ error: error?.message || 'Invalid request body.' });
  }
  const site = await authedSite(req, res, raw);
  if (!site) return;
  try {
    const body = JSON.parse(raw || '{}');
    return res.status(200).json(await gscPerformance(site.site_id, Number(body.days) || 28));
  } catch (error: any) {
    return res.status(422).json({ error: error?.message || 'Could not load Search Console performance.' });
  }
}
