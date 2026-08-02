const SITE_URL = process.env.INDEXNOW_SITE_URL || 'https://founderpostai.com';
const INDEXNOW_KEY = 'd97a56932540c852ee2be0b99ad69fc8';
const KEY_LOCATION = `${SITE_URL}/${INDEXNOW_KEY}.txt`;

const sitemapResponse = await fetch(`${SITE_URL}/sitemap.xml`);

if (!sitemapResponse.ok) {
  throw new Error(`Unable to read sitemap: HTTP ${sitemapResponse.status}`);
}

const sitemap = await sitemapResponse.text();
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

if (!urlList.length) {
  throw new Error('The sitemap did not contain any URLs.');
}

const response = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
  },
  body: JSON.stringify({
    host: new URL(SITE_URL).host,
    key: INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    urlList,
  }),
});

if (![200, 202].includes(response.status)) {
  throw new Error(`IndexNow rejected the submission: HTTP ${response.status}`);
}

console.log(`Submitted ${urlList.length} URLs to IndexNow (HTTP ${response.status}).`);
