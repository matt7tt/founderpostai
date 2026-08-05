import type { NextApiRequest, NextApiResponse } from 'next';
import { consumeGscState, exchangeGscCode } from '@/lib/gateway/search-console';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  const state = typeof req.query.state === 'string' ? req.query.state : '';
  try {
    const record = await consumeGscState(state);
    if (typeof req.query.error === 'string') {
      const target = new URL(record.return_url);
      target.searchParams.set('aisuite_gsc', 'denied');
      return res.redirect(302, target.toString());
    }
    const code = typeof req.query.code === 'string' ? req.query.code : '';
    await exchangeGscCode(record, code);
    const target = new URL(record.return_url);
    target.searchParams.set('aisuite_gsc', 'connected');
    return res.redirect(302, target.toString());
  } catch (error: any) {
    return res.status(400).send(error?.message || 'Search Console authorization failed.');
  }
}
