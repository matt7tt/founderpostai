<?php
/** Behavioral test for native Yoast metadata storage. */

define( 'ABSPATH', __DIR__ );

$post_meta = array();

class WP_Error {
	public function __construct( $code, $message ) {}
}

class WPSEO_Meta {
	public static function get_value( $key, $post_id ) {
		return get_post_meta( $post_id, '_yoast_wpseo_' . $key, true );
	}

	public static function set_value( $key, $value, $post_id ) {
		return update_post_meta( $post_id, '_yoast_wpseo_' . $key, $value );
	}
}

function __( $value ) {
	return $value;
}

function is_wp_error( $value ) {
	return $value instanceof WP_Error;
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

function update_meta_cache() {}

require dirname( __DIR__, 2 ) . '/wp-plugins/aisuite-seo/includes/class-meta-adapter.php';

$result = AISuite_SEO_Meta_Adapter::write( 9, 'description', 'Native description' );

if (
	true !== $result ||
	'Native description' !== get_post_meta( 9, '_yoast_wpseo_metadesc', true ) ||
	'Native description' !== get_post_meta( 9, '_aisuite_seo_description', true ) ||
	'Native description' !== AISuite_SEO_Meta_Adapter::read( 9, 'description' )
) {
	fwrite( STDERR, "FAIL: approved metadata was not saved natively and mirrored\n" );
	exit( 1 );
}

update_post_meta( 9, '_yoast_wpseo_metadesc', 'Manual edit' );
if ( 'Manual edit' !== AISuite_SEO_Meta_Adapter::read( 9, 'description' ) ) {
	fwrite( STDERR, "FAIL: a later native edit did not remain authoritative\n" );
	exit( 1 );
}

update_post_meta( 9, '_yoast_wpseo_metadesc', '' );
if ( '' !== AISuite_SEO_Meta_Adapter::read( 9, 'description' ) ) {
	fwrite( STDERR, "FAIL: clearing a native field resurrected the portability mirror\n" );
	exit( 1 );
}

fwrite( STDOUT, "PASS: Yoast native writes, later edits, clears, and portability mirror work\n" );
