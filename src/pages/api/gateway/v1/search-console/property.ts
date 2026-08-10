import type { NextApiRequest, NextApiResponse } from 'next';
import { authedSite } from '@/lib/gateway/store';
import { selectGscProperty } from '@/lib/gateway/search-console';
import { readGatewayBody } from '@/lib/gateway/request';

export const config = { api: { bodyParser: false } };

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
    if (typeof body.property !== 'string' || body.property.length > 2048) {
      return res.status(400).json({ error: 'Invalid Search Console property.' });
    }
    await selectGscProperty(site.site_id, body.property);
    return res.status(200).json({ selected: body.property });
  } catch (error: any) {
    return res.status(422).json({ error: error?.message || 'Could not select this Search Console property.' });
  }
}
