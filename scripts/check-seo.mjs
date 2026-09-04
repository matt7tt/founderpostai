import assert from 'node:assert/strict';
import { get } from 'node:http';

// Run against `npm start` or the deployed public site. Reads pages only.
const base = new URL(process.env.SEO_BASE_URL || 'http://localhost:3000');
const canonicalOrigin = 'https://founderpostai.com';
const request = (url, options) => fetch(url, { signal: AbortSignal.timeout(20000), ...options });
const sitemapResponse = await request(new URL('/sitemap.xml', base));
assert.equal(sitemapResponse.status, 200, 'sitemap is available');
const sitemap = await sitemapResponse.text();
const entries = [...sitemap.matchAll(/<url><loc>([^<]+)<\/loc><lastmod>([^<]+)<\/lastmod><\/url>/g)];
assert.equal(entries.length, 17, 'all public pages are listed');
assert.equal(new Set(entries.map(([, url]) => url)).size, entries.length, 'no duplicate sitemap entries');

for (const [, canonical, lastmod] of entries) {
  const path = new URL(canonical).pathname;
  assert.equal(new URL(canonical).origin, canonicalOrigin);
  const response = await request(new URL(path, base), { redirect: 'manual' });
  assert.equal(response.status, 200, `${path} returns 200 directly`);
  assert.ok(!response.headers.get('x-robots-tag')?.includes('noindex'), `${path} is indexable`);
  const html = await response.text();
  assert.equal([...html.matchAll(/<h1(?:\s|>)/g)].length, 1, `${path} has one H1`);
  assert.ok(html.includes(`<link rel="canonical" href="${canonical}"`), `${path} self-canonicalizes`);
  assert.ok(/<title[^>]*>[^<]+<\/title>/.test(html), `${path} has a title`);
  assert.ok(/<meta name="description" content="[^"]+"/.test(html), `${path} has a description`);
  assert.ok(!/<meta name="robots" content="[^"]*noindex/.test(html), `${path} has no noindex meta tag`);
  const graph = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .flatMap(([, json]) => JSON.parse(json)['@graph'] || []);
  const page = graph.find(node => ['WebPage', 'AboutPage', 'ContactPage', 'CollectionPage'].includes(node['@type']));
  assert.ok(page, `${path} has page schema`);
  assert.equal(page.dateModified.slice(0, 10), lastmod, `${path} sitemap and schema dates agree`);
  if (path === '/ai-suite') {
    assert.ok(html.includes(`dateTime="${lastmod}"`), 'product facts date is visible');
  }
  if (page.datePublished && path !== '/resources') {
    assert.ok(html.includes(`dateTime="${page.datePublished}"`), `${path} publication date is visible`);
    if (page.dateModified !== page.datePublished) {
      assert.ok(html.includes(`dateTime="${page.dateModified}"`), `${path} update date is visible`);
    }
  }
  if (!['/privacy', '/terms'].includes(path)) {
    assert.ok(html.includes('href="/about"'), `${path} links to About`);
    assert.ok(html.includes('href="/contact"'), `${path} links to Contact`);
  }
  if (path === '/wordpress-internal-linking-plugin') {
    assert.ok(html.includes('id="worked-example"'));
    assert.ok(html.includes('Inspect the before-and-after HTML'));
    assert.ok(html.includes('href="/compare/founderpostai-vs-link-whisper"'));
  }
  console.log(`PASS ${path} · ${lastmod}`);
}

for (const path of ['/', '/about', '/contact', '/guides/safe-ai-internal-linking-wordpress?source=seo-check']) {
  const production = base.hostname === 'founderpostai.com';
  const target = new URL(path, production ? 'https://www.founderpostai.com' : base);
  // Node 20 fetch does not reliably override Host; use http.get for local checks.
  const result = production
    ? await request(target, { redirect: 'manual' }).then(response => ({
      status: response.status, location: response.headers.get('location'),
    }))
    : await new Promise((resolve, reject) => {
      get(target, { headers: { Host: 'www.founderpostai.com' }, signal: AbortSignal.timeout(20000) }, response => {
        response.resume();
        resolve({ status: response.statusCode, location: response.headers.location });
      }).on('error', reject);
    });
  assert.equal(result.status, 308, `www${path} permanently redirects`);
  assert.equal(new URL(result.location).href, `${canonicalOrigin}${path}`, 'path and query are preserved');
}
console.log('PASS canonical host redirects preserve paths and queries');
