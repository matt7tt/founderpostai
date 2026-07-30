import { absoluteUrl, SITE_URL } from './site';

export const AI_SUITE_PATH = '/ai-suite';
export const AI_SUITE_URL = absoluteUrl(AI_SUITE_PATH);
export const AI_SUITE_TITLE =
  'AI Suite for WordPress: Product Facts | FounderPostAI';
export const AI_SUITE_DESCRIPTION =
  'Verified product facts for FounderPostAI AI Suite: WordPress requirements, current plugin versions, features, pricing, privacy, downloads, and FAQs.';

export const AI_SUITE_REQUIREMENTS = {
  wordpress: 'WordPress 6.5 or later',
  php: 'PHP 7.4 or later',
  license: 'GPL v2 or later',
  provider: 'Anthropic',
};

export const AI_SUITE_PRODUCTS = [
  {
    id: 'ai-suite-core',
    name: 'AI Suite Core',
    version: '0.1.2',
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
    ],
    downloadPath: '/downloads/aisuite-core.zip',
  },
  {
    id: 'ai-suite-seo',
    name: 'AI Suite SEO',
    version: '0.1.2',
    price: 'Free',
    priceValue: '0',
    audience: 'Sites that want reviewable SEO suggestions',
    description:
      'The free WordPress SEO module for titles, meta descriptions, reviewable suggestions, and block-aware internal links.',
    features: [
      'Per-post analysis and batches of ten',
      'Suggestion review queue',
      'Block-aware internal link insertion',
      'A WordPress revision before every write',
    ],
    downloadPath: '/downloads/aisuite-seo.zip',
  },
  {
    id: 'ai-suite-seo-pro',
    name: 'AI Suite SEO Pro',
    version: '1.0.1',
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

export const AI_SUITE_FAQS = [
  {
    question: 'What is FounderPostAI AI Suite?',
    answer:
      'FounderPostAI AI Suite is a three-plugin WordPress SEO system: AI Suite Core provides the shared runtime, AI Suite SEO provides free reviewable SEO suggestions, and AI Suite SEO Pro adds whole-site bulk runs, scheduling, and auto-apply.',
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
      'AI Suite Core and AI Suite SEO are free direct downloads with no license checks. AI Suite SEO Pro costs $79 per year for one site. The Agency plan costs $199 per year for unlimited sites managed by the license holder.',
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
    license: 'https://www.gnu.org/licenses/old-licenses/gpl-2.0.html',
    featureList: product.features,
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
            },
            {
              '@type': 'Offer',
              name: 'Agency annual license for unlimited managed sites',
              price: '199',
              priceCurrency: 'USD',
              availability: 'https://schema.org/InStock',
              url: `${SITE_URL}/#pricing`,
            },
          ]
        : {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
            url: absoluteUrl(product.downloadPath || AI_SUITE_PATH),
          },
    publisher: {
      '@id': `${SITE_URL}/#organization`,
    },
  }));
}
