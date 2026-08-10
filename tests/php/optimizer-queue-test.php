<?php
/**
 * Verifies that the per-post in-flight claim prevents duplicate paid jobs.
 */

define( 'ABSPATH', __DIR__ );
define( 'DAY_IN_SECONDS', 86400 );

class WP_Error {
	protected $code;
	protected $message;

	public function __construct( $code, $message ) {
		$this->code    = $code;
		$this->message = $message;
	}

	public function get_error_code() {
		return $this->code;
	}
}

class AISuite_Test_Jobs {
	public $calls = 0;
	public $fail_next = false;
	public $payload = array();
	public $context = array();

	public function enqueue( $type = '', $payload = array(), $context = array() ) {
		++$this->calls;
		$this->payload = $payload;
		$this->context = $context;

		if ( $this->fail_next ) {
			$this->fail_next = false;
			return new WP_Error( 'queue_failed', 'Queue failed.' );
		}

		return '00000000-0000-4000-8000-000000000001';
	}
}

$post_meta = array();
$jobs      = new AISuite_Test_Jobs();

function __( $message ) {
	return $message;
}

function add_action() {}
function current_user_can() {
	return true;
}
function is_wp_error( $value ) {
	return $value instanceof WP_Error;
}
function wp_strip_all_tags( $value ) {
	return strip_tags( $value );
}
function sanitize_text_field( $value ) {
	return trim( strip_tags( (string) $value ) );
}
function sanitize_key( $value ) {
	return preg_replace( '/[^a-z0-9_\-]/', '', strtolower( (string) $value ) );
}
function wp_json_encode( $value ) {
	return json_encode( $value );
}
function get_permalink() {
	return 'https://example.com/post/';
}
function get_posts() {
	return array();
}
function get_post_types() {
	return array( 'post', 'page' );
}
function apply_filters( $hook, $value ) {
	return $value;
}
function get_post( $post_id ) {
	return (object) array(
		'ID'                => (int) $post_id,
		'post_status'       => 'publish',
		'post_type'         => 'post',
		'post_title'        => 'Example',
		'post_content'      => 'Example content',
		'post_excerpt'      => '',
		'post_modified_gmt' => '2026-01-01 00:00:00',
	);
}
function get_post_meta( $post_id, $key ) {
	global $post_meta;
	return isset( $post_meta[ $post_id ][ $key ] ) ? $post_meta[ $post_id ][ $key ] : '';
}
function update_post_meta( $post_id, $key, $value ) {
	global $post_meta;
	$post_meta[ $post_id ][ $key ] = $value;
	return true;
}
function update_meta_cache() {}
function add_post_meta( $post_id, $key, $value, $unique = false ) {
	global $post_meta;
	if ( $unique && isset( $post_meta[ $post_id ][ $key ] ) ) {
		return false;
	}
	$post_meta[ $post_id ][ $key ] = $value;
	return true;
}
function delete_post_meta( $post_id, $key ) {
	global $post_meta;
	unset( $post_meta[ $post_id ][ $key ] );
	return true;
}
function aisuite() {
	global $jobs;
	return (object) array( 'jobs' => $jobs );
}

require dirname( __DIR__, 2 ) . '/wp-plugins/aisuite-seo/includes/class-meta-adapter.php';
require dirname( __DIR__, 2 ) . '/wp-plugins/aisuite-seo/includes/class-link-candidates.php';
require dirname( __DIR__, 2 ) . '/wp-plugins/aisuite-seo/includes/class-optimizer.php';

$optimizer = new AISuite_SEO_Optimizer( false );
$first     = $optimizer->analyze( 7 );
$second    = $optimizer->analyze( 7 );

if ( is_wp_error( $first ) || ! is_wp_error( $second ) || 'aisuite_seo_already_queued' !== $second->get_error_code() || 1 !== $jobs->calls ) {
	fwrite( STDERR, "FAIL: simultaneous analyses were not deduplicated\n" );
	exit( 1 );
}

delete_post_meta( 7, AISuite_SEO_Optimizer::META_QUEUED );
$jobs->fail_next = true;
$failed          = $optimizer->analyze( 7 );

if ( ! is_wp_error( $failed ) || '' !== get_post_meta( 7, AISuite_SEO_Optimizer::META_QUEUED, true ) ) {
	fwrite( STDERR, "FAIL: a failed enqueue left the post permanently locked\n" );
	exit( 1 );
}

$refined = $optimizer->analyze(
	7,
	true,
	array(
		'focus'       => 'title',
		'instruction' => '<b>Make this more specific.</b>',
	)
);

if ( is_wp_error( $refined ) || 'title' !== $jobs->payload['review_request']['focus'] || 'Make this more specific.' !== $jobs->payload['review_request']['instruction'] || empty( $jobs->context['replace_review'] ) ) {
	fwrite( STDERR, "FAIL: review refinements were not sanitized and preserved in the queued job\n" );
	exit( 1 );
}

fwrite( STDOUT, "PASS: duplicate analyses are blocked, failed claims release, and refinements are queued safely\n" );
