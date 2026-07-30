=== AI Suite Core ===
Contributors: founderpostai
Tags: ai, automation, seo, content
Requires at least: 6.5
Tested up to: 7.0
Requires PHP: 7.4
Stable tag: 0.1.1
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Shared runtime for AI Suite modules: account connection, credit balance, brand context, and the background job queue.

== Description ==

AI Suite Core is the shared layer every AI Suite module runs on. Install it once and each module you add reuses the same connection, the same monthly action allowance, and the same description of your business.

Core on its own does not modify your site. It provides:

* One connection to your AI Suite account, with no API keys stored in WordPress
* A credit meter showing actions remaining this month
* Brand context — what your business does, who it sells to, tone, words to avoid — read by every module
* A background job queue so long-running work never blocks the admin
* A choice of billing: a monthly allowance of included actions, or a flat plan fee with your own AI provider key

== External services ==

This plugin connects to the AI Suite gateway to process the content you submit.

When you run an action in a module, that module sends the relevant content — for example a post's title and body — to the gateway, which returns a suggestion. Nothing is sent until you run an action. Your brand context is included with each request so results match your business.

The plugin also sends your site URL, admin email, WordPress version, and PHP version once, at connection time, to create your account record. Account status is checked hourly.

If you choose to use your own AI provider key, the key is sent to the gateway, verified, and stored there. It is not saved in your WordPress database. You can also add it on your account dashboard instead, so it never passes through this site at all.

Service: AI Suite gateway (https://founderpostai.com)
Terms of service: https://founderpostai.com/terms
Privacy policy: https://founderpostai.com/privacy

== Frequently Asked Questions ==

= Do I need an account? =

Yes. Core is free, and connecting is free. Actions draw from a monthly allowance.

= Does it store my API keys? =

No. Whether you use included actions or your own provider key, the key lives on the gateway. WordPress holds only a site identifier and a signing secret — so a database backup or a staging clone of your site never contains a live credential.

= Can I use my own OpenAI or Anthropic account? =

Yes. Switch billing to "Use my own API key" on the Connection screen, then add the key there or on your dashboard. Model usage is then billed directly by your provider and your plan fee is flat.

= Why are jobs slow on my site? =

Background work runs immediately in most cases. If your host blocks loopback requests, it falls back to WP-Cron, which only fires when someone visits your site. The Connection screen shows which method your site is using.

== Changelog ==

= 0.1.1 =
* Connection ping endpoint no longer requires credentials, so first-time registration succeeds behind the gateway's reachability check.
* Job submissions now retry transient network failures with backoff instead of failing permanently, and wait long enough for slow analyses.
* Fixed a race where a fast gateway callback could make a finished job re-fire its completion hooks.
* Uninstall now also clears per-job scheduled events.

= 0.1.0 =
* Initial release.
