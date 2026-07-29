import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';

export default function Connect() {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const mint = async () => {
    setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/gateway/v1/connect-token', { method: 'POST' });
      const d = await r.json();
      if (d.connect_token) setToken(d.connect_token);
      else setError(d.error || 'Something went wrong.');
    } catch {
      setError('Something went wrong.');
    }
    setLoading(false);
  };

  return (
    <>
      <Head>
        <title>Get a connection token — FounderPostAI</title>
      </Head>
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Inter', sans-serif",
          background: '#fafafa',
          color: '#0a0a0a',
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 600, letterSpacing: '-0.04em', margin: '0 0 12px' }}>
          Connect your site
        </h1>
        <p style={{ fontSize: '16px', color: '#6b6b6b', maxWidth: '440px', margin: '0 0 32px', lineHeight: 1.6 }}>
          Generate a free connection token, then paste it into{' '}
          <strong>wp-admin → AI Suite → Connection</strong>. Tokens are single-use and expire in
          15 minutes.
        </p>

        {token ? (
          <div
            style={{
              background: '#fff',
              border: '2px solid #0a0a0a',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '520px',
              width: '100%',
            }}
          >
            <p style={{ margin: '0 0 12px', fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 'clamp(14px, 3vw, 18px)', wordBreak: 'break-all' }}>
              {token}
            </p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(token);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              style={{ background: '#0a0a0a', color: '#fff', border: 'none', borderRadius: '999px', padding: '12px 22px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
            >
              {copied ? 'Copied ✓' : 'Copy token'}
            </button>
          </div>
        ) : (
          <button
            onClick={mint}
            disabled={loading}
            style={{ background: '#0a0a0a', color: '#fff', border: 'none', borderRadius: '999px', padding: '16px 30px', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}
          >
            {loading ? 'Generating…' : 'Generate my token'}
          </button>
        )}
        {error && <p style={{ color: '#c00', marginTop: '16px' }}>{error}</p>}

        <p style={{ marginTop: '32px' }}>
          <Link href="/" style={{ fontSize: '14px', color: '#6b6b6b' }}>← Back to the site</Link>
        </p>
      </div>
    </>
  );
}
