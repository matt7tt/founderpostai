export const SITE_NAME = 'FounderPostAI';
export const SITE_ALTERNATE_NAME = 'Founder Post AI';
export const SITE_URL = 'https://founderpostai.com';
export const WORDPRESS_ORG_CORE_URL =
  'https://wordpress.org/plugins/founderpostai-ai-suite-core/';
export const HOME_TITLE = 'AI SEO Plugin for WordPress | FounderPostAI';
export const HOME_DESCRIPTION =
  'Generate reviewable SEO titles, meta descriptions, and safe internal links in WordPress. Install Core free from WordPress.org, add SEO, and automate with Pro.';
export const SOCIAL_IMAGE_PATH = '/og-image.png';
export const SITE_LAST_MODIFIED = '2026-09-03';
export const SITE_LAST_MODIFIED_ISO = '2026-09-03T12:00:00+01:00';
export const WORDPRESS_ORG_STATUS_NOTICE =
  'FounderPostAI – AI Suite Core is available free from the official WordPress.org Plugin Directory. Install it from Plugins → Add Plugin by searching for “FounderPostAI”, then upload the free SEO module from FounderPostAI.';

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
