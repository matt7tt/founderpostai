<?php
/**
 * Whole-site internal-link candidate retrieval.
 *
 * The gateway should see the most relevant real pages, not merely the latest
 * ones. This scanner considers every published public post in bounded batches,
 * keeps only the strongest candidates in memory, and sends that closed list to
 * the AI for final semantic selection and exact-anchor matching.
 */

defined( 'ABSPATH' ) || exit;

class AISuite_SEO_Link_Candidates {

	const DEFAULT_LIMIT = 60;
	const BATCH_SIZE    = 250;

	public static function select( $source_id, $limit = self::DEFAULT_LIMIT ) {
		$source = get_post( $source_id );
		$limit  = max( 1, min( 100, (int) $limit ) );

		if ( ! $source ) {
			return array();
		}

		$post_types = function_exists( 'get_post_types' ) ? get_post_types( array( 'public' => true ), 'names' ) : array( 'post', 'page' );
		$post_types = array_values( array_diff( (array) $post_types, array( 'attachment' ) ) );

		if ( empty( $post_types ) ) {
			$post_types = array( 'post', 'page' );
		}

		$profile = self::profile( $source );
		$ranked  = array();
		$page    = 1;
		$batch   = max( 25, (int) apply_filters( 'aisuite_seo_link_candidate_batch_size', self::BATCH_SIZE ) );

		do {
			$posts = get_posts(
				array(
					'post_type'        => $post_types,
					'post_status'      => 'publish',
					'posts_per_page'   => $batch,
					'paged'            => $page,
					'orderby'          => 'ID',
					'order'            => 'ASC',
					'no_found_rows'    => true,
					'suppress_filters' => false,
				)
			);

			foreach ( $posts as $post ) {
				if ( (int) $post->ID === (int) $source_id ) {
					continue;
				}

				$ranked[] = array(
					'id'       => (int) $post->ID,
					'title'    => (string) $post->post_title,
					'url'      => get_permalink( $post ),
					'_score'   => self::score( $profile, $post ),
					'_modified' => isset( $post->post_modified_gmt ) ? strtotime( $post->post_modified_gmt . ' UTC' ) : 0,
				);
			}

			// Retaining a small top pool makes memory independent of site size.
			if ( count( $ranked ) > $limit * 6 ) {
				self::sort( $ranked );
				$ranked = array_slice( $ranked, 0, $limit * 3 );
			}

			++$page;
		} while ( count( $posts ) === $batch );

		self::sort( $ranked );
		$ranked = array_slice( $ranked, 0, $limit );

		foreach ( $ranked as &$candidate ) {
			unset( $candidate['_score'], $candidate['_modified'] );
		}
		unset( $candidate );

		return $ranked;
	}

	/**
	 * Public pure ranking helper for behavioral tests and integrations.
	 */
	public static function rank( $source, array $posts, $limit = self::DEFAULT_LIMIT ) {
		$profile = self::profile( $source );
		$ranked  = array();

		foreach ( $posts as $post ) {
			if ( ! is_object( $post ) || (int) $post->ID === (int) $source->ID ) {
				continue;
			}

			$ranked[] = array(
				'post'      => $post,
				'_score'    => self::score( $profile, $post ),
				'_modified' => isset( $post->post_modified_gmt ) ? strtotime( $post->post_modified_gmt . ' UTC' ) : 0,
			);
		}

		self::sort( $ranked );

		return array_map(
			function ( $item ) {
				return $item['post'];
			},
			array_slice( $ranked, 0, max( 1, (int) $limit ) )
		);
	}

	protected static function profile( $post ) {
		$weights = array();
		$text    = self::lower( wp_strip_all_tags( (string) $post->post_content ) );

		self::add_terms( $weights, (string) $post->post_title, 8, 2 );
		self::add_terms( $weights, (string) $post->post_excerpt, 4, 2 );
		self::add_terms( $weights, $text, 1, 4 );

		return array(
			'terms'   => $weights,
			'content' => $text,
		);
	}

	protected static function score( array $profile, $post ) {
		$score       = 0.0;
		$title_terms = self::terms( (string) $post->post_title );
		$body_terms  = self::terms( (string) $post->post_excerpt . ' ' . self::first_chars( wp_strip_all_tags( (string) $post->post_content ), 800 ) );

		foreach ( array_unique( $title_terms ) as $term ) {
			if ( isset( $profile['terms'][ $term ] ) ) {
				$score += $profile['terms'][ $term ] * 5;
			}
		}

		foreach ( array_unique( $body_terms ) as $term ) {
			if ( isset( $profile['terms'][ $term ] ) ) {
				$score += $profile['terms'][ $term ];
			}
		}

		$title = trim( self::lower( wp_strip_all_tags( (string) $post->post_title ) ) );
		if ( strlen( $title ) >= 5 && false !== strpos( $profile['content'], $title ) ) {
			$score += 200;
		}

		return $score;
	}

	protected static function add_terms( array &$weights, $text, $weight, $frequency_cap ) {
		$counts = array_count_values( self::terms( $text ) );

		foreach ( $counts as $term => $count ) {
			$weights[ $term ] = isset( $weights[ $term ] ) ? $weights[ $term ] : 0;
			$weights[ $term ] += min( $frequency_cap, $count ) * $weight;
		}
	}

	protected static function terms( $text ) {
		$parts = preg_split( '/[^\p{L}\p{N}]+/u', self::lower( wp_strip_all_tags( (string) $text ) ), -1, PREG_SPLIT_NO_EMPTY );
		$stop  = array_flip(
			array(
				'the', 'and', 'for', 'that', 'with', 'this', 'from', 'your', 'you', 'are', 'was', 'were',
				'have', 'has', 'had', 'but', 'not', 'all', 'can', 'will', 'into', 'about', 'how', 'what',
				'when', 'where', 'who', 'why', 'our', 'out', 'use', 'using', 'than', 'then', 'them', 'they',
				'its', 'their', 'there', 'been', 'also', 'more', 'most', 'some', 'any', 'each', 'only', 'over',
			)
		);

		return array_values(
			array_filter(
				(array) $parts,
				function ( $term ) use ( $stop ) {
					return strlen( $term ) >= 3 && ! isset( $stop[ $term ] ) && ! is_numeric( $term );
				}
			)
		);
	}

	protected static function sort( array &$ranked ) {
		usort(
			$ranked,
			function ( $a, $b ) {
				if ( $a['_score'] === $b['_score'] ) {
					if ( $a['_modified'] === $b['_modified'] ) {
						$a_id = isset( $a['id'] ) ? $a['id'] : $a['post']->ID;
						$b_id = isset( $b['id'] ) ? $b['id'] : $b['post']->ID;
						return (int) $b_id - (int) $a_id;
					}
					return $a['_modified'] < $b['_modified'] ? 1 : -1;
				}
				return $a['_score'] < $b['_score'] ? 1 : -1;
			}
		);
	}

	protected static function lower( $value ) {
		return function_exists( 'mb_strtolower' ) ? mb_strtolower( (string) $value, 'UTF-8' ) : strtolower( (string) $value );
	}

	protected static function first_chars( $value, $length ) {
		return function_exists( 'mb_substr' ) ? mb_substr( (string) $value, 0, $length, 'UTF-8' ) : substr( (string) $value, 0, $length );
	}
}
