<?php
/**
 * Verifies payload fingerprints distinguish real edits from link markup and
 * preserve request-time state across asynchronous analysis jobs.
 */

define( 'ABSPATH', __DIR__ );
define( 'DAY_IN_SECONDS', 86400 );

$posts = array(
	7 => (object) array(
		'ID'                => 7,
		'post_status'       => 'publish',
		'post_type'         => 'post',
		'post_title'        => 'Fingerprint test',
		'post_content'      => '<p>Hello world</p>',
		'post_excerpt'      => 'A short excerpt.',
		'post_modified_gmt' => '2026-08-04 12:00:00',
	),
);
$post_meta = array();

class AISuite_SEO_Meta_Adapter {
	public static function read( $post_id, $field ) {
		global $post_meta;
		$key = 'title' === $field ? '_test_title' : '_test_description';
		return isset( $post_meta[ $post_id ][ $key ] ) ? $post_meta[ $post_id ][ $key ] : '';
	}
}

function get_post( $post ) {
	global $posts;
	if ( is_object( $post ) ) {
		return $post;
	}
	return isset( $posts[ $post ] ) ? $posts[ $post ] : null;
}
function get_post_meta( $post_id, $key ) {
	global $post_meta;
	return isset( $post_meta[ $post_id ][ $key ] ) ? $post_meta[ $post_id ][ $key ] : '';
}
function update_post_meta( $post_id, $key, $value ) {
	global $post_meta;
	$post_meta[ $post_id ][ $key ] = $value;
	return true;
}
function get_permalink( $post ) {
	return 'https://example.com/post-' . (int) $post->ID . '/';
}
function wp_strip_all_tags( $value ) {
	return strip_tags( $value );
}
function wp_json_encode( $value ) {
	return json_encode( $value );
}

require dirname( __DIR__, 2 ) . '/wp-plugins/aisuite-seo/includes/class-optimizer.php';

AISuite_SEO_Optimizer::mark_current( 7 );

if ( ! AISuite_SEO_Optimizer::is_current( 7 ) ) {
	fwrite( STDERR, "FAIL: a just-analyzed post was not current\n" );
	exit( 1 );
}

// Approved internal-link insertion changes markup, but not the plain-text
// payload sent for analysis, so it must not create a false stale result.
$posts[7]->post_content      = '<p>Hello <a href="/elsewhere/">world</a></p>';
$posts[7]->post_modified_gmt = '2026-08-04 12:05:00';

if ( ! AISuite_SEO_Optimizer::is_current( 7 ) ) {
	fwrite( STDERR, "FAIL: internal-link markup made an unchanged payload stale\n" );
	exit( 1 );
}

$post_meta[7]['_test_description'] = 'A newly edited description.';

if ( AISuite_SEO_Optimizer::is_current( 7 ) ) {
	fwrite( STDERR, "FAIL: a metadata edit did not make the analysis stale\n" );
	exit( 1 );
}

AISuite_SEO_Optimizer::mark_current( 7 );
$request_hash         = AISuite_SEO_Optimizer::analysis_hash( 7 );
$posts[7]->post_title = 'Edited while the analysis job was running';
AISuite_SEO_Optimizer::mark_current( 7, $request_hash );

if ( AISuite_SEO_Optimizer::is_current( 7 ) ) {
	fwrite( STDERR, "FAIL: an in-flight edit was hidden by analysis completion\n" );
	exit( 1 );
}

fwrite( STDOUT, "PASS: analysis freshness follows the submitted payload without false link staleness\n" );
