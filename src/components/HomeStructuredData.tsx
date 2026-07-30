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
      '@type': 'SoftwareApplication',
      '@id': `${SITE_URL}/#ai-suite-core`,
      name: 'AI Suite Core',
      description:
        'The free WordPress runtime for secure gateway connections, credits, brand context, and background AI jobs.',
      url: `${SITE_URL}/#plugins`,
      downloadUrl: absoluteUrl('/downloads/aisuite-core.zip'),
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'WordPress 6.5 or later',
      softwareVersion: '0.1.2',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: absoluteUrl('/downloads/aisuite-core.zip'),
      },
      publisher: {
        '@id': `${SITE_URL}/#organization`,
      },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE_URL}/#ai-suite-seo`,
      name: 'AI Suite SEO',
      description:
        'A free WordPress SEO plugin for search titles, meta descriptions, reviewable suggestions, and block-aware internal links.',
      url: `${SITE_URL}/#plugins`,
      downloadUrl: absoluteUrl('/downloads/aisuite-seo.zip'),
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'WordPress 6.5 or later',
      softwareVersion: '0.1.2',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: absoluteUrl('/downloads/aisuite-seo.zip'),
      },
      publisher: {
        '@id': `${SITE_URL}/#organization`,
      },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE_URL}/#ai-suite-seo-pro`,
      name: 'AI Suite SEO Pro',
      description:
        'A WordPress SEO automation plugin for whole-site bulk runs, scheduled re-optimization, and auto-applying trusted suggestions.',
      url: `${SITE_URL}/#pricing`,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'WordPress 6.5 or later',
      softwareVersion: '1.0.1',
      offers: {
        '@type': 'Offer',
        name: 'SEO Pro annual license',
        price: '79',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: `${SITE_URL}/#pricing`,
      },
      publisher: {
        '@id': `${SITE_URL}/#organization`,
      },
    },
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
