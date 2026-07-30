<?php
/**
 * Suggestion storage.
 *
 * A custom table rather than post meta: the review queue needs to be sorted and
 * filtered across thousands of posts, and meta queries fall over on shared
 * hosting well before that.
 */

defined( 'ABSPATH' ) || exit;

class AISuite_SEO_Store {

	const DB_VERSION = '1';
	const DB_OPTION  = 'aisuite_seo_db_version';

	public static function table() {
		global $wpdb;
		return $wpdb->prefix . 'aisuite_seo_suggestions';
	}

	public static function install() {
		global $wpdb;

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';

		$table   = self::table();
		$charset = $wpdb->get_charset_collate();

		$sql = "CREATE TABLE {$table} (
			id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
			post_id BIGINT UNSIGNED NOT NULL,
			field VARCHAR(32) NOT NULL,
			current_value LONGTEXT NULL,
			suggested_value LONGTEXT NULL,
			rationale TEXT NULL,
			status VARCHAR(16) NOT NULL DEFAULT 'pending',
			created_at DATETIME NOT NULL,
			resolved_at DATETIME NULL,
			resolved_by BIGINT UNSIGNED NULL,
			PRIMARY KEY  (id),
			KEY post_field (post_id, field),
			KEY status_created (status, created_at)
		) {$charset};";

		dbDelta( $sql );

		wp_cache_delete( 'aisuite_seo_table', 'aisuite' );
		update_option( self::DB_OPTION, self::DB_VERSION, false );
	}

	public static function maybe_upgrade() {
		if ( get_option( self::DB_OPTION ) !== self::DB_VERSION ) {
			self::install();
		}
	}

	/**
	 * Guard every query. A plugin activated by copying files, or a failed
	 * dbDelta on a locked-down host, leaves the table missing — and an
	 * unguarded query then throws a DB error onto every admin screen.
	 */
	public static function table_exists() {
		global $wpdb;

		$cached = wp_cache_get( 'aisuite_seo_table', 'aisuite' );

		if ( false !== $cached ) {
			return (bool) $cached;
		}

		$table  = self::table();
		$exists = (bool) $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $table ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery

		wp_cache_set( 'aisuite_seo_table', $exists ? 1 : 0, 'aisuite', HOUR_IN_SECONDS );

		return $exists;
	}

	/** Drop everything this module created. Called from uninstall.php. */
	public static function drop() {
		global $wpdb;

		$table = self::table();

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery
		$wpdb->query( $wpdb->prepare( 'DROP TABLE IF EXISTS %i', $table ) );

		delete_option( self::DB_OPTION );
	}

	/**
	 * Replace any pending suggestion for the same post+field. Re-running an
	 * analysis should not stack duplicates in the queue.
	 */
	public static function put( $post_id, $field, $current, $suggested, $rationale = '' ) {
		global $wpdb;

		if ( ! self::table_exists() ) {
			return 0;
		}

		$table = self::table();
		$field = substr( sanitize_key( $field ), 0, 32 );
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery -- suggestions intentionally live in a purpose-built indexed queue table.
		$saved = $wpdb->insert(
			$table,
			array(
				'post_id'         => (int) $post_id,
				'field'           => $field,
				'current_value'   => (string) $current,
				'suggested_value' => (string) $suggested,
				'rationale'       => (string) $rationale,
				'status'          => 'pending',
				'created_at'      => current_time( 'mysql', true ),
			),
			array( '%d', '%s', '%s', '%s', '%s', '%s', '%s' )
		);

		if ( false === $saved ) {
			return 0;
		}

		$id = (int) $wpdb->insert_id;

		// Insert first. If the database rejects the new row, the customer's
		// existing pending suggestion remains available instead of disappearing.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery
		$wpdb->query(
			$wpdb->prepare(
				'DELETE FROM %i WHERE post_id = %d AND field = %s AND status = %s AND id <> %d',
				$table,
				(int) $post_id,
				$field,
				'pending',
				$id
			)
		);

		self::flush_counts();

		return $id;
	}

	public static function get( $id ) {
		global $wpdb;

		if ( ! self::table_exists() ) {
			return null;
		}

		$table = self::table();

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		return $wpdb->get_row( $wpdb->prepare( 'SELECT * FROM %i WHERE id = %d', $table, (int) $id ) );
	}

	/**
	 * @param array $args status, post_id, per_page, page
	 * @return array
	 */
	public static function query( array $args = array() ) {
		global $wpdb;

		if ( ! self::table_exists() ) {
			return array();
		}

		$args = wp_parse_args(
			$args,
			array(
				'status'   => 'pending',
				'post_id'  => 0,
				'per_page' => 20,
				'page'     => 1,
			)
		);

		$args['status']   = sanitize_key( $args['status'] );
		$args['per_page'] = min( 100, max( 1, (int) $args['per_page'] ) );
		$args['page']     = max( 1, (int) $args['page'] );

		$table  = self::table();
		$offset = ( $args['page'] - 1 ) * $args['per_page'];

		if ( $args['post_id'] ) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			return $wpdb->get_results(
				$wpdb->prepare(
					'SELECT * FROM %i WHERE status = %s AND post_id = %d ORDER BY created_at DESC LIMIT %d OFFSET %d',
					$table,
					$args['status'],
					(int) $args['post_id'],
					$args['per_page'],
					$offset
				)
			);
		}

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		return $wpdb->get_results(
			$wpdb->prepare(
				'SELECT * FROM %i WHERE status = %s ORDER BY created_at DESC LIMIT %d OFFSET %d',
				$table,
				$args['status'],
				$args['per_page'],
				$offset
			)
		);
	}

	/**
	 * Cached because the admin menu asks for the pending count on every single
	 * admin page load, and that is not worth a query each time.
	 */
	public static function count( $status = 'pending' ) {
		global $wpdb;

		if ( ! self::table_exists() ) {
			return 0;
		}

		$key    = 'aisuite_seo_count_' . $status;
		$cached = wp_cache_get( $key, 'aisuite' );

		if ( false !== $cached ) {
			return (int) $cached;
		}

		$table = self::table();

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery
		$count = (int) $wpdb->get_var( $wpdb->prepare( 'SELECT COUNT(*) FROM %i WHERE status = %s', $table, $status ) );

		wp_cache_set( $key, $count, 'aisuite', 5 * MINUTE_IN_SECONDS );

		return $count;
	}

	/** Counts are cached; any write must clear them. */
	public static function flush_counts() {
		foreach ( array( 'pending', 'approved', 'rejected' ) as $status ) {
			wp_cache_delete( 'aisuite_seo_count_' . $status, 'aisuite' );
		}
	}

	public static function resolve( $id, $status ) {
		global $wpdb;

		if ( ! self::table_exists() || ! in_array( $status, array( 'approved', 'rejected' ), true ) ) {
			return false;
		}

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- custom queue-table write; flush_counts() invalidates its cache below.
		$updated = $wpdb->update(
			self::table(),
			array(
				'status'      => $status,
				'resolved_at' => current_time( 'mysql', true ),
				'resolved_by' => get_current_user_id(),
			),
			array(
				'id'     => (int) $id,
				'status' => 'pending',
			),
			array( '%s', '%s', '%d' ),
			array( '%d', '%s' )
		);

		if ( $updated ) {
			self::flush_counts();
		}

		return 1 === $updated;
	}
}
