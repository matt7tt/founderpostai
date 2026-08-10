=== FounderPostAI – AI Suite Core ===
Contributors: founderpostai
Tags: ai, automation, seo, content
Requires at least: 6.5
Tested up to: 7.0
Requires PHP: 7.4
Stable tag: 0.1.5
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Connect WordPress to AI services and share brand settings, account status, and a reliable background job queue across FounderPostAI modules.

== Description ==

AI Suite Core is the shared layer every AI Suite module runs on. Install it once and each module you add reuses the same connection, the same monthly action allowance, and the same description of your business.

Core does not modify posts or pages. It provides:

* One authenticated connection to your FounderPostAI account, with no AI provider keys stored in WordPress
* A usage meter for the hosted AI service
* Brand context — what your business does, who it sells to, tone, words to avoid — read by every module
* A resilient background queue that uses Action Scheduler when available, then loopback requests, then WP-Cron
* Signed requests and callbacks, retry handling, callback health checks, and polling for hosts that block callbacks
* A choice of service billing: managed actions or your own Anthropic API key
* A direct feedback form for bug reports, ideas, and general product feedback
* An encrypted gateway connection for optional read-only Google Search Console reporting used by compatible modules

All functionality included in this plugin is available without a plugin license, feature key, trial period, or time limit. Managed-action allowances are usage limits of the external AI service, not locks on plugin code. The complete plugin is licensed under GPLv2 or later.

== Installation ==

1. Install and activate FounderPostAI – AI Suite Core.
2. Open AI Suite > Connection in WordPress.
3. Follow the link to the FounderPostAI dashboard and create a single-use connection code.
4. Paste the code into WordPress and choose managed actions or your own Anthropic API key.
5. Install a compatible AI Suite module, such as FounderPostAI – AI Suite SEO.

== External services ==

This plugin connects to the FounderPostAI AI Suite gateway. Connecting the site is an explicit administrator action.

At connection time, the plugin sends the site URL, administrator email address, WordPress version, and PHP version to create the account record. After connection, it checks account and service status hourly.

When an administrator runs an action in an AI Suite module, that module sends the relevant content — for example a post title and body — plus saved brand context to the gateway. The gateway sends that input to the Anthropic API and returns structured suggestions. Nothing is sent for AI processing until an administrator runs an action.

If you choose BYOK service billing, your Anthropic API key is sent to the gateway, verified with Anthropic, and stored encrypted on the gateway. It is not saved in the WordPress database. You can instead enter it on the FounderPostAI dashboard so it never passes through this WordPress site.

When an administrator explicitly submits the Feedback form, the selected plugin, feedback type, message, optional reply email, plugin version, WordPress version, PHP version, and connected site identity are sent to the FounderPostAI gateway. They are stored in a private review inbox for support and product planning. No feedback is sent automatically.

When an administrator explicitly connects Google Search Console from a compatible module, the browser is sent to Google's OAuth consent screen with the read-only Search Console scope. Google sends the gateway an access token and refresh token. The refresh token is encrypted on the gateway and is never stored in WordPress. The gateway uses it to list accessible Search Console properties and retrieve the selected property's finalized queries, pages, clicks, impressions, click-through rates, and average positions. Search Console data is returned to the WordPress dashboard and is not sent to an AI model. Disconnecting removes the gateway-held Google token.

FounderPostAI AI Suite gateway:

* Service: https://founderpostai.com/ai-suite
* Terms: https://founderpostai.com/terms
* Privacy: https://founderpostai.com/privacy

Anthropic API:

* Service: https://www.anthropic.com/api
* Commercial terms: https://www.anthropic.com/legal/commercial-terms
* Privacy: https://www.anthropic.com/legal/privacy

Google Search Console API (optional):

* Service: https://search.google.com/search-console
* API terms: https://developers.google.com/terms/api-services-user-data-policy
* Privacy: https://policies.google.com/privacy

The plugin does not download, install, or execute code from either service. Suggestions are returned as data and are validated by the installed module before storage or use.

== Frequently Asked Questions ==

= Do I need an account? =

Yes. This plugin is a client for the substantive FounderPostAI hosted AI service, so a free FounderPostAI account and an explicit site connection are required. Service usage can use managed actions or your own Anthropic API key. No functionality included in the plugin code is unlocked by a license.

= Does it store my API keys? =

No AI provider key is stored in WordPress. In BYOK mode the Anthropic key is encrypted and stored on the gateway. WordPress holds only a site identifier and a signing secret used to authenticate this installation.

= Can I use my own Anthropic account? =

Yes. Switch billing to "Use my own API key" on the Connection screen, then add the key there or on your dashboard. Model usage is then billed directly by Anthropic and your plan fee is flat.

= Why are jobs slow on my site? =

Background work runs immediately in most cases. If your host blocks loopback requests, it falls back to WP-Cron, which only fires when someone visits your site. The Connection screen shows which method your site is using.

== Changelog ==

= 0.1.5 =
* Added the secure gateway methods used by compatible modules for optional read-only Google Search Console reporting.
* Disconnecting AI Suite now also removes any gateway-held Google Search Console token.
* Added complete Search Console external-service and suggested privacy-policy disclosures.
* Added collision-resistant FounderPostAI module hooks and an accessor while preserving compatibility with existing modules.

= 0.1.4 =
* Added a one-screen feedback form for bugs, improvement ideas, and general feedback.
* Feedback is authenticated with the existing site connection, rate-limited, and sent only after an administrator explicitly submits it.
* Added a disconnected-site email fallback and updated privacy disclosures.

= 0.1.3 =
* Added distinctive FounderPostAI directory branding and WordPress.org-aligned plugin metadata.
* Added complete FounderPostAI and Anthropic service disclosures and suggested site privacy-policy text.
* Clarified that hosted-service usage allowances do not restrict functionality included in the GPL plugin.

= 0.1.2 =
* Prevented duplicate queue runners from submitting or completing the same job twice.
* Polling now retries temporary gateway failures instead of leaving jobs stuck until cleanup.
* Gateway errors are shown accurately, BYOK key removal reports failures, and disconnecting cancels local jobs cleanly.
* New requests bind signatures to the HTTP method and route to prevent cross-route replay.

= 0.1.1 =
* Connection ping endpoint no longer requires credentials, so first-time registration succeeds behind the gateway's reachability check.
* Job submissions now retry transient network failures with backoff instead of failing permanently, and wait long enough for slow analyses.
* Fixed a race where a fast gateway callback could make a finished job re-fire its completion hooks.
* Uninstall now also clears per-job scheduled events.

= 0.1.0 =
* Initial release.
