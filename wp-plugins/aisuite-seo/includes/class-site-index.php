<?php
/**
 * Incremental local content index.
 *
 * Large sites should not reload every published post whenever one page needs
 * internal-link candidates. This compact, local-only index is built in bounded
 * batches and updated whenever content changes.
 */

defined( 'ABSPATH' ) || exit;

class FounderPostAI_AISuite_SEO_Site_Index {

	const HOOK         = 'founderpostai_aisuite_seo_build_site_index';
	const STATE_OPTION = 'founderpostai_aisuite_seo_index_state';
	const BATCH_SIZE   = 100;
	const CONTENT_MAX  = 20000;

	public function __construct() {
		add_action( self::HOOK, array( $this, 'run_batch' ) );
		add_action( 'save_post', array( $this, 'on_save' ), 30, 3 );
		add_action( 'deleted_post', array( $this, 'delete' ) );

		if ( ! self::is_ready() ) {
			self::schedule();
		}
	}

	/** Return the custom index table name. */
	public static function table() {
		global $wpdb;
		return $wpdb->prefix . 'founderpostai_aisuite_seo_index';
	}

	/** Previous direct-download releases used this generated table name. */
	protected static function legacy_table() {
		global $wpdb;
		return $wpdb->prefix . 'aisuite_seo_index';
	}

