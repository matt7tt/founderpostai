import type { ContentDates } from './content-dates';

export type SearchPageKind = 'feature' | 'integration' | 'guide' | 'comparison';

export interface SearchContentSection {
  title: string;
  body: string;
  bullets: string[];
}

export interface SearchContentStep {
  title: string;
  body: string;
}

export interface SearchContentFaq {
  question: string;
  answer: string;
}

export interface SearchContentComparison {
  caption: string;
  columns: string[];
  rows: string[][];
}

export interface SearchContentSource {
  label: string;
  href: string;
}

export interface SearchPage extends ContentDates {
  slug: string;
  path: string;
  kind: SearchPageKind;
  navLabel: string;
  title: string;
  description: string;
  eyebrow: string;
  h1: string;
  directAnswer: string;
  bestFor: string;
  worksWith: string;
  outcome: string;
  sections: SearchContentSection[];
  steps: SearchContentStep[];
  guardrails: string[];
  faqs: SearchContentFaq[];
  comparison?: SearchContentComparison;
  sources?: SearchContentSource[];
}

export const SEARCH_PAGES: SearchPage[] = [
  {
    slug: 'ai-meta-description-generator-wordpress',
    publishedAt: '2026-07-30',
    updatedAt: '2026-09-04',
    path: '/ai-meta-description-generator-wordpress',
    kind: 'feature',
    navLabel: 'AI meta descriptions',
    title: 'AI Meta Description Generator for WordPress | FounderPostAI',
    description:
      'Generate reviewable WordPress meta descriptions from the published page, saved brand context, and audience guidance—without silently replacing newer edits.',
    eyebrow: 'WordPress meta description workflow',
    h1: 'An AI meta description generator built for WordPress review workflows',
    directAnswer:
      'FounderPostAI analyzes the page already published in WordPress and proposes a concise search description for review. You see the current and suggested values together, then approve, reject, or revise the suggestion before it can affect the site.',
    bestFor: 'Editors improving missing, duplicated, or outdated search descriptions',
    worksWith: 'Yoast SEO, Rank Math, All in One SEO, SEOPress, or standalone WordPress',
    outcome: 'A reviewable description tied to the current version of the page',
    sections: [
      {
        title: 'Descriptions start with the page—not a blank prompt',
        body:
          'The analysis request includes the live title, body, excerpt, and the brand context saved for the site. That gives the suggestion a factual source and lets a reviewer compare it with what visitors will actually find after clicking.',
        bullets: [
          'Uses the current WordPress post or page as the source',
          'Can reflect audience, tone, and phrases the brand avoids',
          'Keeps the proposal separate from the live value until approval',
        ],
      },
      {
        title: 'Review the current and proposed snippets side by side',
        body:
          'A useful description is not just a character-count exercise. The review queue makes the editorial decision visible: keep the existing description, accept the proposal, or edit it manually in the normal WordPress workflow.',
        bullets: [
          'Shows existing and suggested metadata together',
          'Supports per-page work and free batches of ten',
          'Rejects stale suggestions if the live page changed after analysis',
        ],
      },
      {
        title: 'Keep one plugin responsible for frontend metadata',
        body:
          'When an established SEO plugin is active, AI Suite does not print a second competing set of tags. Approved values are saved into that plugin’s native metadata fields so it continues to own the page head and its normal editor remains accurate.',
        bullets: [
          'Avoids duplicate meta-description output',
          'Uses native metadata adapters for four common SEO plugins',
          'Can output its own metadata when no supported SEO plugin is active',
        ],
      },
    ],
    steps: [
      {
        title: 'Open a published post or page',
        body: 'Run AI Suite SEO from the content you want to improve.',
      },
      {
        title: 'Generate a structured suggestion',
        body: 'The current content and saved brand context are sent only when you start the action.',
      },
      {
        title: 'Review the proposed description',
        body: 'Compare it with the current value and make the editorial decision yourself.',
      },
      {
        title: 'Apply with a recoverable history',
        body: 'WordPress saves a revision before content changes, and stale results are not allowed to overwrite newer work.',
      },
    ],
    guardrails: [
      'No promise that a particular description will be selected as the Google snippet',
      'No full-page rewrite disguised as metadata optimization',
      'No second set of competing tags when a supported SEO plugin is active',
      'No automatic replacement of a newer manual edit with an older suggestion',
    ],
    faqs: [
      {
        question: 'Will Google always use the generated meta description?',
        answer:
          'No. Search engines can choose a different snippet based on the query. FounderPostAI helps you create a useful page-level description; it cannot control which snippet a search engine displays.',
      },
      {
        question: 'Can I use it with Yoast or Rank Math?',
        answer:
          'Yes. AI Suite saves approved values into the supported plugin’s native metadata fields and leaves frontend rendering to that plugin instead of printing duplicate metadata.',
      },
      {
        question: 'Does the free plugin generate descriptions in bulk?',
        answer:
          'The free SEO module supports individual pages and batches of ten. SEO Pro adds whole-site bulk runs and scheduling.',
      },
    ],
  },
  {
    slug: 'ai-seo-title-generator-wordpress',
    publishedAt: '2026-07-30',
    updatedAt: '2026-09-04',
    path: '/ai-seo-title-generator-wordpress',
    kind: 'feature',
    navLabel: 'AI SEO titles',
    title: 'AI SEO Title Generator for WordPress | FounderPostAI',
    description:
      'Generate reviewable WordPress SEO title suggestions from the live page and brand context, with stale-result protection and supported SEO plugin integrations.',
    eyebrow: 'WordPress search title workflow',
    h1: 'Generate WordPress SEO titles without handing over editorial control',
    directAnswer:
      'FounderPostAI proposes a search title from the page that is actually published, then places it beside the current title in a review queue. Nothing changes until a WordPress user approves it, and a result based on an older page version cannot overwrite newer work.',
    bestFor: 'Teams refreshing unclear, duplicated, or missing search titles',
    worksWith: 'Yoast SEO, Rank Math, All in One SEO, SEOPress, or standalone WordPress',
    outcome: 'A concise title suggestion that remains an editorial decision',
    sections: [
      {
        title: 'Use the live page as the source of truth',
        body:
          'The title suggestion is grounded in the current title, body, excerpt, and saved brand context. Reviewers can check whether the proposal accurately represents the page instead of evaluating an isolated AI prompt.',
        bullets: [
          'Reads the content already present in WordPress',
          'Includes saved tone, audience, and brand constraints',
          'Does not invent a new subject simply to chase a keyword',
        ],
      },
      {
        title: 'Separate analysis from publication',
        body:
          'Generation and application are distinct actions. The plugin stores a pending suggestion with the content state used to create it, allowing editors to accept, reject, or replace it in the normal workflow.',
        bullets: [
          'Current and proposed title appear side by side',
          'Pending suggestions can be reviewed later',
          'A content fingerprint prevents stale application',
        ],
      },
      {
        title: 'Integrate instead of fighting the SEO stack',
        body:
          'AI Suite detects four common SEO plugins and lets the active plugin keep control of title output. When none is active, it can use WordPress title filters directly.',
        bullets: [
          'Yoast SEO native metadata adapter',
          'Rank Math native metadata adapter',
          'All in One SEO and SEOPress native metadata adapters',
        ],
      },
    ],
    steps: [
      {
        title: 'Choose the page',
        body: 'Start with a published post or page whose search title needs attention.',
      },
      {
        title: 'Run the analysis',
        body: 'AI Suite sends a structured request based on the live page and saved brand rules.',
      },
      {
        title: 'Check accuracy and intent',
        body: 'Confirm that the proposed title describes the page and makes sense for its intended reader.',
      },
      {
        title: 'Approve or keep the original',
        body: 'Apply only when the suggestion is better; rejecting it leaves the current value untouched.',
      },
    ],
    guardrails: [
      'No automatic claim that a title will improve rankings',
      'No keyword-stuffed title template applied across every page',
      'No silent overwrite of an edit made after analysis',
      'No duplicate title output from competing SEO plugins',
    ],
    faqs: [
      {
        question: 'Does FounderPostAI change the WordPress post title?',
        answer:
          'It proposes a separate SEO title value. The visible post title remains under normal WordPress editorial control.',
      },
      {
        question: 'Can I edit a suggestion before using it?',
        answer:
          'Yes. Suggestions are review material, not mandatory output. You can retain the current value or make a manual edit.',
      },
      {
        question: 'What happens if the page changes while a title is pending?',
        answer:
          'The plugin detects that the suggestion was generated from an older content state and rejects it rather than overwriting newer work.',
      },
    ],
  },
  {
    slug: 'wordpress-internal-linking-plugin',
    publishedAt: '2026-07-30',
    updatedAt: '2026-09-04',
    path: '/wordpress-internal-linking-plugin',
    kind: 'feature',
    navLabel: 'Internal linking plugin',
    title: 'Safe WordPress Internal Linking Plugin | FounderPostAI',
    description:
      'See how FounderPostAI adds internal links in WordPress: a before-and-after example, setup steps, protected content, review, and undo. Start with the free SEO module.',
    eyebrow: 'Constrained WordPress internal links',
    h1: 'A WordPress internal linking plugin designed not to invent links',
    directAnswer:
      'FounderPostAI gives the model a closed list of real published destinations and accepts a suggestion only when the exact anchor phrase already exists as ordinary text in the source page. The inserter skips headings, code, shortcodes, and existing links.',
    bestFor: 'Editors who want contextual suggestions with conservative insertion rules',
    worksWith: 'Published WordPress posts and pages in the Block or Classic Editor',
    outcome: 'Reviewable source, destination, and anchor combinations that WordPress can validate',
    sections: [
      {
        title: 'Start with a closed candidate set',
        body:
          'The optimizer gathers real published posts and pages from the same WordPress site before asking for suggestions. The model chooses from those candidates rather than generating a destination URL from memory.',
        bullets: [
          'Candidate IDs and permalinks come from WordPress',
          'Draft, private, and invented destinations are not offered',
          'The current page is excluded from its own candidate list',
        ],
      },
      {
        title: 'Require anchor text that already exists',
        body:
          'A recommendation must identify an exact phrase already present in the source content. That constraint avoids dropping unnatural invented copy into an otherwise finished paragraph merely to create a link.',
        bullets: [
          'Exact source phrase is checked before insertion',
          'Existing links are not nested or replaced',
          'The destination is revalidated when the suggestion is applied',
        ],
      },
      {
        title: 'Insert through WordPress-aware safeguards',
        body:
          'In the Block Editor, insertion is limited to paragraph and list-item blocks, including eligible blocks nested inside groups or columns. In Classic Editor content, the inserter walks ordinary HTML text nodes. It leaves unsupported blocks and protected markup alone.',
        bullets: [
          'Skips headings, code, preformatted text, and shortcodes',
          'Avoids block comments and existing anchor elements',
          'Saves a WordPress revision before changing content',
        ],
      },
    ],
    steps: [
      {
        title: 'Install Core, connect, and add SEO',
        body: 'Install FounderPostAI – AI Suite Core from WordPress.org, connect it under AI Suite → Connection, then upload and activate the free SEO module. Choose a published source post and make sure the destination is also published on the same site.',
      },
      {
        title: 'Analyze one representative post',
        body: 'Choose “Optimize with AI Suite” from a post or page row, then open AI Suite → SEO to review the result. Check the destination, exact anchor phrase, and the suggested reason. A valid URL is not enough: the destination should genuinely expand on the source paragraph.',
      },
      {
        title: 'Apply, then inspect the live paragraph',
        body: 'Approve the link suggestion only after review. The plugin rechecks the source and destination, saves a revision, and inserts an ordinary link. Open the published page and follow it to confirm the wording, destination, and layout are right.',
      },
      {
        title: 'Keep or undo before scaling up',
        body: 'Use “Undo this change” on an applied suggestion if needed. Undo is blocked when newer edits would be overwritten; inspect WordPress revisions in that case. Once the sample is useful, repeat with the free ten-post analysis batches. Pro adds unattended scheduling and optional auto-apply.',
      },
    ],
    guardrails: [
      'No model-generated destination URLs',
      'No invented anchor copy',
      'No insertion inside headings, code, shortcodes, or existing links',
      'No change without a WordPress revision first',
    ],
    faqs: [
      {
        question: 'Will internal links remain if I deactivate the plugin?',
        answer:
          'Yes. Applied links are ordinary WordPress content. Deactivating AI Suite does not turn them into broken shortcodes or remove them.',
      },
      {
        question: 'Does it automatically add every suggestion?',
        answer:
          'The free workflow requires review. SEO Pro offers conservative auto-apply settings, but those settings are optional and still use the same validation rules.',
      },
      {
        question: 'Does it find broken links or orphan pages?',
        answer:
          'The SEO health dashboard includes local link counts and orphaned-content indicators. It is not a substitute for a dedicated broken-link crawler or the full reporting toolset of a specialist link-audit product.',
      },
      {
        question: 'Why did the plugin leave my paragraph unchanged?',
        answer:
          'The anchor may be absent, split across HTML elements, already linked, or inside a protected block. The source may also have changed since analysis, or the destination may no longer be published. Check the review message and analyze the current post again; do not remove safeguards just to force a link.',
      },
      {
        question: 'How much does the internal-linking workflow cost?',
        answer:
          'Core and the SEO module are free plugins, including manual review and repeatable ten-post analysis batches. AI processing uses the managed allowance or your configured Anthropic API billing; free plugin code does not mean unlimited free inference. The separately distributed Pro add-on contains unattended automation.',
      },
      {
        question: 'Will it link every occurrence of a phrase?',
        answer:
          'No. Each suggested link is inserted at most once, at its first eligible text occurrence. Matching preserves the original casing and rejects partial-word matches. Review placement for reader usefulness rather than aiming for a particular link count.',
      },
    ],
  },
  {
    slug: 'yoast-ai-seo-automation',
    publishedAt: '2026-07-30',
    updatedAt: '2026-09-04',
    path: '/yoast-ai-seo-automation',
    kind: 'integration',
    navLabel: 'FounderPostAI with Yoast',
    title: 'AI SEO Automation for Yoast SEO | FounderPostAI',
    description:
      'Use reviewable AI title and meta-description suggestions alongside Yoast SEO while Yoast remains responsible for frontend metadata and canonical output.',
    eyebrow: 'FounderPostAI + Yoast SEO',
    h1: 'Add review-first AI SEO automation alongside Yoast SEO',
    directAnswer:
      'FounderPostAI can analyze WordPress content and save approved titles and descriptions into Yoast’s native metadata fields. Yoast remains the active SEO plugin, so AI Suite does not print a competing canonical tag or duplicate metadata block.',
    bestFor: 'Yoast users who want a separate AI review queue and constrained internal links',
    worksWith: 'Yoast SEO on singular WordPress posts and pages',
    outcome: 'AI-assisted metadata while Yoast keeps ownership of frontend SEO output',
    sections: [
      {
        title: 'Keep Yoast in charge of the page head',
        body:
          'Running two SEO plugins can create duplicate tags when both try to own frontend output. AI Suite detects Yoast and stays quiet in its own head-output path, saving approved values through its native metadata adapter instead.',
        bullets: [
          'Updates Yoast’s native title and meta-description fields',
          'Does not print a competing canonical URL',
          'Leaves Yoast’s other SEO features and schema behavior in place',
        ],
      },
      {
        title: 'Add a review queue around AI suggestions',
        body:
          'FounderPostAI separates generation from application. Editors can compare the current value with a suggestion based on the live page and saved brand context before approving anything.',
        bullets: [
          'Per-post analysis or free batches of ten',
          'Current and proposed values remain visible',
          'Stale suggestions cannot replace newer edits',
        ],
      },
      {
        title: 'Use internal-link safeguards independently of metadata output',
        body:
          'The internal-link workflow operates on WordPress content and real published destinations. It does not require replacing Yoast or changing how Yoast handles the page head.',
        bullets: [
          'Closed list of published destinations',
          'Exact anchor phrase must already exist',
          'Revision saved before content insertion',
        ],
      },
    ],
    steps: [
      {
        title: 'Leave Yoast active',
        body: 'There is no migration step and no need to disable Yoast SEO.',
      },
      {
        title: 'Install AI Suite Core and SEO',
        body: 'Core provides the connection and job runtime; SEO provides the review workflow.',
      },
      {
        title: 'Generate and review',
        body: 'Analyze a post, compare values, and approve only the suggestions that improve the page.',
      },
      {
        title: 'Let Yoast render the result',
        body: 'Approved values are saved into Yoast’s native metadata fields, keeping its editor and frontend output aligned.',
      },
    ],
    guardrails: [
      'No automatic migration of the entire Yoast configuration',
      'No duplicate canonical or Open Graph ownership',
      'No claim that AI Suite replaces Yoast’s full SEO feature set',
      'No stale suggestion overwriting a newer editorial value',
    ],
    faqs: [
      {
        question: 'Do I need to remove Yoast SEO?',
        answer:
          'No. The integration is specifically designed to work while Yoast remains active and responsible for frontend SEO output.',
      },
      {
        question: 'Does FounderPostAI replace every Yoast feature?',
        answer:
          'No. FounderPostAI focuses on reviewable titles, descriptions, internal links, and optional bulk automation. Yoast continues to provide its broader SEO feature set.',
      },
      {
        question: 'Will the two plugins output duplicate meta tags?',
        answer:
          'AI Suite detects Yoast and does not use its standalone head-output path. Approved values are saved into Yoast’s native metadata fields.',
      },
    ],
  },
  {
    slug: 'rank-math-ai-seo-automation',
    publishedAt: '2026-07-30',
    updatedAt: '2026-09-04',
    path: '/rank-math-ai-seo-automation',
    kind: 'integration',
    navLabel: 'FounderPostAI with Rank Math',
    title: 'AI SEO Automation for Rank Math | FounderPostAI',
    description:
      'Add reviewable AI titles, meta descriptions, and safe internal links while Rank Math continues to own frontend SEO metadata and canonical output.',
    eyebrow: 'FounderPostAI + Rank Math',
    h1: 'Use safe AI SEO automation alongside Rank Math',
    directAnswer:
      'FounderPostAI saves approved title and description values into Rank Math’s native metadata fields and suppresses its own standalone head output while Rank Math is active. That adds an AI review workflow without creating a second SEO stack.',
    bestFor: 'Rank Math sites that need editorial review, revisions, and bulk AI workflows',
    worksWith: 'Rank Math on singular WordPress posts and pages',
    outcome: 'Reviewable AI suggestions rendered through the existing Rank Math output path',
    sections: [
      {
        title: 'Avoid two plugins competing for metadata',
        body:
          'AI Suite checks whether Rank Math is active before deciding how to output approved metadata. Rank Math continues to control the document head and the rest of its SEO configuration.',
        bullets: [
          'Updates Rank Math’s native title and description fields',
          'Does not add a second canonical tag',
          'Leaves Rank Math schema and sitemap settings untouched',
        ],
      },
      {
        title: 'Review AI output against the live page',
        body:
          'The suggestion is created from the current WordPress content and saved brand rules. Editors can inspect the current and proposed values together rather than accepting a black-box rewrite.',
        bullets: [
          'Suggestions remain pending until reviewed',
          'Each result is tied to the analyzed content state',
          'Manual edits made later take precedence',
        ],
      },
      {
        title: 'Add internal links without changing Rank Math',
        body:
          'Internal-link proposals use published WordPress destinations and exact source text. The workflow is independent from Rank Math’s frontend output and can be reviewed on its own merits.',
        bullets: [
          'Real on-site destinations only',
          'No invented anchor text',
          'Revision-first content changes',
        ],
      },
    ],
    steps: [
      {
        title: 'Keep the existing Rank Math configuration',
        body: 'AI Suite does not require an SEO-plugin migration.',
      },
      {
        title: 'Connect AI Suite',
        body: 'Install Core, connect the site, then activate the free SEO module.',
      },
      {
        title: 'Review suggestions',
        body: 'Approve titles, descriptions, and links selectively from the queue.',
      },
      {
        title: 'Render through Rank Math',
        body: 'Approved metadata is saved in Rank Math’s native fields so its editor and frontend output stay aligned.',
      },
    ],
    guardrails: [
      'No duplicate metadata block from AI Suite',
      'No replacement of Rank Math’s sitemap, schema, or redirect tools',
      'No unattended edit unless the site owner enables a Pro automation rule',
      'No older pending suggestion replacing newer content',
    ],
    faqs: [
      {
        question: 'Can Rank Math stay active?',
        answer:
          'Yes. The integration assumes Rank Math remains active and lets it continue to own frontend SEO output.',
      },
      {
        question: 'Does this use Rank Math Content AI?',
        answer:
          'No. FounderPostAI is a separate review and automation workflow. It integrates with Rank Math’s native metadata fields.',
      },
      {
        question: 'Will it change Rank Math schema settings?',
        answer:
          'No. AI Suite’s integration is limited to approved title and description values; it does not rewrite Rank Math’s broader configuration.',
      },
    ],
  },
  {
    slug: 'aioseo-ai-seo-automation',
    publishedAt: '2026-07-30',
    updatedAt: '2026-09-04',
    path: '/aioseo-ai-seo-automation',
    kind: 'integration',
    navLabel: 'FounderPostAI with AIOSEO',
    title: 'AI SEO Automation for All in One SEO | FounderPostAI',
    description:
      'Use reviewable AI SEO suggestions with All in One SEO while AIOSEO continues to control frontend title, description, canonical, and broader SEO output.',
    eyebrow: 'FounderPostAI + All in One SEO',
    h1: 'Add a review-first AI workflow to All in One SEO',
    directAnswer:
      'When All in One SEO is active, FounderPostAI saves approved title and description values into AIOSEO’s native post model and avoids printing its own competing tags. Editors gain a structured AI review queue without replacing the existing SEO plugin.',
    bestFor: 'AIOSEO users who want grounded suggestions and recoverable content changes',
    worksWith: 'All in One SEO on singular WordPress posts and pages',
    outcome: 'AI-assisted titles and descriptions delivered through AIOSEO’s output path',
    sections: [
      {
        title: 'Preserve the existing All in One SEO setup',
        body:
          'FounderPostAI is not positioned as a migration away from AIOSEO. It detects the active plugin and limits its integration to the approved title and description values.',
        bullets: [
          'Updates AIOSEO’s native post model',
          'Avoids a duplicate canonical or metadata block',
          'Does not change AIOSEO sitemaps, schema, or redirects',
        ],
      },
      {
        title: 'Ground proposals in the current WordPress page',
        body:
          'AI Suite analyzes the page that exists now, together with saved brand context. That creates a specific proposal a human can verify instead of a generic SEO template.',
        bullets: [
          'Live title, body, and excerpt inform the request',
          'Brand tone and prohibited phrases can be included',
          'Current and suggested values remain visible together',
        ],
      },
      {
        title: 'Keep content changes recoverable',
        body:
          'Internal links are separately validated against published destinations and exact source phrases. A WordPress revision is saved before the inserter changes the post.',
        bullets: [
          'Closed target list',
          'Block- and DOM-aware insertion',
          'Stale-result protection',
        ],
      },
    ],
    steps: [
      {
        title: 'Keep All in One SEO active',
        body: 'No migration or configuration reset is required.',
      },
      {
        title: 'Install the two free AI Suite plugins',
        body: 'Activate Core before the SEO module, then connect the WordPress site.',
      },
      {
        title: 'Generate review material',
        body: 'Run an individual analysis or a batch and inspect each proposed change.',
      },
      {
        title: 'Approve through the existing stack',
        body: 'AIOSEO remains responsible for rendering the approved frontend metadata.',
      },
    ],
    guardrails: [
      'No claim to replace AIOSEO’s complete toolset',
      'No duplicate frontend metadata ownership',
      'No automatic edits hidden from the review workflow',
      'No application of a suggestion based on outdated content',
    ],
    faqs: [
      {
        question: 'Is FounderPostAI a replacement for All in One SEO?',
        answer:
          'No. It adds a focused AI suggestion, review, and automation layer while AIOSEO keeps its broader responsibilities.',
      },
      {
        question: 'Does it create duplicate meta descriptions?',
        answer:
          'AI Suite detects AIOSEO and saves the approved description into its native post model instead of printing a second description tag.',
      },
      {
        question: 'Can the free plugin process more than one page?',
        answer:
          'Yes. The free workflow supports batches of ten. Whole-site runs and scheduling are part of SEO Pro.',
      },
    ],
  },
  {
    slug: 'safe-ai-internal-linking-wordpress',
    publishedAt: '2026-07-30',
    updatedAt: '2026-07-30',
    path: '/guides/safe-ai-internal-linking-wordpress',
    kind: 'guide',
    navLabel: 'Safe internal linking guide',
    title: 'Safe AI Internal Linking in WordPress: A Practical Guide',
    description:
      'A practical framework for reviewing AI internal-link suggestions in WordPress: valid targets, existing anchors, protected content regions, and revisions.',
    eyebrow: 'Practical WordPress SEO guide',
    h1: 'How to use AI for internal linking without damaging WordPress content',
    directAnswer:
      'Safe AI internal linking requires four checks: the destination must be a real published URL, the anchor must already make sense in the source sentence, protected markup must be skipped, and every write must be recoverable. Relevance alone is not enough.',
    bestFor: 'WordPress editors evaluating manual or automated link suggestions',
    worksWith: 'Block Editor and Classic Editor content',
    outcome: 'A repeatable acceptance checklist for internal links',
    sections: [
      {
        title: 'Validate the destination before debating relevance',
        body:
          'A plausible-looking URL can still be invented, redirected, private, or unpublished. Build the candidate set from the current WordPress database and confirm the target again when applying the change.',
        bullets: [
          'Use published posts and pages from the same site',
          'Exclude the source page from its own candidate set',
          'Recheck post status and permalink at application time',
        ],
      },
      {
        title: 'Treat the sentence as editorial content',
        body:
          'The best target does not justify awkward anchor copy. Prefer a phrase that already occurs naturally in the sentence and accurately prepares the reader for the destination.',
        bullets: [
          'Use exact source text instead of model-invented wording',
          'Reject anchors that overpromise the destination',
          'Do not link every repeated occurrence of the same phrase',
        ],
      },
      {
        title: 'Protect WordPress structure and recovery',
        body:
          'A plain text replacement can corrupt markup, nest links, or modify a shortcode. Parse the content, skip structural regions, and save a revision before the write.',
        bullets: [
          'Avoid headings, code, preformatted blocks, and shortcodes',
          'Never insert inside an existing anchor element',
          'Keep a WordPress revision for rollback and review',
        ],
      },
    ],
    steps: [
      {
        title: 'Create a closed destination list',
        body: 'Collect real published pages that are eligible to receive an internal link.',
      },
      {
        title: 'Ask for a source phrase and destination',
        body: 'A suggestion should identify both parts explicitly, not just say two pages are related.',
      },
      {
        title: 'Apply an editorial test',
        body: 'Read the sentence and destination together. Reject the link if it does not help a visitor.',
      },
      {
        title: 'Apply through a structure-aware inserter',
        body: 'Revalidate the content state, skip protected regions, save a revision, and then write.',
      },
    ],
    guardrails: [
      'Do not let a model fabricate URLs from page titles',
      'Do not rewrite a sentence solely to force an anchor',
      'Do not insert links with a blind string replacement',
      'Do not automate before reviewing a representative sample',
    ],
    faqs: [
      {
        question: 'How many internal links should a WordPress post have?',
        answer:
          'There is no universal number. Add links when they help a reader reach a relevant next page, and avoid treating a quota as a substitute for editorial judgment.',
      },
      {
        question: 'Should AI create new anchor text?',
        answer:
          'A conservative workflow can require the anchor phrase to exist already. This avoids silently rewriting finished copy just to manufacture a link.',
      },
      {
        question: 'Can safe suggestions be auto-applied?',
        answer:
          'They can be after the site owner has reviewed enough examples and enabled narrow rules. The destination, anchor, content state, and protected regions should still be validated every time.',
      },
    ],
  },
  {
    slug: 'bulk-update-wordpress-seo-metadata',
    publishedAt: '2026-07-30',
    updatedAt: '2026-07-30',
    path: '/guides/bulk-update-wordpress-seo-metadata',
    kind: 'guide',
    navLabel: 'Bulk metadata guide',
    title: 'How to Bulk Update WordPress SEO Metadata Safely',
    description:
      'Plan a safe bulk update of WordPress SEO titles and meta descriptions with batching, review samples, stale-result protection, scheduling, and rollback.',
    eyebrow: 'Practical WordPress SEO guide',
    h1: 'How to bulk update WordPress SEO metadata without losing control',
    directAnswer:
      'A safe bulk workflow separates analysis from application. Inventory the pages, process bounded batches, review a representative sample, protect newer manual edits, and make every applied change traceable or recoverable.',
    bestFor: 'Sites with a backlog of missing or outdated titles and descriptions',
    worksWith: 'Published WordPress posts and pages using supported SEO plugin output',
    outcome: 'A controlled metadata backlog instead of a one-click sitewide rewrite',
    sections: [
      {
        title: 'Define the backlog before generating anything',
        body:
          'Start with a measurable group: pages missing descriptions, titles that duplicate the post title without context, or content changed since metadata was last reviewed. Avoid reprocessing the whole site merely because a button exists.',
        bullets: [
          'Prioritize indexed and revenue-relevant pages',
          'Exclude pages already reviewed recently',
          'Record the current value and content state',
        ],
      },
      {
        title: 'Use batches to test quality and operating cost',
        body:
          'A small batch exposes weak brand instructions, unusual post types, and integration issues before they spread. The free AI Suite SEO workflow processes batches of ten; Pro continues through the broader backlog.',
        bullets: [
          'Review the first ten suggestions individually',
          'Adjust brand context when the same problem repeats',
          'Estimate acceptance rate before scheduling more work',
        ],
      },
      {
        title: 'Make automation conservative by default',
        body:
          'The safest auto-apply case is an empty field on unchanged content. Existing editorial metadata should require a higher bar, and an older queued suggestion should never replace a newer manual value.',
        bullets: [
          'Tie every suggestion to the analyzed content state',
          'Auto-apply only explicitly enabled suggestion types',
          'Keep scheduled work bounded and observable',
        ],
      },
    ],
    steps: [
      {
        title: 'Inventory and prioritize',
        body: 'Choose a defined set of pages with a clear metadata problem.',
      },
      {
        title: 'Run a representative batch',
        body: 'Include different authors, templates, content lengths, and existing SEO states.',
      },
      {
        title: 'Review acceptance and failure patterns',
        body: 'Measure how many suggestions are accepted, edited, rejected, or invalidated as stale.',
      },
      {
        title: 'Scale with scheduled, recoverable work',
        body: 'Expand only after the rules are trustworthy and continue monitoring changed content.',
      },
    ],
    guardrails: [
      'Do not overwrite strong existing metadata just to make it different',
      'Do not apply results generated from an older version of the page',
      'Do not launch a sitewide run before testing a representative batch',
      'Do not treat generated metadata as a ranking guarantee',
    ],
    faqs: [
      {
        question: 'How large is a free FounderPostAI batch?',
        answer:
          'The free AI Suite SEO module can process batches of ten. SEO Pro adds whole-site bulk runs and scheduled re-analysis.',
      },
      {
        question: 'What is the safest metadata field to auto-apply?',
        answer:
          'An empty field on content that has not changed since analysis is generally safer than replacing an existing manually edited value. Site owners should still review representative results first.',
      },
      {
        question: 'Can a bulk run overwrite a newer manual edit?',
        answer:
          'AI Suite stores the analyzed content state and rejects stale pending suggestions. Pro’s auto-apply logic also avoids applying an older result over newer metadata.',
      },
    ],
  },
  {
    slug: 'founderpostai-vs-link-whisper',
    publishedAt: '2026-07-30',
    updatedAt: '2026-07-30',
    path: '/compare/founderpostai-vs-link-whisper',
    kind: 'comparison',
    navLabel: 'FounderPostAI vs Link Whisper',
    title: 'FounderPostAI vs Link Whisper: WordPress Link Workflows',
    description:
      'Compare FounderPostAI and Link Whisper by scope, suggestion workflow, destination and anchor safeguards, reporting, metadata support, and automation.',
    eyebrow: 'WordPress plugin comparison',
    h1: 'FounderPostAI vs Link Whisper: which workflow fits your site?',
    directAnswer:
      'Choose Link Whisper when dedicated internal-link reporting, orphan-page discovery, and link-management breadth are the priority. Choose FounderPostAI when you want one review queue for SEO titles, meta descriptions, and deliberately constrained internal-link insertion with revisions.',
    bestFor: 'Teams choosing between a dedicated link tool and a broader review-first SEO workflow',
    worksWith: 'Self-hosted WordPress sites',
    outcome: 'A scope-based decision instead of a claim that one product is universally better',
    sections: [
      {
        title: 'The products solve overlapping but different problems',
        body:
          'Link Whisper is centered on internal-link discovery, reporting, and management. FounderPostAI combines constrained internal links with reviewable titles and meta descriptions, then adds whole-site SEO automation in Pro.',
        bullets: [
          'Link Whisper emphasizes link reports and orphan content',
          'FounderPostAI includes metadata suggestions in the same queue',
          'Both let users review suggestions rather than surrender all control',
        ],
      },
      {
        title: 'The link-suggestion safeguards differ',
        body:
          'FounderPostAI’s defining constraint is mechanical validation: destinations come from a closed WordPress candidate list and the exact anchor phrase must already exist in the source. Link Whisper emphasizes semantic suggestions and a broader link-management toolset.',
        bullets: [
          'FounderPostAI revalidates destination and anchor during application',
          'Link Whisper offers link health and orphan-page reporting',
          'Evaluate suggestion relevance with your own content before choosing',
        ],
      },
      {
        title: 'Test the workflow, not just the feature checklist',
        body:
          'Install the free versions on a staging site or a small content sample. Compare relevance, rejection rate, the clarity of review, and whether the product addresses the larger SEO tasks your team actually performs.',
        bullets: [
          'Use the same ten source pages for both tests',
          'Record accepted, edited, and rejected suggestions',
          'Check content recovery and what remains after deactivation',
        ],
      },
    ],
    steps: [
      {
        title: 'Write down the primary job',
        body: 'Decide whether you need dedicated link reporting or a mixed metadata-and-link review workflow.',
      },
      {
        title: 'Run the same content sample',
        body: 'Compare both products on pages representative of the actual site.',
      },
      {
        title: 'Score editorial usefulness',
        body: 'Measure relevance, correction time, rejected suggestions, and confidence in application.',
      },
      {
        title: 'Check the complete operating model',
        body: 'Review processing, pricing, support, automation, and required integrations before committing.',
      },
    ],
    guardrails: [
      'This comparison does not claim that either plugin guarantees ranking gains',
      'Link Whisper features can change; verify its current official listing',
      'FounderPostAI does not claim Link Whisper’s full reporting feature set',
      'Test both products with your content and backup practices',
    ],
    comparison: {
      caption: 'FounderPostAI and Link Whisper workflow comparison',
      columns: ['Area', 'FounderPostAI AI Suite', 'Link Whisper'],
      rows: [
        ['Primary scope', 'SEO titles, descriptions, and constrained internal links', 'Internal-link suggestions, reports, and management'],
        ['Free workflow', 'Per-post work and batches of ten', 'Editor suggestions and link-health reporting'],
        ['Destination rule', 'Closed list of published WordPress pages', 'Semantic and keyword-based link suggestions'],
        ['Anchor rule', 'Exact phrase must already exist in source content', 'Suggestion workflow with editable anchor text'],
        ['Recovery', 'WordPress revision before content write', 'Applied links remain normal WordPress links'],
        ['Metadata suggestions', 'Included', 'Not the product’s primary scope'],
        ['Dedicated link reports', 'Not currently the primary feature', 'Orphan and link-distribution reporting'],
      ],
    },
    sources: [
      {
        label: 'Link Whisper’s current WordPress.org listing',
        href: 'https://wordpress.org/plugins/link-whisper/',
      },
    ],
    faqs: [
      {
        question: 'Is FounderPostAI a complete replacement for Link Whisper?',
        answer:
          'Not for every use case. Sites that rely on Link Whisper’s dedicated orphan-page, broken-link, or link-management reports should evaluate those separately.',
      },
      {
        question: 'Which plugin also generates SEO metadata?',
        answer:
          'FounderPostAI includes reviewable SEO title and meta-description suggestions. Link Whisper’s official listing is primarily focused on internal links.',
      },
      {
        question: 'Can I test both for free?',
        answer:
          'Both products offer free WordPress plugins. Use a staging site or a controlled sample and verify current terms on each product’s official source.',
      },
    ],
  },
  {
    slug: 'ai-seo-plugins-wordpress',
    publishedAt: '2026-07-30',
    updatedAt: '2026-07-30',
    path: '/compare/ai-seo-plugins-wordpress',
    kind: 'comparison',
    navLabel: 'AI SEO plugin checklist',
    title: 'AI SEO Plugins for WordPress: A Practical Comparison Guide',
    description:
      'Compare WordPress AI SEO plugin categories by scope, editorial control, metadata ownership, internal-link safeguards, processing, recovery, and automation.',
    eyebrow: 'WordPress plugin selection guide',
    h1: 'How to compare AI SEO plugins for WordPress',
    directAnswer:
      'Start with the job you need done. Broad SEO suites manage many technical settings, link tools specialize in site structure, writing tools produce copy, and review-first automation focuses on controlled changes. Compare ownership, recovery, and failure behavior—not just the number of AI features.',
    bestFor: 'WordPress owners deciding which type of AI SEO product belongs in their stack',
    worksWith: 'Sites evaluating a new plugin or adding AI to an existing SEO plugin',
    outcome: 'A practical evaluation checklist based on workflow and risk',
    sections: [
      {
        title: 'Separate broad SEO ownership from AI assistance',
        body:
          'A broad SEO suite may own canonicals, schema, sitemaps, redirects, and metadata. An AI assistant can work alongside it, but two plugins should not print competing versions of the same frontend tags.',
        bullets: [
          'Identify which plugin owns the page head',
          'Check how approved AI values reach that output path',
          'Avoid duplicate canonical, title, description, or schema output',
        ],
      },
      {
        title: 'Ask what happens when the AI is wrong',
        body:
          'Every AI tool will produce suggestions you should reject. A serious evaluation includes the rejection path, stale-result handling, content recovery, and whether generated destinations or code can reach the live site.',
        bullets: [
          'Look for a visible review state',
          'Require revisions or another rollback mechanism',
          'Check whether newer manual edits take priority',
        ],
      },
      {
        title: 'Compare processing and automation honestly',
        body:
          'Managed inference is simpler; bring-your-own-key can provide usage control. Bulk automation saves time only after the instructions and acceptance rules have been tested on representative content.',
        bullets: [
          'Understand what content leaves WordPress and when',
          'Test a small batch before a sitewide run',
          'Confirm what stops working if a subscription ends',
        ],
      },
    ],
    steps: [
      {
        title: 'Define the missing capability',
        body: 'Metadata, internal links, audits, full copy, or broad technical SEO are different jobs.',
      },
      {
        title: 'Map ownership and compatibility',
        body: 'Know which plugin controls each frontend signal and database value.',
      },
      {
        title: 'Test failure and recovery',
        body: 'Reject a suggestion, edit a page after analysis, deactivate the plugin, and restore a change.',
      },
      {
        title: 'Measure useful acceptance',
        body: 'Track how much reviewer time the tool actually saves on real pages.',
      },
    ],
    guardrails: [
      'Do not select a plugin solely because it claims the most AI features',
      'Do not allow two tools to own the same frontend metadata',
      'Do not automate generated links or copy before reviewing samples',
      'Do not assume a plugin can guarantee traffic or rankings',
    ],
    comparison: {
      caption: 'Common WordPress AI SEO plugin categories',
      columns: ['Category', 'Usually strongest at', 'Important question'],
      rows: [
        ['Broad SEO suite', 'Canonicals, schema, sitemaps, redirects, and general SEO settings', 'Does its AI workflow provide enough review and recovery?'],
        ['Internal-link specialist', 'Link discovery, orphan-page reports, and link management', 'How are destinations, anchors, and insertions validated?'],
        ['AI writing tool', 'Drafting or rewriting larger passages', 'Can generated copy reach the live site without editorial approval?'],
        ['Review-first automation', 'Structured suggestions, approval queues, and bounded bulk work', 'Does it cover the SEO jobs the team actually needs?'],
      ],
    },
    faqs: [
      {
        question: 'Should an AI SEO plugin replace my existing SEO plugin?',
        answer:
          'Not necessarily. A focused assistant can work alongside the plugin that already controls canonicals, schema, and sitemaps, provided their output responsibilities are clear.',
      },
      {
        question: 'What is the most important safety feature?',
        answer:
          'There is no single feature, but visible review, stale-result protection, validated destinations, and recoverable writes together create a much safer workflow.',
      },
      {
        question: 'Will installing an AI SEO plugin increase traffic?',
        answer:
          'A plugin can make useful SEO work faster; it cannot guarantee indexing, rankings, links, or demand. Content quality, site authority, technical health, and distribution still matter.',
      },
    ],
  },
];

export const TOP_LEVEL_SEARCH_PAGES = SEARCH_PAGES.filter(
  (page) => page.kind === 'feature' || page.kind === 'integration'
);

export const GUIDE_SEARCH_PAGES = SEARCH_PAGES.filter((page) => page.kind === 'guide');

export const COMPARISON_SEARCH_PAGES = SEARCH_PAGES.filter(
  (page) => page.kind === 'comparison'
);

export function findSearchPage(path: string): SearchPage | undefined {
  return SEARCH_PAGES.find((page) => page.path === path);
}

export function relatedSearchPages(page: SearchPage, limit = 3): SearchPage[] {
  const sameKind = SEARCH_PAGES.filter(
    (candidate) => candidate.path !== page.path && candidate.kind === page.kind
  );
  const otherKinds = SEARCH_PAGES.filter(
    (candidate) => candidate.path !== page.path && candidate.kind !== page.kind
  );

  return [...sameKind, ...otherKinds].slice(0, limit);
}
