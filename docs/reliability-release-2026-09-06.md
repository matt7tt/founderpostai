# Purchase and plugin reliability release

Releases: free SEO 0.1.9, SEO Pro 1.0.6. Core stays at its WordPress.org release 0.1.6.

## Behavior

- Verified Stripe webhooks and the receipt page share deterministic, idempotent license fulfillment. The latest subscription state is checked instead of trusting webhook arrival order or Redis billing status.
- Pro packages are outside `public`. Expiring signed links also check the current subscription at download time. Historical ZIPs were moved to `private/downloads/legacy` for rollback, not deleted.
- A one-site license atomically binds to the connected site's hostname and installation path. HTTPS migrations retain their seat. Agency licenses support multiple sites. Remove the old site's key before releasing its seat on the purchase page.
- Only the separate Pro plugin gates automation. Core and free SEO remain license-free. A known inactive license stops Pro automation; service outages allow a previously verified key up to 48 hours of grace. Normal entitlement checks are cached for six hours.
- Stripe's hosted billing sign-in supports customers who lost the checkout page. Cancellation is at the end of the paid period. The private purchase page also opens billing and releases site activations.
- SEO's direct updater is available starting in 0.1.9. Existing 0.1.8 installations need one manual ZIP update to install that updater. Keep the standard `aisuite-seo` directory.
- Health audits use 50-post background batches, derived database rows and link edges, and 50-row dashboard pagination. Content changes keep the previous complete snapshot visible. Low-traffic sites need a reliable WP-Cron runner.
- Gateway jobs atomically reserve credits and persist their processing lease. Duplicate submissions do not double-charge. Polling, balance refreshes, or the next site submission recover leases older than two minutes and refund each reservation once, without inflating a new month's allowance. Site-wide recovery handles at most 20 jobs in one Redis round trip. Provider calls time out after 30 seconds; Redis calls after three seconds.

## Verification

`npm run test:reliability` runs mocked Stripe APIs and real Redis/Lua in disposable Docker containers. It never loads production environment files. Tests cover concurrent fulfillment and site claims, tampered/expired download tokens, download authorization, billing ownership, signed webhook verification, duplicate jobs, refunds, interrupted work, period rollover, and BYOK counters.

`tests/wordpress/compose.yml` defines a disposable local WordPress/MariaDB environment on port 8892. Install WordPress at `http://localhost:8892`, activate `founderpostai-ai-suite-core aisuite-seo aisuite-seo-pro`, then run `wp eval-file /tests/reliability.php` in its CLI service. It verifies actual dependency resolution, native WordPress update discovery, Pro entitlement/grace behavior, bounded health scans, pagination, and plain-permalink link counts. It blocks external services during the fixture test.

The existing PHP behavior harnesses, read-only gateway tests, SEO metadata tests, lint, typecheck, and production build are separate checks. Do not assume `test:gateway` is read-only: its older feedback-store test writes namespaced data to configured Redis.

Run `npm run package:plugins` after PHP edits. `scripts/configure-plugin-billing.mjs --apply` is an explicit production operation that verifies Payment Link prices, configures the portal and webhook, and saves Vercel environment values without logging secrets. Redeploy after environment changes. Reusing an existing webhook requires its previously configured signing secret.

## Remaining external verification

- Transactional license-delivery and email-only license recovery need a configured email service and verified sender. Billing email sign-in is provided by Stripe, but is not a substitute for license-delivery email. Lost-license requests currently go to support with a receipt.
- No real customer payment or cancellation is part of the automated tests. Complete a Stripe test-mode end-to-end checkout when test credentials are available before claiming live purchase verification.
- Genuine product screenshots/demos and measured field Core Web Vitals remain separate SEO work; this release does not invent customer proof or claim a performance score.
