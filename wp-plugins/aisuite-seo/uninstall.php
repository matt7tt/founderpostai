<?php
/**
 * Removes the suggestions table and the post meta this module wrote.
 *
 * The SEO title and description meta are deliberately kept: they are the
 * customer's published content, not plugin bookkeeping, and deleting them on
 * uninstall would silently strip search metadata from every page.
 */

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

global $wpdb;

require_once plugin_dir_path( __FILE__ ) . 'includes/class-store.php';

if ( class_exists( 'AISuite_SEO_Store' ) ) {
	AISuite_SEO_Store::drop();
}

// Bookkeeping meta only.
foreach ( array( '_aisuite_seo_analyzed', '_aisuite_seo_error', '_aisuite_seo_queued', '_aisuite_seo_meta_provider', '_aisuite_seo_title_provider', '_aisuite_seo_description_provider' ) as $aisuite_seo_meta_key ) {
	delete_post_meta_by_key( $aisuite_seo_meta_key );
}

delete_transient( 'aisuite_seo_health_snapshot' );

// Remove any stale per-suggestion mutex left by an interrupted apply request.
// phpcs:ignore WordPress.DB.DirectDatabaseQuery
$aisuite_seo_lock_options = $wpdb->get_col(
	$wpdb->prepare(
		"SELECT option_name FROM {$wpdb->options} WHERE option_name LIKE %s",
		$wpdb->esc_like( 'aisuite_seo_apply_lock_' ) . '%'
	)
);

foreach ( (array) $aisuite_seo_lock_options as $aisuite_seo_lock_option ) {
	delete_option( $aisuite_seo_lock_option );
}
