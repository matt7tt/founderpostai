import type { NextApiRequest, NextApiResponse } from 'next';
import { authedSite } from '@/lib/gateway/store';
import { createGscAuthorizationUrl } from '@/lib/gateway/search-console';
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
    const authorizationUrl = await createGscAuthorizationUrl(site, body.return_url);
    return res.status(200).json({ authorization_url: authorizationUrl });
  } catch (error: any) {
    return res.status(422).json({ error: error?.message || 'Could not start Search Console authorization.' });
  }
}
