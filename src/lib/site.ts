export const SITE_NAME = 'FounderPostAI';
export const SITE_ALTERNATE_NAME = 'Founder Post AI';
export const SITE_URL = 'https://founderpostai.com';
export const HOME_TITLE = 'AI SEO Plugin for WordPress | FounderPostAI';
export const HOME_DESCRIPTION =
  'Generate reviewable SEO titles, meta descriptions, and safe internal links in WordPress. Download Core and SEO free; add bulk automation with Pro.';
export const SOCIAL_IMAGE_PATH = '/og-image.png';
export const SITE_LAST_MODIFIED = '2026-07-30';
export const SITE_LAST_MODIFIED_ISO = '2026-07-30T21:00:00-07:00';
export const WORDPRESS_ORG_REVIEW_NOTICE =
  'FounderPostAI – AI Suite Core is awaiting WordPress.org review. Until the directory listing is approved, install Core and SEO from the direct ZIP downloads using Plugins → Add New → Upload Plugin.';

export function absoluteUrl(path: string = '/'): string {
  return new URL(path, SITE_URL).toString();
}

export function organizationStructuredData() {
  return {
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    alternateName: SITE_ALTERNATE_NAME,
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      '@id': `${SITE_URL}/#logo`,
      url: absoluteUrl('/brand-icon.png'),
      contentUrl: absoluteUrl('/brand-icon.png'),
      width: 512,
      height: 512,
      caption: SITE_NAME,
    },
    image: {
      '@id': `${SITE_URL}/#logo`,
    },
    email: 'support@founderpostai.com',
    sameAs: ['https://profiles.wordpress.org/founderpostai/'],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'support@founderpostai.com',
      availableLanguage: ['English'],
    },
  };
}

export function websiteStructuredData() {
  return {
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    alternateName: SITE_ALTERNATE_NAME,
    description: HOME_DESCRIPTION,
    inLanguage: 'en-US',
    publisher: {
      '@id': `${SITE_URL}/#organization`,
    },
  };
}
