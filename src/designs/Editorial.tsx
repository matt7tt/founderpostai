import Link from 'next/link';
import { PAYMENT_LINKS, track } from '../lib/ab';
import { AI_SEO_CAPABILITIES, HOME_FAQS } from '../lib/products';
import { WORDPRESS_ORG_CORE_URL, WORDPRESS_ORG_STATUS_NOTICE } from '../lib/site';

const serif = "Charter, 'Bitstream Charter', 'Sitka Text', Cambria, Georgia, serif";
const mono = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";

const plugins = [
  {
    id: '01',
    name: 'AI Suite Core',
    tagline: 'The runtime every module builds on',
    price: 'Free',
    desc: 'Connection, credits, brand context, and a three-tier job queue (Action Scheduler → loopback → WP-Cron). One shared embedding index of your site that every module retrieves against.',
    features: [
      'Signed gateway calls, both directions',
      'Credits meter or BYOK — key never stored in WordPress',
      'Brand context shared across modules',
      'Reconcile poll for firewalled hosts',
    ],
    cta: { label: 'Get Core on WordPress.org →', href: WORDPRESS_ORG_CORE_URL, track: null },
  },
  {
    id: '02',
    name: 'AI Suite SEO',
    tagline: 'Analyze, review, apply — a complete product',
    price: 'Free',
    desc: 'Full SEO suggestions with a review queue, per-post or in batches of ten. Block- and DOM-aware internal link insertion, validated against a closed candidate set. No locked features, no license checks.',
    features: [
      'Suggestion table + review UI',
      'Internal links inserted block-aware',
      'Revision saved before every write',
      'Conflict detection for Yoast, Rank Math & AIOSEO',
    ],
    cta: { label: 'Download SEO ↓', href: '/downloads/aisuite-seo.zip', track: null },
  },
  {
    id: '03',
    name: 'AI Suite SEO Pro',
    tagline: 'Bulk, scheduling, and auto-apply',
    price: '$79/yr',
    desc: 'Everything the free SEO plugin deliberately doesn’t contain: whole-site bulk runs, scheduled re-optimization, and auto-apply for trusted suggestion types. Ships with its own update client.',
    features: [
      'Bulk-run your entire backlog',
      'Scheduled re-optimization',
      'Auto-apply trusted suggestions',
      'Updates served direct, not via .org',
    ],
    cta: { label: 'Get SEO Pro', href: PAYMENT_LINKS.pro, track: 'pro' },
  },
];

