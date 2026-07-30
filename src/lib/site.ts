export const SITE_NAME = 'FounderPostAI';
export const SITE_URL = 'https://founderpostai.com';
export const HOME_TITLE = 'AI SEO Plugins for WordPress | FounderPostAI';
export const HOME_DESCRIPTION =
  'Download AI Suite Core and AI Suite SEO free. Add bulk SEO audits, internal linking, scheduled optimization, and auto-apply with SEO Pro.';
export const SOCIAL_IMAGE_PATH = '/og-image.png';

export function absoluteUrl(path: string = '/'): string {
  return new URL(path, SITE_URL).toString();
}
