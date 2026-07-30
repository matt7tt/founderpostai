import { useState } from 'react';
import Link from 'next/link';
import { ChevronUp } from 'lucide-react';
import { AI_SEO_CAPABILITIES, HOME_FAQS } from '../lib/products';
import { WORDPRESS_ORG_REVIEW_NOTICE } from '../lib/site';
import styles from '../styles/Studio.module.css';

const TICKER_ITEMS = [
  'AI Suite Core',
  'AI Suite SEO',
  'SEO Pro',
  'Free & GPL',
  'Managed or BYOK',
  'GPL Licensed',
];

const TRUSTED = [
  { name: 'Block Editor', style: { fontFamily: 'system-ui', fontWeight: 800 } },
  { name: 'Classic Editor', style: { fontFamily: 'Georgia, serif', fontWeight: 500 } },
  { name: 'Yoast SEO', style: { fontFamily: 'Georgia, serif', fontWeight: 500 } },
  { name: 'Rank Math', style: { fontFamily: "'Inter', sans-serif", fontWeight: 600 } },
  { name: 'All in One SEO', style: { fontFamily: "'Source Serif 4', serif", fontWeight: 600 } },
  { name: 'SEOPress', style: { fontFamily: "'Inter', sans-serif", fontWeight: 700 } },
  { name: 'Action Scheduler', style: { fontFamily: 'system-ui', fontWeight: 600 } },
  { name: 'WP-Cron', style: { fontFamily: "'Inter', sans-serif", fontWeight: 600 } },
];

const PLUGINS = [
  {
    id: 'FREE · DIRECT DOWNLOAD',
    name: 'AI Suite Core',
    tagline: 'The runtime every module builds on',
    price: 'Free',
    download: '/downloads/aisuite-core.zip',
    desc: 'Connection, credits, brand context, and a three-tier job queue (Action Scheduler → loopback → WP-Cron). One shared embedding index of your site that every module retrieves against.',
    features: ['Signed gateway calls, both directions', 'Credits meter or BYOK — your key is never stored in WordPress', 'Brand context shared across modules', 'Reconcile poll for firewalled hosts'],
  },
  {
    id: 'FREE · DIRECT DOWNLOAD',
    name: 'AI Suite SEO',
    tagline: 'Analyze, review, apply — a complete product',
    price: 'Free',
    download: '/downloads/aisuite-seo.zip',
    desc: 'Full SEO suggestions with a review queue, per-post or in batches of ten. Block- and DOM-aware internal link insertion, validated against a closed candidate set. No locked features, no license checks.',
    features: ['Suggestion table + review UI', 'Internal links inserted block-aware', 'Revision saved before every write', 'Conflict detection for Yoast, Rank Math & AIOSEO'],
  },
  {
    id: 'PAID · THIS STORE',
    name: 'AI Suite SEO Pro',
    tagline: 'Bulk, scheduling, and auto-apply',
    price: '$79/yr',
    download: null,
    desc: 'Everything the free SEO plugin deliberately doesn’t contain: whole-site bulk runs, scheduled re-optimization, and auto-apply for trusted suggestion types. Ships with its own update client.',
    features: ['Bulk-run your entire backlog', 'Scheduled re-optimization', 'Auto-apply trusted suggestions', 'Updates served direct, not via .org'],
  },
];

const DRAWER_LINKS = [
  { label: 'Plugins', href: '#plugins' },
  { label: 'Plans', href: '#pricing' },
  { label: 'FAQs', href: '#faq' },
  { label: 'Product Facts', href: '/ai-suite' },
  { label: 'Account', href: '/login' },
  { label: 'Get in Touch', href: 'mailto:support@founderpostai.com' },
];

import { PAYMENT_LINKS, track } from '../lib/ab';

