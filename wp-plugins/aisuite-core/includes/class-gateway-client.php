<?php
/**
 * Thin HTTP client for the gateway.
 *
 * Everything expensive happens on the other end of this class. WordPress only
 * ever posts a job and waits for a callback — no request here should block a
 * page load for more than a few seconds.
 */

defined( 'ABSPATH' ) || exit;

class AISuite_Gateway_Client {

	const TIMEOUT = 10;

	/**
	 * Job submits wait much longer: the gateway may run the analysis inline and
	 * take most of a minute on a long post. Submits only ever run in background
	 * context (loopback, Action Scheduler, or WP-Cron), so nothing a visitor or
	 * admin is waiting on ever blocks this long.
	 */
	const SUBMIT_TIMEOUT = 65;

	/**
	 * Connect this site to an account.
	 *
	 * The connect token is short-lived and comes from the account dashboard, so
	 * the user never pastes a long-lived secret into WordPress.
	 *
	 * @return array|WP_Error
	 */
	public function register_site( $connect_token ) {
		$connect_token = trim( (string) $connect_token );

		if ( '' === $connect_token ) {
			return new WP_Error( 'aisuite_missing_token', __( 'Paste the connection code from your dashboard first.', 'aisuite-core' ) );
		}

		$body = array(
			'site_url'       => home_url(),
			'admin_email'    => get_option( 'admin_email' ),
			'wp_version'     => get_bloginfo( 'version' ),
			'php_version'    => PHP_VERSION,
			'plugin_version' => AISUITE_CORE_VERSION,
			'connect_token'  => $connect_token,
			'callback_url'   => rest_url( 'aisuite/v1/callback' ),
		);

		$response = wp_remote_post(
			aisuite_gateway_url() . '/v1/sites/register',
			array(
				'timeout' => self::TIMEOUT,
				'headers' => array( 'Content-Type' => 'application/json' ),
				'body'    => wp_json_encode( $body ),
			)
		);

		$data = $this->parse( $response );

		if ( is_wp_error( $data ) ) {
			return $data;
		}

		if ( empty( $data['site_id'] ) || empty( $data['site_secret'] ) ) {
			return new WP_Error( 'aisuite_bad_registration', __( 'The gateway did not return site credentials.', 'aisuite-core' ) );
		}

		AISuite_Site_Auth::store_credentials( $data['site_id'], $data['site_secret'] );

		if ( ! empty( $data['account'] ) && is_array( $data['account'] ) ) {
			AISuite_Site_Auth::store_account( $data['account'] );
		}

		return $data;
	}

	/**
	 * Submit a job. Returns immediately with a job id; the result arrives on the
	 * REST callback.
	 *
	 * @return array|WP_Error
	 */
	public function submit_job( $type, array $payload, $idempotency_key ) {
		return $this->request(
			'POST',
			'/v1/jobs',
			array(
				'type'            => $type,
				'payload'         => $payload,
				'idempotency_key' => $idempotency_key,
				'callback_url'    => rest_url( 'aisuite/v1/callback' ),
				'brand_context'   => aisuite()->brand->get(),
			),
			self::SUBMIT_TIMEOUT
		);
	}

	/**
	 * Poll a job. Only used as a safety net when a callback never lands —
	 * firewalls in front of customer sites do block inbound POSTs.
	 *
	 * @return array|WP_Error
	 */
	public function get_job( $job_id ) {
		return $this->request( 'GET', '/v1/jobs/' . rawurlencode( $job_id ) );
	}

	/** @return array|WP_Error */
	public function get_account() {
		$data = $this->request( 'GET', '/v1/account' );

		if ( ! is_wp_error( $data ) && is_array( $data ) ) {
			AISuite_Site_Auth::store_account( $data );
		}

		return $data;
	}

	/**
	 * Push documents into the site's index so modules can retrieve against the
	 * site's own content instead of guessing.
	 *
	 * @return array|WP_Error
	 */
	public function index_documents( array $documents ) {
		return $this->request( 'POST', '/v1/index/documents', array( 'documents' => $documents ) );
	}

