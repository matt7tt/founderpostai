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

		// These filters cover provider caches and metadata approved by versions
		// before native adapters existed. Native storage remains authoritative.
		add_filter( 'wpseo_title', array( $this, 'integration_title' ) );
		add_filter( 'wpseo_metadesc', array( $this, 'integration_description' ) );
		add_filter( 'rank_math/frontend/title', array( $this, 'integration_title' ) );
		add_filter( 'rank_math/frontend/description', array( $this, 'integration_description' ) );
		add_filter( 'aioseo_title', array( $this, 'integration_title' ) );
		add_filter( 'aioseo_description', array( $this, 'integration_description' ) );
		add_filter( 'seopress_titles_title', array( $this, 'integration_title' ) );
		add_filter( 'seopress_titles_desc', array( $this, 'integration_description' ) );
	}

	/**
	 * @return string|false Name of the conflicting plugin, or false.
	 */
	public static function conflicting_plugin() {
		$provider = AISuite_SEO_Meta_Adapter::provider();

		return AISuite_SEO_Meta_Adapter::PROVIDER_AISUITE === $provider ? false : AISuite_SEO_Meta_Adapter::label( $provider );
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

	public function integration_title( $title ) {
		return $this->integration_value( $title, AISuite_SEO_Optimizer::META_TITLE );
	}

	public function integration_description( $description ) {
		return $this->integration_value( $description, AISuite_SEO_Optimizer::META_DESCRIPTION );
	}

	protected function integration_value( $current, $meta_key ) {
		if ( ! is_singular() ) {
			return $current;
		}

		$post_id = get_queried_object_id();
		$field   = AISuite_SEO_Optimizer::META_TITLE === $meta_key ? 'title' : 'description';

		$custom = get_post_meta( $post_id, $meta_key, true );
		$marker = get_post_meta( $post_id, AISuite_SEO_Meta_Adapter::provider_key( $field ), true );

		if ( AISuite_SEO_Meta_Adapter::provider() === $marker ) {
			$native = AISuite_SEO_Meta_Adapter::read( $post_id, $field );

			// A later manual edit (including clearing the field) wins. When the
			// values still match, return the mirror to cover a stale provider
			// index/cache immediately after the native write.
			return '' !== trim( (string) $custom ) && (string) $native === (string) $custom ? (string) $custom : $current;
		}

		// Compatibility for values approved before native adapters existed.

		return '' !== trim( (string) $custom ) ? (string) $custom : $current;
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
