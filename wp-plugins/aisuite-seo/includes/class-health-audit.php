<?php
/** Bounded, resumable local audits. Stores derived rows, never full post bodies. */
defined( 'ABSPATH' ) || exit;

class FounderPostAI_AISuite_SEO_Health_Audit {
	const HOOK = 'founderpostai_aisuite_seo_health_batch';
	const STATE = 'founderpostai_aisuite_seo_health_state';
	const SNAPSHOT = 'founderpostai_aisuite_seo_health_complete';
	const DIRTY = 'founderpostai_aisuite_seo_health_dirty';
	const LOCK = 'founderpostai_aisuite_seo_health_lock';
	const BATCH = 50;

	public function __construct() {
		add_action( self::HOOK, array( __CLASS__, 'run_batch' ) );
	}

	public static function table( $edges = false ) {
		global $wpdb;
		return $wpdb->prefix . 'founderpostai_aisuite_seo_health_' . ( $edges ? 'edges' : 'rows' );
	}

	public static function install() {
		global $wpdb;
		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		$table = self::table();
		$edges = self::table( true );
		$charset = $wpdb->get_charset_collate();
		dbDelta( "CREATE TABLE {$table} (
			generation varchar(36) NOT NULL,
			post_id bigint unsigned NOT NULL,
			url_hash char(32) NOT NULL,
			data text NOT NULL,
			missing tinyint NOT NULL DEFAULT 0,
			stale tinyint NOT NULL DEFAULT 0,
			errors tinyint NOT NULL DEFAULT 0,
			optimized tinyint NOT NULL DEFAULT 0,
			orphaned tinyint NOT NULL DEFAULT 0,
			pending int NOT NULL DEFAULT 0,
			PRIMARY KEY  (generation,post_id),
			KEY url_hash (generation,url_hash)
		) {$charset};" );
		dbDelta( "CREATE TABLE {$edges} (
			generation varchar(36) NOT NULL,
			source_id bigint unsigned NOT NULL,
			target_hash char(32) NOT NULL,
			PRIMARY KEY  (generation,source_id,target_hash),
			KEY target_hash (generation,target_hash)
		) {$charset};" );
		self::invalidate();
	}

	public static function schedule() {
		if ( ! wp_next_scheduled( self::HOOK ) ) {
			wp_schedule_single_event( time() + 10, self::HOOK );
		}
	}

	public static function invalidate() {
		update_option( self::DIRTY, wp_generate_uuid4(), false );
		self::schedule();
	}

	public static function snapshot( $force = false ) {
		$snapshot = get_option( self::SNAPSHOT, array() );
		if ( $force || empty( $snapshot ) || $snapshot['generated_at'] < time() - 6 * HOUR_IN_SECONDS ) {
			// Don't invalidate a running generation on every dashboard refresh.
			if ( ! get_option( self::DIRTY ) ) {
				self::invalidate();
			}
		}
		if ( get_option( self::DIRTY ) || get_option( self::STATE ) ) {
			self::schedule();
		}
		if ( empty( $snapshot ) ) {
			$snapshot = array( 'generation' => '', 'generated_at' => 0, 'provider' => FounderPostAI_AISuite_SEO_Meta_Adapter::provider(), 'summary' => array_fill_keys( array( 'total', 'optimized', 'coverage', 'missing', 'stale', 'errors', 'orphaned', 'pending', 'action' ), 0 ) );
		}
		$snapshot['building'] = (bool) ( get_option( self::DIRTY ) || get_option( self::STATE ) );
		return $snapshot;
	}

	public static function page( $snapshot, $filter, $page ) {
		global $wpdb;
		if ( empty( $snapshot['generation'] ) ) {
			return array();
		}
		$clauses = array( 'all' => '1=1', 'action' => '(optimized=0 OR orphaned=1)', 'missing' => 'missing=1', 'stale' => 'stale=1', 'errors' => 'errors=1', 'orphaned' => 'orphaned=1', 'optimized' => 'optimized=1' );
		$where = isset( $clauses[ $filter ] ) ? $clauses[ $filter ] : $clauses['all'];
		// Only a fixed SQL allowlist is interpolated; identifiers/values are prepared.
		$rows = $wpdb->get_col( $wpdb->prepare( "SELECT data FROM %i WHERE generation=%s AND {$where} ORDER BY post_id DESC LIMIT %d OFFSET %d", self::table(), $snapshot['generation'], FounderPostAI_AISuite_SEO_Health_Screen::PER_PAGE, ( max( 1, (int) $page ) - 1 ) * FounderPostAI_AISuite_SEO_Health_Screen::PER_PAGE ) );
		return array_map( function ( $row ) { return json_decode( $row, true ); }, $rows );
	}

