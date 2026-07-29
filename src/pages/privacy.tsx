import Head from 'next/head';
import Link from 'next/link';

export default function Privacy() {
  return (
    <>
      <Head>
        <title>Privacy Policy — FounderPostAI</title>
      </Head>
      <div style={{ fontFamily: "'Inter', sans-serif", maxWidth: '680px', margin: '0 auto', padding: '64px 24px', color: '#0a0a0a', lineHeight: 1.7 }}>
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
          <strong>On this website:</strong> anonymized usage analytics via Vercel Web Analytics.
          No advertising trackers.
        </p>

        <h2>What we never do</h2>
        <p>
          We never use your content to train AI models. We never sell your data. Your AI provider
          key (BYOK mode) is posted directly to the gateway and never written to your WordPress
          database.
        </p>

        <h2>Third parties</h2>
        <p>
          Stripe (payments), Anthropic/OpenAI (inference, with training opted out), Vercel
          (hosting and analytics).
        </p>

        <h2>Your rights</h2>
        <p>
          Email <a href="mailto:support@founderpostai.com">support@founderpostai.com</a> to
          access, correct, export, or delete your data. Deleting your account removes your site
          record and content history from the gateway.
        </p>

        <p style={{ marginTop: '48px' }}>
          <Link href="/" style={{ color: '#6b6b6b' }}>← Back to founderpostai.com</Link>
        </p>
      </div>
    </>
  );
}
