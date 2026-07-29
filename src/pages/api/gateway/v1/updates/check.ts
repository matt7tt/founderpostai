import type { NextApiRequest, NextApiResponse } from 'next';
import { getJSON } from '@/lib/gateway/redis';

const LATEST = {
  version: '1.0.0',
  url: 'https://founderpostai.com/downloads/aisuite-seo-pro-1.0.0.zip',
  tested: '7.0',
};

// GET /v1/updates/check?slug=&version=&license=
// Premium only: a valid, active license gets the package URL; lapsed gets metadata only.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const license = (req.query.license as string) || (req.headers['x-aisuite-license'] as string);
  const rec = license ? await getJSON<any>(`license:${license}`) : null;

  const active = rec && rec.status === 'active';
  return res.status(200).json({
    version: LATEST.version,
    tested: LATEST.tested,
    package: active ? LATEST.url : null,
    url: 'https://founderpostai.com',
    sections: {
      description: 'AI Suite SEO Pro — bulk, scheduling, and auto-apply.',
      changelog: active ? '' : 'License lapsed — renew to receive updates.',
    },
  });
}
