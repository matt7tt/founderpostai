import {
  absoluteUrl,
  organizationStructuredData,
  SITE_NAME,
  SITE_URL,
  websiteStructuredData,
} from '../lib/site';

interface PolicyStructuredDataProps {
  path: '/privacy' | '/terms';
  title: string;
  description: string;
  breadcrumbLabel: string;
  dateModified: string;
}

export default function PolicyStructuredData({
  path,
  title,
  description,
  breadcrumbLabel,
  dateModified,
}: PolicyStructuredDataProps) {
  const url = absoluteUrl(path);
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      organizationStructuredData(),
      websiteStructuredData(),
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: title,
        description,
        inLanguage: 'en-US',
        isPartOf: {
          '@id': `${SITE_URL}/#website`,
        },
        breadcrumb: {
          '@id': `${url}#breadcrumbs`,
        },
        dateModified,
        publisher: {
          '@id': `${SITE_URL}/#organization`,
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumbs`,
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
            name: breadcrumbLabel,
            item: url,
          },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData).replace(/</g, '\\u003c'),
      }}
    />
  );
}
