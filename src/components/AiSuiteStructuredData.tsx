import {
  AI_SUITE_DESCRIPTION,
  AI_SUITE_FAQS,
  AI_SUITE_URL,
  softwareApplicationStructuredData,
} from '../lib/products';
import { absoluteUrl, HOME_DESCRIPTION, SITE_NAME, SITE_URL } from '../lib/site';

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl('/brand-icon.png'),
        width: 512,
        height: 512,
      },
      email: 'support@founderpostai.com',
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: HOME_DESCRIPTION,
      inLanguage: 'en-US',
      publisher: {
        '@id': `${SITE_URL}/#organization`,
      },
    },
    {
      '@type': 'WebPage',
      '@id': `${AI_SUITE_URL}#webpage`,
      url: AI_SUITE_URL,
      name: 'AI Suite for WordPress: product facts and technical overview',
      description: AI_SUITE_DESCRIPTION,
      inLanguage: 'en-US',
      isPartOf: {
        '@id': `${SITE_URL}/#website`,
      },
      about: softwareApplicationStructuredData().map((product) => ({
        '@id': product['@id'],
      })),
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
