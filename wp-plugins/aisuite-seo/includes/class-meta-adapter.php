<?php
/**
 * Native metadata storage adapters.
 *
 * AI Suite owns the review workflow, but the SEO plugin already selected by
 * the site owner should remain the source of truth. Approved values are
 * therefore written through that plugin's native API/storage and mirrored in
 * AI Suite's post meta so they survive a later deactivation or migration.
 */

defined( 'ABSPATH' ) || exit;

class FounderPostAI_AISuite_SEO_Meta_Adapter {

	const PROVIDER_FOUNDERPOSTAI = 'founderpostai_aisuite_seo';
	const PROVIDER_YOAST   = 'yoast';
	const PROVIDER_RANKMATH = 'rankmath';
	const PROVIDER_AIOSEO  = 'aioseo';
	const PROVIDER_SEOPRESS = 'seopress';

	/**
	 * @return string Active metadata provider slug.
	 */
	public static function provider() {
		if ( defined( 'WPSEO_VERSION' ) || class_exists( 'WPSEO_Meta' ) ) {
			return self::PROVIDER_YOAST;
		}

		if ( defined( 'RANK_MATH_VERSION' ) || class_exists( '\\RankMath\\Post' ) ) {
			return self::PROVIDER_RANKMATH;
		}

		if ( defined( 'AIOSEO_VERSION' ) || class_exists( '\\AIOSEO\\Plugin\\Common\\Models\\Post' ) ) {
			return self::PROVIDER_AIOSEO;
		}

		if ( defined( 'SEOPRESS_VERSION' ) ) {
			return self::PROVIDER_SEOPRESS;
		}

		return self::PROVIDER_FOUNDERPOSTAI;
	}

	public static function label( $provider = '' ) {
		$provider = $provider ? $provider : self::provider();
		$labels   = array(
			self::PROVIDER_FOUNDERPOSTAI => __( 'AI Suite SEO', 'founderpostai-ai-suite-seo' ),
			self::PROVIDER_YOAST   => __( 'Yoast SEO', 'founderpostai-ai-suite-seo' ),
			self::PROVIDER_RANKMATH => __( 'Rank Math', 'founderpostai-ai-suite-seo' ),
			self::PROVIDER_AIOSEO  => __( 'All in One SEO', 'founderpostai-ai-suite-seo' ),
			self::PROVIDER_SEOPRESS => __( 'SEOPress', 'founderpostai-ai-suite-seo' ),
		);

		return isset( $labels[ $provider ] ) ? $labels[ $provider ] : $labels[ self::PROVIDER_FOUNDERPOSTAI ];
	}

	/**
	 * Read the explicit title or description from the active provider.
	 *
	 * Empty provider values fall back to AI Suite's mirror. This preserves
	 * approved metadata created before native adapters were introduced.
	 */
	public static function read( $post_id, $field ) {
		$post_id = (int) $post_id;
		$field   = self::valid_field( $field );

		if ( ! $post_id || ! $field ) {
			return '';
		}

		$value = self::read_native( $post_id, $field, self::provider() );

		if ( '' !== trim( (string) $value ) ) {
			return (string) $value;
		}

		// Once AI Suite has written this provider natively, an empty value is
		// meaningful too: the owner may have deliberately cleared it there.
		if ( self::provider() === get_post_meta( $post_id, self::provider_key( $field ), true ) ) {
			return '';
		}

		return (string) get_post_meta( $post_id, self::mirror_key( $field ), true );
	}

