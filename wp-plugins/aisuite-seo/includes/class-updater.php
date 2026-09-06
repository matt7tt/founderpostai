<?php
/** Public, license-free updater for direct-download installations. */
defined( 'ABSPATH' ) || exit;

class FounderPostAI_AISuite_SEO_Updater {
	const CACHE = 'founderpostai_aisuite_seo_update';
	public function __construct() {
		add_filter( 'update_plugins_founderpostai.com', array( $this, 'update' ), 10, 3 );
		add_filter( 'plugins_api', array( $this, 'info' ), 20, 3 );
	}

	protected function remote() {
		$cached = get_transient( self::CACHE );
		if ( false !== $cached ) {
			return $cached;
		}
		$response = wp_remote_get( 'https://founderpostai.com/api/plugins/seo', array( 'timeout' => 8 ) );
		if ( is_wp_error( $response ) || 200 !== (int) wp_remote_retrieve_response_code( $response ) ) {
			set_transient( self::CACHE, array(), 5 * MINUTE_IN_SECONDS );
			return array();
		}
		$data = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( ! is_array( $data ) || empty( $data['version'] ) || ! is_string( $data['version'] ) || empty( $data['package'] ) || 'https://founderpostai.com/downloads/aisuite-seo.zip' !== $data['package'] ) {
			return array();
		}
		set_transient( self::CACHE, $data, 6 * HOUR_IN_SECONDS );
		return $data;
	}

	public function update( $update, $data, $file ) {
		if ( $file !== plugin_basename( FOUNDERPOSTAI_AISUITE_SEO_FILE ) ) {
			return $update;
		}
		$remote = $this->remote();
		return empty( $remote ) ? $update : $remote;
	}

	public function info( $result, $action, $args ) {
		if ( 'plugin_information' !== $action || empty( $args->slug ) || 'aisuite-seo' !== $args->slug ) {
			return $result;
		}
		$remote = $this->remote();
		if ( empty( $remote ) ) {
			return $result;
		}
		$remote['download_link'] = $remote['package'];
		return (object) $remote;
	}
}
