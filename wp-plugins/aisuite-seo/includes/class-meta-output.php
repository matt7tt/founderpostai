<?php
/**
 * Frontend output.
 *
 * If Yoast, Rank Math, AIOSEO, or SEOPress is active, this class stays quiet
 * and lets them own the head. Two plugins printing competing canonical and OG
 * tags is worse for the customer than doing nothing, and "your plugin broke my
 * meta tags" is an unrecoverable review.
 */

defined( 'ABSPATH' ) || exit;

class AISuite_SEO_Meta_Output {

	public function __construct() {
		add_action( 'wp_head', array( $this, 'output' ), 1 );
		add_filter( 'document_title_parts', array( $this, 'filter_title' ) );
	}

	/**
	 * @return string|false Name of the conflicting plugin, or false.
	 */
	public static function conflicting_plugin() {
		$conflicts = array(
			'Yoast SEO'   => 'WPSEO_VERSION',
			'Rank Math'   => 'RANK_MATH_VERSION',
			'All in One SEO' => 'AIOSEO_VERSION',
			'SEOPress'    => 'SEOPRESS_VERSION',
		);

		foreach ( $conflicts as $name => $constant ) {
			if ( defined( $constant ) ) {
				return $name;
			}
		}

		return false;
	}

	protected function should_output() {
		return is_singular() && ! self::conflicting_plugin();
	}

	public function filter_title( $parts ) {
		if ( ! $this->should_output() ) {
			return $parts;
		}

		$custom = get_post_meta( get_queried_object_id(), AISuite_SEO_Optimizer::META_TITLE, true );

		if ( $custom ) {
			$parts['title'] = $custom;
			unset( $parts['tagline'] );
		}

		return $parts;
	}

	public function output() {
		if ( ! $this->should_output() ) {
			return;
		}

		$post_id     = get_queried_object_id();
		$title       = get_post_meta( $post_id, AISuite_SEO_Optimizer::META_TITLE, true );
		$description = get_post_meta( $post_id, AISuite_SEO_Optimizer::META_DESCRIPTION, true );

		if ( ! $title && ! $description ) {
			return;
		}

		echo "\n<!-- AI Suite SEO -->\n";

		if ( $description ) {
			printf( "<meta name=\"description\" content=\"%s\" />\n", esc_attr( $description ) );
			printf( "<meta property=\"og:description\" content=\"%s\" />\n", esc_attr( $description ) );
		}

		if ( $title ) {
			printf( "<meta property=\"og:title\" content=\"%s\" />\n", esc_attr( $title ) );
		}

		printf( "<meta property=\"og:url\" content=\"%s\" />\n", esc_url( get_permalink( $post_id ) ) );
		printf( "<meta property=\"og:type\" content=\"%s\" />\n", 'article' );
	}
}