	/**
	 * Batch read for audits. WordPress primes ordinary post meta in one query;
	 * AIOSEO uses its own table, so that provider gets one bounded SQL read too.
	 *
	 * @return array<int,array{title:string,description:string}>
	 */
	public static function read_many( array $post_ids ) {
		$post_ids = array_values( array_unique( array_filter( array_map( 'intval', $post_ids ) ) ) );
		$values   = array();

		if ( empty( $post_ids ) ) {
			return $values;
		}

		update_meta_cache( 'post', $post_ids );

		foreach ( $post_ids as $post_id ) {
			$values[ $post_id ] = array(
				'title'       => '',
				'description' => '',
			);
		}

		if ( self::PROVIDER_AIOSEO === self::provider() ) {
			global $wpdb;

			$table        = $wpdb->prefix . 'aioseo_posts';
			$placeholders = implode( ',', array_fill( 0, count( $post_ids ), '%d' ) );
			$query_args   = array_merge( array( $table ), $post_ids );
			// One prepared query avoids two AIOSEO model queries per audited post.
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- placeholders are generated locally and every value is prepared here.
			$rows = $wpdb->get_results( $wpdb->prepare( "SELECT post_id, title, description FROM %i WHERE post_id IN ({$placeholders})", $query_args ) );

			foreach ( (array) $rows as $row ) {
				$post_id = (int) $row->post_id;
				if ( isset( $values[ $post_id ] ) ) {
					$values[ $post_id ]['title']       = (string) $row->title;
					$values[ $post_id ]['description'] = (string) $row->description;
				}
			}

			foreach ( $values as $post_id => $fields ) {
				foreach ( array( 'title', 'description' ) as $field ) {
					if ( '' === trim( $fields[ $field ] ) && self::provider() !== get_post_meta( $post_id, self::provider_key( $field ), true ) ) {
						$values[ $post_id ][ $field ] = (string) get_post_meta( $post_id, self::mirror_key( $field ), true );
					}
				}
			}

			return $values;
		}

		foreach ( $post_ids as $post_id ) {
			$values[ $post_id ]['title']       = self::read( $post_id, 'title' );
			$values[ $post_id ]['description'] = self::read( $post_id, 'description' );
		}

		return $values;
	}

	/**
	 * Persist through the active provider, then update the portability mirror.
	 *
	 * @return true|WP_Error
	 */
	public static function write( $post_id, $field, $value ) {
		$post_id = (int) $post_id;
		$field   = self::valid_field( $field );
		$value   = (string) $value;

		if ( ! $post_id || ! $field ) {
			return new WP_Error( 'founderpostai_aisuite_seo_invalid_meta', __( 'The metadata field is invalid.', 'founderpostai-ai-suite-seo' ) );
		}

		$provider = self::provider();
		$written  = self::write_native( $post_id, $field, $value, $provider );

		if ( is_wp_error( $written ) ) {
			return $written;
		}

		if ( false === $written && $value !== (string) self::read_native( $post_id, $field, $provider ) ) {
			return new WP_Error( 'founderpostai_aisuite_seo_write_failed', __( 'The active SEO plugin could not save that metadata.', 'founderpostai-ai-suite-seo' ) );
		}

		$mirror_key = self::mirror_key( $field );
		$mirrored   = update_post_meta( $post_id, $mirror_key, $value );

		if ( false === $mirrored && $value !== (string) get_post_meta( $post_id, $mirror_key, true ) ) {
			return new WP_Error( 'founderpostai_aisuite_seo_write_failed', __( 'WordPress could not save the metadata portability copy.', 'founderpostai-ai-suite-seo' ) );
		}

		update_post_meta( $post_id, self::provider_key( $field ), $provider );

		return true;
	}

	protected static function read_native( $post_id, $field, $provider ) {
		switch ( $provider ) {
			case self::PROVIDER_YOAST:
				$key = 'title' === $field ? 'title' : 'metadesc';
				if ( class_exists( 'WPSEO_Meta' ) && is_callable( array( 'WPSEO_Meta', 'get_value' ) ) ) {
					return (string) WPSEO_Meta::get_value( $key, $post_id );
				}
				return (string) get_post_meta( $post_id, '_yoast_wpseo_' . $key, true );

			case self::PROVIDER_RANKMATH:
				if ( class_exists( '\\RankMath\\Post' ) && is_callable( array( '\\RankMath\\Post', 'get_meta' ) ) ) {
					return (string) \RankMath\Post::get_meta( $field, $post_id );
				}
				return (string) get_post_meta( $post_id, 'rank_math_' . $field, true );

			case self::PROVIDER_AIOSEO:
				$class = '\\AIOSEO\\Plugin\\Common\\Models\\Post';
				if ( class_exists( $class ) && is_callable( array( $class, 'getPost' ) ) ) {
					$model = $class::getPost( $post_id );
					return is_object( $model ) && isset( $model->{$field} ) ? (string) $model->{$field} : '';
				}
				return '';

			case self::PROVIDER_SEOPRESS:
				return (string) get_post_meta( $post_id, 'title' === $field ? '_seopress_titles_title' : '_seopress_titles_desc', true );

			default:
				return (string) get_post_meta( $post_id, self::mirror_key( $field ), true );
		}
	}

