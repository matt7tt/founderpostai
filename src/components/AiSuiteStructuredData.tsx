import {
  AI_SUITE_DESCRIPTION,
  AI_SUITE_LAST_MODIFIED,
  AI_SUITE_FAQS,
  AI_SUITE_URL,
  softwareApplicationStructuredData,
} from '../lib/products';
import {
  absoluteUrl,
  organizationStructuredData,
  SITE_NAME,
  SITE_URL,
  SOCIAL_IMAGE_PATH,
  websiteStructuredData,
} from '../lib/site';

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    organizationStructuredData(),
    websiteStructuredData(),
    {
      '@type': 'WebPage',
      '@id': `${AI_SUITE_URL}#webpage`,
      url: AI_SUITE_URL,
      name: 'AI SEO plugin for WordPress: titles, meta descriptions, and internal links',
      description: AI_SUITE_DESCRIPTION,
      inLanguage: 'en-US',
      isPartOf: {
        '@id': `${SITE_URL}/#website`,
      },
      about: softwareApplicationStructuredData().map((product) => ({
        '@id': product['@id'],
      })),
      mainEntity: softwareApplicationStructuredData().map((product) => ({
        '@id': product['@id'],
      })),
      hasPart: {
        '@id': `${AI_SUITE_URL}#faq`,
      },
      breadcrumb: {
        '@id': `${AI_SUITE_URL}#breadcrumbs`,
      },
      primaryImageOfPage: {
        '@type': 'ImageObject',
        '@id': `${AI_SUITE_URL}#primaryimage`,
        url: absoluteUrl(SOCIAL_IMAGE_PATH),
        contentUrl: absoluteUrl(SOCIAL_IMAGE_PATH),
        width: 1200,
        height: 630,
      },
      dateModified: AI_SUITE_LAST_MODIFIED,
      publisher: {
        '@id': `${SITE_URL}/#organization`,
      },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${AI_SUITE_URL}#breadcrumbs`,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: SITE_NAME,
          item: SITE_URL,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'AI Suite product facts',
          item: AI_SUITE_URL,
        },
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': `${AI_SUITE_URL}#faq`,
      mainEntity: AI_SUITE_FAQS.map(({ question, answer }) => ({
        '@type': 'Question',
        name: question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: answer,
        },
      })),
    },
    ...softwareApplicationStructuredData(),
  ],
};

export default function AiSuiteStructuredData() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData).replace(/</g, '\\u003c'),
      }}
    />
  );
}