	/**
	 * Switch between managed credits and bring-your-own-key.
	 *
	 * @return array|WP_Error
	 */
	public function set_billing_mode( $mode ) {
		$data = $this->request( 'POST', '/v1/account/billing-mode', array( 'mode' => $mode ) );

		if ( ! is_wp_error( $data ) && is_array( $data ) ) {
			AISuite_Site_Auth::store_account( $data );
		}

		return $data;
	}

	/**
	 * Forward a provider API key to the gateway.
	 *
	 * The key passes through this PHP process and is not written to the
	 * database, to a log, or to a transient. The gateway verifies it with a
	 * minimal call before storing, so the response tells the customer straight
	 * away whether the key works.
	 *
	 * @return array|WP_Error
	 */
	public function set_provider_key( $provider, $key ) {
		$data = $this->request(
			'POST',
			'/v1/account/provider-key',
			array(
				'provider' => $provider,
				'key'      => $key,
			)
		);

		if ( ! is_wp_error( $data ) && is_array( $data ) ) {
			AISuite_Site_Auth::store_account( $data );
		}

		return $data;
	}

	/**
	 * @return array|WP_Error
	 */
	public function delete_provider_key() {
		$data = $this->request( 'DELETE', '/v1/account/provider-key' );

		if ( ! is_wp_error( $data ) && is_array( $data ) ) {
			AISuite_Site_Auth::store_account( $data );
		}

		return $data;
	}

	/**
	 * Ask the gateway to POST to this site's callback URL and report whether it
	 * arrived. Catches firewalls that silently drop inbound requests before the
	 * customer's first job disappears into nothing.
	 *
	 * @return array|WP_Error
	 */
	public function verify_callback() {
		return $this->request( 'POST', '/v1/sites/verify-callback', array( 'callback_url' => rest_url( 'aisuite/v1/callback' ) ) );
	}

	/**
	 * @return array|WP_Error
	 */
	protected function request( $method, $path, array $body = null, $timeout = self::TIMEOUT ) {
		if ( ! AISuite_Site_Auth::is_connected() ) {
			return new WP_Error( 'aisuite_not_connected', __( 'Connect your AI Suite account before running this.', 'aisuite-core' ) );
		}

		$raw       = null === $body ? '' : wp_json_encode( $body );
		$timestamp = (string) time();

		$args = array(
			'method'  => $method,
			'timeout' => (int) $timeout,
			'headers' => array(
				'Content-Type'          => 'application/json',
				'X-AISuite-Site'        => AISuite_Site_Auth::site_id(),
				'X-AISuite-Timestamp'   => $timestamp,
				'X-AISuite-Signature'   => AISuite_Site_Auth::sign( $timestamp, $raw ),
				'X-AISuite-Plugin'      => AISUITE_CORE_VERSION,
			),
		);

		if ( '' !== $raw ) {
			$args['body'] = $raw;
		}

		return $this->parse( wp_remote_request( aisuite_gateway_url() . $path, $args ) );
	}

	/**
	 * @return array|WP_Error
	 */
	protected function parse( $response ) {
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$code = (int) wp_remote_retrieve_response_code( $response );
		$body = wp_remote_retrieve_body( $response );
		$data = json_decode( $body, true );

		// 204, or any 2xx with an empty body, is a success with nothing to say.
		// Treating it as a parse failure made DELETE look broken.
		if ( $code >= 200 && $code < 300 && '' === trim( (string) $body ) ) {
			return array();
		}

		if ( 402 === $code ) {
			return new WP_Error(
				'aisuite_out_of_credits',
				__( 'This account is out of credits. Add credits to keep running jobs.', 'aisuite-core' ),
				array( 'status' => 402 )
			);
		}

		if ( 401 === $code || 403 === $code ) {
			return new WP_Error(
				'aisuite_unauthorized',
				__( 'The gateway rejected this site\'s credentials. Reconnect on the AI Suite screen.', 'aisuite-core' ),
				array( 'status' => $code )
			);
		}

		if ( $code >= 400 || ! is_array( $data ) ) {
			$message = is_array( $data ) && ! empty( $data['message'] )
				? $data['message']
				: __( 'The gateway returned an unexpected response.', 'aisuite-core' );

			return new WP_Error( 'aisuite_gateway_error', $message, array( 'status' => $code ) );
		}

		return $data;
	}
}
