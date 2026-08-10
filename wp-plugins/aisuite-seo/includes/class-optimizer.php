<?php
/**
 * Request analyses, receive results, apply approved changes.
 *
 * Nothing here writes to a post until a human approves it. That constraint is
 * the product — "it changed my site without asking" is how an SEO plugin dies
 * on the .org reviews page.
 */

defined( 'ABSPATH' ) || exit;

class FounderPostAI_AISuite_SEO_Optimizer {

	const META_TITLE       = '_founderpostai_aisuite_seo_title';
	const META_DESCRIPTION = '_founderpostai_aisuite_seo_description';
	const META_INDEXED     = '_founderpostai_aisuite_seo_indexed_hash';
	const META_ANALYZED    = '_founderpostai_aisuite_seo_analyzed';
	const META_ERROR       = '_founderpostai_aisuite_seo_error';
	const META_QUEUED      = '_founderpostai_aisuite_seo_queued';
	const APPLY_LOCK       = 'founderpostai_aisuite_seo_apply_lock_';

	/** Fields the gateway may return. Anything else is dropped. */
	const FIELDS = array( 'title', 'description', 'internal_links' );

	public function __construct( $register_hooks = true ) {
		if ( $register_hooks ) {
			add_action( 'founderpostai_aisuite_job_completed_seo.analyze_post', array( $this, 'receive_analysis' ), 10, 2 );
			add_action( 'founderpostai_aisuite_job_failed_seo.analyze_post', array( $this, 'receive_failure' ), 10, 2 );
		}
	}

