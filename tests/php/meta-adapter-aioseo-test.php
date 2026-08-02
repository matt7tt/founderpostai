<?php
/** Behavioral test for All in One SEO's native post model save path. */

namespace AIOSEO\Plugin\Common\Models {
	class Post {
		public static $values = array();

		public static function getPost( $post_id ) {
			return (object) array_merge(
				array( 'title' => '', 'description' => '' ),
				isset( self::$values[ $post_id ] ) ? self::$values[ $post_id ] : array()
			);
		}

		public static function savePost( $post_id, $data ) {
			self::$values[ $post_id ] = array_merge(
				isset( self::$values[ $post_id ] ) ? self::$values[ $post_id ] : array(),
				$data
			);
		}
	}
}

namespace {
	define( 'ABSPATH', __DIR__ );

	$post_meta = array();

	class WP_Error {
		public function __construct( $code, $message ) {}
	}

	function __( $value ) {
		return $value;
	}

	function is_wp_error( $value ) {
		return $value instanceof WP_Error;
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

	require dirname( __DIR__, 2 ) . '/wp-plugins/aisuite-seo/includes/class-meta-adapter.php';

	$result = \AISuite_SEO_Meta_Adapter::write( 11, 'title', 'AIOSEO title' );
	$model  = \AIOSEO\Plugin\Common\Models\Post::getPost( 11 );

	if (
		true !== $result ||
		'AIOSEO title' !== $model->title ||
		'AIOSEO title' !== get_post_meta( 11, '_aisuite_seo_title', true ) ||
		'AIOSEO title' !== \AISuite_SEO_Meta_Adapter::read( 11, 'title' )
	) {
		fwrite( STDERR, "FAIL: approved metadata did not use AIOSEO's post model\n" );
		exit( 1 );
	}

	fwrite( STDOUT, "PASS: approved metadata is saved through AIOSEO's post model\n" );
}
