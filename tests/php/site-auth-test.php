<?php
/**
 * Signature compatibility and validation harness.
 */

define( 'ABSPATH', __DIR__ );

class WP_Error {
	public $code;

	public function __construct( $code ) {
		$this->code = $code;
	}
}

$options = array();

function __( $message ) {
	return $message;
}

function is_wp_error( $value ) {
	return $value instanceof WP_Error;
}

function sanitize_text_field( $value ) {
	return trim( strip_tags( (string) $value ) );
}

function get_option( $key, $default = false ) {
	global $options;
	return array_key_exists( $key, $options ) ? $options[ $key ] : $default;
}

function update_option( $key, $value ) {
	global $options;
	$options[ $key ] = $value;
	return true;
}

function delete_option( $key ) {
	global $options;
	unset( $options[ $key ] );
	return true;
}

require dirname( __DIR__, 2 ) . '/wp-plugins/aisuite-core/includes/class-site-auth.php';

$secret    = 'whsec_0123456789abcdef01234567';
$timestamp = (string) time();
$body      = '{"ok":true}';

if ( ! hash_equals( hash_hmac( 'sha256', "{$timestamp}.{$body}", $secret ), AISuite_Site_Auth::sign( $timestamp, $body, $secret ) ) ) {
	fwrite( STDERR, "FAIL: legacy callback signature changed\n" );
	exit( 1 );
}

$canonical = "POST\n/v1/jobs\n{$body}";
if ( ! hash_equals( hash_hmac( 'sha256', "{$timestamp}.{$canonical}", $secret ), AISuite_Site_Auth::sign_request( $timestamp, 'post', '/v1/jobs', $body, $secret ) ) ) {
	fwrite( STDERR, "FAIL: v2 request signature is not method/path bound\n" );
	exit( 1 );
}

$stored = AISuite_Site_Auth::store_credentials( 'site_0123456789abcdef01234567', $secret );
if ( is_wp_error( $stored ) || ! AISuite_Site_Auth::is_connected() ) {
	fwrite( STDERR, "FAIL: valid gateway credentials were rejected\n" );
	exit( 1 );
}

$bad = AISuite_Site_Auth::store_credentials( 'site_x', 'short' );
if ( ! is_wp_error( $bad ) ) {
	fwrite( STDERR, "FAIL: malformed gateway credentials were accepted\n" );
	exit( 1 );
}

fwrite( STDOUT, "PASS: legacy and v2 signatures plus credential validation\n" );
