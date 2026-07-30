import type { NextApiRequest, NextApiResponse } from 'next';
import { authedSite } from '@/lib/gateway/store';
import { setJSON } from '@/lib/gateway/redis';

export const config = { api: { bodyParser: false } };

async function rawBody(req: NextApiRequest): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks).toString('utf8');
}

// POST /v1/index/documents — stores the site's document set keyed by site.
// (Embeddings are a later optimization; the SEO module's closed link-target set
// already ships with each job payload, so analysis works without them.)
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const raw = await rawBody(req);
  const site = await authedSite(req, res, raw);
  if (!site) return;

  let documents: any;
  try {
    ({ documents } = JSON.parse(raw || '{}'));
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  if (!Array.isArray(documents) || documents.length > 500) {
    return res.status(400).json({ error: 'documents must be an array of at most 500 items' });
  }

  const clean = documents.map((d: any) => ({
    post_id: Number.isInteger(d?.post_id) ? d.post_id : 0,
    url: typeof d?.url === 'string' ? d.url.slice(0, 2048) : '',
    title: typeof d?.title === 'string' ? d.title.slice(0, 500) : '',
    content: typeof d?.content === 'string' ? d.content.slice(0, 500_000) : '',
  }));

  await setJSON(
    `docs:${site.site_id}`,
    clean,
    60 * 60 * 24 * 90
  );
  return res.status(200).json({ indexed: clean.length });
}
