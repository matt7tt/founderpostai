import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import SearchPageStructuredData from '../../src/components/SearchPageStructuredData';
import { formatContentDate, INFORMATION_PAGE_DATES, RESOURCES_DATES } from '../../src/lib/content-dates';
import { SEARCH_PAGES } from '../../src/lib/search-content';
import { SITE_URL } from '../../src/lib/site';
import { AI_SUITE_LAST_MODIFIED, AI_SUITE_PRODUCTS, softwareApplicationStructuredData } from '../../src/lib/products';

test('editorial dates are explicit, valid, ordered, and not future-dated', () => {
  const today = new Date().toISOString().slice(0, 10);
  for (const dates of [...SEARCH_PAGES, INFORMATION_PAGE_DATES, RESOURCES_DATES]) {
    for (const value of [dates.publishedAt, dates.updatedAt]) {
      assert.match(value, /^\d{4}-\d{2}-\d{2}$/);
      assert.equal(new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10), value);
      assert.ok(value <= today);
    }
    assert.ok(dates.publishedAt <= dates.updatedAt);
  }
  assert.equal(formatContentDate('2026-07-30'), 'July 30, 2026');
  assert.ok(SEARCH_PAGES.some(page => page.updatedAt === page.publishedAt), 'untouched pages retain their dates');
});

test('search page schema uses that page’s dates and the canonical product entity', () => {
  for (const page of SEARCH_PAGES) {
    const html = renderToStaticMarkup(createElement(SearchPageStructuredData, { page }));
    const json = JSON.parse(html.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, ''));
    const datedNodes = json['@graph'].filter((node: Record<string, unknown>) => node.datePublished);
    assert.equal(datedNodes.length, ['guide', 'comparison'].includes(page.kind) ? 2 : 1);
    for (const node of datedNodes) {
      assert.equal(node.datePublished, page.publishedAt);
      assert.equal(node.dateModified, page.updatedAt);
    }
    const webpage = json['@graph'].find((node: Record<string, unknown>) => node['@type'] === 'WebPage');
    assert.equal(webpage.about['@id'], `${SITE_URL}/#ai-suite-seo`);
    assert.equal(webpage.url, `${SITE_URL}${page.path}`);
  }
});

test('product schema preserves separate release-record dates', () => {
  const products = softwareApplicationStructuredData();
  AI_SUITE_PRODUCTS.forEach((product, index) => {
    assert.equal(products[index].dateModified, product.updatedAt);
    assert.ok(product.updatedAt <= AI_SUITE_LAST_MODIFIED);
  });
  assert.equal(AI_SUITE_LAST_MODIFIED, '2026-09-04');
  assert.equal(products[2].dateModified, '2026-08-10');
});