export default function Editorial() {
  return (
    <div className="min-h-screen bg-[#F7F4EE] text-[#1B1712] antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[300] focus:bg-[#1B1712] focus:px-4 focus:py-3 focus:text-white"
        >
          Skip to content
        </a>

        {/* Nav */}
        <header className="border-b border-[#1B1712]/15">
          <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <Link href="/" className="text-xl font-bold tracking-tight" style={{ fontFamily: serif }}>
                FounderPostAI
              </Link>
              <span className="hidden sm:inline text-[11px] uppercase tracking-[0.18em] text-[#1B1712]/70" style={{ fontFamily: mono }}>
                AI Suite for WordPress
              </span>
            </div>
            <nav aria-label="Primary navigation" className="flex items-center gap-6 text-sm">
              <a href="#plugins" className="hidden sm:inline hover:text-[#00749C] transition-colors">Plugins</a>
              <a href="#pricing" className="hidden sm:inline hover:text-[#00749C] transition-colors">Pricing</a>
              <a href="#faq" className="hidden sm:inline hover:text-[#00749C] transition-colors">FAQ</a>
              <Link href="/resources" className="hidden lg:inline hover:text-[#00749C] transition-colors">Resources</Link>
              <Link href="/ai-suite" className="hidden lg:inline hover:text-[#00749C] transition-colors">Product facts</Link>
              <a
                href={WORDPRESS_ORG_CORE_URL}
                className="bg-[#1B1712] text-[#F7F4EE] px-4 py-2 text-sm font-medium hover:bg-[#00749C] transition-colors"
              >
                Install Core free
              </a>
            </nav>
          </div>
        </header>

        <main id="main-content">
        {/* Hero */}
        <section className="border-b border-[#1B1712]/15">
          <div className="max-w-6xl mx-auto px-6 py-20 md:py-28 grid md:grid-cols-[1.4fr_1fr] gap-12 items-center">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#00749C] mb-6" style={{ fontFamily: mono }}>
                Free & GPL · Pro in this store
              </p>
              <h1 className="text-4xl md:text-6xl leading-[1.05] font-bold tracking-tight mb-6" style={{ fontFamily: serif }}>
                AI SEO plugins for WordPress that keep you in control.
              </h1>
              <p className="text-lg md:text-xl text-[#1B1712]/70 leading-relaxed max-w-xl mb-8">
                Generate reviewable SEO titles, meta descriptions, and safe internal-link
                suggestions inside WordPress. Approve every change, keep revisions, and add
                bulk automation when you are ready.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <a
                  href={WORDPRESS_ORG_CORE_URL}
                  className="bg-[#00749C] text-white px-7 py-3.5 font-medium text-center hover:bg-[#005d7e] transition-colors"
                >
                  Install Core free →
                </a>
                <a
                  href="/downloads/aisuite-seo.zip"
                  className="border border-[#1B1712]/30 px-7 py-3.5 font-medium text-center hover:border-[#1B1712] transition-colors"
                >
                  Download SEO free ↓
                </a>
              </div>
              <p className="text-sm text-[#1B1712]/70">
                Core and SEO are free · No credit card · GPL-licensed
              </p>
            </div>

            {/* Fake wp-admin card */}
            <div className="hidden md:block border border-[#1B1712]/20 bg-white shadow-[6px_6px_0_0_rgba(27,23,18,0.12)]">
              <div className="border-b border-[#1B1712]/15 px-4 py-2.5 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1B1712]/20" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#1B1712]/20" />
                <span className="ml-2 text-[11px] text-[#1B1712]/70" style={{ fontFamily: mono }}>
                  wp-admin · AI Suite → Review queue
                </span>
              </div>
              <div className="p-5 space-y-4 text-sm">
                <div className="space-y-2">
                  <div className="h-3 w-3/4 bg-[#1B1712]/10 rounded-sm" />
                  <div className="h-3 w-full bg-[#1B1712]/10 rounded-sm" />
                  <div className="h-3 w-5/6 bg-[#1B1712]/10 rounded-sm" />
                </div>
                <div className="border border-[#00749C]/40 bg-[#00749C]/5 p-3">
                  <p className="text-[11px] uppercase tracking-[0.15em] text-[#00749C] mb-2" style={{ fontFamily: mono }}>
                    AI Suite SEO suggests
                  </p>
                  <p className="text-[#1B1712]/80 leading-relaxed">
                    “Add an internal link from this paragraph to <em>/seo-basics</em> — anchor:
                    ‘keyword research checklist’.”
                  </p>
                  <div className="flex gap-2 mt-3">
                    <span className="bg-[#00749C] text-white text-xs px-3 py-1.5">Approve</span>
                    <span className="border border-[#1B1712]/25 text-xs px-3 py-1.5">Reject</span>
                  </div>
                </div>
                <p className="text-[11px] text-[#1B1712]/70" style={{ fontFamily: mono }}>
                  ↑ nothing ships without your review
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Compatibility strip */}
        <section className="border-b border-[#1B1712]/15 bg-[#1B1712] text-[#F7F4EE]">
          <div className="max-w-6xl mx-auto px-6 py-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm">
            <span className="text-[11px] uppercase tracking-[0.2em] text-[#F7F4EE]/50" style={{ fontFamily: mono }}>
              Plays nicely with
            </span>
            {['Block Editor', 'Classic Editor', 'Yoast SEO', 'Rank Math', 'All in One SEO', 'SEOPress', 'WP-Cron'].map((x) => (
              <span key={x} className="font-medium">{x}</span>
            ))}
          </div>
        </section>

        {/* Search-focused capabilities */}
        <section id="capabilities" aria-labelledby="capabilities-heading" className="border-b border-[#1B1712]/15 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
            <div className="mb-12 max-w-3xl">
              <p className="mb-4 text-[11px] uppercase tracking-[0.22em] text-[#00749C]" style={{ fontFamily: mono }}>
                WordPress AI SEO workflow
              </p>
              <h2 id="capabilities-heading" className="mb-4 text-3xl font-bold tracking-tight md:text-5xl" style={{ fontFamily: serif }}>
                Optimize search snippets and internal links without giving up editorial control.
              </h2>
              <p className="text-lg leading-relaxed text-[#1B1712]/65">
                FounderPostAI analyzes the content already on your site, returns structured
                suggestions, and lets you review the exact proposed value before anything changes.
              </p>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              {AI_SEO_CAPABILITIES.map((capability) => (
                <article id={capability.id} key={capability.id} className="border border-[#1B1712]/15 bg-[#F7F4EE] p-7">
                  <h3 className="mb-3 text-xl font-bold" style={{ fontFamily: serif }}>
                    {capability.title}
                  </h3>
                  <p className="mb-5 leading-relaxed text-[#1B1712]/70">{capability.summary}</p>
                  <ul className="space-y-2 text-sm text-[#1B1712]/70">
                    {capability.points.map((point) => (
                      <li key={point} className="flex gap-2">
                        <span aria-hidden="true" className="font-bold text-[#00749C]">✓</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={capability.resourcePath}
                    className="mt-6 inline-block text-sm font-bold text-[#00749C] underline decoration-[#00749C]/30 underline-offset-4"
                  >
                    Read the {capability.id === 'internal-linking' ? 'internal linking' : capability.id.replace('-', ' ')} guide →
                  </Link>
                </article>
              ))}
            </div>
            <p className="mt-8 text-sm text-[#1B1712]/65">
              See the complete{' '}
              <Link href="/ai-suite#workflow" className="font-medium text-[#00749C] underline underline-offset-4">
                WordPress AI SEO workflow and technical details
              </Link>
              .
            </p>
          </div>
        </section>

        {/* Plugins */}
        <section id="plugins" className="max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="mb-14 max-w-2xl">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#00749C] mb-4" style={{ fontFamily: mono }}>
              The suite
            </p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4" style={{ fontFamily: serif }}>
              Two free plugins. One worth paying for.
            </h2>
            <p className="text-lg text-[#1B1712]/65 leading-relaxed">
              Core and SEO are complete, free products — no locked features, no license
              checks. Pro is a separate download that adds what the free plugin deliberately
              doesn’t contain.
            </p>
          </div>

          <div
            role="note"
            className="mb-8 max-w-3xl border border-[#00749C]/35 bg-[#52C5E8]/10 px-5 py-4"
          >
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#00749C]" style={{ fontFamily: mono }}>
              WordPress.org status
            </p>
            <p className="text-sm leading-relaxed text-[#1B1712]/75">
              {WORDPRESS_ORG_STATUS_NOTICE}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-[#1B1712]/15 border border-[#1B1712]/15">
            {plugins.map((p) => (
              <article key={p.id} className="bg-[#F7F4EE] p-8 flex flex-col hover:bg-white transition-colors">
                <div className="flex items-start justify-between mb-6">
                  <span className="text-[11px] text-[#1B1712]/70" style={{ fontFamily: mono }}>MODULE {p.id}</span>
                  <span className="text-sm font-bold bg-[#1B1712] text-[#F7F4EE] px-2.5 py-1" style={{ fontFamily: mono }}>
                    {p.price}
                  </span>
                </div>
                <h3 className="text-2xl font-bold mb-1" style={{ fontFamily: serif }}>{p.name}</h3>
                <p className="text-sm text-[#00749C] font-medium mb-4">{p.tagline}</p>
                <p className="text-[#1B1712]/70 leading-relaxed mb-6">{p.desc}</p>
                <ul className="space-y-2.5 text-sm mb-8">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2.5 text-[#1B1712]/75">
                      <span className="text-[#00749C] font-bold shrink-0">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto flex items-center gap-3">
                  {p.cta && (
                    <a
                      href={p.cta.href}
                      onClick={p.cta.track ? () => track('checkout_click', { design: 'editorial', plan: 'pro' }) : undefined}
                      className="border border-[#1B1712]/30 px-5 py-2.5 text-sm font-medium hover:bg-[#1B1712] hover:text-[#F7F4EE] transition-colors"
                    >
                      {p.cta.label}
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>

          <p className="mt-6 text-sm text-[#1B1712]/70 text-center">
            Every module: managed credits from us, or unlimited actions on your own provider
            key.{' '}
            <Link href="/ai-suite" className="font-medium text-[#00749C] underline underline-offset-4">
              Read the verified technical overview
            </Link>
            .
          </p>
        </section>

        {/* How it works */}
        <section className="border-y border-[#1B1712]/15 bg-white">
          <div className="max-w-6xl mx-auto px-6 py-20 md:py-24">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-12" style={{ fontFamily: serif }}>
              From install to first suggestion in about two minutes
            </h2>
            <div className="grid md:grid-cols-3 gap-10">
              {[
                ['01', 'Install Core, then add SEO', 'Find FounderPostAI Core under Plugins → Add Plugin, then upload the free SEO module. Both install like ordinary WordPress plugins.'],
                ['02', 'Connect once', 'Managed credits work out of the box. Prefer BYOK? Your provider key is posted straight to the gateway — never written to WordPress.'],
                ['03', 'Review, then apply', 'Suggestions land in a review queue. Approve what you like; a WordPress revision is saved before every write, so anything can be rolled back.'],
              ].map(([n, t, d]) => (
                <div key={n}>
                  <p aria-hidden="true" className="text-5xl font-bold text-[#00749C]/70 mb-3" style={{ fontFamily: serif }}>{n}</p>
                  <h3 className="text-lg font-bold mb-2">{t}</h3>
                  <p className="text-[#1B1712]/65 leading-relaxed">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="mb-14 max-w-2xl">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#00749C] mb-4" style={{ fontFamily: mono }}>
              Honest pricing
            </p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4" style={{ fontFamily: serif }}>
              Start free. Pay only when you scale.
            </h2>
            <p className="text-lg text-[#1B1712]/65 leading-relaxed">
              All plans include updates and email support. Managed plans spend “actions” from a
              credit balance; BYOK is a flat fee with unlimited actions on your own provider key.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Free */}
            <div className="border border-[#1B1712]/20 bg-white p-8 flex flex-col">
              <h3 className="text-lg font-bold mb-1">Free</h3>
              <p className="text-sm text-[#1B1712]/70 mb-6">Core + SEO, free downloads.</p>
              <p className="text-4xl font-bold mb-1" style={{ fontFamily: serif }}>
                $0<span className="text-base font-normal text-[#1B1712]/70"> forever</span>
              </p>
              <p className="text-sm text-[#1B1712]/70 mb-8">complete product, no license checks</p>
              <ul className="space-y-2.5 text-sm mb-8 text-[#1B1712]/75">
                <li>✓ Analyze, review & apply suggestions</li>
                <li>✓ Per-post and batches of ten</li>
                <li>✓ Block-aware internal link insertion</li>
                <li>✓ BYOK — unlimited actions on your key</li>
              </ul>
              <a href={WORDPRESS_ORG_CORE_URL} className="mt-auto block text-center border border-[#1B1712]/30 px-6 py-3 font-medium hover:border-[#1B1712] transition-colors">
                Install Core free
              </a>
            </div>

            {/* Pro */}
            <div className="border-2 border-[#00749C] bg-white p-8 flex flex-col relative shadow-[6px_6px_0_0_rgba(0,116,156,0.15)]">
              <span className="absolute -top-3.5 left-6 bg-[#00749C] text-white text-[11px] font-bold uppercase tracking-[0.15em] px-3 py-1" style={{ fontFamily: mono }}>
                Best deal
              </span>
              <h3 className="text-lg font-bold mb-1">SEO Pro</h3>
              <p className="text-sm text-[#1B1712]/70 mb-6">Bulk, scheduling & auto-apply for one site.</p>
              <p className="text-4xl font-bold mb-1" style={{ fontFamily: serif }}>
                $79<span className="text-base font-normal text-[#1B1712]/70">/yr</span>
              </p>
              <p className="text-sm text-[#00749C] font-medium mb-8">
                managed credits included — no API key needed
              </p>
              <ul className="space-y-2.5 text-sm mb-8 text-[#1B1712]/75">
                <li>✓ Everything in Free</li>
                <li>✓ Whole-site bulk runs</li>
                <li>✓ Scheduled re-optimization</li>
                <li>✓ Auto-apply trusted suggestions</li>
                <li>✓ 30-day money-back guarantee</li>
              </ul>
              <a
                href={PAYMENT_LINKS.pro}
                onClick={() => track('checkout_click', { design: 'editorial', plan: 'pro' })}
                className="mt-auto block text-center bg-[#00749C] text-white px-6 py-3 font-medium hover:bg-[#005d7e] transition-colors"
              >
                Get SEO Pro — $79/yr
              </a>
            </div>

            {/* Agency */}
            <div className="border border-[#1B1712]/20 bg-white p-8 flex flex-col">
              <h3 className="text-lg font-bold mb-1">Agency</h3>
              <p className="text-sm text-[#1B1712]/70 mb-6">Pro on every client site you run.</p>
              <p className="text-4xl font-bold mb-1" style={{ fontFamily: serif }}>
                $199<span className="text-base font-normal text-[#1B1712]/70">/yr</span>
              </p>
              <p className="text-sm text-[#1B1712]/70 mb-8">unlimited sites, BYOK flat fee</p>
              <ul className="space-y-2.5 text-sm mb-8 text-[#1B1712]/75">
                <li>✓ Everything in SEO Pro</li>
                <li>✓ Unlimited client sites</li>
                <li>✓ Unlimited actions on your own key</li>
                <li>✓ Priority email support</li>
                <li>✓ 30-day money-back guarantee</li>
              </ul>
              <a
                href={PAYMENT_LINKS.agency}
                onClick={() => track('checkout_click', { design: 'editorial', plan: 'agency' })}
                className="mt-auto block text-center border border-[#1B1712]/30 px-6 py-3 font-medium hover:border-[#1B1712] transition-colors"
              >
                Get Agency — $199/yr
              </a>
            </div>
          </div>

          <p className="mt-8 text-sm text-[#1B1712]/70 text-center max-w-xl mx-auto">
            Not happy in the first 30 days? One email, full refund, and everything already applied
            stays exactly where it is — it’s plain WordPress content.
          </p>
        </section>

        {/* FAQ */}
        <section id="faq" className="border-t border-[#1B1712]/15 bg-white">
          <div className="max-w-3xl mx-auto px-6 py-20 md:py-24">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-12" style={{ fontFamily: serif }}>
              Questions WordPress people actually ask
            </h2>
            <div className="divide-y divide-[#1B1712]/10">
              {HOME_FAQS.map(({ question, answer }) => (
                <details key={question} className="group py-5">
                  <summary className="flex items-center justify-between cursor-pointer list-none font-bold text-lg">
                    {question}
                    <span className="ml-4 text-[#00749C] text-xl leading-none transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-[#1B1712]/70 leading-relaxed">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-[#1B1712]/15 bg-[#1B1712] text-[#F7F4EE]">
          <div className="max-w-4xl mx-auto px-6 py-20 text-center">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-5" style={{ fontFamily: serif }}>
              Give your WordPress site the upgrade it deserves.
            </h2>
            <p className="text-lg text-[#F7F4EE]/65 mb-8 max-w-xl mx-auto">
              SEO Pro on one site, $79/yr. Core and SEO are free forever. Thirty days to change
              your mind.
            </p>
            <a
              href={PAYMENT_LINKS.pro}
              onClick={() => track('checkout_click', { design: 'editorial', plan: 'pro' })}
              className="inline-block bg-[#F7F4EE] text-[#1B1712] px-8 py-4 font-bold hover:bg-[#00749C] hover:text-white transition-colors"
            >
              Get SEO Pro — $79/yr
            </a>
          </div>
        </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-[#1B1712]/15">
          <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[#1B1712]/70">
            <span className="font-bold text-[#1B1712]" style={{ fontFamily: serif }}>FounderPostAI</span>
            <div className="flex gap-6">
              <a href="#plugins" className="hover:text-[#00749C]">Plugins</a>
              <a href="#pricing" className="hover:text-[#00749C]">Pricing</a>
              <a href="#faq" className="hover:text-[#00749C]">FAQ</a>
              <Link href="/resources" className="hover:text-[#00749C]">Resources</Link>
              <Link href="/ai-suite" className="hover:text-[#00749C]">Product facts</Link>
              <Link href="/privacy" className="hover:text-[#00749C]">Privacy</Link>
              <Link href="/terms" className="hover:text-[#00749C]">Terms</Link>
            </div>
            <p>© {new Date().getFullYear()} FounderPostAI · GPL-licensed code, human-written support</p>
          </div>
        </footer>
    </div>
  );
}
