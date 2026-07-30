<?php
/**
 * Brand context.
 *
 * The single reason the bundle beats five separate plugins: the customer
 * describes their business once, and every module — SEO, forms, storekeeper —
 * gets the same voice, audience, and constraints. Attach it to every job.
 */

defined( 'ABSPATH' ) || exit;

class AISuite_Brand_Context {

	const OPTION = 'aisuite_brand_context';

	public function defaults() {
		return array(
			'business_name'   => get_bloginfo( 'name' ),
			'what_you_do'     => '',
			'audience'        => '',
			'tone'            => 'clear and direct',
			'locale'          => get_locale(),
			'primary_market'  => '',
			'avoid_phrases'   => '',
			'style_notes'     => '',
		);
	}

	/**
	 * @return array
	 */
	public function get() {
		$stored = get_option( self::OPTION, array() );
		$stored = is_array( $stored ) ? $stored : array();

		return wp_parse_args( $stored, $this->defaults() );
	}

	public function save( array $input ) {
		$clean = array();

		foreach ( $this->defaults() as $key => $default ) {
			$value        = isset( $input[ $key ] ) ? $input[ $key ] : $default;
			$clean[ $key ] = sanitize_textarea_field( $value );
		}

		update_option( self::OPTION, $clean, false );

		return $clean;
	}

	/** Enough context filled in that job output won't be generic. */
	public function is_complete() {
		$context = $this->get();
		return '' !== trim( $context['what_you_do'] ) && '' !== trim( $context['audience'] );
	}
}
