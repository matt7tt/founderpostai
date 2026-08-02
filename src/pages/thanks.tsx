import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import SeoHead from '../components/SeoHead';
import { track } from '../lib/ab';
import { AI_SUITE_PRODUCTS } from '../lib/products';

const SEO_PRO = AI_SUITE_PRODUCTS.find((product) => product.id === 'ai-suite-seo-pro')!;

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

interface LicenseData {
  planLabel: string;
  licenseKey: string;
  email?: string;
}

export default function Thanks() {
  const router = useRouter();
  const [license, setLicense] = useState<LicenseData | null>(null);
  const [licenseError, setLicenseError] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    const sessionId = router.query.session_id as string;
    if (!sessionId) return;

    fetch(`/api/license?session_id=${encodeURIComponent(sessionId)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: LicenseData) => {
        setLicense(data);
        track('purchase_confirmed', { plan: data.planLabel });
      })
      .catch(() => setLicenseError(true));
  }, [router.isReady, router.query.session_id]);

  const copyKey = () => {
    if (!license) return;
    navigator.clipboard.writeText(license.licenseKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <SeoHead title="Thank you | FounderPostAI" path="/thanks" noIndex />
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
          FounderPostAI
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
          You’re in. Here’s your license.
        </h1>
        <p style={{ fontSize: '16px', lineHeight: 1.5, color: '#6b6b6b', maxWidth: '480px', margin: '0 0 32px', textAlign: 'center' }}>
          Activate it in wp-admin under <strong>AI Suite → Connection</strong>, then install the
          plugins below in order.
        </p>

        {/* License key box */}
        {license && (
          <div
            style={{
              ...card,
              border: '2px solid #0a0a0a',
              maxWidth: '520px',
              width: '100%',
              marginBottom: '32px',
              textAlign: 'center',
            }}
          >
            <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', color: '#6b6b6b' }}>
              YOUR {license.planLabel.toUpperCase()} LICENSE KEY
            </p>
            <p
              style={{
                margin: '0 0 16px',
                fontFamily: 'ui-monospace, Menlo, monospace',
                fontSize: 'clamp(18px, 4vw, 24px)',
                letterSpacing: '0.06em',
                fontWeight: 600,
              }}
            >
              {license.licenseKey}
            </p>
            <button onClick={copyKey} style={{ ...downloadBtn, border: 'none', cursor: 'pointer' }}>
              {copied ? 'Copied ✓' : 'Copy key'}
            </button>
          </div>
        )}
        {licenseError && (
          <p style={{ fontSize: '14px', color: '#6b6b6b', maxWidth: '440px', margin: '0 0 32px', textAlign: 'center', lineHeight: 1.6 }}>
            We couldn’t load your license key automatically — don’t worry, your payment went
            through. Reply to your Stripe receipt and we’ll send it over.
          </p>
        )}

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

          <div style={card}>
            <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', color: '#6b6b6b' }}>STEP 3 · YOUR PURCHASE</p>
            <h2 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: 600, letterSpacing: '-0.02em' }}>AI Suite SEO Pro</h2>
            <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#6b6b6b', lineHeight: 1.5 }}>
              Bulk runs, scheduling, and auto-apply. Paste your license key after activating.
            </p>
            <a href={`/downloads/aisuite-seo-pro-${SEO_PRO.version}.zip`} style={downloadBtn}>Download SEO Pro ↓</a>
          </div>
        </div>

        <p style={{ fontSize: '13px', color: '#9b9b9b', maxWidth: '440px', margin: '32px 0 24px', textAlign: 'center', lineHeight: 1.6 }}>
          Bookmark this page — your key and downloads live here. Receipt is in your inbox from
          Stripe. Questions or a refund within 30 days? Just reply to it.
        </p>
        <Link href="/" style={{ fontSize: '14px', color: '#6b6b6b', textDecoration: 'underline' }}>
          Back to the site
        </Link>
      </div>
    </>
  );
}
