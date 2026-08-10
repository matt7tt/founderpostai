import assert from 'node:assert/strict';
import { normalizeGscRows, validateGscReturnUrl } from '../../src/lib/gateway/search-console';
import type { Site } from '../../src/lib/gateway/store';

const site: Site = {
  site_id: 'site_test',
  site_secret: 'secret',
  site_url: 'https://example.com',
  admin_email: 'admin@example.com',
  callback_url: 'https://example.com/wp-json/aisuite/v1/callback',
  billing_mode: 'managed',
  plan: 'free',
  credits_included: 10,
  created_at: new Date().toISOString(),
};

assert.equal(
  validateGscReturnUrl(site, 'https://example.com/wp-admin/admin.php?page=search-performance'),
  'https://example.com/wp-admin/admin.php?page=search-performance'
);
assert.throws(
  () => validateGscReturnUrl(site, 'https://attacker.example/wp-admin/admin.php'),
  /connected WordPress admin/
);
assert.throws(() => validateGscReturnUrl(site, 'https://example.com/account'), /connected WordPress admin/);

const rows = normalizeGscRows([
  { keys: ['wordpress seo', 'https://example.com/seo'], clicks: 4, impressions: 100, ctr: 0.04, position: 8.2 },
  { keys: ['bad', 'https://example.com/bad'], clicks: -1, impressions: -4, ctr: 8, position: -2 },
]);

assert.deepEqual(rows[0], {
  query: 'wordpress seo',
  page: 'https://example.com/seo',
  clicks: 4,
  impressions: 100,
  ctr: 0.04,
  position: 8.2,
});
assert.deepEqual(rows[1], {
  query: 'bad',
  page: 'https://example.com/bad',
  clicks: 0,
  impressions: 0,
  ctr: 1,
  position: 0,
});

console.log('PASS: Search Console redirects stay on the connected admin and API rows are bounded');
