<?php
/**
 * Removes everything this plugin created. The suggestion data belongs to the
 * free SEO plugin, so nothing there is touched.
 */

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

delete_option( 'founderpostai_aisuite_seo_pro_settings' );
delete_option( 'founderpostai_aisuite_seo_pro_license' );
delete_option( 'founderpostai_aisuite_seo_pro_sweep_cursor' );
delete_option( 'founderpostai_aisuite_seo_pro_migration' );
delete_option( 'aisuite_seo_pro_settings' );
delete_option( 'aisuite_seo_pro_license' );
delete_option( 'aisuite_seo_pro_sweep_cursor' );

delete_transient( 'founderpostai_aisuite_seo_pro_update' );
delete_transient( 'founderpostai_aisuite_seo_pro_entitlement' );
delete_transient( 'aisuite_seo_pro_update' );

wp_clear_scheduled_hook( 'founderpostai_aisuite_seo_pro_sweep' );
wp_clear_scheduled_hook( 'founderpostai_aisuite_seo_pro_bulk_continue' );
wp_clear_scheduled_hook( 'aisuite_seo_pro_sweep' );
wp_clear_scheduled_hook( 'aisuite_seo_pro_bulk_continue' );
