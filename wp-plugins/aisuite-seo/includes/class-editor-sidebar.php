<?php
/** Gutenberg SEO review sidebar and authenticated REST actions. */

defined( 'ABSPATH' ) || exit;

class AISuite_SEO_Editor_Sidebar {

	const REST_NAMESPACE = 'aisuite-seo/v1';

	public function __construct() {
		add_action( 'enqueue_block_editor_assets', array( $this, 'assets' ) );
		add_action( 'rest_api_init', array( $this, 'routes' ) );
	}

	/** Load a dependency-free sidebar built from WordPress's bundled packages. */
	public function assets() {
		$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;

		if ( ! $screen || empty( $screen->post_type ) ) {
			return;
		}

		$post_type = get_post_type_object( $screen->post_type );

		if ( ! $post_type || empty( $post_type->show_in_rest ) ) {
			return;
		}

		wp_enqueue_style( 'aisuite-seo-editor', AISUITE_SEO_URL . 'assets/editor.css', array( 'wp-components' ), AISUITE_SEO_VERSION );
		wp_enqueue_script(
			'aisuite-seo-editor',
			AISUITE_SEO_URL . 'assets/editor.js',
			array( 'wp-api-fetch', 'wp-components', 'wp-data', 'wp-edit-post', 'wp-element', 'wp-i18n', 'wp-plugins' ),
			AISUITE_SEO_VERSION,
			true
		);
		wp_localize_script(
			'aisuite-seo-editor',
			'AISuiteSEOEditor',
			array(
				'namespace' => '/' . self::REST_NAMESPACE,
				'pollMs'    => 5000,
			)
		);
		wp_set_script_translations( 'aisuite-seo-editor', 'founderpostai-ai-suite-seo' );
	}

	/** Register routes that reuse the optimizer's capability and stale checks. */
	public function routes() {
		register_rest_route(
			self::REST_NAMESPACE,
			'/post/(?P<id>\d+)',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_post_state' ),
				'permission_callback' => array( $this, 'can_edit_post' ),
				'args'                => array(
					'id' => array(
						'sanitize_callback' => 'absint',
					),
				),
			)
		);

