<?php
/**
 * Inbound callback endpoint.
 *
 * Permission is the HMAC signature, not a WordPress capability — the caller is
 * the gateway, not a logged-in user. Never widen this to permission_callback
 * __return_true without the signature check.
 */

defined( 'ABSPATH' ) || exit;

class AISuite_REST_Callback {

	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	public function register_routes() {
		register_rest_route(
			'aisuite/v1',
			'/callback',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'handle' ),
				'permission_callback' => array( $this, 'verify' ),
			)
		);

		// Lets the gateway confirm the site is reachable before a customer runs
		// their first job, so "nothing happened" becomes a real error message.
		//
		// Deliberately public: the gateway pings this during registration, before
		// the site has credentials to verify a signature with. It discloses only
		// that the plugin is installed. When signature headers are present they
		// are still checked, and the result is reported, so the connection test
		// can prove the signed path works end to end.
		register_rest_route(
			'aisuite/v1',
			'/ping',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'ping' ),
				'permission_callback' => '__return_true',
			)
		);
	}

	/**
	 * @return true|WP_Error
	 */
	public function verify( WP_REST_Request $request ) {
		return AISuite_Site_Auth::verify_inbound(
			$request->get_header( 'x_aisuite_signature' ),
			$request->get_header( 'x_aisuite_timestamp' ),
			$request->get_body()
		);
	}

	public function ping( WP_REST_Request $request ) {
		$verified = false;

		if ( $request->get_header( 'x_aisuite_signature' ) ) {
			$verified = true === AISuite_Site_Auth::verify_inbound(
				$request->get_header( 'x_aisuite_signature' ),
				$request->get_header( 'x_aisuite_timestamp' ),
				$request->get_body()
			);
		}

		return new WP_REST_Response(
			array(
				'ok'                 => true,
				'version'            => AISUITE_CORE_VERSION,
				'queue'              => AISuite_Job_Queue::dispatch_mode(),
				'signature_verified' => $verified,
			),
			200
		);
	}

	public function handle( WP_REST_Request $request ) {
		$body = $request->get_json_params();

		if ( empty( $body['idempotency_key'] ) ) {
			return new WP_Error( 'aisuite_missing_ref', __( 'Missing idempotency_key.', 'aisuite-core' ), array( 'status' => 400 ) );
		}

		$ref    = sanitize_text_field( $body['idempotency_key'] );
		$status = isset( $body['status'] ) ? sanitize_key( $body['status'] ) : 'completed';

		if ( ! preg_match( '/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i', $ref ) ) {
			return new WP_Error( 'aisuite_bad_ref', __( 'Invalid idempotency_key.', 'aisuite-core' ), array( 'status' => 400 ) );
		}

		if ( ! in_array( $status, array( 'completed', 'failed' ), true ) ) {
			return new WP_Error( 'aisuite_bad_status', __( 'Callback status must be completed or failed.', 'aisuite-core' ), array( 'status' => 400 ) );
		}

		if ( isset( $body['account'] ) && is_array( $body['account'] ) ) {
			AISuite_Site_Auth::store_account( $body['account'] );
		}

		if ( 'failed' === $status ) {
			$message = isset( $body['error'] ) ? sanitize_text_field( $body['error'] ) : __( 'Job failed.', 'aisuite-core' );
			aisuite()->jobs->fail( $ref, $message );
		} else {
			aisuite()->jobs->complete( $ref, isset( $body['result'] ) ? (array) $body['result'] : array() );
		}

		return new WP_REST_Response( array( 'received' => true ), 200 );
	}
}