	/** @return bool|WP_Error */
	protected static function write_native( $post_id, $field, $value, $provider ) {
		switch ( $provider ) {
			case self::PROVIDER_YOAST:
				$key = 'title' === $field ? 'title' : 'metadesc';
				if ( class_exists( 'WPSEO_Meta' ) && is_callable( array( 'WPSEO_Meta', 'set_value' ) ) ) {
					return WPSEO_Meta::set_value( $key, $value, $post_id );
				}
				return update_post_meta( $post_id, '_yoast_wpseo_' . $key, $value );

			case self::PROVIDER_RANKMATH:
				return update_post_meta( $post_id, 'rank_math_' . $field, $value );

			case self::PROVIDER_AIOSEO:
				$class = '\\AIOSEO\\Plugin\\Common\\Models\\Post';
				if ( ! class_exists( $class ) ) {
					return new WP_Error( 'founderpostai_aisuite_seo_aioseo_unavailable', __( 'All in One SEO is active but its post model is unavailable.', 'founderpostai-ai-suite-seo' ) );
				}

				// savePost is AIOSEO's own post-save path: it applies its filters,
				// maintains multilingual compatibility meta, clears caches, and
				// fires aioseo_insert_post without touching unspecified fields.
				if ( is_callable( array( $class, 'savePost' ) ) ) {
					$result = $class::savePost( $post_id, array( $field => $value ) );
					if ( is_string( $result ) && '' !== $result ) {
						return new WP_Error( 'founderpostai_aisuite_seo_write_failed', __( 'All in One SEO reported a database error while saving.', 'founderpostai-ai-suite-seo' ) );
					}
					return false === $result
						? new WP_Error( 'founderpostai_aisuite_seo_write_failed', __( 'All in One SEO could not save that metadata.', 'founderpostai-ai-suite-seo' ) )
						: true;
				}

				if ( ! is_callable( array( $class, 'getPost' ) ) ) {
					return new WP_Error( 'founderpostai_aisuite_seo_aioseo_unavailable', __( 'All in One SEO could not open this post metadata.', 'founderpostai-ai-suite-seo' ) );
				}

				$model = $class::getPost( $post_id );
				if ( ! is_object( $model ) || ! is_callable( array( $model, 'save' ) ) ) {
					return new WP_Error( 'founderpostai_aisuite_seo_aioseo_unavailable', __( 'All in One SEO could not open this post metadata.', 'founderpostai-ai-suite-seo' ) );
				}

				$model->{$field} = $value;
				$model->updated  = gmdate( 'Y-m-d H:i:s' );
				$model->save();
					// phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- Fires AIOSEO's own cache/integration hook.
					do_action( 'aioseo_insert_post', $post_id );

				if ( function_exists( 'aioseo' ) && aioseo()->core->db->lastError() ) {
					return new WP_Error( 'founderpostai_aisuite_seo_write_failed', __( 'All in One SEO reported a database error while saving.', 'founderpostai-ai-suite-seo' ) );
				}

				return true;

			case self::PROVIDER_SEOPRESS:
				return update_post_meta( $post_id, 'title' === $field ? '_seopress_titles_title' : '_seopress_titles_desc', $value );

			default:
				return update_post_meta( $post_id, self::mirror_key( $field ), $value );
		}
	}

	protected static function valid_field( $field ) {
		return in_array( $field, array( 'title', 'description' ), true ) ? $field : '';
	}

	protected static function mirror_key( $field ) {
		return 'title' === $field ? '_founderpostai_aisuite_seo_title' : '_founderpostai_aisuite_seo_description';
	}

	public static function provider_key( $field ) {
		return 'title' === $field ? '_founderpostai_aisuite_seo_title_provider' : '_founderpostai_aisuite_seo_description_provider';
	}
}
