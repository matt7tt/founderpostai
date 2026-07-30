import {
  absoluteUrl,
  HOME_DESCRIPTION,
  HOME_TITLE,
  organizationStructuredData,
  SITE_LAST_MODIFIED_ISO,
  SITE_URL,
  SOCIAL_IMAGE_PATH,
  websiteStructuredData,
} from '../lib/site';
import { HOME_FAQS, softwareApplicationStructuredData } from '../lib/products';

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    organizationStructuredData(),
    websiteStructuredData(),
    {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/#webpage`,
      url: SITE_URL,
      name: HOME_TITLE,
      description: HOME_DESCRIPTION,
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
        '@id': `${SITE_URL}/#faq`,
      },
      primaryImageOfPage: {
        '@type': 'ImageObject',
        '@id': `${SITE_URL}/#primaryimage`,
        url: absoluteUrl(SOCIAL_IMAGE_PATH),
        contentUrl: absoluteUrl(SOCIAL_IMAGE_PATH),
        width: 1200,
        height: 630,
      },
      dateModified: SITE_LAST_MODIFIED_ISO,
      publisher: {
        '@id': `${SITE_URL}/#organization`,
      },
    },
    {
      '@type': 'FAQPage',
      '@id': `${SITE_URL}/#faq`,
      mainEntity: HOME_FAQS.map(({ question, answer }) => ({
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

export default function HomeStructuredData() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData).replace(/</g, '\\u003c'),
      }}
    />
  );
}
