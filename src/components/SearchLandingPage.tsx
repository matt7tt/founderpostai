import Link from 'next/link';
import { useEffect } from 'react';
import { track } from '../lib/ab';
import { relatedSearchPages, type SearchPage } from '../lib/search-content';
import { WORDPRESS_ORG_CORE_URL } from '../lib/site';
import SearchPageStructuredData from './SearchPageStructuredData';
import SeoHead from './SeoHead';

const serif = "Charter, 'Bitstream Charter', 'Sitka Text', Cambria, Georgia, serif";
const mono = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";

const kindLabels: Record<SearchPage['kind'], string> = {
  feature: 'Feature guide',
  integration: 'Integration guide',
  guide: 'Practical guide',
  comparison: 'Plugin comparison',
};

export default function SearchLandingPage({ page }: { page: SearchPage }) {
  const related = relatedSearchPages(page);

  useEffect(() => {
    track('search_content_view', {
      content_type: page.kind,
      slug: page.slug,
    });
  }, [page.kind, page.slug]);

  return (
    <>
      <SeoHead
        title={page.title}
        description={page.description}
        path={page.path}
        imageAlt={`${page.h1} — FounderPostAI`}
      />
      <SearchPageStructuredData page={page} />

      <div className="min-h-screen bg-[#F7F4EE] text-[#1B1712] antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-[#1B1712] focus:px-4 focus:py-3 focus:text-white"
        >
          Skip to content
        </a>

        <header className="border-b border-[#1B1712]/15 bg-[#F7F4EE]">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-5 px-6 py-5">
            <Link href="/" className="text-xl font-bold tracking-tight" style={{ fontFamily: serif }}>
              FounderPostAI
            </Link>
            <nav aria-label="Primary navigation" className="flex items-center gap-5 text-sm">
              <Link href="/resources" className="hidden hover:text-[#00749C] sm:inline">
                Resources
              </Link>
              <Link href="/ai-suite" className="hidden hover:text-[#00749C] md:inline">
                AI Suite
              </Link>
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
              <div className="mx-auto max-w-4xl px-6 py-14 md:py-20">
                <nav aria-label="Breadcrumb" className="mb-8 text-sm text-[#1B1712]/65">
                  <Link href="/" className="underline decoration-[#1B1712]/30 underline-offset-4">
                    FounderPostAI
                  </Link>{' '}
                  <span aria-hidden="true">/</span>{' '}
                  <Link
                    href="/resources"
                    className="underline decoration-[#1B1712]/30 underline-offset-4"
                  >
                    Resources
                  </Link>{' '}
                  <span aria-hidden="true">/</span> {page.navLabel}
                </nav>
                <p
                  className="mb-5 text-[11px] uppercase tracking-[0.22em] text-[#00749C]"
                  style={{ fontFamily: mono }}
                >
                  {page.eyebrow}
                </p>
                <h1
                  className="mb-6 text-4xl font-bold leading-[1.06] tracking-tight md:text-6xl"
                  style={{ fontFamily: serif }}
                >
                  {page.h1}
                </h1>
                <p className="max-w-3xl text-xl leading-relaxed text-[#1B1712]/75">
                  <strong className="text-[#1B1712]">The short answer:</strong>{' '}
                  {page.directAnswer}
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <a
                    href={WORDPRESS_ORG_CORE_URL}
                    className="bg-[#00749C] px-5 py-3 text-sm font-bold text-white hover:bg-[#005d7e]"
                  >
                    Get Core on WordPress.org →
                  </a>
                  <a
                    href="/downloads/aisuite-seo.zip"
                    className="border border-[#1B1712]/30 px-5 py-3 text-sm font-bold hover:border-[#1B1712]"
                  >
                    Download SEO free ↓
                  </a>
                </div>
                <p className="mt-6 text-sm text-[#1B1712]/60">
                  Written from the current product implementation and checked on{' '}
                  <time dateTime="2026-07-30">July 30, 2026</time>.
                </p>
              </div>
            </header>

            <section aria-labelledby="fit-heading" className="border-b border-[#1B1712]/15 bg-white">
              <div className="mx-auto max-w-5xl px-6 py-12">
                <h2 id="fit-heading" className="sr-only">
                  Who this workflow is for
                </h2>
                <dl className="grid gap-px overflow-hidden border border-[#1B1712]/15 bg-[#1B1712]/15 md:grid-cols-3">
                  {[
                    ['Best for', page.bestFor],
                    ['Works with', page.worksWith],
                    ['Practical outcome', page.outcome],
                  ].map(([term, description]) => (
                    <div key={term} className="bg-white p-6">
                      <dt
                        className="mb-2 text-[11px] uppercase tracking-[0.16em] text-[#00749C]"
                        style={{ fontFamily: mono }}
                      >
                        {term}
                      </dt>
                      <dd className="leading-relaxed text-[#1B1712]/75">{description}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </section>

            <section aria-labelledby="details-heading" className="border-b border-[#1B1712]/15">
              <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
                <div className="mb-10 max-w-3xl">
                  <p
                    className="mb-3 text-[11px] uppercase tracking-[0.2em] text-[#00749C]"
                    style={{ fontFamily: mono }}
                  >
                    What matters in practice
                  </p>
                  <h2
                    id="details-heading"
                    className="text-3xl font-bold tracking-tight md:text-5xl"
                    style={{ fontFamily: serif }}
                  >
                    A workflow you can inspect, test, and reverse.
                  </h2>
                </div>
                <div className="grid gap-6 lg:grid-cols-3">
                  {page.sections.map((section) => (
                    <section key={section.title} className="border border-[#1B1712]/15 bg-white p-7">
                      <h3 className="mb-3 text-2xl font-bold" style={{ fontFamily: serif }}>
                        {section.title}
                      </h3>
                      <p className="mb-5 leading-relaxed text-[#1B1712]/70">{section.body}</p>
                      <ul className="space-y-3 text-sm leading-relaxed text-[#1B1712]/70">
                        {section.bullets.map((bullet) => (
                          <li key={bullet} className="flex gap-2">
                            <span aria-hidden="true" className="font-bold text-[#00749C]">✓</span>
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              </div>
            </section>

            {page.comparison && (
              <section aria-labelledby="comparison-heading" className="border-b border-[#1B1712]/15 bg-white">
                <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
                  <h2
                    id="comparison-heading"
                    className="mb-8 text-3xl font-bold tracking-tight md:text-4xl"
                    style={{ fontFamily: serif }}
                  >
                    Compare the workflows directly
                  </h2>
                  <div className="overflow-x-auto border border-[#1B1712]/20">
                    <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                      <caption className="sr-only">{page.comparison.caption}</caption>
                      <thead className="bg-[#1B1712] text-white">
                        <tr>
                          {page.comparison.columns.map((column) => (
                            <th key={column} scope="col" className="px-5 py-4 font-bold">
                              {column}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {page.comparison.rows.map((row) => (
                          <tr key={row[0]} className="border-t border-[#1B1712]/15">
                            {row.map((cell, index) =>
                              index === 0 ? (
                                <th key={cell} scope="row" className="px-5 py-4 font-bold">
                                  {cell}
                                </th>
                              ) : (
                                <td key={cell} className="px-5 py-4 leading-relaxed text-[#1B1712]/70">
                                  {cell}
                                </td>
                              )
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {page.sources && (
                    <p className="mt-5 text-sm leading-relaxed text-[#1B1712]/65">
                      External facts checked against{' '}
                      {page.sources.map((source, index) => (
                        <span key={source.href}>
                          {index > 0 && ', '}
                          <a
                            href={source.href}
                            rel="noopener noreferrer"
                            className="underline decoration-[#1B1712]/30 underline-offset-4 hover:text-[#00749C]"
                          >
                            {source.label}
                          </a>
                        </span>
                      ))}
                      . Product capabilities can change; verify the current vendor source before
                      buying.
                    </p>
                  )}
                </div>
              </section>
            )}

            <section aria-labelledby="steps-heading" className="border-b border-[#1B1712]/15 bg-[#1B1712] text-[#F7F4EE]">
              <div className="mx-auto max-w-5xl px-6 py-16 md:py-20">
                <p
                  className="mb-3 text-[11px] uppercase tracking-[0.2em] text-[#52C5E8]"
                  style={{ fontFamily: mono }}
                >
                  A practical sequence
                </p>
                <h2
                  id="steps-heading"
                  className="mb-10 text-3xl font-bold tracking-tight md:text-4xl"
                  style={{ fontFamily: serif }}
                >
                  Put the workflow into practice
                </h2>
                <ol className="grid gap-px bg-white/15 md:grid-cols-2">
                  {page.steps.map((step, index) => (
                    <li
                      id={`step-${index + 1}`}
                      key={step.title}
                      className="scroll-mt-8 bg-[#1B1712] p-6 md:p-8"
                    >
                      <span
                        className="mb-4 block text-sm text-[#52C5E8]"
                        style={{ fontFamily: mono }}
                      >
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <h3 className="mb-2 text-xl font-bold">{step.title}</h3>
                      <p className="leading-relaxed text-[#F7F4EE]/70">{step.body}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </section>

            <section aria-labelledby="guardrails-heading" className="border-b border-[#1B1712]/15 bg-white">
              <div className="mx-auto grid max-w-5xl gap-10 px-6 py-16 md:grid-cols-[0.8fr_1.2fr] md:py-20">
                <div>
                  <p
                    className="mb-3 text-[11px] uppercase tracking-[0.2em] text-[#00749C]"
                    style={{ fontFamily: mono }}
                  >
                    Boundaries matter
                  </p>
                  <h2
                    id="guardrails-heading"
                    className="text-3xl font-bold tracking-tight"
                    style={{ fontFamily: serif }}
                  >
                    What this workflow does not promise
                  </h2>
                </div>
                <ul className="divide-y divide-[#1B1712]/15 border-y border-[#1B1712]/15">
                  {page.guardrails.map((guardrail) => (
                    <li key={guardrail} className="flex gap-3 py-4 leading-relaxed text-[#1B1712]/75">
                      <span aria-hidden="true" className="font-bold text-[#00749C]">—</span>
                      <span>{guardrail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section aria-labelledby="faq-heading" className="border-b border-[#1B1712]/15">
              <div className="mx-auto max-w-4xl px-6 py-16 md:py-20">
                <h2
                  id="faq-heading"
                  className="mb-8 text-3xl font-bold tracking-tight md:text-4xl"
                  style={{ fontFamily: serif }}
                >
                  Common questions
                </h2>
                <div className="divide-y divide-[#1B1712]/15 border-y border-[#1B1712]/15">
                  {page.faqs.map((faq) => (
                    <details key={faq.question} className="group py-5">
                      <summary className="flex cursor-pointer list-none items-center justify-between text-lg font-bold">
                        {faq.question}
                        <span
                          aria-hidden="true"
                          className="ml-4 text-xl text-[#00749C] transition-transform group-open:rotate-45"
                        >
                          +
                        </span>
                      </summary>
                      <p className="mt-3 max-w-3xl leading-relaxed text-[#1B1712]/70">
                        {faq.answer}
                      </p>
                    </details>
                  ))}
                </div>
              </div>
            </section>

            <section aria-labelledby="related-heading" className="bg-white">
              <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
                <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                  <div>
                    <p
                      className="mb-2 text-[11px] uppercase tracking-[0.2em] text-[#00749C]"
                      style={{ fontFamily: mono }}
                    >
                      Continue researching
                    </p>
                    <h2
                      id="related-heading"
                      className="text-3xl font-bold tracking-tight"
                      style={{ fontFamily: serif }}
                    >
                      Related WordPress SEO resources
                    </h2>
                  </div>
                  <Link href="/resources" className="text-sm font-bold text-[#00749C]">
                    View all resources →
                  </Link>
                </div>
                <div className="grid gap-5 md:grid-cols-3">
                  {related.map((relatedPage) => (
                    <Link
                      key={relatedPage.path}
                      href={relatedPage.path}
                      className="border border-[#1B1712]/15 p-6 hover:border-[#00749C]"
                    >
                      <span
                        className="mb-3 block text-[10px] uppercase tracking-[0.16em] text-[#00749C]"
                        style={{ fontFamily: mono }}
                      >
                        {kindLabels[relatedPage.kind]}
                      </span>
                      <span className="block text-xl font-bold" style={{ fontFamily: serif }}>
                        {relatedPage.navLabel}
                      </span>
                      <span className="mt-3 block text-sm leading-relaxed text-[#1B1712]/65">
                        {relatedPage.description}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </section>

            <section className="bg-[#00749C] text-white">
              <div className="mx-auto max-w-4xl px-6 py-16 text-center md:py-20">
                <h2
                  className="mb-4 text-3xl font-bold tracking-tight md:text-5xl"
                  style={{ fontFamily: serif }}
                >
                  Try the review workflow on a real WordPress page.
                </h2>
                <p className="mx-auto mb-7 max-w-2xl text-lg leading-relaxed text-white">
                  AI Suite Core is free on WordPress.org, and SEO is a free GPL-licensed download.
                  Install Core first, then add SEO and review every suggestion before applying it.
                </p>
                <a
                  href={WORDPRESS_ORG_CORE_URL}
                  className="inline-block bg-white px-7 py-3.5 font-bold text-[#1B1712] hover:bg-[#F7F4EE]"
                >
                  Get Core on WordPress.org →
                </a>
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
              <Link href="/ai-suite">AI Suite</Link>
              <Link href="/resources">Resources</Link>
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
