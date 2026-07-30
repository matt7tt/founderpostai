import Head from 'next/head';
import Link from 'next/link';

export default function Terms() {
  return (
    <>
      <Head>
        <title>Terms of Service — FounderPostAI</title>
      </Head>
      <div style={{ fontFamily: "'Inter', sans-serif", maxWidth: '680px', margin: '0 auto', padding: '64px 24px', color: '#0a0a0a', lineHeight: 1.7 }}>
        <h1 style={{ letterSpacing: '-0.04em' }}>Terms of Service</h1>
        <p style={{ color: '#6b6b6b' }}>Last updated: July 2026</p>

        <h2>1. The service</h2>
        <p>
          FounderPostAI sells licenses for AI Suite SEO Pro and AI Suite Agency, WordPress plugins
          that connect to our hosted gateway to generate SEO suggestions (titles, meta
          descriptions, internal links). The free AI Suite Core and AI Suite SEO plugins are
          licensed under the GPL v2 or later.
        </p>

        <h2>2. Subscriptions</h2>
        <p>
          Paid plans are billed yearly in USD via Stripe. You may cancel at any time; access
          continues until the end of the paid period. We offer a 30-day money-back guarantee on
          all first purchases — email us for a full refund, no questions asked.
        </p>

        <h2>3. License scope</h2>
        <p>
          SEO Pro licenses cover one WordPress site. Agency licenses cover unlimited sites owned
          or managed by you. License keys may not be resold or redistributed.
        </p>

        <h2>4. Content and AI processing</h2>
        <p>
          Content is only sent to the gateway when you explicitly run an action. We do not use
          your content to train AI models. Suggestions are provided as-is; you are responsible
          for reviewing them before applying.
        </p>

        <h2>5. Liability</h2>
        <p>
          The plugins are provided “as is” without warranty of any kind, to the maximum extent
          permitted by law. Our total liability is limited to the amount you paid in the 12
          months preceding the claim.
        </p>

        <h2>6. Contact</h2>
        <p>
          Questions: <a href="mailto:support@founderpostai.com">support@founderpostai.com</a>
        </p>

        <p style={{ marginTop: '48px' }}>
          <Link href="/" style={{ color: '#6b6b6b' }}>← Back to founderpostai.com</Link>
        </p>
      </div>
    </>
  );
}
