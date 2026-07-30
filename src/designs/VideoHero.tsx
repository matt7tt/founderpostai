import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Menu, X } from 'lucide-react';

const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260622_204221_5339e40b-e73d-4ab0-9c65-79c18c66fd50.mp4';

const navLinks = [
  { label: 'Home', href: '#' },
  { label: 'Plugins', href: '#plugins' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
];

const plugins = [
  {
    id: '01',
    name: 'ContentPilot',
    tagline: 'AI writing inside the block editor',
    price: 39,
    desc: 'Draft, rewrite, and expand posts without leaving Gutenberg. It reads your existing content first, so it writes in your voice — not generic AI voice.',
    features: [
      'Works inside Gutenberg & Classic editor',
      'Rewrites in your tone, trained on your posts',
      'One-click outlines, intros, and conclusions',
      'Bring your own API key — no markup',
    ],
  },
  {
    id: '02',
    name: 'ChatFoundry',
    tagline: 'A support chatbot that knows your site',
    price: 49,
    desc: 'Indexes your pages, posts, and docs, then answers visitor questions with real citations from your content. No hallucinated refund policies.',
    features: [
      'Trains on your pages & WooCommerce products',
      'Answers link back to the source page',
      'Hands off to email when it doesn’t know',
      'Matches your theme out of the box',
    ],
  },
  {
    id: '03',
    name: 'MetaForge',
    tagline: 'Bulk SEO meta & alt text in minutes',
    price: 29,
    desc: 'Your old posts have empty meta descriptions and alt text. MetaForge fixes your whole backlog in one sitting, with a review queue so nothing ships blind.',
    features: [
      'Bulk titles, descriptions & alt text',
      'Review queue — approve before it ships',
      'Works with Yoast, Rank Math & AIOSEO',
      'WooCommerce product meta included',
    ],
  },
];

export default function VideoHero() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="bg-black font-geist text-white">
      {/* ===================== FULLSCREEN HERO ===================== */}
      <div className="relative h-screen w-full overflow-hidden bg-black font-geist">
        <video
          className="absolute h-full w-full object-cover"
          style={{ objectPosition: '70% center' }}
          src={VIDEO_URL}
          autoPlay
          muted
          loop
          playsInline
        />

        {/* Navbar */}
        <nav className="relative z-30 flex items-center justify-between px-6 py-5 md:px-12 lg:px-16">
          <div className="flex items-center gap-10">
            <span className="text-lg font-semibold tracking-tight text-white sm:text-xl">
              FounderPostAI
            </span>
            <div className="hidden items-center gap-8 md:flex">
              {navLinks.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  className="text-sm text-white/80 transition-colors hover:text-white"
                >
                  {l.label}
                </a>
              ))}
            </div>
          </div>

          <a
            href="#pricing"
            className="hidden rounded-lg bg-white px-5 py-2 text-sm font-medium text-black transition-transform hover:scale-105 md:block"
          >
            Get the Bundle — $79/yr
          </a>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="relative z-50 flex h-10 w-10 items-center justify-center text-white transition-transform active:scale-90 md:hidden"
            aria-label="Toggle menu"
          >
            <Menu
              size={24}
              className={`absolute transition-all duration-300 ${
                mobileMenuOpen ? 'rotate-90 scale-50 opacity-0' : 'rotate-0 scale-100 opacity-100'
              }`}
            />
            <X
              size={24}
              className={`absolute transition-all duration-300 ${
                mobileMenuOpen ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-50 opacity-0'
              }`}
            />
          </button>
        </nav>

        {/* Mobile menu */}
        <div
          className={`absolute inset-x-0 top-0 z-20 overflow-hidden bg-black/98 backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            mobileMenuOpen ? 'h-screen opacity-100' : 'pointer-events-none h-0 opacity-0'
          }`}
        >
          <div
            className={`flex h-full flex-col justify-center gap-6 px-8 transition-all delay-100 duration-500 ${
              mobileMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}
          >
            {navLinks.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-3xl font-medium text-white/90 hover:text-white"
              >
                {l.label}
              </a>
            ))}
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-6 inline-flex w-fit items-center rounded-full bg-white px-8 py-3.5 text-base font-medium text-black transition-transform hover:scale-105"
            >
              Get the Bundle — $79/yr
            </a>
          </div>
        </div>

        {/* Hero content */}
        <div className="relative z-10 flex h-[calc(100vh-80px)] flex-col justify-between px-6 pb-10 pt-12 sm:pb-12 sm:pt-16 md:px-12 md:pb-16 md:pt-20 lg:px-16">
          <div className="max-w-3xl">
            <p className="mb-4 animate-[fadeSlideUp_0.8s_ease_0.2s_both] text-xs text-white/90 sm:mb-6 sm:text-sm">
              AI Plugins for WordPress
            </p>
            <h1 className="animate-[fadeSlideUp_0.8s_ease_0.4s_both] text-3xl font-medium leading-[1.1] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
              Give WordPress
              <br />
              an AI upgrade,
              <br />
              without the slop.
            </h1>
          </div>

          <div>
            <p className="mb-5 max-w-sm animate-[fadeSlideUp_0.8s_ease_0.7s_both] text-sm leading-relaxed text-white/60 sm:mb-6 sm:max-w-lg sm:text-base md:text-lg">
              Three sharp plugins that live inside wp-admin — writing in your voice, answering
              support questions from your own pages, and fixing your SEO backlog.
            </p>
            <a
              href="#plugins"
              className="inline-flex animate-[fadeSlideUp_0.8s_ease_0.9s_both] items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black transition-transform hover:scale-105 sm:px-6 sm:py-3"
            >
              Meet the Plugins
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </div>

      {/* ===================== STORE SECTIONS ===================== */}

      {/* Compatibility strip */}
      <section className="border-y border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-6 py-6 text-sm">
          <span className="text-xs uppercase tracking-[0.2em] text-white/40">Plays nicely with</span>
          {['Gutenberg', 'Classic Editor', 'WooCommerce', 'Yoast', 'Rank Math', 'Elementor', 'Multisite'].map(
            (x) => (
              <span key={x} className="font-medium text-white/80">
                {x}
              </span>
            )
          )}
        </div>
      </section>

      {/* Plugins */}
      <section id="plugins" className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="mb-16 max-w-2xl">
          <p className="mb-4 text-xs uppercase tracking-[0.22em] text-white/50">The lineup</p>
          <h2 className="mb-5 text-3xl font-medium tracking-tight sm:text-5xl">
            Three plugins. Each does one job well.
          </h2>
          <p className="text-base leading-relaxed text-white/60 sm:text-lg">
            No bloated “AI suite” with 40 features you’ll never open. Buy the one you need, or
            take all three for less than most single plugins charge.
          </p>
        </div>

        <div className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-3">
          {plugins.map((p) => (
            <article
              key={p.id}
              className="flex flex-col bg-black p-8 transition-colors hover:bg-white/5"
            >
              <div className="mb-8 flex items-start justify-between">
                <span className="text-xs text-white/40">PLUGIN {p.id}</span>
                <span className="rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-black">
                  ${p.price}/yr
                </span>
              </div>
              <h3 className="mb-1 text-2xl font-medium tracking-tight">{p.name}</h3>
              <p className="mb-4 text-sm text-white/50">{p.tagline}</p>
              <p className="mb-6 text-sm leading-relaxed text-white/70">{p.desc}</p>
              <ul className="mb-8 space-y-2.5 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2.5 text-white/70">
                    <span className="shrink-0 font-bold text-white">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex items-center gap-3">
                <a
                  href="#pricing"
                  className="rounded-lg border border-white/20 px-5 py-2.5 text-sm font-medium transition-colors hover:bg-white hover:text-black"
                >
                  Get {p.name}
                </a>
                <span className="text-xs text-white/40">1 site · 1 yr of updates</span>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-white/40">
          Every plugin: unlimited generations with your own API key, or use ours on the bundle.
        </p>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <div className="mb-16 max-w-2xl">
            <p className="mb-4 text-xs uppercase tracking-[0.22em] text-white/50">Honest pricing</p>
            <h2 className="mb-5 text-3xl font-medium tracking-tight sm:text-5xl">
              Cheaper than one hour of a freelancer.
            </h2>
            <p className="text-base leading-relaxed text-white/60 sm:text-lg">
              Yearly plans include updates and email support. Or pay once and own it forever.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Single */}
            <div className="flex flex-col rounded-2xl border border-white/15 p-8">
              <h3 className="mb-1 text-lg font-medium">Single plugin</h3>
              <p className="mb-6 text-sm text-white/50">For the one job you need done.</p>
              <p className="mb-1 text-4xl font-medium tracking-tight">
                $29–49<span className="text-base font-normal text-white/50">/yr</span>
              </p>
              <p className="mb-8 text-sm text-white/40">per plugin, 1 site</p>
              <ul className="mb-8 space-y-2.5 text-sm text-white/70">
                <li>✓ 1 year of updates & support</li>
                <li>✓ Bring your own API key, $0 markup</li>
                <li>✓ 30-day money-back guarantee</li>
              </ul>
              <a
                href="#plugins"
                className="mt-auto block rounded-lg border border-white/20 px-6 py-3 text-center font-medium transition-colors hover:border-white"
              >
                Pick a plugin
              </a>
            </div>

            {/* Bundle */}
            <div className="relative flex flex-col rounded-2xl border border-white bg-white p-8 text-black">
              <span className="absolute -top-3 left-6 rounded-full bg-black px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-white">
                Best deal
              </span>
              <h3 className="mb-1 text-lg font-medium">The Full Stack</h3>
              <p className="mb-6 text-sm text-black/50">All three plugins, every site you own.</p>
              <p className="mb-1 text-4xl font-medium tracking-tight">
                $79<span className="text-base font-normal text-black/50">/yr</span>
              </p>
              <p className="mb-8 text-sm font-medium">
                <s className="text-black/40">$117/yr</s> — save $38, unlimited sites
              </p>
              <ul className="mb-8 space-y-2.5 text-sm text-black/75">
                <li>✓ ContentPilot + ChatFoundry + MetaForge</li>
                <li>✓ Unlimited sites (client work welcome)</li>
                <li>✓ Hosted AI included — no API key needed</li>
                <li>✓ Priority email support</li>
                <li>✓ 30-day money-back guarantee</li>
              </ul>
              <a
                href="#"
                className="mt-auto block rounded-lg bg-black px-6 py-3 text-center font-medium text-white transition-transform hover:scale-[1.02]"
              >
                Get the bundle — $79/yr
              </a>
            </div>

            {/* Lifetime */}
            <div className="flex flex-col rounded-2xl border border-white/15 p-8">
              <h3 className="mb-1 text-lg font-medium">Lifetime</h3>
              <p className="mb-6 text-sm text-white/50">Pay once. Never think about it again.</p>
              <p className="mb-1 text-4xl font-medium tracking-tight">
                $199<span className="text-base font-normal text-white/50"> once</span>
              </p>
              <p className="mb-8 text-sm text-white/40">all three plugins, unlimited sites</p>
              <ul className="mb-8 space-y-2.5 text-sm text-white/70">
                <li>✓ Everything in The Full Stack</li>
                <li>✓ Lifetime updates, forever</li>
                <li>✓ All future plugins included</li>
                <li>✓ 30-day money-back guarantee</li>
              </ul>
              <a
                href="#"
                className="mt-auto block rounded-lg border border-white/20 px-6 py-3 text-center font-medium transition-colors hover:border-white"
              >
                Buy lifetime — $199
              </a>
            </div>
          </div>

          <p className="mx-auto mt-8 max-w-xl text-center text-sm text-white/40">
            Not happy in the first 30 days? One email, full refund, and the plugin keeps working
            until your license period would have ended.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-white/10">
        <div className="mx-auto max-w-3xl px-6 py-24">
          <h2 className="mb-12 text-3xl font-medium tracking-tight sm:text-4xl">
            Questions WordPress people actually ask
          </h2>
          <div className="divide-y divide-white/10">
            {[
              [
                'Will it slow down my site?',
                'No. The heavy lifting happens on the AI provider’s servers, not yours. ChatFoundry’s widget loads async and is under 12kb gzipped. ContentPilot and MetaForge only run inside wp-admin — visitors never load a byte of them.',
              ],
              [
                'Is my content used to train models?',
                'No. Requests go through the OpenAI/Anthropic APIs with training opted out. With the bundle’s hosted AI, the same applies — your content is never stored or trained on.',
              ],
              [
                'Does it work with my page builder / SEO plugin?',
                'ContentPilot works in Gutenberg and Classic Editor. MetaForge writes directly into Yoast, Rank Math, and AIOSEO fields. ChatFoundry is a front-end widget that works with any theme or builder.',
              ],
              [
                'What happens if I cancel?',
                'The plugin keeps working until the end of your paid period. Everything it already wrote (posts, meta, alt text) is plain WordPress content — it’s yours, obviously.',
              ],
              [
                'Why is it so cheap? What’s the catch?',
                'No catch. We’re a tiny shop with no investors and no growth targets. Three plugins, fair prices, and support answered by the person who wrote the code.',
              ],
            ].map(([q, a]) => (
              <details key={q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between text-lg font-medium">
                  {q}
                  <span className="ml-4 text-xl leading-none text-white/60 transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 leading-relaxed text-white/60">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-4xl px-6 py-24 text-center">
          <h2 className="mb-5 text-3xl font-medium tracking-tight sm:text-5xl">
            Give your WordPress site the upgrade it deserves.
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-lg text-white/60">
            All three plugins, unlimited sites, $79/yr. Thirty days to change your mind.
          </p>
          <a
            href="#pricing"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-4 font-medium text-black transition-transform hover:scale-105"
          >
            Get The Full Stack — $79/yr
            <ArrowRight size={16} />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm text-white/50 md:flex-row">
          <span className="font-semibold text-white">FounderPostAI</span>
          <div className="flex gap-6">
            <a href="#plugins" className="transition-colors hover:text-white">Plugins</a>
            <a href="#pricing" className="transition-colors hover:text-white">Pricing</a>
            <a href="#faq" className="transition-colors hover:text-white">FAQ</a>
            <Link href="/login" className="transition-colors hover:text-white">Account</Link>
          </div>
          <p>© {new Date().getFullYear()} FounderPostAI · GPL-licensed code</p>
        </div>
      </footer>
    </div>
  );
}
