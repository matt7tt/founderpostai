<?php
/**
 * Update client for the premium plugin.
 *
 * WordPress.org will not serve updates for a paid plugin, so this hooks the
 * update transient and points at your own endpoint. The license check reuses
 * the core site credentials — customers should never paste a second key.
 */

defined( 'ABSPATH' ) || exit;

class AISuite_SEO_Pro_Updater {

	const TRANSIENT = 'aisuite_seo_pro_update';

	protected $file;
	protected $version;
	protected $slug;
	protected $basename;

	public function __construct( $file, $version ) {
		$this->file     = $file;
		$this->version  = $version;
		$this->basename = plugin_basename( $file );
		$this->slug     = dirname( $this->basename );

		add_filter( 'pre_set_site_transient_update_plugins', array( $this, 'inject_update' ) );
		add_filter( 'plugins_api', array( $this, 'plugin_info' ), 20, 3 );
		add_action( 'admin_notices', array( $this, 'license_notice' ) );
	}

	/**
	 * @return array|false
	 */
	protected function remote() {
		$cached = get_transient( self::TRANSIENT );

		if ( false !== $cached ) {
			return $cached;
		}

		if ( ! class_exists( 'AISuite_Site_Auth' ) || ! AISuite_Site_Auth::is_connected() ) {
			return false;
		}

		$timestamp = (string) time();
		$url       = add_query_arg(
			array(
				'slug'    => $this->slug,
				'version' => $this->version,
			),
			aisuite_gateway_url() . '/v1/updates/check'
		);
		$query     = wp_parse_url( $url, PHP_URL_QUERY );
		$path      = '/v1/updates/check' . ( $query ? '?' . $query : '' );
		$response  = wp_remote_get(
			$url,
			array(
				'timeout' => 10,
				'headers' => array(
					'X-AISuite-Site'              => AISuite_Site_Auth::site_id(),
					'X-AISuite-Timestamp'         => $timestamp,
					'X-AISuite-Signature'         => AISuite_Site_Auth::sign_request( $timestamp, 'GET', $path, '' ),
					'X-AISuite-Signature-Version' => '2',
					// The update server only hands out the package URL to an
					// active license. Without this header it returns metadata
					// only, and there is nothing to install.
					'X-AISuite-License'           => class_exists( 'AISuite_SEO_Pro' ) ? AISuite_SEO_Pro::license_key() : '',
				),
			)
		);

		if ( is_wp_error( $response ) || 200 !== (int) wp_remote_retrieve_response_code( $response ) ) {
			set_transient( self::TRANSIENT, array(), HOUR_IN_SECONDS );
			return false;
		}

		$data = json_decode( wp_remote_retrieve_body( $response ), true );
		$data = is_array( $data ) ? $data : array();

		if ( isset( $data['version'] ) && ! is_scalar( $data['version'] ) ) {
			$data = array();
		}

		foreach ( array( 'package', 'url' ) as $url_key ) {
			if ( ! empty( $data[ $url_key ] ) ) {
				$data[ $url_key ] = esc_url_raw( $data[ $url_key ], array( 'https' ) );
			}
		}

		set_transient( self::TRANSIENT, $data, 6 * HOUR_IN_SECONDS );

		return $data;
	}

	public function inject_update( $transient ) {
		if ( empty( $transient->checked ) ) {
			return $transient;
		}

		$remote = $this->remote();

		if ( empty( $remote['version'] ) || version_compare( $this->version, $remote['version'], '>=' ) ) {
			return $transient;
		}

		// No package means no active license on file. Injecting the update
		// anyway would show an "update available" the customer cannot run —
		// the license notice is the actionable message, not a dead button.
		if ( empty( $remote['package'] ) ) {
			return $transient;
		}

		$update              = new stdClass();
		$update->slug        = $this->slug;
		$update->plugin      = $this->basename;
		$update->new_version = $remote['version'];
		$update->package     = isset( $remote['package'] ) ? $remote['package'] : '';
		$update->url         = isset( $remote['url'] ) ? $remote['url'] : '';
		$update->tested      = isset( $remote['tested'] ) ? $remote['tested'] : '';

		$transient->response[ $this->basename ] = $update;

		return $transient;
	}

	public function plugin_info( $result, $action, $args ) {
		if ( 'plugin_information' !== $action || empty( $args->slug ) || $args->slug !== $this->slug ) {
			return $result;
		}

		$remote = $this->remote();

		if ( empty( $remote ) ) {
			return $result;
		}

		$info                = new stdClass();
		$info->name          = isset( $remote['name'] ) ? $remote['name'] : 'AI Suite SEO Pro';
		$info->slug          = $this->slug;
		$info->version       = isset( $remote['version'] ) ? $remote['version'] : $this->version;
		$info->download_link = isset( $remote['package'] ) ? $remote['package'] : '';
		$info->sections      = isset( $remote['sections'] ) ? (array) $remote['sections'] : array();

		return $info;
	}

	public function license_notice() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		if ( ! class_exists( 'AISuite_Site_Auth' ) || ! AISuite_Site_Auth::is_connected() ) {
			printf(
				'<div class="notice notice-warning"><p>%s <a href="%s">%s</a></p></div>',
				esc_html__( 'AI Suite SEO Pro will not receive updates until this site is connected.', 'aisuite-seo-pro' ),
				esc_url( admin_url( 'admin.php?page=aisuite' ) ),
				esc_html__( 'Connect now', 'aisuite-seo-pro' )
			);
			return;
		}

		if ( class_exists( 'AISuite_SEO_Pro' ) && '' === AISuite_SEO_Pro::license_key() ) {
			printf(
				'<div class="notice notice-warning"><p>%s <a href="%s">%s</a></p></div>',
				esc_html__( 'Enter your AI Suite SEO Pro license key to receive plugin updates.', 'aisuite-seo-pro' ),
				esc_url( admin_url( 'admin.php?page=aisuite-seo-pro' ) ),
				esc_html__( 'Add license key', 'aisuite-seo-pro' )
				);
			return;
		}

		if ( class_exists( 'AISuite_SEO_Pro' ) && ! AISuite_SEO_Pro::license_is_valid( AISuite_SEO_Pro::license_key() ) ) {
			printf(
				'<div class="notice notice-error"><p>%s <a href="%s">%s</a></p></div>',
				esc_html__( 'The AI Suite SEO Pro license key is not in a valid format.', 'aisuite-seo-pro' ),
				esc_url( admin_url( 'admin.php?page=aisuite-seo-pro' ) ),
				esc_html__( 'Replace license key', 'aisuite-seo-pro' )
			);
			return;
		}

		$remote = $this->remote();

		if ( is_array( $remote ) && array_key_exists( 'package', $remote ) && empty( $remote['package'] ) ) {
			printf(
				'<div class="notice notice-warning"><p>%s</p></div>',
				esc_html__( 'This AI Suite SEO Pro license is not active, so plugin updates are unavailable.', 'aisuite-seo-pro' )
			);
		}
	}
}