	/** Create or update the index table without rebuilding it synchronously. */
	public static function install() {
		global $wpdb;

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';

		$table   = self::table();
		$charset = $wpdb->get_charset_collate();
		$legacy  = self::legacy_table();

		// Preserve an already-built local index when moving to the distinct
		// FounderPostAI prefix. The index contains generated data only.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- one-time generated-table migration.
		$new_exists = (bool) $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $table ) );
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- one-time generated-table migration.
		$old_exists = (bool) $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $legacy ) );
		if ( ! $new_exists && $old_exists ) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery -- one-time atomic generated-table migration.
			$renamed = $wpdb->query( $wpdb->prepare( 'RENAME TABLE %i TO %i', $legacy, $table ) );
			if ( false !== $renamed ) {
				$old_exists = false;
			}
		}
		$sql     = "CREATE TABLE {$table} (
			post_id BIGINT UNSIGNED NOT NULL,
			post_type VARCHAR(32) NOT NULL,
			url TEXT NOT NULL,
			title TEXT NOT NULL,
			excerpt TEXT NOT NULL,
			content MEDIUMTEXT NOT NULL,
			content_hash CHAR(64) NOT NULL,
			modified_gmt DATETIME NOT NULL,
			indexed_at DATETIME NOT NULL,
			PRIMARY KEY  (post_id),
			KEY post_type (post_type),
			KEY modified_gmt (modified_gmt),
			FULLTEXT KEY search_content (title, excerpt, content)
		) {$charset};";

		dbDelta( $sql );

		if ( $old_exists ) {
			// A new index already exists, so the obsolete generated copy is safe to remove.
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery -- cleanup of a legacy generated table.
			$wpdb->query( $wpdb->prepare( 'DROP TABLE IF EXISTS %i', $legacy ) );
		}

		if ( false === get_option( self::STATE_OPTION, false ) ) {
			$legacy_state = get_option( 'aisuite_seo_index_state', false );
			if ( is_array( $legacy_state ) ) {
				update_option( self::STATE_OPTION, $legacy_state, false );
			}
		}
		delete_option( 'aisuite_seo_index_state' );
		wp_clear_scheduled_hook( 'aisuite_seo_build_site_index' );

		if ( false === get_option( self::STATE_OPTION, false ) ) {
			self::reset_state();
		}

		self::schedule();
	}

	/** Whether the initial whole-site pass has completed. */
	public static function is_ready() {
		$state = self::state();
		return ! empty( $state['complete'] );
	}

	/** Progress information for the health screen. */
	public static function progress() {
		global $wpdb;

		$state = self::state();
		$table = self::table();

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- purpose-built local index count.
		$count = (int) $wpdb->get_var( $wpdb->prepare( 'SELECT COUNT(*) FROM %i', $table ) );

		return array(
			'indexed'  => $count,
			'complete' => ! empty( $state['complete'] ),
			'cursor'   => isset( $state['cursor'] ) ? (int) $state['cursor'] : 0,
			'updated'  => isset( $state['updated'] ) ? (int) $state['updated'] : 0,
		);
	}

	/** Clear generated index rows and start a new bounded rebuild. */
	public static function rebuild() {
		global $wpdb;

		$table = self::table();
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery -- generated index rows are intentionally rebuilt from canonical posts.
		$wpdb->query( $wpdb->prepare( 'DELETE FROM %i', $table ) );
		self::reset_state();
		self::schedule( 1 );
	}

	/** Remove all index-owned storage on uninstall. */
	public static function drop() {
		global $wpdb;

		foreach ( array( self::table(), self::legacy_table() ) as $table ) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery -- uninstall removes generated index storage, including a partially migrated legacy table.
			$wpdb->query( $wpdb->prepare( 'DROP TABLE IF EXISTS %i', $table ) );
		}
		delete_option( self::STATE_OPTION );
		delete_option( 'aisuite_seo_index_state' );
		wp_clear_scheduled_hook( self::HOOK );
		wp_clear_scheduled_hook( 'aisuite_seo_build_site_index' );
	}

	/** Index one bounded batch, resuming by post ID rather than a costly offset. */
	public function run_batch() {
		global $wpdb;

		$state      = self::state();
		$cursor     = isset( $state['cursor'] ) ? (int) $state['cursor'] : 0;
		$post_types = self::public_post_types();

		if ( empty( $post_types ) ) {
			$state['complete'] = true;
			$state['updated']  = time();
			update_option( self::STATE_OPTION, $state, false );
			return;
		}

		$cursor_filter = function ( $where ) use ( $wpdb, $cursor ) {
			return $where . $wpdb->prepare( ' AND %i.ID > %d', $wpdb->posts, $cursor );
		};
		add_filter( 'posts_where', $cursor_filter );
		$post_ids = get_posts(
			array(
				'post_type'        => $post_types,
				'post_status'      => 'publish',
				'posts_per_page'   => self::BATCH_SIZE,
				'orderby'          => 'ID',
				'order'            => 'ASC',
				'fields'           => 'ids',
				'no_found_rows'    => true,
				'suppress_filters' => false,
			)
		);
		remove_filter( 'posts_where', $cursor_filter );

		foreach ( (array) $post_ids as $post_id ) {
			self::upsert( (int) $post_id );
			$cursor = max( $cursor, (int) $post_id );
		}

		$state['cursor']   = $cursor;
		$state['complete'] = count( $post_ids ) < self::BATCH_SIZE;
		$state['updated']  = time();
		update_option( self::STATE_OPTION, $state, false );

		if ( ! $state['complete'] ) {
			self::schedule( 5 );
		}
	}

	/** Keep a published post current in the index without scanning the site. */
	public function on_save( $post_id, $post, $update ) {
		unset( $update );

		if ( wp_is_post_revision( $post_id ) || wp_is_post_autosave( $post_id ) ) {
			return;
		}

		if ( ! $post || 'publish' !== $post->post_status || ! in_array( $post->post_type, self::public_post_types(), true ) ) {
			self::delete( $post_id );
			return;
		}

		self::upsert( $post );
	}

	/** Delete one no-longer-public document from the generated index. */
	public static function delete( $post_id ) {
		global $wpdb;

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- generated index row maintenance.
		$wpdb->delete( self::table(), array( 'post_id' => (int) $post_id ), array( '%d' ) );
	}

	/** Insert or replace one compact document. */
	public static function upsert( $post ) {
		global $wpdb;

		$post = get_post( $post );

		if ( ! $post || 'publish' !== $post->post_status || ! in_array( $post->post_type, self::public_post_types(), true ) ) {
			if ( $post ) {
				self::delete( $post->ID );
			}
			return false;
		}

		$content = self::truncate( preg_replace( '/\s+/u', ' ', wp_strip_all_tags( (string) $post->post_content ) ), self::CONTENT_MAX );
		$excerpt = self::truncate( preg_replace( '/\s+/u', ' ', wp_strip_all_tags( (string) $post->post_excerpt ) ), 2000 );
		$title   = self::truncate( wp_strip_all_tags( (string) $post->post_title ), 1000 );

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- generated index row maintenance.
		$result = $wpdb->replace(
			self::table(),
			array(
				'post_id'      => (int) $post->ID,
				'post_type'    => substr( sanitize_key( $post->post_type ), 0, 32 ),
				'url'          => (string) get_permalink( $post ),
				'title'        => $title,
				'excerpt'      => $excerpt,
				'content'      => $content,
				'content_hash' => hash( 'sha256', $title . "\n" . $excerpt . "\n" . $content ),
				'modified_gmt' => $post->post_modified_gmt ? $post->post_modified_gmt : current_time( 'mysql', true ),
				'indexed_at'   => current_time( 'mysql', true ),
			),
			array( '%d', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s' )
		);

		return false !== $result;
	}

	/**
	 * Retrieve a small relevant pool for the existing deterministic ranker.
	 *
	 * @param WP_Post $source Source content.
	 * @param int     $limit  Maximum candidate rows.
	 * @return object[]
	 */
	public static function candidates( $source, $limit = 180 ) {
		global $wpdb;

		if ( ! self::is_ready() ) {
			return array();
		}

		$source = get_post( $source );
		$limit  = max( 1, min( 300, (int) $limit ) );

		if ( ! $source ) {
			return array();
		}

		$search = self::search_phrase( $source );
		$table  = self::table();

		if ( $search ) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- bounded full-text read from the generated index.
			$rows = $wpdb->get_results(
				$wpdb->prepare(
					'SELECT post_id, title, excerpt, content, url, modified_gmt FROM %i WHERE post_id <> %d AND MATCH(title, excerpt, content) AGAINST (%s IN NATURAL LANGUAGE MODE) ORDER BY MATCH(title, excerpt, content) AGAINST (%s IN NATURAL LANGUAGE MODE) DESC, modified_gmt DESC LIMIT %d',
					$table,
					(int) $source->ID,
					$search,
					$search,
					$limit
				)
			);
		} else {
			$rows = array();
		}

		// Full-text indexes intentionally ignore common/short terms. A recency
		// fallback keeps sparse or non-English sites useful without a full scan.
		if ( count( $rows ) < $limit ) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- bounded fallback read from the generated index.
			$fallback = $wpdb->get_results(
				$wpdb->prepare(
					'SELECT post_id, title, excerpt, content, url, modified_gmt FROM %i WHERE post_id <> %d ORDER BY modified_gmt DESC LIMIT %d',
					$table,
					(int) $source->ID,
					$limit
				)
			);
			$unique   = array();
			foreach ( array_merge( (array) $rows, (array) $fallback ) as $row ) {
				if ( ! isset( $unique[ (int) $row->post_id ] ) ) {
					$unique[ (int) $row->post_id ] = $row;
				}
			}
			$rows = array_slice( array_values( $unique ), 0, $limit );
		}

		return array_map(
			function ( $row ) {
				return (object) array(
					'ID'                => (int) $row->post_id,
					'post_title'        => (string) $row->title,
					'post_excerpt'      => (string) $row->excerpt,
					'post_content'      => (string) $row->content,
					'post_modified_gmt' => (string) $row->modified_gmt,
					'founderpostai_aisuite_seo_url' => (string) $row->url,
				);
			},
			(array) $rows
		);
	}

	/** Queue one future batch without scheduling duplicates. */
	public static function schedule( $delay = 5 ) {
		if ( ! wp_next_scheduled( self::HOOK ) ) {
			wp_schedule_single_event( time() + max( 1, (int) $delay ), self::HOOK );
		}
	}

	/** Current cursor state with safe defaults. */
	protected static function state() {
		return wp_parse_args(
			(array) get_option( self::STATE_OPTION, array() ),
			array(
				'cursor'   => 0,
				'complete' => false,
				'updated'  => 0,
			)
		);
	}

	/** Reset the generated index cursor. */
	protected static function reset_state() {
		update_option(
			self::STATE_OPTION,
			array(
				'cursor'   => 0,
				'complete' => false,
				'updated'  => time(),
			),
			false
		);
	}

	/** Public post types eligible for search traffic and internal links. */
	protected static function public_post_types() {
		$types = function_exists( 'get_post_types' ) ? get_post_types( array( 'public' => true ), 'names' ) : array( 'post', 'page' );
		return array_values( array_diff( (array) $types, array( 'attachment' ) ) );
	}

	/** Build a conservative full-text query from the most descriptive fields. */
	protected static function search_phrase( $post ) {
		$text  = wp_strip_all_tags( (string) $post->post_title . ' ' . (string) $post->post_excerpt . ' ' . self::truncate( (string) $post->post_content, 2000 ) );
		$parts = preg_split( '/[^\p{L}\p{N}]+/u', self::lower( $text ), -1, PREG_SPLIT_NO_EMPTY );
		$terms = array();

		foreach ( (array) $parts as $term ) {
			if ( self::length( $term ) < 3 || is_numeric( $term ) || isset( $terms[ $term ] ) ) {
				continue;
			}
			$terms[ $term ] = true;
			if ( count( $terms ) >= 20 ) {
				break;
			}
		}

		return implode( ' ', array_keys( $terms ) );
	}

	protected static function truncate( $value, $length ) {
		return function_exists( 'mb_substr' ) ? mb_substr( (string) $value, 0, $length, 'UTF-8' ) : substr( (string) $value, 0, $length );
	}

	protected static function lower( $value ) {
		return function_exists( 'mb_strtolower' ) ? mb_strtolower( (string) $value, 'UTF-8' ) : strtolower( (string) $value );
	}

	protected static function length( $value ) {
		return function_exists( 'mb_strlen' ) ? mb_strlen( (string) $value, 'UTF-8' ) : strlen( (string) $value );
	}
}
