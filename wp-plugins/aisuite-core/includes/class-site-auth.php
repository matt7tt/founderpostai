<?php
/**
 * Site identity and request signing.
 *
 * The site never holds a model provider key. It holds a site_id and a
 * site_secret issued by the gateway at connection time, and signs every
 * request with an HMAC. The same secret verifies inbound callbacks, which is
 * what stops anyone from POSTing fake job results into the site.
 */

defined( 'ABSPATH' ) || exit;

class AISuite_Site_Auth {

	const OPT_SITE_ID = 'aisuite_site_id';
	const OPT_SECRET  = 'aisuite_site_secret';
	const OPT_ACCOUNT = 'aisuite_account';

	/** Signatures older than this are rejected (replay window, in seconds). */
	const MAX_SKEW = 300;

	public static function site_id() {
		return (string) get_option( self::OPT_SITE_ID, '' );
	}

	public static function secret() {
		return (string) get_option( self::OPT_SECRET, '' );
	}

	public static function is_connected() {
		return '' !== self::site_id() && '' !== self::secret();
	}

	public static function store_credentials( $site_id, $secret ) {
		$site_id = is_string( $site_id ) ? sanitize_text_field( $site_id ) : '';
		$secret  = is_string( $secret ) ? trim( $secret ) : '';

		if ( '' === $site_id || strlen( $site_id ) > 191 || strlen( $secret ) < 24 || strlen( $secret ) > 255 ) {
			return new WP_Error( 'aisuite_bad_credentials', __( 'The gateway returned invalid site credentials.', 'aisuite-core' ) );
		}

		update_option( self::OPT_SITE_ID, $site_id, false );
		update_option( self::OPT_SECRET, $secret, false );

		return true;
	}

	public static function disconnect() {
		delete_option( self::OPT_SITE_ID );
		delete_option( self::OPT_SECRET );
		delete_option( self::OPT_ACCOUNT );
	}

	/**
	 * Cached account snapshot: credits remaining, plan, period end.
	 *
	 * @return array
	 */
	public static function account() {
		$account = get_option( self::OPT_ACCOUNT, array() );
		return is_array( $account ) ? $account : array();
	}

	public static function store_account( array $account ) {
		update_option( self::OPT_ACCOUNT, $account, false );
	}

	public static function credits_remaining() {
		$account = self::account();
		return isset( $account['credits_remaining'] ) ? (int) $account['credits_remaining'] : 0;
	}

	/**
	 * Signature scheme, shared by outbound requests and inbound callbacks:
	 *
	 *   base   = timestamp . "." . raw_body
	 *   sig    = hex( hmac_sha256( base, site_secret ) )
	 *
	 * Implement this identically on the gateway. Sign the raw body bytes, not a
	 * re-encoded copy — key ordering will bite you otherwise.
	 */
	public static function sign( $timestamp, $raw_body, $secret = null ) {
		$secret = null === $secret ? self::secret() : $secret;
		return hash_hmac( 'sha256', $timestamp . '.' . $raw_body, $secret );
	}

	/**
	 * Version 2 binds the signature to the HTTP method and gateway path. The
	 * original body-only scheme let an empty-body signature be replayed against
	 * another route during its five-minute validity window.
	 */
	public static function sign_request( $timestamp, $method, $path, $raw_body, $secret = null ) {
		$secret    = null === $secret ? self::secret() : $secret;
		$canonical = strtoupper( (string) $method ) . "\n" . (string) $path . "\n" . (string) $raw_body;

		return hash_hmac( 'sha256', $timestamp . '.' . $canonical, $secret );
	}

	/**
	 * Verify an inbound callback.
	 *
	 * @return true|WP_Error
	 */
	public static function verify_inbound( $signature, $timestamp, $raw_body ) {
		if ( ! self::is_connected() ) {
			return new WP_Error( 'aisuite_not_connected', __( 'Site is not connected.', 'aisuite-core' ), array( 'status' => 401 ) );
		}

		if ( ! $signature || ! $timestamp ) {
			return new WP_Error( 'aisuite_missing_signature', __( 'Missing signature headers.', 'aisuite-core' ), array( 'status' => 401 ) );
		}

		if ( ! preg_match( '/^\d{10,}$/', (string) $timestamp ) || ! preg_match( '/^[a-f0-9]{64}$/i', (string) $signature ) ) {
			return new WP_Error( 'aisuite_bad_signature', __( 'Malformed signature headers.', 'aisuite-core' ), array( 'status' => 401 ) );
		}

		if ( abs( time() - (int) $timestamp ) > self::MAX_SKEW ) {
			return new WP_Error( 'aisuite_stale_signature', __( 'Signature timestamp is outside the accepted window.', 'aisuite-core' ), array( 'status' => 401 ) );
		}

		$expected = self::sign( $timestamp, $raw_body );

		if ( ! hash_equals( $expected, (string) $signature ) ) {
			return new WP_Error( 'aisuite_bad_signature', __( 'Signature verification failed.', 'aisuite-core' ), array( 'status' => 401 ) );
		}

		return true;
	}
}
