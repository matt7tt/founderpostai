import {
  absoluteUrl,
  organizationStructuredData,
  SITE_LAST_MODIFIED_ISO,
  SITE_URL,
  websiteStructuredData,
} from '../lib/site';
import type { SearchPage } from '../lib/search-content';

export default function SearchPageStructuredData({ page }: { page: SearchPage }) {
  const canonical = absoluteUrl(page.path);
  const breadcrumbItems = [
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
      item: absoluteUrl('/resources'),
    },
    {
      '@type': 'ListItem',
      position: 3,
      name: page.navLabel,
      item: canonical,
    },
  ];

  const graph: Record<string, unknown>[] = [
    organizationStructuredData(),
    websiteStructuredData(),
    {
      '@type': 'WebPage',
      '@id': `${canonical}#webpage`,
      url: canonical,
      name: page.title,
      description: page.description,
      inLanguage: 'en-US',
      datePublished: SITE_LAST_MODIFIED_ISO,
      dateModified: SITE_LAST_MODIFIED_ISO,
      isPartOf: {
        '@id': `${SITE_URL}/#website`,
      },
      about: {
        '@id': `${SITE_URL}/ai-suite#ai-suite-seo`,
      },
      breadcrumb: {
        '@id': `${canonical}#breadcrumb`,
      },
      publisher: {
        '@id': `${SITE_URL}/#organization`,
      },
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: absoluteUrl('/og-image.png'),
        width: 1200,
        height: 630,
      },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${canonical}#breadcrumb`,
      itemListElement: breadcrumbItems,
    },
    {
      '@type': 'FAQPage',
      '@id': `${canonical}#faq`,
      url: canonical,
      mainEntity: page.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    },
  ];

  if (page.kind === 'guide' || page.kind === 'comparison') {
    graph.push({
      '@type': 'Article',
      '@id': `${canonical}#article`,
      headline: page.h1,
      description: page.description,
      datePublished: SITE_LAST_MODIFIED_ISO,
      dateModified: SITE_LAST_MODIFIED_ISO,
      mainEntityOfPage: {
        '@id': `${canonical}#webpage`,
      },
      author: {
        '@id': `${SITE_URL}/#organization`,
      },
      publisher: {
        '@id': `${SITE_URL}/#organization`,
      },
      image: absoluteUrl('/og-image.png'),
    });
  }

  if (page.kind === 'guide') {
    graph.push({
      '@type': 'HowTo',
      '@id': `${canonical}#howto`,
      name: page.h1,
      description: page.directAnswer,
      step: page.steps.map((step, index) => ({
        '@type': 'HowToStep',
        position: index + 1,
        name: step.title,
        text: step.body,
        url: `${canonical}#step-${index + 1}`,
      })),
    });
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': graph,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
      }}
    />
  );
}
