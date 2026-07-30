<?php
/**
 * Request analyses, receive results, apply approved changes.
 *
 * Nothing here writes to a post until a human approves it. That constraint is
 * the product — "it changed my site without asking" is how an SEO plugin dies
 * on the .org reviews page.
 */

defined( 'ABSPATH' ) || exit;

class AISuite_SEO_Optimizer {

	const META_TITLE       = '_aisuite_seo_title';
	const META_DESCRIPTION = '_aisuite_seo_description';
	const META_INDEXED     = '_aisuite_seo_indexed_hash';
	const META_QUEUED      = '_aisuite_seo_queued';

	/** Fields the gateway may return. Anything else is dropped. */
	const FIELDS = array( 'title', 'description', 'internal_links' );

	public function __construct() {
		add_action( 'aisuite_job_completed_seo.analyze_post', array( $this, 'receive_analysis' ), 10, 2 );
		add_action( 'aisuite_job_failed_seo.analyze_post', array( $this, 'receive_failure' ), 10, 2 );
	}

	/**
	 * Queue a post for analysis. Sends the content the gateway needs and nothing
	 * more — no user emails, no unrelated meta.
	 *
	 * @param int  $post_id      Post to analyze.
	 * @param bool $enforce_caps Check the current user's rights. Pass false only
	 *                           for work started by cron or a gateway callback,
	 *                           where there is no current user at all — an
	 *                           unconditional check there fails every time and
	 *                           silently disables scheduled runs.
	 * @return string|WP_Error Local job reference.
	 */
	public function analyze( $post_id, $enforce_caps = true ) {
		$post = get_post( $post_id );

		if ( ! $post || 'trash' === $post->post_status ) {
			return new WP_Error( 'aisuite_seo_no_post', __( 'Post not found.', 'aisuite-seo' ) );
		}

		if ( $enforce_caps && ! current_user_can( 'edit_post', $post_id ) ) {
			return new WP_Error( 'aisuite_seo_denied', __( 'You cannot edit this post.', 'aisuite-seo' ) );
		}

		$payload = array(
			'post_id'      => (int) $post_id,
			'permalink'    => get_permalink( $post ),
			'post_type'    => $post->post_type,
			'title'        => $post->post_title,
			'content'      => wp_strip_all_tags( $post->post_content ),
			'excerpt'      => $post->post_excerpt,
			'current_meta' => array(
				'title'       => (string) get_post_meta( $post_id, self::META_TITLE, true ),
				'description' => (string) get_post_meta( $post_id, self::META_DESCRIPTION, true ),
			),
			'link_targets' => $this->link_candidates( $post_id ),
		);

		$ref = aisuite()->jobs->enqueue( 'seo.analyze_post', $payload, array( 'post_id' => (int) $post_id ) );

		if ( ! is_wp_error( $ref ) ) {
			// In-flight marker so bulk runs never queue (and charge for) the
			// same post twice while its first analysis is still processing.
			update_post_meta( $post_id, self::META_QUEUED, time() );
		}

		return $ref;
	}

	/**
	 * Candidate internal link targets.
	 *
	 * Sent as a closed list so the model proposes links to pages that actually
	 * exist. Hallucinated internal links are the single most common failure in
	 * this category.
	 */
	protected function link_candidates( $exclude_id, $limit = 60 ) {
		$posts = get_posts(
			array(
				'post_type'        => array( 'post', 'page' ),
				'post_status'      => 'publish',
				'posts_per_page'   => $limit,
				'exclude'          => array( (int) $exclude_id ),
				'orderby'          => 'modified',
				'order'            => 'DESC',
				'suppress_filters' => false,
			)
		);

		$candidates = array();

		foreach ( $posts as $post ) {
			$candidates[] = array(
				'id'    => $post->ID,
				'title' => $post->post_title,
				'url'   => get_permalink( $post ),
			);
		}

		return $candidates;
	}

	/**
	 * Gateway result → pending suggestions.
	 */
	public function receive_analysis( $result, $context ) {
		$post_id = isset( $context['post_id'] ) ? (int) $context['post_id'] : 0;

		if ( ! $post_id || ! get_post( $post_id ) ) {
			return;
		}

		$suggestions = isset( $result['suggestions'] ) ? (array) $result['suggestions'] : array();

		foreach ( $suggestions as $suggestion ) {
			$field = isset( $suggestion['field'] ) ? sanitize_key( $suggestion['field'] ) : '';

			if ( ! in_array( $field, self::FIELDS, true ) ) {
				continue;
			}

			$value = isset( $suggestion['value'] ) ? $suggestion['value'] : '';

			if ( 'internal_links' === $field ) {
				$value = wp_json_encode( $this->filter_links( (array) $value ) );
			} else {
				$value = sanitize_text_field( $value );
			}

			if ( '' === $value || '[]' === $value ) {
				continue;
			}

			// A suggestion identical to what's already there is pure queue noise.
			if ( in_array( $field, array( 'title', 'description' ), true ) && $value === $this->current_value( $post_id, $field ) ) {
				continue;
			}

			AISuite_SEO_Store::put(
				$post_id,
				$field,
				$this->current_value( $post_id, $field ),
				$value,
				isset( $suggestion['rationale'] ) ? sanitize_text_field( $suggestion['rationale'] ) : ''
			);
		}

		delete_post_meta( $post_id, '_aisuite_seo_error' );
		delete_post_meta( $post_id, self::META_QUEUED );
		update_post_meta( $post_id, '_aisuite_seo_analyzed', time() );
	}

