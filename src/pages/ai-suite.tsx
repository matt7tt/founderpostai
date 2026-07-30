import Link from 'next/link';
import AiSuiteStructuredData from '../components/AiSuiteStructuredData';
import SeoHead from '../components/SeoHead';
import {
  AI_SUITE_DESCRIPTION,
  AI_SUITE_FAQS,
  AI_SUITE_PRODUCTS,
  AI_SUITE_REQUIREMENTS,
  AI_SUITE_TITLE,
} from '../lib/products';
import { WORDPRESS_ORG_REVIEW_NOTICE } from '../lib/site';

const serif = "Charter, 'Bitstream Charter', 'Sitka Text', Cambria, Georgia, serif";
const mono = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";

export default function AiSuite() {
  return (
    <>
      <SeoHead
        title={AI_SUITE_TITLE}
        description={AI_SUITE_DESCRIPTION}
        path="/ai-suite"
      />
      <AiSuiteStructuredData />

      <div className="min-h-screen bg-[#F7F4EE] text-[#1B1712] antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-[#1B1712] focus:px-4 focus:py-3 focus:text-white"
        >
          Skip to content
        </a>

        <header className="border-b border-[#1B1712]/15">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-5">
            <Link
              href="/"
              className="text-xl font-bold tracking-tight"
              style={{ fontFamily: serif }}
            >
              FounderPostAI
            </Link>
            <nav aria-label="Product facts navigation" className="flex items-center gap-5 text-sm">
              <a href="#compare" className="hidden hover:text-[#00749C] sm:inline">
                Compare
              </a>
              <a href="#privacy" className="hidden hover:text-[#00749C] sm:inline">
                Privacy
              </a>
              <a href="#questions" className="hidden hover:text-[#00749C] sm:inline">
                FAQ
              </a>
              <Link
                href="/#pricing"
                className="bg-[#1B1712] px-4 py-2 font-medium text-[#F7F4EE] hover:bg-[#00749C]"
              >
                View plans
              </Link>
            </nav>
          </div>
        </header>

        <main id="main-content">
          <article>
            <header className="border-b border-[#1B1712]/15">
              <div className="mx-auto max-w-4xl px-6 py-16 md:py-24">
                <nav aria-label="Breadcrumb" className="mb-8 text-sm text-[#1B1712]/65">
                  <Link href="/" className="underline decoration-[#1B1712]/30 underline-offset-4">
                    FounderPostAI
                  </Link>{' '}
                  <span aria-hidden="true">/</span> AI Suite product facts
                </nav>
                <p
                  className="mb-5 text-[11px] uppercase tracking-[0.22em] text-[#00749C]"
                  style={{ fontFamily: mono }}
                >
                  Canonical product reference
                </p>
                <h1
                  className="mb-6 text-4xl font-bold leading-[1.06] tracking-tight md:text-6xl"
                  style={{ fontFamily: serif }}
                >
                  AI Suite for WordPress: product facts and technical overview
                </h1>
                <p className="max-w-3xl text-xl leading-relaxed text-[#1B1712]/75">
                  <strong className="text-[#1B1712]">The short answer:</strong> FounderPostAI AI
                  Suite is a three-plugin WordPress SEO system. Core supplies the shared runtime,
                  the free SEO module supplies reviewable optimization suggestions, and SEO Pro
                  adds whole-site bulk runs, scheduling, and auto-apply.
                </p>
                <p className="mt-6 text-sm text-[#1B1712]/60">
                  Product details checked against the current packaged releases on{' '}
                  <time dateTime="2026-07-30">July 30, 2026</time>.
                </p>
              </div>
            </header>

            <section aria-labelledby="facts-heading" className="border-b border-[#1B1712]/15 bg-white">
              <div className="mx-auto max-w-4xl px-6 py-14">
                <h2
                  id="facts-heading"
                  className="mb-8 text-3xl font-bold tracking-tight"
                  style={{ fontFamily: serif }}
                >
                  AI Suite at a glance
                </h2>
                <dl className="grid gap-px overflow-hidden border border-[#1B1712]/15 bg-[#1B1712]/15 sm:grid-cols-2">
                  {[
                    ['Publisher', 'FounderPostAI'],
                    ['Platform', AI_SUITE_REQUIREMENTS.wordpress],
                    ['Server requirement', AI_SUITE_REQUIREMENTS.php],
                    ['Code license', AI_SUITE_REQUIREMENTS.license],
                    ['Current AI provider', AI_SUITE_REQUIREMENTS.provider],
                    ['Support', 'support@founderpostai.com'],
                  ].map(([term, description]) => (
                    <div key={term} className="bg-white p-5">
                      <dt
                        className="mb-1 text-[11px] uppercase tracking-[0.16em] text-[#00749C]"
                        style={{ fontFamily: mono }}
                      >
                        {term}
                      </dt>
                      <dd className="font-semibold">{description}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </section>

            <section id="compare" aria-labelledby="compare-heading" className="mx-auto max-w-6xl px-6 py-16 md:py-24">
              <div className="mb-10 max-w-3xl">
                <h2
                  id="compare-heading"
                  className="mb-4 text-3xl font-bold tracking-tight md:text-4xl"
                  style={{ fontFamily: serif }}
                >
                  Current plugins, versions, and roles
                </h2>
                <p className="text-lg leading-relaxed text-[#1B1712]/70">
                  Install AI Suite Core first. AI Suite SEO and SEO Pro build on that shared
                  runtime. The free plugins are direct downloads; paid access is sold by annual
                  plan.
                </p>
                <div
                  role="note"
                  className="mt-6 border border-[#00749C]/35 bg-[#52C5E8]/10 px-5 py-4"
                >
                  <p
                    className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#00749C]"
                    style={{ fontFamily: mono }}
                  >
                    WordPress.org status
                  </p>
                  <p className="text-sm leading-relaxed text-[#1B1712]/75">
                    {WORDPRESS_ORG_REVIEW_NOTICE}
                  </p>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                {AI_SUITE_PRODUCTS.map((product) => (
                  <section
                    id={product.id}
                    key={product.id}
                    aria-labelledby={`${product.id}-heading`}
                    className="scroll-mt-6 border border-[#1B1712]/20 bg-white p-7"
                  >
                    <div className="mb-5 flex items-center justify-between gap-3">
                      <span
                        className="text-[11px] uppercase tracking-[0.16em] text-[#1B1712]/60"
                        style={{ fontFamily: mono }}
                      >
                        Version {product.version}
                      </span>
                      <span className="bg-[#1B1712] px-2.5 py-1 text-sm font-bold text-white">
                        {product.price}
                      </span>
                    </div>
                    <h3
                      id={`${product.id}-heading`}
                      className="mb-2 text-2xl font-bold"
                      style={{ fontFamily: serif }}
                    >
                      {product.name}
                    </h3>
                    <p className="mb-4 text-sm font-medium text-[#00749C]">{product.audience}</p>
                    <p className="mb-6 leading-relaxed text-[#1B1712]/70">{product.description}</p>
                    <h4 className="mb-2 font-bold">Included capabilities</h4>
                    <ul className="mb-7 space-y-2 text-sm text-[#1B1712]/75">
                      {product.features.map((feature) => (
                        <li key={feature} className="flex gap-2">
                          <span aria-hidden="true" className="font-bold text-[#00749C]">
                            ✓
                          </span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    {product.downloadPath ? (
                      <a
                        href={product.downloadPath}
                        className="inline-block border border-[#1B1712]/30 px-5 py-2.5 text-sm font-bold hover:bg-[#1B1712] hover:text-white"
                      >
                        Download {product.name} ↓
                      </a>
                    ) : (
                      <Link
                        href="/#pricing"
                        className="inline-block border border-[#1B1712]/30 px-5 py-2.5 text-sm font-bold hover:bg-[#1B1712] hover:text-white"
                      >
                        Compare paid plans →
                      </Link>
                    )}
                  </section>
                ))}
              </div>

              <div className="mt-10 overflow-x-auto border border-[#1B1712]/20 bg-white">
                <table className="w-full min-w-[680px] border-collapse text-left text-sm">
                  <caption className="sr-only">Comparison of FounderPostAI AI Suite plans</caption>
                  <thead className="bg-[#1B1712] text-white">
                    <tr>
                      {['Plan', 'Annual price', 'Sites', 'Inference', 'Automation'].map((heading) => (
                        <th key={heading} scope="col" className="px-5 py-4 font-bold">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Free', '$0', 'No license limit', 'BYOK or purchased credits', 'Per-post and batches of ten'],
                      ['SEO Pro', '$79', 'One site', 'Managed credits included or BYOK', 'Bulk, scheduling, auto-apply'],
                      ['Agency', '$199', 'Unlimited managed sites', 'BYOK', 'Bulk, scheduling, auto-apply'],
                    ].map((row) => (
                      <tr key={row[0]} className="border-t border-[#1B1712]/15">
                        {row.map((cell, index) =>
                          index === 0 ? (
                            <th key={cell} scope="row" className="px-5 py-4 font-bold">
                              {cell}
                            </th>
                          ) : (
                            <td key={cell} className="px-5 py-4 text-[#1B1712]/75">
                              {cell}
                            </td>
                          )
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section id="privacy" aria-labelledby="privacy-heading" className="border-y border-[#1B1712]/15 bg-[#1B1712] text-[#F7F4EE]">
              <div className="mx-auto max-w-4xl px-6 py-16 md:py-20">
                <h2
                  id="privacy-heading"
                  className="mb-8 text-3xl font-bold tracking-tight md:text-4xl"
                  style={{ fontFamily: serif }}
                >
                  How processing and content changes work
                </h2>
                <ol className="grid gap-8 md:grid-cols-3">
                  {[
                    ['1', 'You start an action', 'WordPress content is sent for processing only when you run an AI Suite action.'],
                    ['2', 'The gateway processes it', 'Managed plans use FounderPostAI’s Anthropic connection; BYOK uses your Anthropic key at the gateway.'],
                    ['3', 'You keep control', 'Suggestions can be reviewed, and a WordPress revision is saved before every content write.'],
                  ].map(([number, title, text]) => (
                    <li key={number}>
                      <span
                        aria-hidden="true"
                        className="mb-3 block text-4xl font-bold text-[#52C5E8]"
                        style={{ fontFamily: serif }}
                      >
                        {number}
                      </span>
                      <h3 className="mb-2 text-lg font-bold">{title}</h3>
                      <p className="leading-relaxed text-[#F7F4EE]/70">{text}</p>
                    </li>
                  ))}
                </ol>
                <p className="mt-9 text-sm text-[#F7F4EE]/70">
                  FounderPostAI does not use customer content to train AI models. Read the full{' '}
                  <Link href="/privacy" className="font-bold text-white underline underline-offset-4">
                    privacy policy
                  </Link>{' '}
                  and{' '}
                  <Link href="/terms" className="font-bold text-white underline underline-offset-4">
                    terms of service
                  </Link>
                  .
                </p>
              </div>
            </section>

            <section id="questions" aria-labelledby="questions-heading" className="mx-auto max-w-4xl px-6 py-16 md:py-24">
              <h2
                id="questions-heading"
                className="mb-10 text-3xl font-bold tracking-tight md:text-4xl"
                style={{ fontFamily: serif }}
              >
                Common questions, answered directly
              </h2>
              <div className="divide-y divide-[#1B1712]/15 border-y border-[#1B1712]/15">
                {AI_SUITE_FAQS.map(({ question, answer }) => (
                  <details key={question} className="group py-5">
                    <summary className="flex cursor-pointer list-none items-center justify-between text-lg font-bold">
                      {question}
                      <span
                        aria-hidden="true"
                        className="ml-4 text-xl text-[#00749C] transition-transform group-open:rotate-45"
                      >
                        +
                      </span>
                    </summary>
                    <p className="mt-3 max-w-3xl leading-relaxed text-[#1B1712]/70">{answer}</p>
                  </details>
                ))}
              </div>
            </section>
          </article>
        </main>

        <footer className="border-t border-[#1B1712]/15 bg-white">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 px-6 py-10 text-sm text-[#1B1712]/70 md:flex-row">
            <Link href="/" className="font-bold text-[#1B1712]" style={{ fontFamily: serif }}>
              FounderPostAI
            </Link>
            <nav aria-label="Footer navigation" className="flex flex-wrap justify-center gap-5">
              <Link href="/">Home</Link>
              <Link href="/#pricing">Pricing</Link>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
              <a href="/llms.txt">LLM reference</a>
            </nav>
            <p>© {new Date().getFullYear()} FounderPostAI</p>
          </div>
        </footer>
      </div>
    </>
  );
}
