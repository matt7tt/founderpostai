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
        dateModified="2026-09-06"
      />
      <div style={{ fontFamily: "'Inter', sans-serif", maxWidth: '680px', margin: '0 auto', padding: '64px 24px', color: '#0a0a0a', lineHeight: 1.7 }}>
        <nav aria-label="Breadcrumb" style={{ marginBottom: '32px', fontSize: '14px' }}>
          <Link href="/" style={{ color: '#6b6b6b' }}>FounderPostAI</Link>
          <span aria-hidden="true"> / </span>
          <span>Privacy policy</span>
        </nav>
        <h1 style={{ letterSpacing: '-0.04em' }}>Privacy Policy</h1>
        <p style={{ color: '#6b6b6b' }}>Last updated: September 2026</p>

        <h2>What we collect</h2>
        <p>
          <strong>When you buy:</strong> your email address and payment details, processed by
          Stripe. We never see your card number.
        </p>
        <p>
          <strong>Purchase and recovery emails:</strong> Resend processes your checkout email
          address and transactional message contents, including your license and private purchase
          link, to deliver purchase confirmations and requested recovery emails. Our recovery lookup
          uses a keyed hash of your checkout address and encrypted receipt references. Pending email
          payloads are encrypted, removed when Resend accepts a message, and expire after 30 days
          without a successful retry. Delivery markers are retained to prevent duplicate messages.
          Purchase references remain available for license and billing recovery.
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
          <strong>When you send plugin feedback:</strong> your message, selected reply email,
          plugin and software versions, and connected site identity are stored so we can
          investigate bugs, reply when requested, and plan improvements. Feedback remains in our
          review inbox until it is no longer useful for support or product planning, or you ask us
          to delete it.
        </p>
        <p>
          <strong>When you connect Google Search Console:</strong> Google grants the gateway a
          read-only refresh token, which is stored encrypted. The selected property and its
          search queries, pages, clicks, impressions, click-through rates, and average positions
          are retrieved only to provide the WordPress search-performance dashboard. Search
          Console data is not sent to an AI model. Disconnecting removes the stored Google token.
        </p>
        <p>
          <strong>On this website:</strong> anonymous traffic measurement via Vercel Web
          Analytics. We also keep first-party daily counters for page views, plugin install and
          download clicks, connection progress, first completed plugin jobs, checkout clicks, and
          confirmed purchases. Those counters contain only the event type, day, and page path;
          query strings are removed. Anonymous duplicate-prevention markers are used for first-job
          and purchase counts. Counters and markers expire after 180 days.
        </p>
        <p>
          We do not add raw IP addresses, cookies, emails, payment details, license keys, submitted
          content, URL query parameters, or advertising identifiers to these first-party counters.
          We do not use advertising trackers.
        </p>

        <h2>What we never do</h2>
        <p>
          We never use your content to train AI models. We never sell your data. Your AI provider
          key (BYOK mode) is posted directly to the gateway and never written to your WordPress
          database.
        </p>

        <h2>Third parties</h2>
        <p>
          Stripe (payments), Resend (transactional purchase and recovery emails), Anthropic (inference, with training opted out), Google (optional
          read-only Search Console data), Vercel (hosting and analytics), and Upstash (durable
          gateway, OAuth token, feedback, and anonymous aggregate analytics storage).
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
