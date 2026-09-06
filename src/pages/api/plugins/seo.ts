import type { NextApiRequest, NextApiResponse } from 'next';
import { AI_SUITE_PRODUCTS } from '@/lib/products';
const product = AI_SUITE_PRODUCTS.find(item => item.id === 'ai-suite-seo')!;

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
  return res.status(200).json({
    name: product.shortName, slug: 'aisuite-seo', version: product.version,
    url: 'https://founderpostai.com/ai-suite', package: 'https://founderpostai.com/downloads/aisuite-seo.zip',
    tested: '7.0', requires: '6.5', requires_php: '7.4',
    sections: { description: product.description, changelog: 'Background health audits, direct updates, and reliability fixes.' },
  });
}
