# FounderPostAI

A store for the **AI Suite** WordPress plugin family:

- **AI Suite Core** (Free on WordPress.org) — connection, credits, brand context, job queue
- **AI Suite SEO** (Free, direct download) — suggestions + review queue, batches of ten, block-aware internal links
- **AI Suite SEO Pro** ($79/yr, this store) — bulk runs, scheduling, auto-apply
- **Agency** ($199/yr) — Pro on unlimited client sites, BYOK flat fee

Billing modes: managed credits ("actions") or BYOK (customer's own provider key, never stored in WordPress). 30-day refunds, GPL-licensed.

## Traffic and conversion measurement

The homepage uses the Editorial design while the traffic baseline grows. Vercel Web Analytics
provides anonymous site traffic, and the app also stores privacy-safe daily funnel counters in
Upstash for page views, plugin clicks, connection codes, connected sites, first completed jobs,
checkout clicks, and purchases. Open the private `/feedback-review` route to see those metrics.
Daily counters and anonymous duplicate-prevention markers expire after 180 days.

The site shares one canonical URL, search metadata, social preview, and SoftwareApplication
structured-data graph. Public indexable URLs are listed in `/sitemap.xml`; account and transaction
routes send `noindex` directives.

Guide publication and update dates live alongside each entry in `src/lib/search-content.ts`.
Preserve `publishedAt` and advance `updatedAt` only for substantive content changes, not a deploy.
Those dates drive visible bylines, structured data, and sitemap timestamps. Static information-page
and resource-index dates live in `src/lib/content-dates.ts`.
Product-record update dates live beside each product in `src/lib/products.ts`; the product
overview uses the most recent of those dates.

Run `npm run check` for lint, types, gateway tests, SEO schema tests, and a production build.
With `npm start` running, `npm run check:seo` checks all public routes and canonical-host redirects.
After deployment, repeat against production:

```bash
SEO_BASE_URL=https://founderpostai.com npm run check:seo
```

## Payments

Stripe Payment Links — no custom checkout code. Set:

```env
NEXT_PUBLIC_STRIPE_PAYMENT_LINK_PRO="https://buy.stripe.com/..."
NEXT_PUBLIC_STRIPE_PAYMENT_LINK_AGENCY="https://buy.stripe.com/..."
```

Set each link's after-payment redirect to:

```text
https://founderpostai.com/thanks?session_id={CHECKOUT_SESSION_ID}
```

The Checkout Session placeholder is required: the thank-you page verifies the
paid Stripe subscription, issues the customer’s license, and indexes it for Pro updates.

## Design direction

Editorial / indie-plugin-shop aesthetic (deliberately anti-"AI SaaS" slop): warm paper background
(`#F7F4EE`), ink text (`#1B1712`), single WordPress-blue accent (`#00749C`), serif display type
(Charter/Cambria stack), monospace micro-labels, hard borders and offset shadows instead of
gradients and glow.

The landing page (`src/pages/index.tsx`) is self-contained Tailwind; the legacy SaaS dashboard,
auth, and Stripe checkout are still present but are not linked from the plugin storefront.

## Setup

### 1. Install dependencies

Use Node.js 20.9 or newer, then install dependencies:

```bash
npm install
```

### 2. Environment variables

Create a `.env.local` file:

```env
ANTHROPIC_API_KEY=sk-ant-your_key
ANTHROPIC_MODEL=your_supported_model_id
NEXT_PUBLIC_URL=http://localhost:3000
UPSTASH_REDIS_REST_URL=https://your-database.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
GATEWAY_KMS_KEY=your_random_64_character_hex_key
STRIPE_SECRET_KEY=sk_test_your_key
NEXT_PUBLIC_STRIPE_PAYMENT_LINK_PRO=https://buy.stripe.com/...
NEXT_PUBLIC_STRIPE_PAYMENT_LINK_AGENCY=https://buy.stripe.com/...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_AGENCY=price_...
```

Generate `GATEWAY_KMS_KEY` with `openssl rand -hex 32`. Changing it after customers
save BYOK credentials makes those credentials unreadable, so store it as a durable secret.

### 3. Create Stripe products and Payment Links

1. Create **AI Suite SEO Pro** at $79/year.
2. Create **AI Suite Agency** at $199/year.
3. Create a Payment Link for each and set the matching public environment variable.
4. Copy each product's recurring Price ID into `STRIPE_PRICE_PRO` or
   `STRIPE_PRICE_AGENCY`. License issuance fails closed if these are missing.
5. Set each after-payment redirect to
   `https://yourdomain.com/thanks?session_id={CHECKOUT_SESSION_ID}`.

No webhook is required for the plugin purchase flow. The license endpoint verifies the
Checkout Session before issuing a key, and the Pro update endpoint re-checks the
subscription in Stripe before returning a package.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Deploy to Vercel

```bash
npx vercel --prod
```

Add all environment variables in Vercel project settings.

## Tech Stack

- **Framework**: Next.js 16 (Pages Router)
- **Styling**: Tailwind CSS
- **Auth**: NextAuth.js
- **AI**: Anthropic Claude API
- **Payments**: Stripe
- **Gateway storage**: Upstash Redis

## Notes

- Legacy LinkedIn-SaaS routes remain in the repository but are not linked from the plugin storefront.
- The plugin gateway requires Redis; it deliberately does not fall back to process memory.

## Plugin feedback inbox

Connected plugin sites can submit bugs, feature ideas, and general feedback from **AI Suite → Feedback**. Submissions are authenticated with the site's existing signing secret, rate-limited, and stored durably in Upstash Redis.

Set `FEEDBACK_ADMIN_PASSWORD` to a unique value of at least 12 characters, then open `/feedback-review` to review submissions, add private notes, and move each item through new, reviewing, planned, resolved, or spam. The inbox uses `FEEDBACK_ADMIN_SESSION_SECRET`, `NEXTAUTH_SECRET`, or the existing `GATEWAY_KMS_KEY` (in that order) to sign its private session. The route is deliberately unlinked, no-indexed, uncached, and protected by an HttpOnly same-site cookie.
