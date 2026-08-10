<?php
/**
 * Module registry.
 *
 * Feature plugins register on 'aisuite_register_modules'. Core uses this for
 * the dashboard, and for telling the gateway which job types this site can
 * actually handle results for.
 */

defined( 'ABSPATH' ) || exit;

class AISuite_Modules {

	/** @var array */
	protected $modules = array();

	public function __construct() {
		// Module registration uses translated labels. WordPress 6.7+ warns when
		// just-in-time translation is triggered before init.
		add_action( 'init', array( $this, 'collect' ), 5 );
	}

	public function collect() {
		do_action( 'founderpostai_aisuite_register_modules', $this );
		// Backward compatibility for modules released before Core 0.1.5.
		do_action( 'aisuite_register_modules', $this );
	}

	/**
	 * @param string $slug   Unique module slug, e.g. 'seo'.
	 * @param array  $args   name, description, settings_url, job_types, is_pro.
	 */
	public function register( $slug, array $args ) {
		$this->modules[ sanitize_key( $slug ) ] = wp_parse_args(
			$args,
			array(
				'name'         => $slug,
				'description'  => '',
				'settings_url' => '',
				'job_types'    => array(),
				'is_pro'       => false,
			)
		);
	}

	/** @return array */
	public function all() {
		return $this->modules;
	}

	public function has( $slug ) {
		return isset( $this->modules[ sanitize_key( $slug ) ] );
	}
}
