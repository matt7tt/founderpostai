<?php
/**
 * Plugin Name:       FounderPostAI – AI Suite SEO
 * Plugin URI:        https://founderpostai.com/ai-suite
 * Description:       Writes titles, meta descriptions, and internal links for your posts, then shows you the exact change before anything goes live.
 * Version:           0.1.5
 * Requires at least: 6.5
 * Requires PHP:      7.4
 * Requires Plugins:  founderpostai-ai-suite-core
 * Author:            FounderPostAI
 * Author URI:        https://founderpostai.com
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       founderpostai-ai-suite-seo
 */

defined( 'ABSPATH' ) || exit;

define( 'AISUITE_SEO_VERSION', '0.1.5' );
define( 'AISUITE_SEO_FILE', __FILE__ );
define( 'AISUITE_SEO_DIR', plugin_dir_path( __FILE__ ) );
define( 'AISUITE_SEO_URL', plugin_dir_url( __FILE__ ) );

require_once AISUITE_SEO_DIR . 'includes/class-store.php';
require_once AISUITE_SEO_DIR . 'includes/class-link-inserter.php';
require_once AISUITE_SEO_DIR . 'includes/class-link-candidates.php';
require_once AISUITE_SEO_DIR . 'includes/class-meta-adapter.php';
require_once AISUITE_SEO_DIR . 'includes/class-optimizer.php';
require_once AISUITE_SEO_DIR . 'includes/class-meta-output.php';
require_once AISUITE_SEO_DIR . 'includes/class-review-screen.php';
require_once AISUITE_SEO_DIR . 'includes/class-health-screen.php';

register_activation_hook( __FILE__, array( 'AISuite_SEO_Store', 'install' ) );

add_action(
	'plugins_loaded',
	function () {
		// Requires Plugins covers WP 6.5+, but a manual FTP install can still
		// land here without core. Fail loudly instead of fatally.
		if ( ! function_exists( 'aisuite' ) ) {
			add_action(
				'admin_notices',
				function () {
					printf(
						'<div class="notice notice-error"><p>%s</p></div>',
						esc_html__( 'AI Suite SEO needs AI Suite Core. Install and activate it to continue.', 'founderpostai-ai-suite-seo' )
					);
				}
			);
			return;
		}

		AISuite_SEO_Store::maybe_upgrade();

		new AISuite_SEO_Optimizer();
		new AISuite_SEO_Meta_Output();
		new AISuite_SEO_Review_Screen();
		new AISuite_SEO_Health_Screen();

		add_filter(
			'plugin_action_links_' . plugin_basename( AISUITE_SEO_FILE ),
			function ( $links ) {
				if ( class_exists( 'AISuite_Feedback' ) ) {
					array_unshift(
						$links,
						sprintf(
							'<a href="%1$s">%2$s</a>',
							esc_url( AISuite_Feedback::url( 'seo' ) ),
							esc_html__( 'Send feedback', 'founderpostai-ai-suite-seo' )
						)
					);
				}
				return $links;
			}
		);

		add_action(
			'aisuite_register_modules',
			function ( $registry ) {
				$registry->register(
					'seo',
					array(
						'name'         => __( 'SEO', 'founderpostai-ai-suite-seo' ),
						'description'  => __( 'Titles, meta descriptions, and internal links.', 'founderpostai-ai-suite-seo' ),
						'settings_url' => admin_url( 'admin.php?page=aisuite-seo' ),
						'job_types'    => array( 'seo.analyze_post', 'seo.internal_links' ),
					)
				);
			}
		);
	},
	10
);