	public static function run_batch() {
		global $wpdb;
		// Compare-and-delete stale leases so two workers cannot both steal a lock.
		$old = get_option( self::LOCK );
		if ( $old && (int) $old < time() - 300 ) {
			$wpdb->query( $wpdb->prepare( 'DELETE FROM %i WHERE option_name=%s AND option_value=%s', $wpdb->options, self::LOCK, (string) $old ) );
			wp_cache_delete( self::LOCK, 'options' );
		}
		$lease = (string) time();
		if ( ! add_option( self::LOCK, $lease, '', false ) ) {
			self::schedule();
			return;
		}
		try {
			$state = get_option( self::STATE );
			if ( ! $state ) {
				if ( ! get_option( self::DIRTY ) ) { return; }
				$state = array( 'generation' => wp_generate_uuid4(), 'dirty' => get_option( self::DIRTY ), 'cursor' => 0, 'phase' => 'scan' );
				update_option( self::STATE, $state, false );
			}
			$gen = $state['generation'];
			$table = self::table();
			$edges = self::table( true );
			if ( 'scan' === $state['phase'] ) {
				$types = array_values( array_diff( get_post_types( array( 'public' => true ), 'names' ), array( 'attachment' ) ) );
				$types = $types ? $types : array( 'post', 'page' );
				$slots = implode( ',', array_fill( 0, count( $types ), '%s' ) );
				$ids = $wpdb->get_col( $wpdb->prepare( "SELECT ID FROM %i WHERE ID>%d AND post_status='publish' AND post_type IN ({$slots}) ORDER BY ID LIMIT %d", array_merge( array( $wpdb->posts, $state['cursor'] ), $types, array( self::BATCH ) ) ) );
				$metadata = FounderPostAI_AISuite_SEO_Meta_Adapter::read_many( $ids );
				$pending = FounderPostAI_AISuite_SEO_Store::pending_counts_by_post( $ids );
				foreach ( $ids as $id ) {
					$post = get_post( $id );
					if ( ! $post ) { continue; }
					$row = FounderPostAI_AISuite_SEO_Health_Screen::build_row( $post, isset( $metadata[ $id ] ) ? $metadata[ $id ] : array(), isset( $pending[ $id ] ) ? $pending[ $id ] : 0 );
					$url = FounderPostAI_AISuite_SEO_Health_Screen::normalize_url( get_permalink( $post ) );
					$saved = $wpdb->replace( $table, array( 'generation' => $gen, 'post_id' => $id, 'url_hash' => md5( $url ), 'data' => wp_json_encode( $row ), 'missing' => (int) ( $row['missing_title'] || $row['missing_description'] ), 'stale' => (int) $row['stale'], 'errors' => (int) (bool) $row['error'], 'optimized' => (int) $row['optimized'], 'pending' => $row['pending'] ) );
					if ( false === $saved ) { throw new RuntimeException( 'Could not store health row' ); }
					$wpdb->delete( $edges, array( 'generation' => $gen, 'source_id' => $id ) );
					preg_match_all( '/<a\s[^>]*href\s*=\s*(["\'])(.*?)\1/isu', $post->post_content, $matches );
					$targets = array();
					foreach ( $matches[2] as $href ) {
						$target = FounderPostAI_AISuite_SEO_Health_Screen::normalize_url( html_entity_decode( $href, ENT_QUOTES, 'UTF-8' ) );
						if ( '' !== $target && $target !== $url ) { $targets[ md5( $target ) ] = true; }
					}
					foreach ( array_keys( $targets ) as $hash ) {
						if ( false === $wpdb->replace( $edges, array( 'generation' => $gen, 'source_id' => $id, 'target_hash' => $hash ) ) ) { throw new RuntimeException( 'Could not store health edge' ); }
					}
					$state['cursor'] = (int) $id;
				}
				if ( count( $ids ) < self::BATCH ) { $state['phase'] = 'links'; $state['cursor'] = 0; }
			} else {
				$rows = $wpdb->get_results( $wpdb->prepare( 'SELECT post_id,url_hash,data FROM %i WHERE generation=%s AND post_id>%d ORDER BY post_id LIMIT %d', $table, $gen, $state['cursor'], self::BATCH ) );
				foreach ( $rows as $stored ) {
					$row = json_decode( $stored->data, true );
					$row['incoming'] = (int) $wpdb->get_var( $wpdb->prepare( 'SELECT COUNT(*) FROM %i WHERE generation=%s AND target_hash=%s', $edges, $gen, $stored->url_hash ) );
					$row['outgoing'] = (int) $wpdb->get_var( $wpdb->prepare( 'SELECT COUNT(DISTINCT e.target_hash) FROM %i e INNER JOIN %i r ON r.generation=e.generation AND r.url_hash=e.target_hash WHERE e.generation=%s AND e.source_id=%d', $edges, $table, $gen, $stored->post_id ) );
					$row['orphaned'] = 0 === $row['incoming'];
					if ( false === $wpdb->update( $table, array( 'data' => wp_json_encode( $row ), 'orphaned' => (int) $row['orphaned'] ), array( 'generation' => $gen, 'post_id' => $stored->post_id ) ) ) { throw new RuntimeException( 'Could not store link counts' ); }
					$state['cursor'] = (int) $stored->post_id;
				}
				if ( count( $rows ) < self::BATCH ) {
					$summary = $wpdb->get_row( $wpdb->prepare( 'SELECT COUNT(*) total, SUM(optimized) optimized, SUM(missing) missing, SUM(stale) stale, SUM(errors) errors, SUM(orphaned) orphaned, SUM(pending) pending, SUM(optimized=0 OR orphaned=1) action FROM %i WHERE generation=%s', $table, $gen ), ARRAY_A );
					$summary = array_map( 'intval', $summary );
					$summary['coverage'] = $summary['total'] ? (int) round( 100 * $summary['optimized'] / $summary['total'] ) : 100;
					update_option( self::SNAPSHOT, array( 'generation' => $gen, 'generated_at' => time(), 'provider' => FounderPostAI_AISuite_SEO_Meta_Adapter::provider(), 'summary' => $summary ), false );
					delete_option( self::STATE );
					$wpdb->query( $wpdb->prepare( 'DELETE FROM %i WHERE option_name=%s AND option_value=%s', $wpdb->options, self::DIRTY, $state['dirty'] ) );
					wp_cache_delete( self::DIRTY, 'options' );
					// Only obsolete generated audit data is removed; posts and metadata are untouched.
					$wpdb->query( $wpdb->prepare( 'DELETE FROM %i WHERE generation<>%s', $table, $gen ) );
					$wpdb->query( $wpdb->prepare( 'DELETE FROM %i WHERE generation<>%s', $edges, $gen ) );
					if ( get_option( self::DIRTY ) ) { self::schedule(); }
					return;
				}
			}
			update_option( self::STATE, $state, false );
			self::schedule();
		} catch ( Throwable $error ) {
			// Keep the last completed generation and resume this batch on the next cron run.
			self::schedule();
		} finally {
			$wpdb->query( $wpdb->prepare( 'DELETE FROM %i WHERE option_name=%s AND option_value=%s', $wpdb->options, self::LOCK, $lease ) );
			wp_cache_delete( self::LOCK, 'options' );
		}
	}

	public static function drop() {
		global $wpdb;
		foreach ( array( self::table(), self::table( true ) ) as $table ) { $wpdb->query( $wpdb->prepare( 'DROP TABLE IF EXISTS %i', $table ) ); }
		foreach ( array( self::STATE, self::SNAPSHOT, self::DIRTY, self::LOCK ) as $option ) { delete_option( $option ); }
		wp_clear_scheduled_hook( self::HOOK );
	}
}
