import Link from 'next/link';
import Head from 'next/head';

const card: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid rgba(0,0,0,0.08)',
  borderRadius: '16px',
  padding: '24px',
  textAlign: 'left',
};

const downloadBtn: React.CSSProperties = {
  display: 'inline-block',
  background: '#0a0a0a',
  color: '#ffffff',
  borderRadius: '999px',
  padding: '12px 22px',
  fontSize: '14px',
  fontWeight: 600,
  textDecoration: 'none',
};

export default function Thanks() {
  return (
    <>
      <Head>
        <title>Thank you — FounderPostAI</title>
      </Head>
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          fontFamily: "'Inter', sans-serif",
          background: '#fafafa',
          color: '#0a0a0a',
          padding: '64px 24px',
        }}
      >
        <p
          style={{
            fontFamily: "'Source Serif 4', serif",
            fontStyle: 'italic',
            fontWeight: 600,
            fontSize: '30px',
            letterSpacing: '-0.08em',
            margin: '0 0 24px',
          }}
        >
          FounderPostAI<sup style={{ fontFamily: "'Inter', sans-serif", fontStyle: 'normal', fontSize: '14px' }}>®</sup>
        </p>
        <h1
          style={{
            fontSize: 'clamp(32px, 5vw, 48px)',
            fontWeight: 600,
            letterSpacing: '-0.05em',
            lineHeight: 1.05,
            margin: '0 0 12px',
            textAlign: 'center',
          }}
        >
          You’re in. Here’s your plugin.
        </h1>
        <p style={{ fontSize: '16px', lineHeight: 1.5, color: '#6b6b6b', maxWidth: '480px', margin: '0 0 40px', textAlign: 'center' }}>
          Download below, then in wp-admin: <strong>Plugins → Add New → Upload Plugin</strong>.
          Install in this order — each one needs the previous.
        </p>

        <div style={{ display: 'grid', gap: '16px', maxWidth: '520px', width: '100%' }}>
          <div style={card}>
            <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', color: '#6b6b6b' }}>STEP 1 · FREE</p>
            <h2 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: 600, letterSpacing: '-0.02em' }}>AI Suite Core</h2>
            <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#6b6b6b', lineHeight: 1.5 }}>
              The runtime: connection, credits, and brand context. Required by everything else.
            </p>
            <a href="/downloads/aisuite-core.zip" style={downloadBtn}>Download Core ↓</a>
          </div>

          <div style={card}>
            <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', color: '#6b6b6b' }}>STEP 2 · FREE</p>
            <h2 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: 600, letterSpacing: '-0.02em' }}>AI Suite SEO</h2>
            <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#6b6b6b', lineHeight: 1.5 }}>
              The free SEO module: suggestions, review queue, and internal links.
            </p>
            <a href="/downloads/aisuite-seo.zip" style={downloadBtn}>Download SEO ↓</a>
          </div>

          <div style={{ ...card, border: '2px solid #0a0a0a' }}>
            <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', color: '#0a0a0a' }}>STEP 3 · YOUR PURCHASE</p>
            <h2 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: 600, letterSpacing: '-0.02em' }}>AI Suite SEO Pro</h2>
            <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#6b6b6b', lineHeight: 1.5 }}>
              Bulk runs, scheduling, and auto-apply. After activating, go to{' '}
              <strong>AI Suite → Connection</strong> to link your account.
            </p>
            <a href="/downloads/aisuite-seo-pro-1.0.0.zip" style={downloadBtn}>Download SEO Pro ↓</a>
          </div>
        </div>

        <p style={{ fontSize: '13px', color: '#9b9b9b', maxWidth: '440px', margin: '32px 0 24px', textAlign: 'center', lineHeight: 1.6 }}>
          Save this page (bookmark it) — it’s your download hub. Receipt is in your inbox from
          Stripe. Questions or a refund within 30 days? Just reply to it.
        </p>
        <Link href="/" style={{ fontSize: '14px', color: '#6b6b6b', textDecoration: 'underline' }}>
          Back to the site
        </Link>
      </div>
    </>
  );
}