		register_rest_route(
			self::REST_NAMESPACE,
			'/post/(?P<id>\d+)/analyze',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'analyze' ),
				'permission_callback' => array( $this, 'can_edit_post' ),
				'args'                => array(
					'id'          => array( 'sanitize_callback' => 'absint' ),
					'focus'       => array( 'sanitize_callback' => 'sanitize_key' ),
					'instruction' => array( 'sanitize_callback' => 'sanitize_text_field' ),
				),
			)
		);

		register_rest_route(
			self::REST_NAMESPACE,
			'/suggestion/(?P<id>\d+)/(?P<decision>apply|reject|undo)',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'resolve' ),
				'permission_callback' => array( $this, 'can_edit_suggestion' ),
				'args'                => array(
					'id'       => array( 'sanitize_callback' => 'absint' ),
					'decision' => array( 'sanitize_callback' => 'sanitize_key' ),
				),
			)
		);
	}

	/** Route permission for a concrete editable post. */
	public function can_edit_post( WP_REST_Request $request ) {
		return current_user_can( 'edit_post', (int) $request['id'] );
	}

	/** Resolve the owning post before authorizing a suggestion action. */
	public function can_edit_suggestion( WP_REST_Request $request ) {
		$row = AISuite_SEO_Store::get( (int) $request['id'] );
		return $row && current_user_can( 'edit_post', (int) $row->post_id );
	}

	/** Current metadata, analysis state, pending work, and recoverable history. */
	public function get_post_state( WP_REST_Request $request ) {
		return rest_ensure_response( $this->state( (int) $request['id'] ) );
	}

	/** Queue a normal regeneration or instruction-led refinement. */
	public function analyze( WP_REST_Request $request ) {
		$focus = sanitize_key( (string) $request->get_param( 'focus' ) );

		if ( ! in_array( $focus, array( '', 'all', 'title', 'description', 'internal_links' ), true ) ) {
			return new WP_Error( 'aisuite_seo_bad_focus', __( 'Choose a valid area to refine.', 'founderpostai-ai-suite-seo' ), array( 'status' => 400 ) );
		}

		$instruction = sanitize_text_field( (string) $request->get_param( 'instruction' ) );
		$instruction = $this->truncate( $instruction, 500 );
		$optimizer   = new AISuite_SEO_Optimizer( false );
		$result      = $optimizer->analyze(
			(int) $request['id'],
			true,
			array(
				'focus'       => $focus ? $focus : 'all',
				'instruction' => $instruction,
			)
		);

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return rest_ensure_response(
			array(
				'queued' => true,
				'ref'    => $result,
			)
		);
	}

	/** Apply, dismiss, or safely undo one suggestion from Gutenberg. */
	public function resolve( WP_REST_Request $request ) {
		$decision  = sanitize_key( (string) $request['decision'] );
		$optimizer = new AISuite_SEO_Optimizer( false );

		if ( 'apply' === $decision ) {
			$value = $request->get_param( 'suggested_value' );

			if ( null !== $value && ! is_string( $value ) ) {
				return new WP_Error( 'aisuite_seo_invalid_edit', __( 'The edited suggestion is invalid.', 'founderpostai-ai-suite-seo' ), array( 'status' => 400 ) );
			}

			$result = $optimizer->apply( (int) $request['id'], true, null === $value ? null : sanitize_text_field( $value ) );
		} elseif ( 'undo' === $decision ) {
			$result = $optimizer->undo( (int) $request['id'] );
		} else {
			$result = $optimizer->reject( (int) $request['id'] );
		}

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		$row = AISuite_SEO_Store::get( (int) $request['id'] );
		return rest_ensure_response( $this->state( $row ? (int) $row->post_id : 0 ) );
	}

	/** Build the sidebar's intentionally small response. */
	protected function state( $post_id ) {
		$post = get_post( $post_id );

		if ( ! $post ) {
			return new WP_Error( 'aisuite_seo_no_post', __( 'Post not found.', 'founderpostai-ai-suite-seo' ), array( 'status' => 404 ) );
		}

		$title       = AISuite_SEO_Meta_Adapter::read( $post_id, 'title' );
		$description = AISuite_SEO_Meta_Adapter::read( $post_id, 'description' );
		$pending     = AISuite_SEO_Store::query(
			array(
				'status'   => 'pending',
				'post_id'  => $post_id,
				'per_page' => 20,
			)
		);
		$applied     = AISuite_SEO_Store::query(
			array(
				'status'   => 'approved',
				'post_id'  => $post_id,
				'per_page' => 10,
			)
		);

		return array(
			'post'        => array(
				'id'    => (int) $post->ID,
				'title' => get_the_title( $post ),
				'url'   => get_permalink( $post ),
			),
			'meta'        => array(
				'title'       => (string) $title,
				'description' => (string) $description,
			),
			'preview'     => array(
				'title'       => $title ? (string) $title : get_the_title( $post ),
				'description' => $description ? (string) $description : wp_trim_words( wp_strip_all_tags( $post->post_excerpt ? $post->post_excerpt : $post->post_content ), 24, '…' ),
			),
			'analysis'    => array(
				'queued'  => (bool) AISuite_SEO_Optimizer::is_queued( $post_id ),
				'current' => (bool) AISuite_SEO_Optimizer::is_current( $post ),
				'error'   => (string) get_post_meta( $post_id, AISuite_SEO_Optimizer::META_ERROR, true ),
			),
			'suggestions' => array_map( array( $this, 'suggestion_data' ), array_merge( $pending, $applied ) ),
		);
	}

	/** Normalize a queue row for JavaScript without exposing rollback content. */
	protected function suggestion_data( $row ) {
		$value = (string) $row->suggested_value;

		if ( 'internal_links' === $row->field ) {
			$value = json_decode( $value, true );
			$value = is_array( $value ) ? $value : array();
		}

		return array(
			'id'              => (int) $row->id,
			'field'           => sanitize_key( $row->field ),
			'current_value'   => (string) $row->current_value,
			'suggested_value' => $value,
			'rationale'       => (string) $row->rationale,
			'status'          => sanitize_key( $row->status ),
			'can_undo'        => 'approved' === $row->status && property_exists( $row, 'rollback_value' ) && property_exists( $row, 'applied_value' ) && null !== $row->rollback_value && null !== $row->applied_value,
		);
	}

	protected function truncate( $value, $length ) {
		return function_exists( 'mb_substr' ) ? mb_substr( (string) $value, 0, $length, 'UTF-8' ) : substr( (string) $value, 0, $length );
	}
}
