import Link from 'next/link';
import type { ReactNode } from 'react';
import { formatContentDate, INFORMATION_PAGE_DATES } from '../lib/content-dates';
import { absoluteUrl, organizationStructuredData, SITE_URL, websiteStructuredData } from '../lib/site';
import SeoHead from './SeoHead';
import SiteFooter from './SiteFooter';

interface InformationPageProps {
  path: '/about' | '/contact';
  title: string;
  description: string;
  eyebrow: string;
  heading: string;
  children: ReactNode;
}

export default function InformationPage({ path, title, description, eyebrow, heading, children }: InformationPageProps) {
  const url = absoluteUrl(path);
  const updatedAt = path === '/contact' ? '2026-09-06' : INFORMATION_PAGE_DATES.updatedAt;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      organizationStructuredData(),
      websiteStructuredData(),
      {
        '@type': path === '/about' ? 'AboutPage' : 'ContactPage',
        '@id': `${url}#webpage`,
        url,
        name: title,
        description,
        inLanguage: 'en-US',
        datePublished: INFORMATION_PAGE_DATES.publishedAt,
        dateModified: updatedAt,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${SITE_URL}/#organization` },
        publisher: { '@id': `${SITE_URL}/#organization` },
      },
    ],
  };

  return (
    <>
      <SeoHead title={title} description={description} path={path} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <div className="min-h-screen bg-[#F7F4EE] text-[#1B1712] antialiased">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-[#1B1712] focus:px-4 focus:py-3 focus:text-white">
          Skip to content
        </a>
        <header className="border-b border-[#1B1712]/15">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-5 px-6 py-5">
            <Link href="/" className="text-xl font-bold tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>FounderPostAI</Link>
            <nav aria-label="Primary navigation" className="flex gap-5 text-sm">
              <Link href="/resources" className="hidden hover:text-[#00749C] sm:inline">Resources</Link>
              <Link href="/ai-suite" className="font-bold text-[#00749C]">AI Suite →</Link>
            </nav>
          </div>
        </header>
        <main id="main-content" className="mx-auto max-w-4xl px-6 py-14 md:py-20">
          <nav aria-label="Breadcrumb" className="mb-8 text-sm text-[#1B1712]/65">
            <Link href="/" className="underline underline-offset-4">FounderPostAI</Link>
            {' / '}{path === '/about' ? 'About' : 'Contact'}
          </nav>
          <p className="mb-5 font-mono text-xs uppercase tracking-[0.2em] text-[#00749C]">{eyebrow}</p>
          <h1 className="max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight md:text-6xl" style={{ fontFamily: 'Georgia, serif' }}>{heading}</h1>
          <p className="mt-6 max-w-2xl text-xl leading-relaxed text-[#1B1712]/75">{description}</p>
          <div className="mt-12 space-y-10 text-base leading-relaxed [&_h2]:mb-4 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:font-bold [&_p+p]:mt-4 [&_a]:text-[#00749C] [&_a]:underline [&_a]:underline-offset-4 [&_li+li]:mt-2">
            {children}
          </div>
          <p className="mt-12 border-t border-[#1B1712]/15 pt-6 text-sm text-[#1B1712]/60">
            Published <time dateTime={INFORMATION_PAGE_DATES.publishedAt}>{formatContentDate(INFORMATION_PAGE_DATES.publishedAt)}</time>
            {updatedAt !== INFORMATION_PAGE_DATES.publishedAt && <> · Updated <time dateTime={updatedAt}>{formatContentDate(updatedAt)}</time></>}
          </p>
        </main>
        <SiteFooter />
      </div>
    </>
  );
}
