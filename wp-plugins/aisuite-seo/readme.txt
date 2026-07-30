=== AI Suite SEO ===
Contributors: founderpostai
Tags: seo, meta description, internal links, ai, content
Requires at least: 6.5
Requires Plugins: aisuite-core
Tested up to: 7.0
Requires PHP: 7.4
Stable tag: 0.1.2
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Writes your search titles, meta descriptions, and internal links, then shows you each change before it goes live.

== Description ==

Most SEO plugins score your page and hand the work back to you. This one does the work and asks you to approve it.

Run an analysis on a post and AI Suite SEO returns:

* A search title written for the page you actually published
* A meta description in your brand's voice
* Internal links to real pages on your site, with the anchor text already chosen

Every suggestion lands in a review queue showing the current value beside the proposed one and a one-line reason. Nothing touches your content until you click Apply, and applying an internal-link change saves a revision first, so it is always reversible.

If Yoast, Rank Math, All in One SEO, or SEOPress is active, AI Suite SEO leaves tag rendering to that plugin and passes approved titles and descriptions through its public integration filters.

== External services ==

This plugin uses AI Suite Core to send content to the AI Suite gateway for processing. When you run an analysis, the post's title, plain-text content, excerpt, permalink, existing meta values, and a list of your published post titles and URLs (used as internal link candidates) are sent. Nothing is sent until you run an analysis.

Service: AI Suite gateway (https://founderpostai.com)
Terms of service: https://founderpostai.com/terms
Privacy policy: https://founderpostai.com/privacy

== Frequently Asked Questions ==

= Will it change my posts on its own? =

No. Every suggestion waits for approval.

= Does it work alongside Yoast? =

Yes. It detects Yoast, stops outputting duplicate tags, and passes approved titles and descriptions to Yoast through its documented filters.

= How many posts can I analyze? =

As many as your monthly action allowance covers, or without limit if you are using your own provider key. Batch runs from this screen are capped at 10 posts at a time.

= What if the suggested link text isn't in my post? =

Nothing is changed. Links are only inserted where the exact phrase appears as ordinary text — never inside headings, code, existing links, or shortcodes.

== Changelog ==

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
