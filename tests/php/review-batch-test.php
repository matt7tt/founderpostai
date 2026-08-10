<?php
/**
 * Verifies repeat manual batches scan past already-current recent posts.
 */

define( 'ABSPATH', __DIR__ );
define( 'DAY_IN_SECONDS', 86400 );

$posts          = array();
$post_meta      = array();
$queried_pages  = array();

for ( $post_id = 1; $post_id <= 63; ++$post_id ) {
	$posts[ $post_id ] = (object) array(
		'ID'                => $post_id,
		'post_status'       => 'publish',
		'post_type'         => 'post',
		'post_title'        => 'Post ' . $post_id,
		'post_content'      => 'Body ' . $post_id,
		'post_excerpt'      => '',
		'post_modified_gmt' => '2026-08-04 12:00:00',
	);
}

class FounderPostAI_AISuite_SEO_Meta_Adapter {
	public static function read() {
		return '';
	}
}

function add_action() {}
function add_filter() {}
function current_user_can() {
	return true;
}
function get_post( $post ) {
	global $posts;
	if ( is_object( $post ) ) {
		return $post;
	}
	return isset( $posts[ $post ] ) ? $posts[ $post ] : null;
}
function get_posts( $args ) {
	global $posts, $queried_pages;
	$page             = isset( $args['paged'] ) ? (int) $args['paged'] : 1;
	$page_size        = (int) $args['posts_per_page'];
	$queried_pages[]  = $page;
	return array_slice( array_values( $posts ), ( $page - 1 ) * $page_size, $page_size );
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
function get_permalink( $post ) {
	return 'https://example.com/post-' . (int) $post->ID . '/';
}
function wp_strip_all_tags( $value ) {
	return strip_tags( $value );
}
function wp_json_encode( $value ) {
	return json_encode( $value );
}

require dirname( __DIR__, 2 ) . '/wp-plugins/aisuite-seo/includes/class-optimizer.php';
require dirname( __DIR__, 2 ) . '/wp-plugins/aisuite-seo/includes/class-review-screen.php';

for ( $post_id = 1; $post_id <= 60; ++$post_id ) {
	FounderPostAI_AISuite_SEO_Optimizer::mark_current( $post_id );
}

class AISuite_Test_Review_Screen extends FounderPostAI_AISuite_SEO_Review_Screen {
	public function next_batch( $limit ) {
		return $this->batch_post_ids( $limit );
	}
}

$screen = new AISuite_Test_Review_Screen();
$batch  = $screen->next_batch( 10 );

if ( array( 61, 62, 63 ) !== $batch || array( 1, 2 ) !== $queried_pages ) {
	fwrite( STDERR, 'FAIL: batch selection did not advance past current posts: ' . json_encode( $batch ) . "\n" );
	exit( 1 );
}

fwrite( STDOUT, "PASS: repeat batches advance to the next posts needing analysis\n" );
