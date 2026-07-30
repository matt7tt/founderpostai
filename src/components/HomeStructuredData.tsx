import { absoluteUrl, HOME_DESCRIPTION, SITE_NAME, SITE_URL } from '../lib/site';
import { softwareApplicationStructuredData } from '../lib/products';

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
