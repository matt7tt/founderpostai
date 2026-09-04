import {
  absoluteUrl,
  SITE_LAST_MODIFIED_ISO,
  SITE_URL,
  SOCIAL_IMAGE_PATH,
  WORDPRESS_ORG_CORE_URL,
} from './site';

export const AI_SUITE_PATH = '/ai-suite';
export const AI_SUITE_URL = absoluteUrl(AI_SUITE_PATH);
export const AI_SUITE_TITLE =
  'AI SEO Plugin for WordPress | FounderPostAI AI Suite';
export const AI_SUITE_DESCRIPTION =
  'Generate reviewable SEO titles, meta descriptions, and safe internal links in WordPress. Compare free AI Suite downloads with Pro bulk automation.';

export const AI_SUITE_REQUIREMENTS = {
  wordpress: 'WordPress 6.5 or later',
  php: 'PHP 7.4 or later',
  license: 'GPL v2 or later',
  provider: 'Anthropic',
};

export const AI_SUITE_PRODUCTS = [
  {
    id: 'ai-suite-core',
    name: 'FounderPostAI – AI Suite Core',
    shortName: 'AI Suite Core',
    version: '0.1.6',
    price: 'Free',
    priceValue: '0',
    audience: 'Every AI Suite installation',
    description:
      'The shared WordPress runtime for secure gateway connections, credits, brand context, and background AI jobs.',
    features: [
      'Signed gateway calls',
      'Managed credits or bring your own Anthropic key',
      'Shared brand context',
      'Background job queue with fallbacks',
      'Encrypted read-only Search Console bridge',
    ],
    downloadPath: WORDPRESS_ORG_CORE_URL,
  },
  {
    id: 'ai-suite-seo',
    name: 'FounderPostAI – AI Suite SEO',
    shortName: 'AI Suite SEO',
    version: '0.1.8',
    price: 'Free',
    priceValue: '0',
    audience: 'Sites that want reviewable SEO suggestions',
    description:
      'The free WordPress SEO module for titles, meta descriptions, reviewable suggestions, and block-aware internal links.',
    features: [
      'Gutenberg sidebar with live search previews',
      'Site-wide SEO health dashboard',
      'Safe bulk apply and guarded undo',
      'Read-only Search Console opportunities',
      'Native Yoast, Rank Math, AIOSEO, and SEOPress metadata',
      'Incrementally indexed internal-link discovery',
    ],
    downloadPath: '/downloads/aisuite-seo.zip',
  },
  {
    id: 'ai-suite-seo-pro',
    name: 'FounderPostAI – AI Suite SEO Pro',
    shortName: 'AI Suite SEO Pro',
    version: '1.0.5',
    price: '$79 per year',
    priceValue: '79',
    audience: 'One WordPress site that needs automation',
    description:
      'The paid WordPress SEO automation module for whole-site bulk runs, scheduled re-optimization, and auto-applying trusted suggestion types.',
    features: [
      'Whole-site bulk runs',
      'Scheduled re-optimization',
      'Auto-apply for trusted suggestion types',
      'Direct plugin updates',
    ],
    downloadPath: null,
  },
] as const;

export const AI_SEO_CAPABILITIES = [
  {
    id: 'seo-titles',
    resourcePath: '/ai-seo-title-generator-wordpress',
    title: 'AI SEO titles that match the published page',
    summary:
      'Generate a concise search title from the post you actually published, then compare it with the current value before approving anything.',
    points: [
      'Uses the page title, body, excerpt, and saved brand context',
      'Shows the current and proposed title side by side',
      'Rejects stale suggestions if the live value changed after analysis',
    ],
  },
  {
    id: 'meta-descriptions',
    resourcePath: '/ai-meta-description-generator-wordpress',
    title: 'Meta descriptions in your brand voice',
    summary:
      'Create useful search snippets that reflect the page, audience, tone, and phrases your business needs to avoid.',
    points: [
      'Works with Yoast, Rank Math, All in One SEO, and SEOPress',
      'Saves approved metadata into the active SEO plugin’s native fields',
      'Never replaces a newer manual edit with an older suggestion',
    ],
  },
  {
    id: 'internal-linking',
    resourcePath: '/wordpress-internal-linking-plugin',
    title: 'Safe WordPress internal-link suggestions',
    summary:
      'Suggest links only to real published pages, using anchor text that already appears verbatim in the source content.',
    points: [
      'Whole-site relevance ranking surfaces better destination pages',
      'Avoids headings, code, shortcodes, and existing links',
      'Creates a WordPress revision before changing post content',
    ],
  },
] as const;

export const HOME_FAQS = [
  {
    question: 'Why are Core and SEO free?',
    answer:
      'Core and SEO are complete GPL plugins with no license checks or locked code. WordPress.org also prohibits locking functionality already shipped in a directory plugin, so Pro is a genuinely separate download containing its own bulk, scheduling, and auto-apply code.',
  },
  {
    question: 'Does it work with my existing SEO plugin?',
    answer:
      'Yes. When Yoast SEO, Rank Math, All in One SEO, or SEOPress is active, AI Suite saves approved titles and descriptions into that plugin’s native metadata fields and avoids printing duplicate tags.',
  },
  {
    question: 'How are internal-link suggestions kept safe?',
    answer:
      'The model can select only real published posts and pages. The exact anchor must already exist in the source content, the destination is checked again before application, and WordPress saves a revision before the write.',
  },
  {
    question: 'Managed credits or BYOK—what is the difference?',
    answer:
      'With managed processing, FounderPostAI buys inference and you spend actions from a credit balance. With BYOK, you connect your own Anthropic key and model usage is billed by Anthropic. In either mode, the provider key is sent to the gateway and is never written to the WordPress database.',
  },
  {
    question: 'Will AI Suite slow down my site?',
    answer:
      'AI inference runs on the FounderPostAI gateway, not in a visitor page request. Background jobs dispatch through Action Scheduler when available, then loopback requests, then WP-Cron as a fallback.',
  },
  {
    question: 'What happens to my content?',
    answer:
      'Content is sent to the gateway only when an administrator runs an action, and FounderPostAI does not use customer content to train AI models. Every content write saves a WordPress revision first so it can be rolled back.',
  },
  {
    question: 'What happens if I cancel Pro?',
    answer:
      'Bulk runs, scheduling, and auto-apply stop at the end of the paid period. Previously applied metadata, links, and revisions remain ordinary WordPress content, and the free plugins continue to work.',
  },
] as const;

