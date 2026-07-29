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

  const { documents } = JSON.parse(raw || '{}');
  if (!Array.isArray(documents)) return res.status(400).json({ error: 'documents must be an array' });

  await setJSON(
    `docs:${site.site_id}`,
    documents.map((d: any) => ({ post_id: d.post_id, url: d.url, title: d.title, content: d.content })),
    60 * 60 * 24 * 90
  );
  return res.status(200).json({ indexed: documents.length });
}
