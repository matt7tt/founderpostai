import SiteFooter from '../components/SiteFooter';
import Link from 'next/link';
import SeoHead from '../components/SeoHead';
import {
  COMPARISON_SEARCH_PAGES,
  GUIDE_SEARCH_PAGES,
  SEARCH_PAGES,
  TOP_LEVEL_SEARCH_PAGES,
  type SearchPage,
} from '../lib/search-content';
import {
  absoluteUrl,
  organizationStructuredData,
  SITE_URL,
  WORDPRESS_ORG_CORE_URL,
  websiteStructuredData,
} from '../lib/site';
import { RESOURCES_DATES } from '../lib/content-dates';

const TITLE = 'WordPress AI SEO Resources and Guides | FounderPostAI';
const DESCRIPTION =
  'Practical guides to WordPress SEO titles, meta descriptions, internal links, plugin integrations, bulk workflows, and AI SEO plugin evaluation.';
const serif = "Charter, 'Bitstream Charter', 'Sitka Text', Cambria, Georgia, serif";
const mono = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";

const groups: { title: string; description: string; pages: SearchPage[] }[] = [
  {
    title: 'SEO workflow guides',
    description:
      'Understand the concrete title, description, and internal-link workflows before installing a plugin.',
    pages: TOP_LEVEL_SEARCH_PAGES.filter((page) => page.kind === 'feature'),
  },
  {
    title: 'WordPress SEO plugin integrations',
    description:
      'See how FounderPostAI works alongside the plugin that already owns frontend SEO output.',
    pages: TOP_LEVEL_SEARCH_PAGES.filter((page) => page.kind === 'integration'),
  },
  {
    title: 'Implementation guides',
    description:
      'Use practical checklists for safe internal links and controlled bulk metadata work.',
    pages: GUIDE_SEARCH_PAGES,
  },
  {
    title: 'Plugin comparison guides',
    description:
      'Compare scope, safeguards, recovery, and automation without pretending one tool is best for every site.',
    pages: COMPARISON_SEARCH_PAGES,
  },
];

export default function Resources() {
  const canonical = absoluteUrl('/resources');
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      organizationStructuredData(),
      websiteStructuredData(),
      {
        '@type': 'CollectionPage',
        '@id': `${canonical}#webpage`,
        url: canonical,
        name: TITLE,
        description: DESCRIPTION,
        inLanguage: 'en-US',
        datePublished: RESOURCES_DATES.publishedAt,
        dateModified: RESOURCES_DATES.updatedAt,
        isPartOf: {
          '@id': `${SITE_URL}/#website`,
        },
        breadcrumb: {
          '@id': `${canonical}#breadcrumb`,
        },
        mainEntity: {
          '@id': `${canonical}#resources`,
        },
        publisher: {
          '@id': `${SITE_URL}/#organization`,
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonical}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'FounderPostAI',
            item: SITE_URL,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Resources',
            item: canonical,
          },
        ],
      },
      {
        '@type': 'ItemList',
        '@id': `${canonical}#resources`,
        name: 'FounderPostAI WordPress AI SEO resources',
        numberOfItems: SEARCH_PAGES.length,
        itemListElement: SEARCH_PAGES.map((page, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: page.navLabel,
          url: absoluteUrl(page.path),
        })),
      },
    ],
  };

  return (
    <>
      <SeoHead
        title={TITLE}
        description={DESCRIPTION}
        path="/resources"
        imageAlt="FounderPostAI WordPress AI SEO resources and practical guides"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />

      <div className="min-h-screen bg-[#F7F4EE] text-[#1B1712] antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-[#1B1712] focus:px-4 focus:py-3 focus:text-white"
        >
          Skip to content
        </a>

        <header className="border-b border-[#1B1712]/15">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-5 px-6 py-5">
            <Link href="/" className="text-xl font-bold tracking-tight" style={{ fontFamily: serif }}>
              FounderPostAI
            </Link>
            <nav aria-label="Primary navigation" className="flex items-center gap-5 text-sm">
              <Link href="/ai-suite" className="hidden hover:text-[#00749C] sm:inline">
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
          <header className="border-b border-[#1B1712]/15">
            <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
              <nav aria-label="Breadcrumb" className="mb-8 text-sm text-[#1B1712]/65">
                <Link href="/" className="underline decoration-[#1B1712]/30 underline-offset-4">
                  FounderPostAI
                </Link>{' '}
                <span aria-hidden="true">/</span> Resources
              </nav>
              <p
                className="mb-5 text-[11px] uppercase tracking-[0.22em] text-[#00749C]"
                style={{ fontFamily: mono }}
              >
                WordPress AI SEO library
              </p>
              <h1
                className="mb-6 max-w-4xl text-4xl font-bold leading-[1.04] tracking-tight md:text-6xl"
                style={{ fontFamily: serif }}
              >
                Practical WordPress SEO guides built from the product’s real workflow
              </h1>
              <p className="max-w-3xl text-xl leading-relaxed text-[#1B1712]/75">
                Learn how reviewable titles, meta descriptions, constrained internal links,
                native metadata adapters, and bounded bulk automation work before you apply them to a
                live WordPress site.
              </p>
            </div>
          </header>

          {groups.map((group, groupIndex) => (
            <section
              key={group.title}
              aria-labelledby={`group-${groupIndex}`}
              className={`border-b border-[#1B1712]/15 ${groupIndex % 2 ? 'bg-white' : ''}`}
            >
              <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
                <div className="mb-9 max-w-3xl">
                  <h2
                    id={`group-${groupIndex}`}
                    className="mb-3 text-3xl font-bold tracking-tight md:text-4xl"
                    style={{ fontFamily: serif }}
                  >
                    {group.title}
                  </h2>
                  <p className="text-lg leading-relaxed text-[#1B1712]/70">{group.description}</p>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {group.pages.map((page) => (
                    <Link
                      key={page.path}
                      href={page.path}
                      className="group flex min-h-[250px] flex-col border border-[#1B1712]/15 bg-[#F7F4EE] p-7 hover:border-[#00749C]"
                    >
                      <span
                        className="mb-4 text-[10px] uppercase tracking-[0.17em] text-[#00749C]"
                        style={{ fontFamily: mono }}
                      >
                        {page.kind}
                      </span>
                      <h3
                        className="mb-3 text-2xl font-bold leading-tight group-hover:text-[#00749C]"
                        style={{ fontFamily: serif }}
                      >
                        {page.navLabel}
                      </h3>
                      <p className="mb-6 text-sm leading-relaxed text-[#1B1712]/68">
                        {page.description}
                      </p>
                      <span className="mt-auto text-sm font-bold">Read the guide →</span>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          ))}

          <section className="bg-[#1B1712] text-[#F7F4EE]">
            <div className="mx-auto max-w-4xl px-6 py-16 text-center md:py-20">
              <h2
                className="mb-4 text-3xl font-bold tracking-tight md:text-5xl"
                style={{ fontFamily: serif }}
              >
                Test the workflow instead of taking the copy on faith.
              </h2>
              <p className="mx-auto mb-7 max-w-2xl text-lg leading-relaxed text-[#F7F4EE]/70">
                Download Core and SEO free, analyze a representative page, and keep only the
                suggestions that improve the actual WordPress content.
              </p>
              <a
                href={WORDPRESS_ORG_CORE_URL}
                className="inline-block bg-[#F7F4EE] px-7 py-3.5 font-bold text-[#1B1712] hover:bg-[#52C5E8]"
              >
                Get Core on WordPress.org →
              </a>
            </div>
          </section>
        </main>

        <SiteFooter />
      </div>
    </>
  );
}
