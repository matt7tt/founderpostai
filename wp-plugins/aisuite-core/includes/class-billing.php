<?php
/**
 * Billing modes.
 *
 * Two ways a site can pay for work:
 *
 *   managed — you buy inference wholesale, the customer spends "actions"
 *   byok    — the customer's own provider key, held on the gateway, flat fee
 *
 * The provider key is never written to this database. It is posted straight
 * through to the gateway and forgotten. Anything else puts a live credential
 * in every backup, migration export, and staging clone of the site.
 */

defined( 'ABSPATH' ) || exit;

class AISuite_Billing {

	const MODE_MANAGED = 'managed';
	const MODE_BYOK    = 'byok';

	/**
	 * Providers the gateway can accept a key for. Only list what the gateway
	 * actually supports — offering a provider here that the gateway rejects
	 * turns into a "my key doesn't work" ticket, not a feature.
	 */
	const PROVIDERS = array(
		'anthropic' => 'Anthropic',
	);

	/**
	 * Current mode, as reported by the gateway. The gateway is authoritative —
	 * a local option would drift the moment someone changes plan elsewhere.
	 */
	public static function mode() {
		$account = AISuite_Site_Auth::account();
		$mode    = isset( $account['billing_mode'] ) ? $account['billing_mode'] : self::MODE_MANAGED;

		return self::MODE_BYOK === $mode ? self::MODE_BYOK : self::MODE_MANAGED;
	}

	public static function is_byok() {
		return self::MODE_BYOK === self::mode();
	}

	/**
	 * Provider key status. Never contains the key itself — the gateway returns
	 * only what's needed to render "which key is this".
	 *
	 * @return array { present, provider, last4, verified_at, error }
	 */
	public static function provider_key_status() {
		$account = AISuite_Site_Auth::account();
		$status  = isset( $account['provider_key'] ) && is_array( $account['provider_key'] )
			? $account['provider_key']
			: array();

		return wp_parse_args(
			$status,
			array(
				'present'     => false,
				'provider'    => '',
				'last4'       => '',
				'verified_at' => '',
				'error'       => '',
			)
		);
	}

	/**
	 * Clean up a pasted key.
	 *
	 * Keys copied out of a provider console or a shared doc routinely arrive
	 * with a trailing newline, a non-breaking space, or a zero-width character
	 * riding along. Those are invisible in a password field, so rejecting them
	 * produces a support ticket the customer cannot diagnose. Strip them,
	 * then validate what's left.
	 */
	public static function normalize_key( $key ) {
		$key = (string) $key;

		// Non-breaking space, zero-width space, ZWNJ/ZWJ, BOM.
		$key = preg_replace( '/[\x{00A0}\x{200B}\x{200C}\x{200D}\x{FEFF}]/u', '', $key );

		return trim( $key );
	}

	/**
	 * Shape check before the key leaves the site.
	 *
	 * Deliberately loose — providers change prefixes, and a plugin that rejects
	 * a valid new key format is worse than one that forwards a bad key and
	 * shows the gateway's error.
	 *
	 * @param string $provider Provider slug.
	 * @param string $key      Already normalized by normalize_key().
	 * @return true|WP_Error
	 */
	public static function validate_key_shape( $provider, $key ) {
		if ( ! isset( self::PROVIDERS[ $provider ] ) ) {
			return new WP_Error( 'aisuite_bad_provider', __( 'Unknown provider.', 'founderpostai-ai-suite-core' ) );
		}

		if ( strlen( $key ) < 20 ) {
			return new WP_Error( 'aisuite_key_too_short', __( 'That does not look like a complete API key.', 'founderpostai-ai-suite-core' ) );
		}

		if ( ! preg_match( '/^[A-Za-z0-9_\-\.]+$/', $key ) ) {
			return new WP_Error( 'aisuite_key_bad_chars', __( 'That key contains characters no provider uses. Check for a stray space or line break.', 'founderpostai-ai-suite-core' ) );
		}

		return true;
	}

	/** Last four characters, for display only. */
	public static function tail( $key ) {
		return substr( self::normalize_key( $key ), -4 );
	}

	/** Human label for a provider slug. */
	public static function provider_label( $slug ) {
		return isset( self::PROVIDERS[ $slug ] ) ? self::PROVIDERS[ $slug ] : $slug;
	}
}
