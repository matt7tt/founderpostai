=== FounderPostAI – AI Suite SEO ===
Contributors: founderpostai
Tags: seo, meta description, internal links, ai, content
Requires at least: 6.5
Requires Plugins: founderpostai-ai-suite-core
Tested up to: 7.0
Requires PHP: 7.4
Stable tag: 0.1.6
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Reviewable AI SEO titles, meta descriptions, and validated internal links with revisions before content changes.

== Description ==

Most SEO plugins score your page and hand the work back to you. This one does the work and asks you to approve it.

Run an analysis on a post and AI Suite SEO returns:

* A search title written for the page you actually published
* A meta description in your brand's voice
* Internal links to real pages on your site, with the anchor text already chosen

Every suggestion lands in a review queue showing the current value beside the proposed one and a one-line reason. Nothing touches your content until you click Apply, and applying an internal-link change saves a revision first, so it is always reversible.

If Yoast, Rank Math, All in One SEO, or SEOPress is active, AI Suite SEO leaves tag rendering to that plugin and saves approved titles and descriptions directly into its native metadata fields.

What makes it different:

* Internal-link targets come from a closed list of real published posts on your site.
* Whole-site candidate retrieval ranks topical relevance before the AI selects a link, rather than considering only the newest posts.
* Suggested anchor text must occur verbatim in the source content before it can be applied.
* Link insertion is block- and DOM-aware and avoids headings, code, existing links, and shortcodes.
* Suggestions that became stale after analysis are rejected instead of overwriting newer edits.
* Every content write creates a WordPress revision first.
* All suggestions remain reviewable; there is no arbitrary PHP or JavaScript generation or execution.
* A site-wide SEO health dashboard tracks coverage, missing metadata, stale or failed analyses, orphaned content, link counts, and pending suggestions.

All functionality included in this plugin is available without a plugin license, feature key, trial period, or time limit. Manual 10-post batches are repeatable reliability chunks, not a total usage cutoff. Hosted AI service usage is described below.

== Installation ==

1. Install and activate FounderPostAI – AI Suite Core.
2. Connect Core to the FounderPostAI service from AI Suite > Connection.
3. Install and activate FounderPostAI – AI Suite SEO.
4. Open AI Suite > SEO or use "Optimize with AI Suite" from a post or page row.
5. Use Send feedback on the SEO screen for a bug report, improvement idea, or general feedback.

== External services ==

This plugin uses FounderPostAI – AI Suite Core to send content to the FounderPostAI AI Suite gateway. Running an analysis is an explicit administrator action.

The SEO screen also links to Core's feedback form with AI Suite SEO preselected. Feedback is sent only when an administrator explicitly submits that form. The form's exact data disclosure is documented in AI Suite Core and shown immediately before submission.

When an administrator runs an analysis, the post title, plain-text content, excerpt, permalink, existing meta values, saved brand context, and a list of published post titles and URLs used as internal-link candidates are sent. The gateway sends this input to the Anthropic API and returns structured SEO suggestions. Nothing is sent until an administrator runs an analysis.

FounderPostAI AI Suite gateway:

* Service: https://founderpostai.com/ai-suite
* Terms: https://founderpostai.com/terms
* Privacy: https://founderpostai.com/privacy

Anthropic API:

* Service: https://www.anthropic.com/api
* Commercial terms: https://www.anthropic.com/legal/commercial-terms
* Privacy: https://www.anthropic.com/legal/privacy

The plugin does not download or execute code from either service. The gateway returns structured data, and the plugin validates field types, lengths, link targets, and anchor text before storing a suggestion.

== Frequently Asked Questions ==

= Will it change my posts on its own? =

No. Every suggestion waits for approval.

= Does it work alongside Yoast? =

Yes. It detects Yoast, stops outputting duplicate tags, and writes approved titles and descriptions through Yoast's native metadata API. Rank Math, All in One SEO, and SEOPress have native adapters too.

= How many posts can I analyze? =

There is no plugin-level total. For reliability, each manual batch queues the next 10 posts that need analysis; you can run another batch for additional posts. Already-current posts and posts with an analysis in flight are skipped. Actual AI processing is subject to the managed allowance or Anthropic API usage associated with your chosen external-service billing mode.

= What if the suggested link text isn't in my post? =

Nothing is changed. Links are only inserted where the exact phrase appears as ordinary text — never inside headings, code, existing links, or shortcodes.

= Is any included functionality locked behind a paid license? =

No. Every feature and every line of functional code shipped in this plugin is available without a license check. A separately distributed add-on contains its own automation code for unattended whole-site runs, scheduling, and conservative auto-apply; it does not unlock dormant code in this plugin.

== Changelog ==

= 0.1.6 =
* Repeat manual batches now advance to the next posts that need analysis instead of re-analyzing the same recent posts.
* Analysis freshness now follows the submitted content and metadata, avoiding false stale warnings after an approved internal-link change.
* Edits made while an analysis job is running remain correctly flagged for re-analysis.

= 0.1.5 =
* Added native metadata adapters for Yoast SEO, Rank Math, All in One SEO, and SEOPress.
* Added a site-wide SEO health dashboard with actionable filters and internal-link counts.
* Internal-link candidates now come from relevance-ranked whole-site retrieval instead of the 60 most recently modified posts.
* Native metadata remains editable in the active SEO plugin while an AI Suite mirror preserves portability.

= 0.1.4 =
* Added direct Send feedback links on the SEO review screen and Plugins screen.
* The shared form preselects AI Suite SEO so bug reports and improvement ideas are easy to classify.

= 0.1.3 =
* Added distinctive FounderPostAI directory branding and WordPress.org-aligned dependency metadata.
* Added complete FounderPostAI and Anthropic service disclosures.
* Documented the plugin's closed-target link validation, revision safety, and non-trialware behavior.

= 0.1.2 =
* Per-post queue claims now prevent simultaneous requests from charging twice for one analysis.
* Added pagination so every suggestion remains reachable on large review queues.
* Approved metadata now integrates with Yoast, Rank Math, All in One SEO, and SEOPress without duplicate tags.
* Applying a stale suggestion no longer overwrites metadata edited after the analysis.
* Suggestion writes are failure-safe and model output is validated and length-limited before storage.

= 0.1.1 =
* Internal link targets are re-checked and their permalinks refreshed at apply time, so a stale suggestion can never insert a broken link.
* Fixed a rare text-corruption edge case when an anchor matched with different letter casing in non-Latin text.
* Suggestions identical to the current value are no longer queued.

= 0.1.0 =
* Initial release.
