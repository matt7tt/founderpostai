import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import SeoHead from '../components/SeoHead';
import { WORDPRESS_ORG_CORE_URL } from '../lib/site';

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
  active: boolean;
  downloadUrl: string | null;
  licensedSite: string | null;
}

export default function Thanks() {
  const router = useRouter();
  const [license, setLicense] = useState<LicenseData | null>(null);
  const [licenseError, setLicenseError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    const sessionId = router.query.session_id;
    const controller = new AbortController();
    setLicense(null);
    setLicenseError('');
    setLoading(true);
    if (typeof sessionId !== 'string' || !sessionId.startsWith('cs_')) {
      setLicenseError('Open the confirmation link from checkout to view your purchase. If you lost it, contact support with your Stripe receipt.');
      setLoading(false);
      return;
    }
    void (async () => {
      try {
        for (let retry = 0; retry < 3; retry++) {
          const response = await fetch(`/api/license?session_id=${encodeURIComponent(sessionId)}`, { signal: controller.signal, cache: 'no-store' });
          const data = await response.json();
          if (response.ok) {
            if (!controller.signal.aborted) {
              setLicense(data);
            }
            return;
          }
          if (response.status !== 503 || retry === 2) throw new Error(data.error || 'Your purchase could not be verified.');
          await new Promise(resolve => setTimeout(resolve, 1500 * (retry + 1)));
          if (controller.signal.aborted) return;
        }
      } catch (error) {
        if (!controller.signal.aborted) setLicenseError(error instanceof Error ? error.message : 'We could not verify your purchase. Please retry.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [router.isReady, router.query.session_id, attempt]);

  const copyKey = async () => {
    if (!license) return;
    try {
      await navigator.clipboard.writeText(license.licenseKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { setActionError('Clipboard access was blocked. Select and copy the key above.'); }
  };

  const manage = async (action: 'billing' | 'release_site') => {
    if (action === 'release_site' && !window.confirm('Remove the license key from the old WordPress site first. Release its one-site activation now?')) return;
    setBusy(true);
    setActionError('');
    try {
      const response = await fetch('/api/purchase/manage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, session_id: router.query.session_id }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (data.url) window.location.assign(data.url);
      else setAttempt(value => value + 1);
    } catch (error) { setActionError(error instanceof Error ? error.message : 'Please retry.'); }
    finally { setBusy(false); }
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
          {license ? 'Your AI Suite purchase.' : loading ? 'Checking your purchase…' : 'Purchase lookup'}
        </h1>
        <p style={{ fontSize: '16px', lineHeight: 1.5, color: '#6b6b6b', maxWidth: '480px', margin: '0 0 32px', textAlign: 'center' }}>
          Install the plugins below in order. Connect Core under <strong>AI Suite → Connection</strong>,
          then enter your license under <strong>AI Suite → SEO Pro</strong>.
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
            <p>{license.active ? 'Subscription active' : 'Subscription inactive — manage billing to renew.'}</p>
            <button disabled={busy} onClick={() => manage('billing')}>Manage billing / cancel subscription</button>
            {license.licensedSite && <p>Active site: {license.licensedSite}<br /><button disabled={busy} onClick={() => manage('release_site')}>Release site for a move</button></p>}
          </div>
        )}
        {licenseError && (
          <div role="alert" style={{ maxWidth: '440px', marginBottom: '32px', textAlign: 'center' }}>
            <p>{licenseError}</p>
            <button onClick={() => setAttempt(value => value + 1)}>Retry lookup</button>{' · '}<Link href="/contact">Contact support</Link>
            {process.env.NEXT_PUBLIC_STRIPE_BILLING_PORTAL && <p><a href={process.env.NEXT_PUBLIC_STRIPE_BILLING_PORTAL}>Manage billing with your checkout email</a></p>}
          </div>
        )}
        {actionError && <p role="alert">{actionError}</p>}

        <div style={{ display: 'grid', gap: '16px', maxWidth: '520px', width: '100%' }}>
          <div style={card}>
            <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', color: '#6b6b6b' }}>STEP 1 · FREE</p>
            <h2 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: 600, letterSpacing: '-0.02em' }}>AI Suite Core</h2>
            <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#6b6b6b', lineHeight: 1.5 }}>
              The runtime: connection, credits, and brand context. Required by everything else.
            </p>
            <a href={WORDPRESS_ORG_CORE_URL} style={downloadBtn}>Get Core on WordPress.org →</a>
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
            {license?.downloadUrl ? <a href={license.downloadUrl} style={downloadBtn}>Download SEO Pro ↓</a> : <p>Pro downloads become available after your active purchase is verified.</p>}
          </div>
        </div>

        <p style={{ fontSize: '13px', color: '#9b9b9b', maxWidth: '440px', margin: '32px 0 24px', textAlign: 'center', lineHeight: 1.6 }}>
          Keep this page private and bookmark it for your key, fresh download links, and billing.
          Questions or a refund within 30 days? <Link href="/contact">Contact support</Link> with your Stripe receipt.
        </p>
        <Link href="/" style={{ fontSize: '14px', color: '#6b6b6b', textDecoration: 'underline' }}>
          Back to the site
        </Link>
      </div>
    </>
  );
}