export default function Studio() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const sideLines = Array.from({ length: 20 });

  return (
    <div className={styles.root}>
      <a href="#main-content" className={styles.skipLink}>
        Skip to content
      </a>

      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.navbarInner}>
          <Link href="/" className={styles.logo}>
            FounderPostAI
          </Link>
          <button
            className={styles.menuButton}
            onClick={() => setDrawerOpen(!drawerOpen)}
            aria-expanded={drawerOpen}
            aria-controls="studio-menu"
          >
            Menu
            <ChevronUp
              size={16}
              style={{
                transition: 'transform 0.3s ease',
                transform: drawerOpen ? 'rotate(180deg)' : 'none',
              }}
            />
          </button>
        </div>
      </nav>

      {/* Drawer */}
      <div
        id="studio-menu"
        className={`${styles.drawer} ${drawerOpen ? styles.drawerOpen : ''}`}
        inert={!drawerOpen ? true : undefined}
      >
        {DRAWER_LINKS.map((l) =>
          l.href.startsWith('/') || l.href.startsWith('mailto') ? (
            <Link key={l.label} href={l.href} className={styles.drawerLink} onClick={() => setDrawerOpen(false)}>
              {l.label}
            </Link>
          ) : (
            <a key={l.label} href={l.href} className={styles.drawerLink} onClick={() => setDrawerOpen(false)}>
              {l.label}
            </a>
          )
        )}
        <p className={styles.drawerFooter}>© {new Date().getFullYear()} FounderPostAI — AI plugins for WordPress</p>
      </div>

      <main id="main-content">
      {/* Hero */}
      <section className={styles.hero}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/studio-hero.webp"
          alt=""
          width="1280"
          height="724"
          fetchPriority="high"
          className={styles.heroBackground}
        />
        {/* Side curved lines (desktop) */}
        <div className={styles.linesLeft}>
          {sideLines.map((_, i) => (
            <div
              key={`l${i}`}
              className={`${styles.lineSide} ${styles.lineLeft}`}
              style={{ width: `${60 + i * 10}px`, animationDelay: `${i * 0.25}s` }}
            />
          ))}
        </div>
        <div className={styles.linesRight}>
          {sideLines.map((_, i) => (
            <div
              key={`r${i}`}
              className={`${styles.lineSide} ${styles.lineRight}`}
              style={{ width: `${60 + i * 10}px`, animationDelay: `${i * 0.25}s` }}
            />
          ))}
        </div>
        {/* Top lines (mobile) */}
        <div className={styles.linesTop}>
          {sideLines.map((_, i) => (
            <div
              key={`t${i}`}
              className={styles.lineTop}
              style={{ height: `${60 + i * 10}px`, animationDelay: `${i * 0.25}s` }}
            />
          ))}
        </div>

        <div className={styles.heroContent}>
          {/* Ticker */}
          <div className={styles.ticker}>
            <div className={styles.tickerTrack}>
              {Array.from({ length: 4 }).flatMap((_, dup) =>
                TICKER_ITEMS.map((item) => (
                  <span key={`${dup}-${item}`} className={styles.tickerItem}>
                    {item}
                  </span>
                ))
              )}
            </div>
          </div>

          <h1 className={styles.title}>
            Safe AI SEO automation for <span className={styles.serif}>WordPress</span>.
          </h1>
          <p className={styles.subtitle}>
            Generate reviewable SEO titles, meta descriptions, and safe internal-link
            suggestions. Approve every change, keep revisions, and add bulk automation when
            you are ready.
          </p>

          <div className={styles.ctaRow}>
            <a href="#pricing" className={styles.primaryButton}>
              View Plans
            </a>
            <a href="mailto:support@founderpostai.com" className={styles.bookButton}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/support-avatar.png"
                alt=""
                width="40"
                height="40"
                className={styles.bookAvatar}
              />
              <span>
                <span className={styles.bookTextPrimary}>Chat for 15 minutes</span>
                <br />
                <span className={styles.bookTextSecondary}>
                  <span className={styles.greenDot} />
                  Pick a slot
                </span>
              </span>
            </a>
          </div>
        </div>

        <div className={styles.progressiveBlur} />
      </section>

      {/* Trusted by */}
      <section className={styles.trusted}>
        <p className={styles.trustedLabel}>Works with the tools you already use</p>
        <div className={styles.trustedMarquee}>
          <div className={styles.trustedTrack}>
            {Array.from({ length: 2 }).flatMap((_, dup) =>
              TRUSTED.map((t) => (
                <span key={`${dup}-${t.name}`} className={styles.trustedLogo} style={t.style}>
                  {t.name}
                </span>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Search-focused capabilities */}
      <section id="capabilities" aria-labelledby="studio-capabilities-heading" className={styles.section}>
        <p className={styles.sectionLabel}>WordPress AI SEO workflow</p>
        <h2 id="studio-capabilities-heading" className={styles.sectionTitle}>
          Optimize search snippets and internal links without giving up editorial control.
        </h2>
        <p className={styles.sectionSub}>
          FounderPostAI analyzes the content already on your site, returns structured suggestions,
          and lets you review the exact proposed value before anything changes.
        </p>
        <div className={styles.capabilityGrid}>
          {AI_SEO_CAPABILITIES.map((capability) => (
            <article id={capability.id} key={capability.id} className={styles.capabilityCard}>
              <h3>{capability.title}</h3>
              <p>{capability.summary}</p>
              <ul>
                {capability.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <p className={styles.sectionSub} style={{ marginTop: '28px', marginBottom: 0 }}>
          See the complete{' '}
          <Link href="/ai-suite#workflow" style={{ color: 'inherit', textDecoration: 'underline' }}>
            WordPress AI SEO workflow and technical details
          </Link>
          .
        </p>
      </section>

      {/* Plugins */}
      <section id="plugins" className={styles.section}>
        <p className={styles.sectionLabel}>The suite</p>
        <h2 className={styles.sectionTitle}>Two free plugins. One worth paying for.</h2>
        <p className={styles.sectionSub}>
          Core and SEO are complete, free products — no locked features, no license checks.
          Pro is a separate download that adds what the free plugin deliberately doesn’t contain.
        </p>
        <div role="note" className={styles.distributionNotice}>
          <strong>WordPress.org status</strong>
          <p>{WORDPRESS_ORG_REVIEW_NOTICE}</p>
        </div>
        <div className={styles.pluginGrid}>
          {PLUGINS.map((p) => (
            <article key={p.id} className={styles.pluginCard}>
              <div className={styles.pluginMeta}>
                <span>{p.id}</span>
                <span className={styles.pluginPrice}>{p.price}</span>
              </div>
              <h3 className={styles.pluginName}>{p.name}</h3>
              <p className={styles.pluginTagline}>{p.tagline}</p>
              <p className={styles.pluginDesc}>{p.desc}</p>
              <ul className={styles.pluginFeatures}>
                {p.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              {p.download ? (
                <a href={p.download} className={styles.pluginCta}>
                  Download {p.name} ↓
                </a>
              ) : (
                <a href="#pricing" className={styles.pluginCta}>
                  Get {p.name} →
                </a>
              )}
            </article>
          ))}
        </div>
        <p className={styles.sectionSub} style={{ marginTop: '28px', marginBottom: 0 }}>
          Need exact versions, requirements, or data-handling details?{' '}
          <Link href="/ai-suite" style={{ color: 'inherit', textDecoration: 'underline' }}>
            Read the verified technical overview
          </Link>
          .
        </p>
      </section>

      {/* Pricing */}
      <section id="pricing" className={styles.section}>
        <p className={styles.sectionLabel}>Honest pricing</p>
        <h2 className={styles.sectionTitle}>Start free. Pay only when you scale.</h2>
        <p className={styles.sectionSub}>
          All plans include updates and email support. Managed plans spend “actions” from a credit
          balance; BYOK is a flat fee with unlimited actions on your own provider key.
        </p>
        <div className={styles.pricingGrid}>
          <div className={styles.priceCard}>
            <h3 className={styles.priceName}>Free</h3>
            <p className={styles.priceNote}>Core + SEO, free downloads.</p>
            <p className={styles.priceAmount}>
              $0<span> forever</span>
            </p>
            <p className={styles.priceNote}>complete product, no license checks</p>
            <ul className={styles.priceFeatures}>
              <li>Analyze, review & apply suggestions</li>
              <li>Per-post and batches of ten</li>
              <li>Block-aware internal link insertion</li>
              <li>BYOK — unlimited actions on your key</li>
            </ul>
            <a href="#plugins" className={styles.priceButton}>
              Choose the free plugins
            </a>
          </div>

          <div className={`${styles.priceCard} ${styles.priceCardFeatured}`}>
            <h3 className={styles.priceName}>SEO Pro</h3>
            <p className={styles.priceNote}>Bulk, scheduling & auto-apply for one site.</p>
            <p className={styles.priceAmount}>
              $79<span>/yr</span>
            </p>
            <p className={styles.priceSave}>managed credits included — no API key needed</p>
            <ul className={styles.priceFeatures}>
              <li>Everything in Free</li>
              <li>Whole-site bulk runs</li>
              <li>Scheduled re-optimization</li>
              <li>Auto-apply trusted suggestions</li>
              <li>30-day money-back guarantee</li>
            </ul>
            <a
              href={PAYMENT_LINKS.pro}
              onClick={() => track('checkout_click', { design: 'studio', plan: 'pro' })}
              className={`${styles.priceButton} ${styles.priceButtonFeatured}`}
            >
              Get SEO Pro — $79/yr
            </a>
          </div>

          <div className={styles.priceCard}>
            <h3 className={styles.priceName}>Agency</h3>
            <p className={styles.priceNote}>Pro on every client site you run.</p>
            <p className={styles.priceAmount}>
              $199<span>/yr</span>
            </p>
            <p className={styles.priceNote}>unlimited sites, BYOK flat fee</p>
            <ul className={styles.priceFeatures}>
              <li>Everything in SEO Pro</li>
              <li>Unlimited client sites</li>
              <li>Unlimited actions on your own key</li>
              <li>Priority email support</li>
              <li>30-day money-back guarantee</li>
            </ul>
            <a
              href={PAYMENT_LINKS.agency}
              onClick={() => track('checkout_click', { design: 'studio', plan: 'agency' })}
              className={styles.priceButton}
            >
              Get Agency — $199/yr
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className={styles.section}>
        <div className={styles.faq}>
          <p className={styles.sectionLabel}>FAQ</p>
          <h2 className={styles.sectionTitle} style={{ marginBottom: '40px' }}>
            Questions WordPress people actually ask
          </h2>
          {HOME_FAQS.map(({ question, answer }) => (
            <details key={question} className={styles.faqItem}>
              <summary>
                {question}
                <span className={styles.faqPlus}>+</span>
              </summary>
              <p className={styles.faqAnswer}>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className={styles.finalCta}>
        <h2 className={styles.sectionTitle}>
          Give your site the <span className={styles.serif}>upgrade</span> it deserves.
        </h2>
        <p className={styles.sectionSub}>
          SEO Pro on one site, $79/yr. Core and SEO are free forever. Thirty days to change your
          mind.
        </p>
        <a
          href={PAYMENT_LINKS.pro}
          onClick={() => track('checkout_click', { design: 'studio', plan: 'pro' })}
          className={styles.primaryButton}
        >
          Get SEO Pro — $79/yr
        </a>
      </section>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <Link href="/" className={styles.logo} style={{ fontSize: '20px' }}>
          FounderPostAI
        </Link>
        <div className={styles.footerLinks}>
          <a href="#plugins">Plugins</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
          <Link href="/ai-suite">Product facts</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/login">Account</Link>
        </div>
        <p>© {new Date().getFullYear()} FounderPostAI · GPL-licensed code</p>
      </footer>
    </div>
  );
}
