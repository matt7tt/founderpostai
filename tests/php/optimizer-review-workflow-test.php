<?php
/**
 * Verifies reviewed metadata edits and exact, guarded undo for metadata/links.
 */

define( 'ABSPATH', __DIR__ );
define( 'DAY_IN_SECONDS', 86400 );
define( 'MINUTE_IN_SECONDS', 60 );

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

	public function get_error_message() {
		return $this->message;
	}
}

class AISuite_SEO_Store {
	public static $rows = array();

	public static function get( $id ) {
		return isset( self::$rows[ $id ] ) ? self::$rows[ $id ] : null;
	}

	public static function resolve_applied( $id, $suggested, $rollback, $applied ) {
		$row                  = self::$rows[ $id ];
		$row->suggested_value = $suggested;
		$row->rollback_value  = $rollback;
		$row->applied_value   = $applied;
		$row->status          = 'approved';
		return true;
	}

	public static function mark_undone( $id ) {
		self::$rows[ $id ]->status = 'undone';
		return true;
	}

	public static function resolve( $id, $status ) {
		self::$rows[ $id ]->status = $status;
		return true;
	}
}

class AISuite_SEO_Meta_Adapter {
	public static function read( $post_id, $field ) {
		global $seo_values;
		return isset( $seo_values[ $post_id ][ $field ] ) ? $seo_values[ $post_id ][ $field ] : '';
	}

	public static function write( $post_id, $field, $value ) {
		global $seo_values;
		$seo_values[ $post_id ][ $field ] = $value;
		return true;
	}
}

class AISuite_SEO_Link_Candidates {
	public static function select() {
		return array();
	}
}

class AISuite_SEO_Link_Inserter {
	public function insert( $content, $links ) {
		$link = reset( $links );
		return array(
			'content' => str_replace( $link['anchor'], '<a href="' . $link['url'] . '">' . $link['anchor'] . '</a>', $content ),
		);
	}
}

class AISuite_SEO_Health_Screen {
	public static function invalidate() {}
}

$posts = array(
	1 => (object) array(
		'ID'                => 1,
		'post_status'       => 'publish',
		'post_type'         => 'post',
		'post_title'        => 'Source',
		'post_content'      => 'Read target here.',
		'post_excerpt'      => '',
		'post_modified_gmt' => '2026-08-04 12:00:00',
	),
	2 => (object) array(
		'ID'                => 2,
		'post_status'       => 'publish',
		'post_type'         => 'post',
		'post_title'        => 'Target',
		'post_content'      => 'Target page.',
		'post_excerpt'      => '',
		'post_modified_gmt' => '2026-08-04 12:00:00',
	),
);
$post_meta  = array();
$seo_values = array(
	1 => array(
		'title'       => 'Original title',
		'description' => 'Original description',
	),
);
$locks      = array();
$revisions  = 0;

function __( $message ) {
	return $message;
}
function current_user_can() {
	return true;
}
function is_wp_error( $value ) {
	return $value instanceof WP_Error;
}
function sanitize_text_field( $value ) {
	return trim( strip_tags( (string) $value ) );
}
function wp_strip_all_tags( $value ) {
	return strip_tags( $value );
}
function wp_json_encode( $value ) {
	return json_encode( $value );
}
function get_post( $post ) {
	global $posts;
	if ( is_object( $post ) ) {
		return $post;
	}
	return isset( $posts[ $post ] ) ? $posts[ $post ] : null;
}
function get_permalink( $post ) {
	$post = get_post( $post );
	return 'https://example.com/post-' . (int) $post->ID . '/';
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
function add_option( $key, $value ) {
	global $locks;
	if ( isset( $locks[ $key ] ) ) {
		return false;
	}
	$locks[ $key ] = $value;
	return true;
}
function get_option( $key, $default = 0 ) {
	global $locks;
	return isset( $locks[ $key ] ) ? $locks[ $key ] : $default;
}
function delete_option( $key ) {
	global $locks;
	unset( $locks[ $key ] );
	return true;
}
function wp_save_post_revision() {
	global $revisions;
	++$revisions;
	return $revisions;
}
function wp_update_post( $values ) {
	global $posts;
	$post_id = (int) $values['ID'];
	$posts[ $post_id ]->post_content = $values['post_content'];
	return $post_id;
}

require dirname( __DIR__, 2 ) . '/wp-plugins/aisuite-seo/includes/class-optimizer.php';

$optimizer = new AISuite_SEO_Optimizer( false );

AISuite_SEO_Store::$rows[101] = (object) array(
	'id'              => 101,
	'post_id'         => 1,
	'field'           => 'title',
	'current_value'   => 'Original title',
	'suggested_value' => 'Generated title',
	'status'          => 'pending',
);

$applied = $optimizer->apply( 101, true, 'Human-edited title' );
$row     = AISuite_SEO_Store::$rows[101];

if ( is_wp_error( $applied ) || 'Human-edited title' !== $seo_values[1]['title'] || 'Original title' !== $row->rollback_value || 'Human-edited title' !== $row->applied_value || 'approved' !== $row->status ) {
	fwrite( STDERR, "FAIL: reviewed title was not journaled exactly\n" );
	exit( 1 );
}

$undone = $optimizer->undo( 101 );

if ( is_wp_error( $undone ) || 'Original title' !== $seo_values[1]['title'] || 'undone' !== AISuite_SEO_Store::$rows[101]->status ) {
	fwrite( STDERR, "FAIL: metadata undo did not restore the previous value\n" );
	exit( 1 );
}

AISuite_SEO_Store::$rows[102] = (object) array(
	'id'              => 102,
	'post_id'         => 1,
	'field'           => 'description',
	'current_value'   => 'Original description',
	'suggested_value' => 'Generated description',
	'status'          => 'pending',
);

$optimizer->apply( 102 );
$seo_values[1]['description'] = 'A human changed this later.';
$blocked = $optimizer->undo( 102 );

if ( ! is_wp_error( $blocked ) || 'aisuite_seo_undo_stale' !== $blocked->get_error_code() || 'approved' !== AISuite_SEO_Store::$rows[102]->status ) {
	fwrite( STDERR, "FAIL: undo overwrote or accepted a newer metadata edit\n" );
	exit( 1 );
}

AISuite_SEO_Store::$rows[103] = (object) array(
	'id'              => 103,
	'post_id'         => 1,
	'field'           => 'internal_links',
	'current_value'   => '',
	'suggested_value' => json_encode( array( array( 'target_id' => 2, 'anchor' => 'target' ) ) ),
	'status'          => 'pending',
);

$original_content = $posts[1]->post_content;
$link_applied     = $optimizer->apply( 103 );

if ( is_wp_error( $link_applied ) || false === strpos( $posts[1]->post_content, '<a href=' ) || $original_content !== AISuite_SEO_Store::$rows[103]->rollback_value ) {
	$detail = is_wp_error( $link_applied ) ? $link_applied->get_error_code() : json_encode( array( $posts[1]->post_content, AISuite_SEO_Store::$rows[103] ) );
	fwrite( STDERR, "FAIL: link application did not journal exact post content: {$detail}\n" );
	exit( 1 );
}

$link_undone = $optimizer->undo( 103 );

if ( is_wp_error( $link_undone ) || $original_content !== $posts[1]->post_content || 2 !== $revisions ) {
	fwrite( STDERR, "FAIL: link undo did not restore content with a revision\n" );
	exit( 1 );
}

fwrite( STDOUT, "PASS: reviewed edits and guarded metadata/link undo preserve newer work\n" );
