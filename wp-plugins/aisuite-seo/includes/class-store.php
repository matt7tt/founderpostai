<?php
/**
 * Suggestion storage.
 *
 * A custom table rather than post meta: the review queue needs to be sorted and
 * filtered across thousands of posts, and meta queries fall over on shared
 * hosting well before that.
 */

defined( 'ABSPATH' ) || exit;

class FounderPostAI_AISuite_SEO_Store {

	const DB_VERSION  = '4';
	const DB_OPTION   = 'founderpostai_aisuite_seo_db_version';
	const CACHE_GROUP = 'founderpostai_aisuite_seo';

	public static function table() {
		global $wpdb;
		return $wpdb->prefix . 'founderpostai_aisuite_seo_suggestions';
	}

	/** Previous direct-download releases used this table before the prefix review. */
	protected static function legacy_table() {
		global $wpdb;
		return $wpdb->prefix . 'aisuite_seo_suggestions';
	}

	public static function install() {
		global $wpdb;

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';

		$table   = self::table();
		$charset = $wpdb->get_charset_collate();
		$legacy  = self::legacy_table();

		// Preserve review history from direct-download versions. A rename is
		// atomic and happens only when the distinct new table does not exist.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- one-time schema migration.
		$new_exists = (bool) $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $table ) );
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- one-time schema migration.
		$old_exists = (bool) $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $legacy ) );
		if ( ! $new_exists && $old_exists ) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery -- one-time atomic table migration.
			$renamed = $wpdb->query( $wpdb->prepare( 'RENAME TABLE %i TO %i', $legacy, $table ) );
			if ( false !== $renamed ) {
				$old_exists = false;
			}
		}

		$sql = "CREATE TABLE {$table} (
			id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
			post_id BIGINT UNSIGNED NOT NULL,
			field VARCHAR(32) NOT NULL,
			current_value LONGTEXT NULL,
			suggested_value LONGTEXT NULL,
			rollback_value LONGTEXT NULL,
			applied_value LONGTEXT NULL,
			rationale TEXT NULL,
			status VARCHAR(16) NOT NULL DEFAULT 'pending',
			created_at DATETIME NOT NULL,
			resolved_at DATETIME NULL,
			resolved_by BIGINT UNSIGNED NULL,
			undo_at DATETIME NULL,
			undo_by BIGINT UNSIGNED NULL,
			PRIMARY KEY  (id),
			KEY post_field (post_id, field),
			KEY status_created (status, created_at)
		) {$charset};";

		dbDelta( $sql );

		// If an interrupted upgrade left both tables, append the legacy rows
		// without reusing IDs, then remove the obsolete generic table.
		if ( $old_exists ) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery -- one-time compatibility migration between plugin-owned tables.
			$copied = $wpdb->query(
				$wpdb->prepare(
					'INSERT INTO %i (post_id, field, current_value, suggested_value, rollback_value, applied_value, rationale, status, created_at, resolved_at, resolved_by, undo_at, undo_by) SELECT post_id, field, current_value, suggested_value, rollback_value, applied_value, rationale, status, created_at, resolved_at, resolved_by, undo_at, undo_by FROM %i',
					$table,
					$legacy
				)
			);
			if ( false !== $copied ) {
				// phpcs:ignore WordPress.DB.DirectDatabaseQuery -- copied legacy table is no longer used.
				$wpdb->query( $wpdb->prepare( 'DROP TABLE IF EXISTS %i', $legacy ) );
			}
		}

		self::migrate_legacy_post_meta();
		delete_option( 'aisuite_seo_db_version' );

		if ( class_exists( 'FounderPostAI_AISuite_SEO_Site_Index' ) ) {
			FounderPostAI_AISuite_SEO_Site_Index::install();
		}

		wp_cache_delete( 'founderpostai_aisuite_seo_table', self::CACHE_GROUP );
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

		$cached = wp_cache_get( 'founderpostai_aisuite_seo_table', self::CACHE_GROUP );

		if ( false !== $cached ) {
			return (bool) $cached;
		}

		$table  = self::table();
		$exists = (bool) $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $table ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery

		wp_cache_set( 'founderpostai_aisuite_seo_table', $exists ? 1 : 0, self::CACHE_GROUP, HOUR_IN_SECONDS );

		return $exists;
	}

	/** Drop everything this module created. Called from uninstall.php. */
	public static function drop() {
		global $wpdb;

		foreach ( array( self::table(), self::legacy_table() ) as $table ) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery -- uninstall removes plugin-owned storage, including a partially migrated legacy table.
			$wpdb->query( $wpdb->prepare( 'DROP TABLE IF EXISTS %i', $table ) );
		}

		delete_option( self::DB_OPTION );
		delete_option( 'aisuite_seo_db_version' );

		if ( class_exists( 'FounderPostAI_AISuite_SEO_Site_Index' ) ) {
			FounderPostAI_AISuite_SEO_Site_Index::drop();
		}
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

		$key    = 'founderpostai_aisuite_seo_count_' . $status;
		$cached = wp_cache_get( $key, self::CACHE_GROUP );

		if ( false !== $cached ) {
			return (int) $cached;
		}

		$table = self::table();

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery
		$count = (int) $wpdb->get_var( $wpdb->prepare( 'SELECT COUNT(*) FROM %i WHERE status = %s', $table, $status ) );

		wp_cache_set( $key, $count, self::CACHE_GROUP, 5 * MINUTE_IN_SECONDS );

		return $count;
	}

	/** @return array<int,int> Pending suggestion counts keyed by post ID. */
	public static function pending_counts_by_post() {
		global $wpdb;

		if ( ! self::table_exists() ) {
			return array();
		}

		$table = self::table();
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$rows = $wpdb->get_results( $wpdb->prepare( 'SELECT post_id, COUNT(*) AS total FROM %i WHERE status = %s GROUP BY post_id', $table, 'pending' ) );
		$out  = array();

		foreach ( (array) $rows as $row ) {
			$out[ (int) $row->post_id ] = (int) $row->total;
		}

		return $out;
	}

	/** Counts are cached; any write must clear them. */
	public static function flush_counts() {
		foreach ( array( 'pending', 'approved', 'rejected', 'undone' ) as $status ) {
			wp_cache_delete( 'founderpostai_aisuite_seo_count_' . $status, self::CACHE_GROUP );
		}
	}

	/**
	 * Move legacy metadata once, preferring any value already written under the
	 * new unique key. The old keys are removed so future reads cannot conflict.
	 */
	protected static function migrate_legacy_post_meta() {
		global $wpdb;
		// One-time, version-gated migration of plugin-owned post metadata.
		// phpcs:disable WordPress.DB.DirectDatabaseQuery, WordPress.DB.SlowDBQuery

		$mapping = array(
			'_aisuite_seo_title'                => '_founderpostai_aisuite_seo_title',
			'_aisuite_seo_description'          => '_founderpostai_aisuite_seo_description',
			'_aisuite_seo_indexed_hash'         => '_founderpostai_aisuite_seo_indexed_hash',
			'_aisuite_seo_analyzed'             => '_founderpostai_aisuite_seo_analyzed',
			'_aisuite_seo_error'                => '_founderpostai_aisuite_seo_error',
			'_aisuite_seo_queued'               => '_founderpostai_aisuite_seo_queued',
			'_aisuite_seo_title_provider'       => '_founderpostai_aisuite_seo_title_provider',
			'_aisuite_seo_description_provider' => '_founderpostai_aisuite_seo_description_provider',
		);

		foreach ( $mapping as $legacy_key => $new_key ) {
			$copied = $wpdb->query(
				$wpdb->prepare(
					'INSERT INTO %i (post_id, meta_key, meta_value) SELECT legacy.post_id, %s, legacy.meta_value FROM %i AS legacy LEFT JOIN %i AS current ON current.post_id = legacy.post_id AND current.meta_key = %s WHERE legacy.meta_key = %s AND current.meta_id IS NULL',
					$wpdb->postmeta,
					$new_key,
					$wpdb->postmeta,
					$wpdb->postmeta,
					$new_key,
					$legacy_key
				)
			);
			if ( false !== $copied ) {
				$wpdb->delete( $wpdb->postmeta, array( 'meta_key' => $legacy_key ), array( '%s' ) );
			}
		}

		foreach ( array( '_founderpostai_aisuite_seo_title_provider', '_founderpostai_aisuite_seo_description_provider' ) as $provider_key ) {
			$wpdb->update(
				$wpdb->postmeta,
				array( 'meta_value' => FounderPostAI_AISuite_SEO_Meta_Adapter::PROVIDER_FOUNDERPOSTAI ),
				array(
					'meta_key'   => $provider_key,
					'meta_value' => 'aisuite',
				),
				array( '%s' ),
				array( '%s', '%s' )
			);
		}
		// phpcs:enable
	}

	/**
	 * Resolve an applied suggestion and atomically journal its exact rollback.
	 *
	 * @param int    $id              Suggestion ID.
	 * @param string $suggested_value Final reviewed suggestion.
	 * @param string $rollback_value  Exact value before the write.
	 * @param string $applied_value   Exact metadata or content fingerprint after the write.
	 * @return bool
	 */
	public static function resolve_applied( $id, $suggested_value, $rollback_value, $applied_value ) {
		global $wpdb;

		if ( ! self::table_exists() ) {
			return false;
		}

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- custom queue-table write; flush_counts() invalidates its cache below.
		$updated = $wpdb->update(
			self::table(),
			array(
				'suggested_value' => (string) $suggested_value,
				'rollback_value'  => (string) $rollback_value,
				'applied_value'   => (string) $applied_value,
				'status'          => 'approved',
				'resolved_at'     => current_time( 'mysql', true ),
				'resolved_by'     => get_current_user_id(),
			),
			array(
				'id'     => (int) $id,
				'status' => 'pending',
			),
			array( '%s', '%s', '%s', '%s', '%s', '%d' ),
			array( '%d', '%s' )
		);

		if ( $updated ) {
			self::flush_counts();
		}

		return 1 === $updated;
	}

	/**
	 * Mark a safely rolled-back application as undone.
	 *
	 * @param int $id Suggestion ID.
	 * @return bool
	 */
	public static function mark_undone( $id ) {
		global $wpdb;

		if ( ! self::table_exists() ) {
			return false;
		}

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- custom queue-table write; flush_counts() invalidates its cache below.
		$updated = $wpdb->update(
			self::table(),
			array(
				'status'  => 'undone',
				'undo_at' => current_time( 'mysql', true ),
				'undo_by' => get_current_user_id(),
			),
			array(
				'id'     => (int) $id,
				'status' => 'approved',
			),
			array( '%s', '%s', '%d' ),
			array( '%d', '%s' )
		);

		if ( $updated ) {
			self::flush_counts();
		}

		return 1 === $updated;
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

	/**
	 * Dismiss an older pending field after a successful focused regeneration
	 * returns no replacement (for example, no safe internal link exists).
	 *
	 * @param int    $post_id Post owning the pending field.
	 * @param string $field   Valid suggestion field.
	 * @return int Number of rows dismissed.
	 */
	public static function dismiss_pending_field( $post_id, $field ) {
		global $wpdb;

		$field = sanitize_key( $field );
		if ( ! self::table_exists() || ! in_array( $field, FounderPostAI_AISuite_SEO_Optimizer::FIELDS, true ) ) {
			return 0;
		}

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- custom queue-table state transition.
		$updated = $wpdb->update(
			self::table(),
			array(
				'status'      => 'rejected',
				'resolved_at' => current_time( 'mysql', true ),
				'resolved_by' => get_current_user_id(),
			),
			array(
				'post_id' => (int) $post_id,
				'field'   => $field,
				'status'  => 'pending',
			),
			array( '%s', '%s', '%d' ),
			array( '%d', '%s', '%s' )
		);

		if ( $updated ) {
			self::flush_counts();
		}

		return (int) $updated;
	}
}
