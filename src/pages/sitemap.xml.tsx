import type { GetServerSideProps } from 'next';
import { SITE_LAST_MODIFIED, SITE_URL } from '../lib/site';

const urls = [
  { loc: `${SITE_URL}/`, lastmod: SITE_LAST_MODIFIED },
  { loc: `${SITE_URL}/ai-suite`, lastmod: SITE_LAST_MODIFIED },
  { loc: `${SITE_URL}/privacy`, lastmod: '2026-07-29' },
  { loc: `${SITE_URL}/terms`, lastmod: '2026-07-29' },
];

function Sitemap() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    ({ loc, lastmod }) =>
      `  <url><loc>${loc}</loc><lastmod>${lastmod}</lastmod></url>`
  )
  .join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
  res.write(sitemap);
  res.end();

  return { props: {} };
};

export default Sitemap;
