<?php
/** Verifies ready local indexes replace repeated whole-site post scans. */

define( 'ABSPATH', __DIR__ );

$source = (object) array(
	'ID'                => 1,
	'post_title'        => 'WordPress SEO guide',
	'post_excerpt'      => '',
	'post_content'      => 'Internal linking for WordPress sites.',
	'post_modified_gmt' => '2026-08-01 00:00:00',
);

function wp_strip_all_tags( $value ) {
	return strip_tags( $value );
}

function get_post( $post ) {
	global $source;
	return is_object( $post ) ? $post : ( 1 === (int) $post ? $source : null );
}

function get_permalink( $post ) {
	return 'https://example.com/' . (int) $post->ID . '/';
}

function get_post_types() {
	return array( 'post', 'page' );
}

function apply_filters( $hook, $value ) {
	return $value;
}

function get_posts() {
	fwrite( STDERR, "FAIL: ready local index fell back to a whole-site scan\n" );
	exit( 1 );
}

class AISuite_SEO_Site_Index {
	public static function is_ready() {
		return true;
	}

	public static function candidates() {
		return array(
			(object) array(
				'ID'                => 3,
				'post_title'        => 'Internal links for WordPress SEO',
				'post_excerpt'      => 'Relevant guide.',
				'post_content'      => 'Build a useful internal linking structure.',
				'post_modified_gmt' => '2026-01-01 00:00:00',
				'aisuite_url'       => 'https://example.com/internal-links/',
			),
			(object) array(
				'ID'                => 2,
				'post_title'        => 'Office lunch ideas',
				'post_excerpt'      => 'Recipes.',
				'post_content'      => 'Sandwiches and salads.',
				'post_modified_gmt' => '2026-07-01 00:00:00',
				'aisuite_url'       => 'https://example.com/lunch/',
			),
		);
	}
}

require dirname( __DIR__, 2 ) . '/wp-plugins/aisuite-seo/includes/class-link-candidates.php';

$candidates = AISuite_SEO_Link_Candidates::select( 1, 2 );

if ( 2 !== count( $candidates ) || 3 !== $candidates[0]['id'] || 'https://example.com/internal-links/' !== $candidates[0]['url'] ) {
	fwrite( STDERR, "FAIL: local index candidates were not relevance ranked and preserved\n" );
	exit( 1 );
}

fwrite( STDOUT, "PASS: ready local index avoids whole-site scans and preserves relevance ranking\n" );
