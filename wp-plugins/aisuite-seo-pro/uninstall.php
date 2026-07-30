<?php
/**
 * Removes everything this plugin created. The suggestion data belongs to the
 * free SEO plugin, so nothing there is touched.
 */

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

delete_option( 'aisuite_seo_pro_settings' );
delete_option( 'aisuite_seo_pro_license' );

delete_transient( 'aisuite_seo_pro_update' );

wp_clear_scheduled_hook( 'aisuite_seo_pro_sweep' );
wp_clear_scheduled_hook( 'aisuite_seo_pro_bulk_continue' );
