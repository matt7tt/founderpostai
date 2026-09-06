<?php
/** Run only inside the disposable tests/wordpress environment with wp eval-file. */
if ( 'http://localhost:8892' !== get_option( 'siteurl' ) ) { throw new RuntimeException( 'Not the isolated test site' ); }
global $wpdb;
FounderPostAI_AISuite_SEO_Health_Audit::drop();
FounderPostAI_AISuite_SEO_Health_Audit::install();

function check_reliability( $condition, $message ) {
	if ( ! $condition ) { throw new RuntimeException( $message ); }
	WP_CLI::log( 'PASS: ' . $message );
}

add_filter( 'pre_http_request', function ( $pre, $args, $url ) {
	// WordPress only runs third-party Update URI hooks after its directory check succeeds.
	if ( false !== strpos( $url, 'api.wordpress.org/plugins/update-check/' ) ) {
		return array( 'response' => array( 'code' => 200 ), 'body' => '{"plugins":{},"no_update":{},"translations":[]}' );
	}
	return new WP_Error( 'isolated', 'External services disabled in tests' );
}, 100, 3 );
wp_set_current_user( 1 );
check_reliability( class_exists( 'FounderPostAI_AISuite_SEO_Pro' ), 'Three plugins activate under their actual download folder names' );
WP_Plugin_Dependencies::initialize();
check_reliability( ! WP_Plugin_Dependencies::has_unmet_dependencies( 'aisuite-seo-pro/aisuite-seo-pro.php' ), 'WordPress dependency checker accepts installed SEO directory' );
check_reliability( ! FounderPostAI_AISuite_SEO_Pro::automation_allowed(), 'No key cannot run paid automation' );

$free_update = new FounderPostAI_AISuite_SEO_Updater();
set_transient( FounderPostAI_AISuite_SEO_Updater::CACHE, array( 'slug' => 'aisuite-seo', 'version' => '99.0.0', 'package' => 'https://founderpostai.com/downloads/aisuite-seo.zip' ), 300 );
$update = $free_update->update( false, array(), 'aisuite-seo/aisuite-seo.php' );
check_reliability( '99.0.0' === $update['version'], 'Free update discovery needs no license or gateway connection' );
check_reliability( false === $free_update->update( false, array(), 'different/plugin.php' ), 'Free updater does not overwrite another plugin update' );
delete_site_transient( 'update_plugins' );
wp_update_plugins();
$updates = get_site_transient( 'update_plugins' );
check_reliability( isset( $updates->response['aisuite-seo/aisuite-seo.php'] ) && '99.0.0' === $updates->response['aisuite-seo/aisuite-seo.php']->new_version, 'WordPress itself discovers the free update through its Update URI hook' );
delete_transient( FounderPostAI_AISuite_SEO_Updater::CACHE );

$key = 'AISP-AAAA-BBBB-CCCC';
update_option( FounderPostAI_AISuite_SEO_Pro::LICENSE_OPTION, $key );
set_transient( FounderPostAI_AISuite_SEO_Pro_Updater::TRANSIENT, array( 'active' => true ), 300 );
check_reliability( FounderPostAI_AISuite_SEO_Pro::automation_allowed(), 'Verified Pro entitlement enables only Pro automation' );
set_transient( FounderPostAI_AISuite_SEO_Pro_Updater::TRANSIENT, array( 'active' => false ), 300 );
set_transient( FounderPostAI_AISuite_SEO_Pro_Updater::GRACE, hash( 'sha256', $key ), 300 );
check_reliability( ! FounderPostAI_AISuite_SEO_Pro::automation_allowed(), 'Explicit inactive subscription overrides outage grace' );
set_transient( FounderPostAI_AISuite_SEO_Pro_Updater::TRANSIENT, array(), 300 );
check_reliability( FounderPostAI_AISuite_SEO_Pro::automation_allowed(), 'Temporary outage retains previously verified entitlement' );
delete_transient( FounderPostAI_AISuite_SEO_Pro_Updater::GRACE );
check_reliability( ! FounderPostAI_AISuite_SEO_Pro::automation_allowed(), 'Expired grace cannot keep automation running' );
delete_option( FounderPostAI_AISuite_SEO_Pro::LICENSE_OPTION );

$target = wp_insert_post( array( 'post_title' => 'Audit target', 'post_status' => 'publish', 'post_content' => '<p>Target.</p>' ) );
$source = wp_insert_post( array( 'post_title' => 'Audit source', 'post_status' => 'publish', 'post_content' => '<p><a href="' . get_permalink( $target ) . '">Target</a></p>' ) );
$posts = 151;
for ( $i = 0; $i < $posts; $i++ ) {
	wp_insert_post( array( 'post_title' => 'Audit fixture ' . $i, 'post_status' => 'publish', 'post_content' => str_repeat( 'Representative long-form content. ', 1500 ) ) );
}
$empty = FounderPostAI_AISuite_SEO_Health_Audit::snapshot();
check_reliability( $empty['building'] && 0 === $empty['generated_at'], 'First dashboard request schedules work without scanning posts' );
$start = microtime( true );
FounderPostAI_AISuite_SEO_Health_Audit::run_batch();
$state = get_option( FounderPostAI_AISuite_SEO_Health_Audit::STATE );
$table = FounderPostAI_AISuite_SEO_Health_Audit::table();
$count = (int) $wpdb->get_var( $wpdb->prepare( 'SELECT COUNT(*) FROM %i WHERE generation=%s', $table, $state['generation'] ) );
check_reliability( $count <= 50 && $count > 0, 'One audit batch reads at most 50 posts' );
for ( $i = 0; $i < 30 && get_option( FounderPostAI_AISuite_SEO_Health_Audit::STATE ); $i++ ) {
	FounderPostAI_AISuite_SEO_Health_Audit::run_batch();
}
$snapshot = FounderPostAI_AISuite_SEO_Health_Audit::snapshot();
check_reliability( ! $snapshot['building'] && $snapshot['summary']['total'] >= $posts + 2, 'All background phases produce a complete site-wide snapshot' );
$page = FounderPostAI_AISuite_SEO_Health_Audit::page( $snapshot, 'all', 1 );
check_reliability( count( $page ) === 50, 'Dashboard only loads its 50-row page' );
$target_row = json_decode( $wpdb->get_var( $wpdb->prepare( 'SELECT data FROM %i WHERE generation=%s AND post_id=%d', $table, $snapshot['generation'], $target ) ), true );
$source_row = json_decode( $wpdb->get_var( $wpdb->prepare( 'SELECT data FROM %i WHERE generation=%s AND post_id=%d', $table, $snapshot['generation'], $source ) ), true );
check_reliability( 1 === $target_row['incoming'] && ! $target_row['orphaned'] && 1 === $source_row['outgoing'], 'Plain-permalink incoming and outgoing link counts remain correct' );
FounderPostAI_AISuite_SEO_Health_Audit::invalidate();
check_reliability( FounderPostAI_AISuite_SEO_Health_Audit::snapshot()['generation'] === $snapshot['generation'], 'Edits preserve last complete results while a new scan is pending' );
WP_CLI::log( sprintf( 'Audit fixture: %d posts; %.2fs across batches; peak %.1f MiB (includes fixture creation).', $snapshot['summary']['total'], microtime( true ) - $start, memory_get_peak_usage( true ) / 1048576 ) );
