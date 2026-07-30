export const SITE_NAME = 'FounderPostAI';
export const SITE_URL = 'https://founderpostai.com';
export const HOME_TITLE = 'AI SEO Plugins for WordPress | FounderPostAI';
export const HOME_DESCRIPTION =
  'Download AI Suite Core and AI Suite SEO free. Add bulk SEO audits, internal linking, scheduled optimization, and auto-apply with SEO Pro.';
export const SOCIAL_IMAGE_PATH = '/og-image.png';
export const WORDPRESS_ORG_REVIEW_NOTICE =
  'FounderPostAI – AI Suite Core is awaiting WordPress.org review. Until the directory listing is approved, install Core and SEO from the direct ZIP downloads using Plugins → Add New → Upload Plugin.';

export function absoluteUrl(path: string = '/'): string {
  return new URL(path, SITE_URL).toString();
}
