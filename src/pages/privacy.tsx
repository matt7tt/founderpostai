import Link from 'next/link';
import PolicyStructuredData from '../components/PolicyStructuredData';
import SeoHead from '../components/SeoHead';

export default function Privacy() {
  const description =
    'How FounderPostAI handles purchases, connected WordPress sites, AI processing, analytics, provider keys, and data rights.';

  return (
    <>
      <SeoHead
        title="Privacy Policy | FounderPostAI"
        description={description}
        path="/privacy"
      />
      <PolicyStructuredData
        path="/privacy"
        title="Privacy Policy | FounderPostAI"
        description={description}
        breadcrumbLabel="Privacy policy"
        dateModified="2026-07-30T22:00:00-07:00"
      />
      <div style={{ fontFamily: "'Inter', sans-serif", maxWidth: '680px', margin: '0 auto', padding: '64px 24px', color: '#0a0a0a', lineHeight: 1.7 }}>
        <nav aria-label="Breadcrumb" style={{ marginBottom: '32px', fontSize: '14px' }}>
          <Link href="/" style={{ color: '#6b6b6b' }}>FounderPostAI</Link>
          <span aria-hidden="true"> / </span>
          <span>Privacy policy</span>
        </nav>
        <h1 style={{ letterSpacing: '-0.04em' }}>Privacy Policy</h1>
        <p style={{ color: '#6b6b6b' }}>Last updated: July 2026</p>

        <h2>What we collect</h2>
        <p>
          <strong>When you buy:</strong> your email address and payment details, processed by
          Stripe. We never see your card number.
        </p>
        <p>
          <strong>When you connect a site:</strong> your site URL, admin email, WordPress version,
          and PHP version — sent once, at connection time, to create your account record.
        </p>
        <p>
          <strong>When you run an action:</strong> the content you submit for processing (e.g. a
          post’s title and body, existing meta values, and a list of published post titles/URLs
          for internal-link suggestions), plus your brand context. Nothing is sent until you run
          an action.
        </p>
        <p>
          <strong>On this website:</strong> anonymized usage analytics via Vercel Web Analytics,
          including page paths, referring domains, plugin-download clicks, pricing and checkout
          clicks, support and outbound-link clicks, and the purchased plan after a successful
          license lookup. We do not send payment details, license keys, content, URL query
          parameters, or advertising identifiers to analytics. No advertising trackers.
        </p>

        <h2>What we never do</h2>
        <p>
          We never use your content to train AI models. We never sell your data. Your AI provider
          key (BYOK mode) is posted directly to the gateway and never written to your WordPress
          database.
        </p>

        <h2>Third parties</h2>
        <p>
          Stripe (payments), Anthropic (inference, with training opted out), Vercel (hosting and
          analytics).
        </p>

        <h2>Your rights</h2>
        <p>
          Email <a href="mailto:support@founderpostai.com">support@founderpostai.com</a> to
          access, correct, export, or delete your data. Deleting your account removes your site
          record and content history from the gateway.
        </p>

        <nav aria-label="Related pages" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #e5e5e5' }}>
          <Link href="/" style={{ color: '#6b6b6b' }}>FounderPostAI home</Link>
          <Link href="/ai-suite" style={{ color: '#6b6b6b' }}>AI SEO plugin details</Link>
          <Link href="/resources" style={{ color: '#6b6b6b' }}>WordPress SEO resources</Link>
          <Link href="/terms" style={{ color: '#6b6b6b' }}>Terms of service</Link>
        </nav>
      </div>
    </>
  );
}
