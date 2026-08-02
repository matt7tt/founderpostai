=== FounderPostAI – AI Suite SEO Pro ===
Contributors: founderpostai
Tags: seo, ai, automation, bulk optimization
Requires at least: 6.5
Tested up to: 7.0
Requires PHP: 7.4
Stable tag: 1.0.3
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Bulk SEO analysis, scheduled re-analysis, and conservative auto-apply rules for AI Suite SEO.

== Description ==

AI Suite SEO Pro adds automation to AI Suite SEO:

* Queue never-analyzed posts and pages in bounded background batches.
* Re-analyze changed content on a daily schedule.
* Auto-apply generated titles and descriptions only when the live field is still empty.
* Receive updates from FounderPostAI while the saved license is active.

AI Suite Core and AI Suite SEO must both be installed and active.

== Installation ==

1. Install and activate AI Suite Core.
2. Install and activate AI Suite SEO.
3. Upload the AI Suite SEO Pro ZIP from Plugins > Add New > Upload Plugin.
4. Activate AI Suite SEO Pro.
5. Open AI Suite > SEO Pro and enter the license key from your receipt.

== Changelog ==

= 1.0.3 =

* Added direct feedback links on the SEO Pro settings and Plugins screens.
* Reports use Core's authenticated feedback form with SEO Pro preselected.

= 1.0.2 =

* Updated dependency metadata for the final FounderPostAI WordPress.org plugin slugs.
* Aligned the add-on name with the FounderPostAI directory branding.

= 1.0.1 =

* Prevented large-site daily sweeps from repeatedly scanning only the newest posts.
* Prevented auto-apply from applying stale suggestions or overwriting newly entered metadata.
* Added dependency and inactive-license notices.
* Hardened update-response and license validation.
* Cleaned scheduled work and sweep state on deactivation or uninstall.

= 1.0.0 =

* Initial release.
