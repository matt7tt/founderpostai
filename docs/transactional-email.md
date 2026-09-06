# Resend purchase and recovery emails

Sender: `support@contact.founderpostai.com`. Website and private purchase links remain on `https://founderpostai.com`. Production secrets are stored in Vercel, never in source or browser bundles.

## Delivery

Verified checkout fulfillment stores an encrypted receipt reference indexed by an HMAC of the normalized checkout email. It atomically queues one purchase message per subscription. Both the Stripe webhook and purchase page attempt delivery. Resend errors do not remove the license or block its download page; the webhook returns a retryable failure while the message remains pending. A permanent accepted-message marker plus Resend's 24-hour idempotency window prevents routine duplicate delivery. An ambiguous provider acceptance followed by an extended storage outage beyond that window can still result in a duplicate; this is not a claim of exactly-once external delivery.

The outbox uses an atomic 60-second sender lease, encrypted immutable payloads, bounded provider timeouts, and exponential retry delays. Message content is removed when Resend accepts it. Pending content expires 30 days after enqueue. “Sent” means accepted by Resend, not confirmed inbox delivery.

`/api/cron/email-outbox` requires `Authorization: Bearer <CRON_SECRET>`. The daily Vercel cron runs at 07:00 UTC (Hobby scheduling can vary within that hour), draining at most 25 messages within a bounded invocation. Checkout/webhook delivery does not wait for the daily cron. An operator can securely invoke the same endpoint after fixing a sender outage. Higher-frequency cron requires a Vercel plan supporting it; this release does not upgrade billing.

## Recovery

Forms on `/thanks` and `/contact` accept only the checkout email. The API responds generically whether or not it matched a purchase. Only existing purchase records can receive recovery messages. IP and address limits are 5/hour and 3/hour respectively; repeat requests within a 15-minute window share a single immutable message. Customers receive their existing private purchase URLs, not an unauthenticated API response containing licenses. Current subscription checks still govern downloads and billing.

New checkouts and verified receipt visits populate the recovery index. Historical purchases must be indexed before email-only recovery works; do not claim automatic migration without checking those sessions. Changes to a customer's Stripe billing email do not change the original checkout email used for this recovery flow.

## Required setup and checks

- Verify `contact.founderpostai.com` in Resend with its supplied SPF and DKIM records. DNS changes are managed by the site owner.
- Keep Resend click/open tracking disabled for the private receipt links. Plain-text messages do not embed tracking pixels.
- Configure a receiving mailbox or forwarding route for `support@contact.founderpostai.com` if customer replies should reach it. Sender verification alone does not create a support inbox. Existing published support contact details have not been replaced by an unverified inbox.
- Configure server-only `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `CRON_SECRET`, then redeploy. They must not use a `NEXT_PUBLIC_` prefix.
- Run `npm run test:reliability`. Email tests use a fake Resend API and disposable real Redis; they do not send customer mail or load production credentials.
- Once verified, smoke-test only with Resend's documented `delivered@resend.dev` recipient or a separately authorized test inbox. Do not send customer license data to a test recipient.

References: [Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys), [Resend test recipients](https://resend.com/docs/dashboard/emails/send-test-emails), [Vercel cron limits](https://vercel.com/docs/cron-jobs/usage-and-pricing).
