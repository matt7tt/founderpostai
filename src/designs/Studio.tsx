import { useState } from 'react';
import Link from 'next/link';
import { ChevronUp } from 'lucide-react';
import styles from '../styles/Studio.module.css';

const TICKER_ITEMS = [
  'AI Suite Core',
  'AI Suite SEO',
  'SEO Pro',
  'Free on WordPress.org',
  'Managed or BYOK',
  'GPL Licensed',
];

const TRUSTED = [
  { name: 'WooCommerce', style: { fontFamily: 'system-ui', fontWeight: 800 } },
  { name: 'Yoast', style: { fontFamily: 'Georgia, serif', fontWeight: 500 } },
  { name: 'Rank Math', style: { fontFamily: "'Inter', sans-serif", fontWeight: 600 } },
  { name: 'Elementor', style: { fontFamily: "'Inter', sans-serif", fontWeight: 700 } },
  { name: 'Gutenberg', style: { fontFamily: 'system-ui', fontWeight: 600 } },
  { name: 'WP Engine', style: { fontFamily: 'Georgia, serif', fontWeight: 700 } },
  { name: 'Kinsta', style: { fontFamily: 'system-ui', fontWeight: 800 } },
  { name: 'Cloudways', style: { fontFamily: "'Inter', sans-serif", fontWeight: 600 } },
  { name: 'AIOSEO', style: { fontFamily: "'Source Serif 4', serif", fontWeight: 600 } },
  { name: 'Multisite', style: { fontFamily: "'Inter', sans-serif", fontWeight: 600 } },
];

const PLUGINS = [
  {
    id: 'FREE · WORDPRESS.ORG',
    name: 'AI Suite Core',
    tagline: 'The runtime every module builds on',
    price: 'Free',
    desc: 'Connection, credits, brand context, and a three-tier job queue (Action Scheduler → loopback → WP-Cron). One shared embedding index of your site that every module retrieves against.',
    features: ['Signed gateway calls, both directions', 'Credits meter or BYOK — your key is never stored in WordPress', 'Brand context shared across modules', 'Reconcile poll for firewalled hosts'],
  },
  {
    id: 'FREE · WORDPRESS.ORG',
    name: 'AI Suite SEO',
    tagline: 'Analyze, review, apply — a complete product',
    price: 'Free',
    desc: 'Full SEO suggestions with a review queue, per-post or in batches of ten. Block- and DOM-aware internal link insertion, validated against a closed candidate set. No locked features, no license checks.',
    features: ['Suggestion table + review UI', 'Internal links inserted block-aware', 'Revision saved before every write', 'Conflict detection for Yoast, Rank Math & AIOSEO'],
  },
  {
    id: 'PAID · THIS STORE',
    name: 'AI Suite SEO Pro',
    tagline: 'Bulk, scheduling, and auto-apply',
    price: '$79/yr',
    desc: 'Everything the free SEO plugin deliberately doesn’t contain: whole-site bulk runs, scheduled re-optimization, and auto-apply for trusted suggestion types. Ships with its own update client.',
    features: ['Bulk-run your entire backlog', 'Scheduled re-optimization', 'Auto-apply trusted suggestions', 'Updates served direct, not via .org'],
  },
];

const FAQS = [
  ['Why are Core and SEO free?', 'Because WordPress.org doesn’t allow hosted plugins with locked or crippled features — so the split is by plugin, not by feature flag. The free SEO plugin is complete: analyze, review, apply, per-post and batches of ten. Pro is a separate download that adds bulk, scheduling, and auto-apply.'],
  ['Managed credits or BYOK — what’s the difference?', 'Managed: we buy inference wholesale and you spend “actions” from a credit balance. BYOK: you connect your own OpenAI/Anthropic key, pay a flat plan fee, and run unlimited actions — model usage is billed by your provider. Either way, your key is posted straight to the gateway and never written to WordPress.'],
  ['Will it slow down my site?', 'No. All inference happens on the gateway, not your server. Jobs dispatch through Action Scheduler, a loopback, or WP-Cron with a time budget — nothing heavy runs on the page request your visitors hit.'],
  ['What happens to my content? Is it safe?', 'Every write saves a WordPress revision first, so anything applied can be rolled back. Content is only sent to the gateway when you run an action, and it’s never used to train models.'],
  ['What happens if I cancel Pro?', 'Bulk, scheduling, and auto-apply stop at the end of your paid period. Everything already applied — meta, links, revisions — is plain WordPress content and stays exactly where it is. The free plugins keep working forever.'],
];

const DRAWER_LINKS = [
  { label: 'Plugins', href: '#plugins' },
  { label: 'Plans', href: '#pricing' },
  { label: 'FAQs', href: '#faq' },
  { label: 'Account', href: '/login' },
  { label: 'Get in Touch', href: 'mailto:support@founderpostai.com' },
];

import { PAYMENT_LINKS, track } from '../lib/ab';

export default function Studio() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const sideLines = Array.from({ length: 20 });

  return (
    <div className={styles.root}>
      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.navbarInner}>
          <a href="#" className={styles.logo}>
            FounderPostAI<sup>®</sup>
          </a>
          <button className={styles.menuButton} onClick={() => setDrawerOpen(!drawerOpen)}>
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
      <div className={`${styles.drawer} ${drawerOpen ? styles.drawerOpen : ''}`}>
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

      {/* Hero */}
      <section className={styles.hero}>
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
            Premium plugins for <span className={styles.serif}>WordPress</span>, on demand.
          </h1>
          <p className={styles.subtitle}>
            One runtime, free on WordPress.org. A complete SEO module, also free. Go Pro for bulk,
            scheduling, and auto-apply — managed credits or your own key.
          </p>

          <div className={styles.ctaRow}>
            <a href="#pricing" className={styles.primaryButton}>
              View Plans
            </a>
            <a href="mailto:support@founderpostai.com" className={styles.bookButton}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://framerusercontent.com/images/hfneFL6CHBi5BnNvCeOaqU9HqE4.png"
                alt="Support avatar"
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

      {/* Plugins */}
      <section id="plugins" className={styles.section}>
        <p className={styles.sectionLabel}>The suite</p>
        <h2 className={styles.sectionTitle}>Two free plugins. One worth paying for.</h2>
        <p className={styles.sectionSub}>
          Core and SEO are complete products on WordPress.org — no locked features, no license
          checks. Pro is a separate download that adds what the free plugin deliberately doesn’t
          contain.
        </p>
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
              <a href="#pricing" className={styles.pluginCta}>
                Get {p.name} →
              </a>
            </article>
          ))}
        </div>
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
            <p className={styles.priceNote}>Core + SEO, from WordPress.org.</p>
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
              Install from WordPress.org
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
          {FAQS.map(([q, a]) => (
            <details key={q} className={styles.faqItem}>
              <summary>
                {q}
                <span className={styles.faqPlus}>+</span>
              </summary>
              <p className={styles.faqAnswer}>{a}</p>
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
          SEO Pro on one site, $79/yr. Free forever on WordPress.org. Thirty days to change your
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

      {/* Footer */}
      <footer className={styles.footer}>
        <span className={styles.logo} style={{ fontSize: '20px' }}>
          FounderPostAI<sup>®</sup>
        </span>
        <div className={styles.footerLinks}>
          <a href="#plugins">Plugins</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
          <Link href="/login">Account</Link>
        </div>
        <p>© {new Date().getFullYear()} FounderPostAI · GPL-licensed code</p>
      </footer>
    </div>
  );
}
