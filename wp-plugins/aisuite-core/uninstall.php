<?php
/**
 * Runs when the plugin is deleted, not merely deactivated.
 *
 * Removes every option this plugin created, including the per-job records,
 * which use dynamic names and so can't be listed literally.
 */

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

global $wpdb;

$aisuite_options = array(
	'aisuite_site_id',
	'aisuite_site_secret',
	'aisuite_account',
	'aisuite_brand_context',
	'aisuite_open_jobs',
	'aisuite_callback_health',
	'aisuite_loopback_token',
);

foreach ( $aisuite_options as $aisuite_option ) {
	delete_option( $aisuite_option );
}

// Per-job records: aisuite_job_{uuid}.
// phpcs:ignore WordPress.DB.DirectDatabaseQuery
$aisuite_job_options = $wpdb->get_col(
	$wpdb->prepare(
		"SELECT option_name FROM {$wpdb->options} WHERE option_name LIKE %s",
		$wpdb->esc_like( 'aisuite_job_' ) . '%'
	)
);

foreach ( (array) $aisuite_job_options as $aisuite_job_option ) {
	delete_option( $aisuite_job_option );
}

// Queue locks and one-time loopback transients have dynamic names.
// phpcs:ignore WordPress.DB.DirectDatabaseQuery
$aisuite_runtime_options = $wpdb->get_col(
	$wpdb->prepare(
		"SELECT option_name FROM {$wpdb->options}
		WHERE option_name LIKE %s
		   OR option_name LIKE %s
		   OR option_name LIKE %s",
		$wpdb->esc_like( 'aisuite_lock_' ) . '%',
		$wpdb->esc_like( '_transient_aisuite_loopback_' ) . '%',
		$wpdb->esc_like( '_transient_timeout_aisuite_loopback_' ) . '%'
	)
);

foreach ( (array) $aisuite_runtime_options as $aisuite_runtime_option ) {
	delete_option( $aisuite_runtime_option );
}

wp_clear_scheduled_hook( 'aisuite_refresh_account' );
wp_clear_scheduled_hook( 'aisuite_cleanup_jobs' );

// Per-job events carry the job reference as an argument, so they can only be
// cleared wholesale by hook name.
wp_unschedule_hook( 'aisuite_submit_job' );
wp_unschedule_hook( 'aisuite_reconcile_job' );
wp_unschedule_hook( 'aisuite_track_job' );

delete_transient( 'aisuite_loopback_token' );
