# FounderPostAI

A store for the **AI Suite** WordPress plugin family:

- **AI Suite Core** (Free, WordPress.org) — connection, credits, brand context, job queue
- **AI Suite SEO** (Free, WordPress.org) — suggestions + review queue, batches of ten, block-aware internal links
- **AI Suite SEO Pro** ($79/yr, this store) — bulk runs, scheduling, auto-apply
- **Agency** ($199/yr) — Pro on unlimited client sites, BYOK flat fee

Billing modes: managed credits ("actions") or BYOK (customer's own provider key, never stored in WordPress). 30-day refunds, GPL-licensed.

## A/B testing

The homepage is split 50/50 between two designs via `src/middleware.ts` (cookie `ab_design`,
30 days). Variants live in `src/designs/Editorial.tsx` and `src/designs/Studio.tsx`.
Force one with `/?v=studio` or `/?v=editorial`. Conversion events (`landing_view`,
`checkout_click`) go to Vercel Analytics via `@vercel/analytics`.

## Payments

Stripe Payment Links — no custom checkout code. Set:

```env
NEXT_PUBLIC_STRIPE_PAYMENT_LINK_PRO="https://buy.stripe.com/..."
NEXT_PUBLIC_STRIPE_PAYMENT_LINK_AGENCY="https://buy.stripe.com/..."
```

Set each link's after-payment redirect to `/thanks`.

## Design direction

Editorial / indie-plugin-shop aesthetic (deliberately anti-"AI SaaS" slop): warm paper background
(`#F7F4EE`), ink text (`#1B1712`), single WordPress-blue accent (`#00749C`), serif display type
(Charter/Cambria stack), monospace micro-labels, hard borders and offset shadows instead of
gradients and glow.

The landing page (`src/pages/index.tsx`) is self-contained Tailwind; the legacy SaaS dashboard,
auth, and Stripe checkout are still present but unlinked from the homepage except the login link.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Create a `.env.local` file:

```env
ANTHROPIC_API_KEY=sk-ant-your_key
NEXTAUTH_SECRET=your_random_32char_secret
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_your_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
STRIPE_PRO_PRICE_ID=price_your_price_id
```

### 3. Create Stripe Product

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Create a product: "FounderPostAI Pro"
3. Set price: $9.00/month recurring
4. Copy the price ID to `STRIPE_PRO_PRICE_ID`

### 4. Set up Stripe Webhook

1. In Stripe Dashboard → Webhooks → Add endpoint
2. URL: `https://yourdomain.com/api/webhooks/stripe`
3. Events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
   - `invoice.payment_failed`
4. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 6. Deploy to Vercel

```bash
npx vercel --prod
```

Add all environment variables in Vercel project settings.

## Tech Stack

- **Framework**: Next.js 14 (Pages Router)
- **Styling**: Tailwind CSS
- **Auth**: NextAuth.js
- **AI**: Anthropic Claude API
- **Payments**: Stripe
- **Storage**: In-memory (upgrade to PostgreSQL for production)

## Notes

- In-memory storage resets on server restart. For production, use a real database (Vercel Postgres, Supabase, PlanetScale)
- The free tier allows 2 posts/month, Pro allows 50/month