	/**
	 * Queue a post for analysis. Sends the content the gateway needs and nothing
	 * more — no user emails, no unrelated meta.
	 *
	 * @param int   $post_id      Post to analyze.
	 * @param bool  $enforce_caps Check the current user's rights. Pass false only
	 *                            for work started by cron or a gateway callback,
	 *                            where there is no current user at all — an
	 *                            unconditional check there fails every time and
	 *                            silently disables scheduled runs.
	 * @param array $review_request Optional focus and human refinement direction.
	 * @return string|WP_Error Local job reference.
	 */
	public function analyze( $post_id, $enforce_caps = true, array $review_request = array() ) {
		$post = get_post( $post_id );

		if ( ! $post || 'trash' === $post->post_status ) {
			return new WP_Error( 'founderpostai_aisuite_seo_no_post', __( 'Post not found.', 'founderpostai-ai-suite-seo' ) );
		}

		if ( $enforce_caps && ! current_user_can( 'edit_post', $post_id ) ) {
			return new WP_Error( 'founderpostai_aisuite_seo_denied', __( 'You cannot edit this post.', 'founderpostai-ai-suite-seo' ) );
		}

		$in_flight = (int) get_post_meta( $post_id, self::META_QUEUED, true );

		if ( $in_flight && time() - $in_flight < DAY_IN_SECONDS ) {
			return new WP_Error( 'founderpostai_aisuite_seo_already_queued', __( 'This post is already queued for analysis.', 'founderpostai-ai-suite-seo' ) );
		}

		if ( $in_flight ) {
			delete_post_meta( $post_id, self::META_QUEUED );
		}

		// Unique post meta is an atomic claim. Writing the marker after enqueue
		// allowed two simultaneous bulk/admin requests to charge for the same post.
		if ( ! add_post_meta( $post_id, self::META_QUEUED, time(), true ) ) {
			return new WP_Error( 'founderpostai_aisuite_seo_already_queued', __( 'This post is already queued for analysis.', 'founderpostai-ai-suite-seo' ) );
		}

		$payload = array(
			'post_id'        => (int) $post_id,
			'permalink'      => get_permalink( $post ),
			'post_type'      => $post->post_type,
			'title'          => $post->post_title,
			'content'        => wp_strip_all_tags( $post->post_content ),
			'excerpt'        => $post->post_excerpt,
			'current_meta'   => array(
				'title'       => $this->current_value( $post_id, 'title' ),
				'description' => $this->current_value( $post_id, 'description' ),
			),
			'link_targets'   => $this->link_candidates( $post_id ),
			'review_request' => array(
				'focus'       => isset( $review_request['focus'] ) && in_array( $review_request['focus'], self::FIELDS, true ) ? $review_request['focus'] : 'all',
				'instruction' => isset( $review_request['instruction'] ) ? $this->truncate( sanitize_text_field( $review_request['instruction'] ), 500 ) : '',
			),
		);

		$ref = founderpostai_aisuite()->jobs->enqueue(
			'seo.analyze_post',
			$payload,
			array(
				'post_id'        => (int) $post_id,
				'analysis_hash'  => self::analysis_hash( $post ),
				'review_focus'   => ! empty( $review_request ) && isset( $review_request['focus'] ) ? sanitize_key( $review_request['focus'] ) : '',
				'replace_review' => ! empty( $review_request ),
			)
		);

		if ( is_wp_error( $ref ) ) {
			delete_post_meta( $post_id, self::META_QUEUED );
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
		return FounderPostAI_AISuite_SEO_Link_Candidates::select( $exclude_id, $limit );
	}

	/**
	 * Gateway result → pending suggestions.
	 */
	public function receive_analysis( $result, $context ) {
		$post_id = isset( $context['post_id'] ) ? (int) $context['post_id'] : 0;

		if ( ! $post_id || ! get_post( $post_id ) ) {
			return;
		}

		if ( ! FounderPostAI_AISuite_SEO_Store::table_exists() ) {
			$this->receive_failure( __( 'The suggestions table is unavailable. Deactivate and reactivate AI Suite SEO, then try again.', 'founderpostai-ai-suite-seo' ), $context );
			return;
		}

		$suggestions   = isset( $result['suggestions'] ) ? (array) $result['suggestions'] : array();
		$store_failed  = false;
		$stored_fields = array();

		foreach ( $suggestions as $suggestion ) {
			if ( ! is_array( $suggestion ) ) {
				continue;
			}

			$field = isset( $suggestion['field'] ) ? sanitize_key( $suggestion['field'] ) : '';

			if ( ! in_array( $field, self::FIELDS, true ) ) {
				continue;
			}

			$value = isset( $suggestion['value'] ) ? $suggestion['value'] : '';

			if ( 'internal_links' === $field ) {
				$value = wp_json_encode( $this->filter_links( (array) $value, $post_id ) );
			} else {
				if ( ! is_scalar( $value ) ) {
					continue;
				}

				$value = sanitize_text_field( (string) $value );
				$value = $this->truncate(
					$value,
					'title' === $field ? 60 : 155
				);
			}

			if ( '' === $value || '[]' === $value ) {
				continue;
			}

			// A suggestion identical to what's already there is pure queue noise.
			if ( in_array( $field, array( 'title', 'description' ), true ) && $value === $this->current_value( $post_id, $field ) ) {
				continue;
			}

			$stored = FounderPostAI_AISuite_SEO_Store::put(
				$post_id,
				$field,
				$this->current_value( $post_id, $field ),
				$value,
				isset( $suggestion['rationale'] ) && is_scalar( $suggestion['rationale'] )
					? sanitize_text_field( (string) $suggestion['rationale'] )
					: ''
			);

			if ( ! $stored ) {
				$store_failed = true;
			} else {
				$stored_fields[ $field ] = true;
			}
		}

		if ( $store_failed ) {
			$this->receive_failure( __( 'A suggestion could not be saved. Check the site database and run the analysis again.', 'founderpostai-ai-suite-seo' ), $context );
			return;
		}

		if ( ! empty( $context['replace_review'] ) ) {
			$focus  = isset( $context['review_focus'] ) ? sanitize_key( $context['review_focus'] ) : 'all';
			$fields = in_array( $focus, self::FIELDS, true ) ? array( $focus ) : self::FIELDS;

			foreach ( $fields as $field ) {
				if ( empty( $stored_fields[ $field ] ) ) {
					FounderPostAI_AISuite_SEO_Store::dismiss_pending_field( $post_id, $field );
				}
			}
		}

		delete_post_meta( $post_id, self::META_ERROR );
		delete_post_meta( $post_id, self::META_QUEUED );
		$analysis_hash = isset( $context['analysis_hash'] ) ? (string) $context['analysis_hash'] : '';
		self::mark_current( $post_id, $analysis_hash );
		if ( class_exists( 'FounderPostAI_AISuite_SEO_Health_Screen' ) ) {
			FounderPostAI_AISuite_SEO_Health_Screen::invalidate();
		}
	}

	public function receive_failure( $message, $context ) {
		$post_id = isset( $context['post_id'] ) ? (int) $context['post_id'] : 0;

		if ( $post_id ) {
			delete_post_meta( $post_id, self::META_QUEUED );
			update_post_meta( $post_id, self::META_ERROR, sanitize_text_field( $message ) );
		}
	}

	/**
	 * Fingerprint the exact post fields used to request an analysis.
	 *
	 * HTML is stripped because that is what the gateway receives. Adding an
	 * approved link therefore does not make an otherwise unchanged analysis
	 * look stale, while edits to visible copy, metadata, or the permalink do.
	 *
	 * @param int|WP_Post $post         Post ID or object.
	 * @param array|null  $current_meta Optional preloaded title and description.
	 * @return string SHA-256 hash, or an empty string when the post is missing.
	 */
	public static function analysis_hash( $post, $current_meta = null ) {
		$post = get_post( $post );

		if ( ! $post ) {
			return '';
		}

		if ( ! is_array( $current_meta ) ) {
			$current_meta = array(
				'title'       => FounderPostAI_AISuite_SEO_Meta_Adapter::read( $post->ID, 'title' ),
				'description' => FounderPostAI_AISuite_SEO_Meta_Adapter::read( $post->ID, 'description' ),
			);
		}

		$input = array(
			'post_type'  => (string) $post->post_type,
			'title'      => (string) $post->post_title,
			'content'    => wp_strip_all_tags( (string) $post->post_content ),
			'excerpt'    => (string) $post->post_excerpt,
			'permalink'  => (string) get_permalink( $post ),
			'meta_title' => isset( $current_meta['title'] ) ? (string) $current_meta['title'] : '',
			'meta_desc'  => isset( $current_meta['description'] ) ? (string) $current_meta['description'] : '',
		);

		return hash( 'sha256', wp_json_encode( $input ) );
	}

	/**
	 * Record the content fingerprint represented by a completed analysis.
	 *
	 * The request-time hash is preferred so an edit made while the job is in
	 * flight remains correctly flagged for another analysis.
	 *
	 * @param int    $post_id      Analyzed post.
	 * @param string $request_hash Optional request-time SHA-256 hash.
	 */
	public static function mark_current( $post_id, $request_hash = '' ) {
		$request_hash = strtolower( (string) $request_hash );

		if ( ! preg_match( '/^[a-f0-9]{64}$/', $request_hash ) ) {
			$request_hash = self::analysis_hash( $post_id );
		}

		if ( $request_hash ) {
			update_post_meta( $post_id, self::META_INDEXED, $request_hash );
		}

		update_post_meta( $post_id, self::META_ANALYZED, time() );
	}

	/**
	 * Whether the post still matches the inputs from its latest analysis.
	 *
	 * Timestamp fallback keeps analyses created before fingerprints were added
	 * working until the post is analyzed again.
	 *
	 * @param int|WP_Post $post         Post ID or object.
	 * @param array|null  $current_meta Optional preloaded title and description.
	 * @return bool
	 */
	public static function is_current( $post, $current_meta = null ) {
		$post = get_post( $post );

		if ( ! $post ) {
			return false;
		}

		$analyzed = (int) get_post_meta( $post->ID, self::META_ANALYZED, true );

		if ( ! $analyzed ) {
			return false;
		}

		$indexed_hash = (string) get_post_meta( $post->ID, self::META_INDEXED, true );

		if ( preg_match( '/^[a-f0-9]{64}$/', $indexed_hash ) ) {
			$current_hash = self::analysis_hash( $post, $current_meta );
			return $current_hash && hash_equals( $indexed_hash, $current_hash );
		}

		$modified = strtotime( $post->post_modified_gmt . ' UTC' );
		return ! $modified || $modified <= $analyzed;
	}

	/**
	 * Whether a real analysis job is still in flight for this post.
	 *
	 * @param int $post_id Post ID.
	 * @return bool
	 */
	public static function is_queued( $post_id ) {
		$queued = (int) get_post_meta( $post_id, self::META_QUEUED, true );
		return $queued && time() - $queued < DAY_IN_SECONDS;
	}

	/**
	 * Drop any proposed link whose target isn't a real published post here.
	 */
	protected function filter_links( array $links, $exclude_id = 0 ) {
		$clean = array();
		$seen  = array();

		foreach ( $links as $link ) {
			if ( ! is_array( $link ) ) {
				continue;
			}

			$target = isset( $link['target_id'] ) ? (int) $link['target_id'] : 0;
			$anchor = isset( $link['anchor'] ) ? sanitize_text_field( $link['anchor'] ) : '';

			if ( ! $target || $target === (int) $exclude_id || '' === $anchor || isset( $seen[ $target ] ) ) {
				continue;
			}

			$post = get_post( $target );

			if ( ! $post || 'publish' !== $post->post_status ) {
				continue;
			}

			$clean[]         = array(
				'target_id' => $target,
				'anchor'    => $anchor,
				'url'       => get_permalink( $post ),
			);
			$seen[ $target ] = true;
		}

		return $clean;
	}

	public function current_value( $post_id, $field ) {
		return FounderPostAI_AISuite_SEO_Meta_Adapter::read( $post_id, $field );
	}

	/**
	 * Apply an approved suggestion.
	 *
	 * @param int         $suggestion_id Suggestion to apply.
	 * @param bool        $enforce_caps  Check the current user's rights.
	 * @param string|null $edited_value  Optional reviewed title or description.
	 * @return true|WP_Error
	 */
	public function apply( $suggestion_id, $enforce_caps = true, $edited_value = null ) {
		if ( ! $this->acquire_apply_lock( $suggestion_id ) ) {
			return new WP_Error( 'founderpostai_aisuite_seo_busy', __( 'That suggestion is already being handled. Refresh and try again.', 'founderpostai-ai-suite-seo' ) );
		}

		try {
			$row = FounderPostAI_AISuite_SEO_Store::get( $suggestion_id );

			if ( ! $row ) {
				return new WP_Error( 'founderpostai_aisuite_seo_missing', __( 'That suggestion no longer exists.', 'founderpostai-ai-suite-seo' ) );
			}

			if ( 'pending' !== $row->status ) {
				return new WP_Error( 'founderpostai_aisuite_seo_resolved', __( 'That suggestion has already been handled.', 'founderpostai-ai-suite-seo' ) );
			}

			if ( $enforce_caps && ! current_user_can( 'edit_post', $row->post_id ) ) {
				return new WP_Error( 'founderpostai_aisuite_seo_denied', __( 'You cannot edit this post.', 'founderpostai-ai-suite-seo' ) );
			}

			$was_current = self::is_current( $row->post_id );
			$suggested   = (string) $row->suggested_value;

			if ( in_array( $row->field, array( 'title', 'description' ), true ) ) {
				if ( null !== $edited_value && ! is_scalar( $edited_value ) ) {
					return new WP_Error( 'founderpostai_aisuite_seo_invalid_edit', __( 'The edited suggestion is invalid.', 'founderpostai-ai-suite-seo' ) );
				}

				if ( null !== $edited_value ) {
					$suggested = sanitize_text_field( (string) $edited_value );
				}

				$suggested = trim( $this->truncate( $suggested, 'title' === $row->field ? 60 : 155 ) );

				if ( '' === $suggested ) {
					return new WP_Error( 'founderpostai_aisuite_seo_empty_edit', __( 'Enter a suggestion before applying it.', 'founderpostai-ai-suite-seo' ) );
				}
			}

			if ( in_array( $row->field, array( 'title', 'description' ), true ) && $this->current_value( $row->post_id, $row->field ) !== (string) $row->current_value ) {
				return new WP_Error(
					'founderpostai_aisuite_seo_stale',
					__( 'This field changed after the suggestion was created. Run a new analysis so nothing newer is overwritten.', 'founderpostai-ai-suite-seo' )
				);
			}

			switch ( $row->field ) {
				case 'title':
					$rollback_value = $this->current_value( $row->post_id, 'title' );
					$updated        = FounderPostAI_AISuite_SEO_Meta_Adapter::write( $row->post_id, 'title', $suggested );
					break;

				case 'description':
					$rollback_value = $this->current_value( $row->post_id, 'description' );
					$updated        = FounderPostAI_AISuite_SEO_Meta_Adapter::write( $row->post_id, 'description', $suggested );
					break;

				case 'internal_links':
					$applied = $this->insert_links( $row->post_id, json_decode( $row->suggested_value, true ) );

					if ( is_wp_error( $applied ) ) {
						return $applied;
					}
					$rollback_value = $applied['before'];
					$applied_value  = 'sha256:' . hash( 'sha256', $applied['after'] );
					$updated        = true;
					break;

				default:
					return new WP_Error( 'founderpostai_aisuite_seo_unknown_field', __( 'Unknown suggestion type.', 'founderpostai-ai-suite-seo' ) );
			}

			if ( is_wp_error( $updated ) ) {
				return $updated;
			}

			if ( false === $updated ) {
				return new WP_Error( 'founderpostai_aisuite_seo_write_failed', __( 'WordPress could not save that change. The suggestion remains pending so you can try again.', 'founderpostai-ai-suite-seo' ) );
			}

			if ( in_array( $row->field, array( 'title', 'description' ), true ) ) {
				$applied_value = $this->current_value( $row->post_id, $row->field );
			}

			if ( ! FounderPostAI_AISuite_SEO_Store::resolve_applied( $suggestion_id, $suggested, $rollback_value, $applied_value ) ) {
				return new WP_Error( 'founderpostai_aisuite_seo_resolved', __( 'That suggestion was handled by another request.', 'founderpostai-ai-suite-seo' ) );
			}

			// Advance the fingerprint across our own approved write only when the
			// source was still current beforehand. Never hide an unrelated edit.
			if ( $was_current ) {
				self::mark_current( $row->post_id );
			}

			if ( class_exists( 'FounderPostAI_AISuite_SEO_Health_Screen' ) ) {
				FounderPostAI_AISuite_SEO_Health_Screen::invalidate();
			}

			return true;
		} finally {
			$this->release_apply_lock( $suggestion_id );
		}
	}

	/**
	 * Undo an application only while the live value is exactly what AI Suite wrote.
	 *
	 * @param int  $suggestion_id Suggestion to undo.
	 * @param bool $enforce_caps  Check the current user's rights.
	 * @return true|WP_Error
	 */
	public function undo( $suggestion_id, $enforce_caps = true ) {
		if ( ! $this->acquire_apply_lock( $suggestion_id ) ) {
			return new WP_Error( 'founderpostai_aisuite_seo_busy', __( 'That suggestion is already being handled. Refresh and try again.', 'founderpostai-ai-suite-seo' ) );
		}

		try {
			$row = FounderPostAI_AISuite_SEO_Store::get( $suggestion_id );

			if ( ! $row ) {
				return new WP_Error( 'founderpostai_aisuite_seo_missing', __( 'That suggestion no longer exists.', 'founderpostai-ai-suite-seo' ) );
			}

			if ( 'approved' !== $row->status ) {
				return new WP_Error( 'founderpostai_aisuite_seo_not_applied', __( 'Only an applied suggestion can be undone.', 'founderpostai-ai-suite-seo' ) );
			}

			if ( $enforce_caps && ! current_user_can( 'edit_post', $row->post_id ) ) {
				return new WP_Error( 'founderpostai_aisuite_seo_denied', __( 'You cannot edit this post.', 'founderpostai-ai-suite-seo' ) );
			}

			if ( ! property_exists( $row, 'rollback_value' ) || ! property_exists( $row, 'applied_value' ) || null === $row->rollback_value || null === $row->applied_value ) {
				return new WP_Error( 'founderpostai_aisuite_seo_no_rollback', __( 'Undo data was not recorded for this older suggestion.', 'founderpostai-ai-suite-seo' ) );
			}

			$restored = $this->restore_application( $row );

			if ( is_wp_error( $restored ) ) {
				return $restored;
			}

			if ( ! FounderPostAI_AISuite_SEO_Store::mark_undone( $suggestion_id ) ) {
				return new WP_Error( 'founderpostai_aisuite_seo_undo_history', __( 'The value was restored, but the review history could not be updated. Refresh before trying anything else.', 'founderpostai-ai-suite-seo' ) );
			}

			if ( class_exists( 'FounderPostAI_AISuite_SEO_Health_Screen' ) ) {
				FounderPostAI_AISuite_SEO_Health_Screen::invalidate();
			}

			return true;
		} finally {
			$this->release_apply_lock( $suggestion_id );
		}
	}

	public function reject( $suggestion_id, $enforce_caps = true ) {
		if ( ! $this->acquire_apply_lock( $suggestion_id ) ) {
			return new WP_Error( 'founderpostai_aisuite_seo_busy', __( 'That suggestion is already being handled. Refresh and try again.', 'founderpostai-ai-suite-seo' ) );
		}

		try {
			$row = FounderPostAI_AISuite_SEO_Store::get( $suggestion_id );

			if ( ! $row ) {
				return new WP_Error( 'founderpostai_aisuite_seo_missing', __( 'That suggestion no longer exists.', 'founderpostai-ai-suite-seo' ) );
			}

			if ( 'pending' !== $row->status ) {
				return new WP_Error( 'founderpostai_aisuite_seo_resolved', __( 'That suggestion has already been handled.', 'founderpostai-ai-suite-seo' ) );
			}

			if ( $enforce_caps && ! current_user_can( 'edit_post', $row->post_id ) ) {
				return new WP_Error( 'founderpostai_aisuite_seo_denied', __( 'You cannot edit this post.', 'founderpostai-ai-suite-seo' ) );
			}

			if ( ! FounderPostAI_AISuite_SEO_Store::resolve( $suggestion_id, 'rejected' ) ) {
				return new WP_Error( 'founderpostai_aisuite_seo_resolved', __( 'That suggestion was handled by another request.', 'founderpostai-ai-suite-seo' ) );
			}

			if ( class_exists( 'FounderPostAI_AISuite_SEO_Health_Screen' ) ) {
				FounderPostAI_AISuite_SEO_Health_Screen::invalidate();
			}

			return true;
		} finally {
			$this->release_apply_lock( $suggestion_id );
		}
	}

	/**
	 * Insert internal links into post content.
	 *
	 * Delegates to the block/DOM-aware inserter. A revision is saved first, so
	 * the change is always reversible from the editor.
	 *
	 * @return array|WP_Error Exact content before and after the write.
	 */
	protected function insert_links( $post_id, $links ) {
		if ( empty( $links ) || ! is_array( $links ) ) {
			return new WP_Error( 'founderpostai_aisuite_seo_no_links', __( 'No usable links in this suggestion.', 'founderpostai-ai-suite-seo' ) );
		}

		$post = get_post( $post_id );

		if ( ! $post ) {
			return new WP_Error( 'founderpostai_aisuite_seo_no_post', __( 'Post not found.', 'founderpostai-ai-suite-seo' ) );
		}

		// Suggestions can sit in the queue for days. Re-check each target and
		// refresh its permalink at apply time, so an unpublished target is
		// dropped and a changed permalink never becomes a broken link.
		$links = $this->filter_links( $links, $post_id );

		if ( empty( $links ) ) {
			return new WP_Error( 'founderpostai_aisuite_seo_no_links', __( 'The linked pages are no longer published, so nothing was changed.', 'founderpostai-ai-suite-seo' ) );
		}

		$before_content = (string) $post->post_content;
		$inserter       = new FounderPostAI_AISuite_SEO_Link_Inserter();
		$result         = $inserter->insert( $before_content, $links );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		if ( $result['content'] === $before_content ) {
			return new WP_Error( 'founderpostai_aisuite_seo_noop', __( 'Nothing changed, so the post was left alone.', 'founderpostai-ai-suite-seo' ) );
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

		return array(
			'before' => $before_content,
			'after'  => (string) $result['content'],
		);
	}

	/**
	 * Restore the exact journaled value without overwriting a later edit.
	 *
	 * @param object $row Applied suggestion row.
	 * @return true|WP_Error
	 */
	protected function restore_application( $row ) {
		if ( in_array( $row->field, array( 'title', 'description' ), true ) ) {
			if ( $this->current_value( $row->post_id, $row->field ) !== (string) $row->applied_value ) {
				return new WP_Error( 'founderpostai_aisuite_seo_undo_stale', __( 'The live value changed after this suggestion was applied, so AI Suite left it alone.', 'founderpostai-ai-suite-seo' ) );
			}

			$updated = FounderPostAI_AISuite_SEO_Meta_Adapter::write( $row->post_id, $row->field, (string) $row->rollback_value );

			if ( is_wp_error( $updated ) ) {
				return $updated;
			}

			return false === $updated
				? new WP_Error( 'founderpostai_aisuite_seo_write_failed', __( 'WordPress could not restore the previous metadata.', 'founderpostai-ai-suite-seo' ) )
				: true;
		}

		if ( 'internal_links' !== $row->field ) {
			return new WP_Error( 'founderpostai_aisuite_seo_unknown_field', __( 'Unknown suggestion type.', 'founderpostai-ai-suite-seo' ) );
		}

		$post = get_post( $row->post_id );

		if ( ! $post ) {
			return new WP_Error( 'founderpostai_aisuite_seo_no_post', __( 'Post not found.', 'founderpostai-ai-suite-seo' ) );
		}

		$applied_hash = 0 === strpos( (string) $row->applied_value, 'sha256:' ) ? substr( (string) $row->applied_value, 7 ) : '';
		$current_hash = hash( 'sha256', (string) $post->post_content );

		if ( ! preg_match( '/^[a-f0-9]{64}$/', $applied_hash ) || ! hash_equals( $applied_hash, $current_hash ) ) {
			return new WP_Error( 'founderpostai_aisuite_seo_undo_stale', __( 'The post changed after these links were applied, so AI Suite left it alone.', 'founderpostai-ai-suite-seo' ) );
		}

		wp_save_post_revision( $row->post_id );

		$updated = wp_update_post(
			array(
				'ID'           => (int) $row->post_id,
				'post_content' => (string) $row->rollback_value,
			),
			true
		);

		return is_wp_error( $updated ) ? $updated : true;
	}

	protected function truncate( $value, $length ) {
		if ( function_exists( 'mb_substr' ) ) {
			return mb_substr( (string) $value, 0, $length );
		}

		return substr( (string) $value, 0, $length );
	}

	protected function acquire_apply_lock( $suggestion_id ) {
		$key = self::APPLY_LOCK . (int) $suggestion_id;

		if ( add_option( $key, time(), '', false ) ) {
			return true;
		}

		$created = (int) get_option( $key, 0 );

		if ( $created && time() - $created > 5 * MINUTE_IN_SECONDS ) {
			delete_option( $key );
			return add_option( $key, time(), '', false );
		}

		return false;
	}

	protected function release_apply_lock( $suggestion_id ) {
		delete_option( self::APPLY_LOCK . (int) $suggestion_id );
	}
}
