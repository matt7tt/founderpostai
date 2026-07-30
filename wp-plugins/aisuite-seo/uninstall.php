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
foreach ( array( '_aisuite_seo_analyzed', '_aisuite_seo_error', '_aisuite_seo_queued' ) as $aisuite_meta_key ) {
	delete_post_meta_by_key( $aisuite_meta_key );
}