export const AI_SUITE_FAQS = [
  {
    question: 'How do I install the free plugins?',
    answer:
      'Install AI Suite Core from the official WordPress.org Plugin Directory by searching for “FounderPostAI” under Plugins → Add Plugin. Then download AI Suite SEO from FounderPostAI and upload it under Plugins → Add Plugin → Upload Plugin.',
  },
  {
    question: 'What is FounderPostAI AI Suite?',
    answer:
      'FounderPostAI AI Suite is a three-plugin WordPress SEO system: AI Suite Core provides the shared runtime, AI Suite SEO provides free reviewable SEO suggestions, and AI Suite SEO Pro adds whole-site bulk runs, scheduling, and auto-apply.',
  },
  {
    question: 'Does AI Suite SEO replace Yoast, Rank Math, AIOSEO, or SEOPress?',
    answer:
      'It does not need to replace them. When one of those SEO plugins is active, AI Suite saves approved titles and meta descriptions into that plugin’s native metadata fields and avoids printing duplicate tags. It can also output approved metadata on a site without another SEO plugin.',
  },
  {
    question: 'How does AI Suite prevent broken or invented internal links?',
    answer:
      'The model can choose only from a closed list of real published posts and pages. The suggested anchor text must occur verbatim in the source content, and the destination is checked again before application. A WordPress revision is saved before the content changes.',
  },
  {
    question: 'Does AI Suite generate or rewrite full WordPress posts?',
    answer:
      'No. The SEO module proposes search titles, meta descriptions, and constrained internal links. It does not generate executable code or replace an entire post with AI-written content.',
  },
  {
    question: 'Which AI provider does AI Suite support?',
    answer:
      'The current FounderPostAI gateway uses Anthropic. Managed plans include inference credits. In BYOK mode, you connect your own Anthropic API key; the key is sent to the gateway and is not stored in the WordPress database.',
  },
  {
    question: 'What are the WordPress and PHP requirements?',
    answer:
      'AI Suite Core, AI Suite SEO, and AI Suite SEO Pro require WordPress 6.5 or later and PHP 7.4 or later.',
  },
  {
    question: 'Are the FounderPostAI WordPress plugins free?',
    answer:
      'AI Suite Core is free on WordPress.org, and AI Suite SEO is a free direct download with no license checks. AI Suite SEO Pro costs $79 per year for one site. The Agency plan costs $199 per year for unlimited sites managed by the license holder.',
  },
  {
    question: 'What happens to WordPress content during AI processing?',
    answer:
      'Content is sent to the FounderPostAI gateway only when a user runs an action. Every content write saves a WordPress revision first, so applied changes can be rolled back. FounderPostAI does not use customer content to train AI models.',
  },
  {
    question: 'What happens if an AI Suite SEO Pro subscription ends?',
    answer:
      'Bulk runs, scheduling, and auto-apply stop at the end of the paid period. Previously applied metadata, links, and revisions remain ordinary WordPress content, and the free plugins continue to work.',
  },
] as const;

export function softwareApplicationStructuredData() {
  return AI_SUITE_PRODUCTS.map((product) => ({
    '@type': 'SoftwareApplication',
    '@id': `${SITE_URL}/#${product.id}`,
    name: product.name,
    alternateName: product.shortName,
    description: product.description,
    url: `${AI_SUITE_URL}#${product.id}`,
    ...(product.downloadPath
      ? { downloadUrl: absoluteUrl(product.downloadPath) }
      : {}),
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'WordPress SEO plugin',
    operatingSystem: AI_SUITE_REQUIREMENTS.wordpress,
    softwareRequirements: AI_SUITE_REQUIREMENTS.php,
    softwareVersion: product.version,
    image: absoluteUrl(SOCIAL_IMAGE_PATH),
    dateModified: SITE_LAST_MODIFIED_ISO,
    isAccessibleForFree: '0' === product.priceValue,
    license: 'https://www.gnu.org/licenses/old-licenses/gpl-2.0.html',
    featureList: product.features,
    brand: {
      '@type': 'Brand',
      name: 'FounderPostAI',
    },
    offers:
      product.id === 'ai-suite-seo-pro'
        ? [
            {
              '@type': 'Offer',
              name: 'SEO Pro annual license for one site',
              price: '79',
              priceCurrency: 'USD',
              availability: 'https://schema.org/InStock',
              url: `${SITE_URL}/#pricing`,
              seller: {
                '@id': `${SITE_URL}/#organization`,
              },
            },
            {
              '@type': 'Offer',
              name: 'Agency annual license for unlimited managed sites',
              price: '199',
              priceCurrency: 'USD',
              availability: 'https://schema.org/InStock',
              url: `${SITE_URL}/#pricing`,
              seller: {
                '@id': `${SITE_URL}/#organization`,
              },
            },
          ]
        : {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
            url: absoluteUrl(product.downloadPath || AI_SUITE_PATH),
            seller: {
              '@id': `${SITE_URL}/#organization`,
            },
          },
    publisher: {
      '@id': `${SITE_URL}/#organization`,
    },
  }));
}
