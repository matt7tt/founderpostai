import Link from 'next/link';
import Head from 'next/head';

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
          justifyContent: 'center',
          fontFamily: "'Inter', sans-serif",
          background: '#ffffff',
          color: '#0a0a0a',
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontFamily: "'Source Serif 4', serif",
            fontStyle: 'italic',
            fontWeight: 600,
            fontSize: '30px',
            letterSpacing: '-0.08em',
            margin: '0 0 32px',
          }}
        >
          FounderPostAI<sup style={{ fontFamily: "'Inter', sans-serif", fontStyle: 'normal', fontSize: '14px' }}>®</sup>
        </p>
        <h1 style={{ fontSize: 'clamp(36px, 6vw, 56px)', fontWeight: 600, letterSpacing: '-0.05em', lineHeight: 1.05, margin: '0 0 16px' }}>
          Your license key is on its way.
        </h1>
        <p style={{ fontSize: '17px', lineHeight: 1.5, color: '#6b6b6b', maxWidth: '460px', margin: '0 0 36px' }}>
          Check your inbox — we just emailed your license key and activation steps.
          Then in wp-admin: <strong>AI Suite → Connection</strong>, paste the key, done.
        </p>
        <Link
          href="/?v=studio"
          style={{
            background: '#0a0a0a',
            color: '#ffffff',
            borderRadius: '999px',
            padding: '16px 30px',
            fontSize: '15px',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Back to the site
        </Link>
      </div>
    </>
  );
}