	public function receive_failure( $message, $context ) {
		$post_id = isset( $context['post_id'] ) ? (int) $context['post_id'] : 0;

		if ( $post_id ) {
			delete_post_meta( $post_id, self::META_QUEUED );
			update_post_meta( $post_id, '_aisuite_seo_error', sanitize_text_field( $message ) );
		}
	}

	/**
	 * Drop any proposed link whose target isn't a real published post here.
	 */
	protected function filter_links( array $links ) {
		$clean = array();

		foreach ( $links as $link ) {
			$target = isset( $link['target_id'] ) ? (int) $link['target_id'] : 0;
			$anchor = isset( $link['anchor'] ) ? sanitize_text_field( $link['anchor'] ) : '';

			if ( ! $target || '' === $anchor ) {
				continue;
			}

			$post = get_post( $target );

			if ( ! $post || 'publish' !== $post->post_status ) {
				continue;
			}

			$clean[] = array(
				'target_id' => $target,
				'anchor'    => $anchor,
				'url'       => get_permalink( $post ),
			);
		}

		return $clean;
	}

	public function current_value( $post_id, $field ) {
		switch ( $field ) {
			case 'title':
				return (string) get_post_meta( $post_id, self::META_TITLE, true );
			case 'description':
				return (string) get_post_meta( $post_id, self::META_DESCRIPTION, true );
			default:
				return '';
		}
	}

	/**
	 * Apply an approved suggestion.
	 *
	 * @return true|WP_Error
	 */
	public function apply( $suggestion_id, $enforce_caps = true ) {
		$row = AISuite_SEO_Store::get( $suggestion_id );

		if ( ! $row ) {
			return new WP_Error( 'aisuite_seo_missing', __( 'That suggestion no longer exists.', 'aisuite-seo' ) );
		}

		if ( 'pending' !== $row->status ) {
			return new WP_Error( 'aisuite_seo_resolved', __( 'That suggestion has already been handled.', 'aisuite-seo' ) );
		}

		if ( $enforce_caps && ! current_user_can( 'edit_post', $row->post_id ) ) {
			return new WP_Error( 'aisuite_seo_denied', __( 'You cannot edit this post.', 'aisuite-seo' ) );
		}

		switch ( $row->field ) {
			case 'title':
				update_post_meta( $row->post_id, self::META_TITLE, sanitize_text_field( $row->suggested_value ) );
				break;

			case 'description':
				update_post_meta( $row->post_id, self::META_DESCRIPTION, sanitize_text_field( $row->suggested_value ) );
				break;

			case 'internal_links':
				$applied = $this->insert_links( $row->post_id, json_decode( $row->suggested_value, true ) );

				if ( is_wp_error( $applied ) ) {
					return $applied;
				}
				break;

			default:
				return new WP_Error( 'aisuite_seo_unknown_field', __( 'Unknown suggestion type.', 'aisuite-seo' ) );
		}

		AISuite_SEO_Store::resolve( $suggestion_id, 'approved' );

		return true;
	}

	public function reject( $suggestion_id, $enforce_caps = true ) {
		$row = AISuite_SEO_Store::get( $suggestion_id );

		if ( ! $row ) {
			return new WP_Error( 'aisuite_seo_missing', __( 'That suggestion no longer exists.', 'aisuite-seo' ) );
		}

		if ( $enforce_caps && ! current_user_can( 'edit_post', $row->post_id ) ) {
			return new WP_Error( 'aisuite_seo_denied', __( 'You cannot edit this post.', 'aisuite-seo' ) );
		}

		AISuite_SEO_Store::resolve( $suggestion_id, 'rejected' );

		return true;
	}

	/**
	 * Insert internal links into post content.
	 *
	 * Delegates to the block/DOM-aware inserter. A revision is saved first, so
	 * the change is always reversible from the editor.
	 *
	 * @return true|WP_Error
	 */
	protected function insert_links( $post_id, $links ) {
		if ( empty( $links ) || ! is_array( $links ) ) {
			return new WP_Error( 'aisuite_seo_no_links', __( 'No usable links in this suggestion.', 'aisuite-seo' ) );
		}

		$post = get_post( $post_id );

		if ( ! $post ) {
			return new WP_Error( 'aisuite_seo_no_post', __( 'Post not found.', 'aisuite-seo' ) );
		}

		// Suggestions can sit in the queue for days. Re-check each target and
		// refresh its permalink at apply time, so an unpublished target is
		// dropped and a changed permalink never becomes a broken link.
		$links = $this->filter_links( $links );

		if ( empty( $links ) ) {
			return new WP_Error( 'aisuite_seo_no_links', __( 'The linked pages are no longer published, so nothing was changed.', 'aisuite-seo' ) );
		}

		$inserter = new AISuite_SEO_Link_Inserter();
		$result   = $inserter->insert( $post->post_content, $links );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		if ( $result['content'] === $post->post_content ) {
			return new WP_Error( 'aisuite_seo_noop', __( 'Nothing changed, so the post was left alone.', 'aisuite-seo' ) );
		}

		wp_save_post_revision( $post_id );

		$updated = wp_update_post(
			array(
				'ID'           => $post_id,
				'post_content' => $result['content'],
			),
			true
		);

		if ( is_wp_error( $updated ) ) {
			return $updated;
		}

		return true;
	}
}
