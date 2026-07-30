<?php
/**
 * Plugin Name:       AI Suite SEO Pro
 * Plugin URI:        https://founderpostai.com/seo
 * Description:       Adds site-wide bulk optimization, scheduled re-analysis, and auto-apply rules to AI Suite SEO.
 * Version:           1.0.1
 * Requires at least: 6.5
 * Requires PHP:      7.4
 * Requires Plugins:  aisuite-core, aisuite-seo
 * Author:            FounderPostAI
 * Author URI:        https://founderpostai.com
 * License:           GPL-2.0-or-later
 * Text Domain:       aisuite-seo-pro
 * Update URI:        https://founderpostai.com/aisuite-seo-pro
 *
 * NOT distributed on WordPress.org. Ships from your own store with its own
 * update server. The free plugin must never contain locked code that this one
 * unlocks — that is what gets a plugin pulled from the directory.
 */

defined( 'ABSPATH' ) || exit;

define( 'AISUITE_SEO_PRO_VERSION', '1.0.1' );
define( 'AISUITE_SEO_PRO_FILE', __FILE__ );

require_once plugin_dir_path( __FILE__ ) . 'includes/class-updater.php';

add_action(
	'plugins_loaded',
	function () {
		if ( ! function_exists( 'aisuite' ) || ! class_exists( 'AISuite_SEO_Optimizer' ) ) {
			add_action(
				'admin_notices',
				function () {
					if ( current_user_can( 'activate_plugins' ) ) {
						printf(
							'<div class="notice notice-error"><p>%s</p></div>',
							esc_html__( 'AI Suite SEO Pro needs both AI Suite Core and AI Suite SEO. Install and activate them to continue.', 'aisuite-seo-pro' )
						);
					}
				}
			);
			return;
		}

		new AISuite_SEO_Pro_Updater( AISUITE_SEO_PRO_FILE, AISUITE_SEO_PRO_VERSION );
		new AISuite_SEO_Pro();
	},
	20
);

register_deactivation_hook(
	__FILE__,
	function () {
		wp_clear_scheduled_hook( AISuite_SEO_Pro::CRON_HOOK );
		wp_clear_scheduled_hook( AISuite_SEO_Pro::CONTINUE_HOOK );
	}
);

class AISuite_SEO_Pro {

	const OPTION         = 'aisuite_seo_pro_settings';
	const LICENSE_OPTION = 'aisuite_seo_pro_license';
	const CRON_HOOK      = 'aisuite_seo_pro_sweep';
	const CONTINUE_HOOK  = 'aisuite_seo_pro_bulk_continue';
	const SWEEP_CURSOR   = 'aisuite_seo_pro_sweep_cursor';
	const BATCH_SIZE     = 25;
	const MAX_SCAN       = 1000;

	public function __construct() {
		add_action( 'admin_menu', array( $this, 'menu' ), 30 );
		add_action( 'admin_post_aisuite_seo_pro_save', array( $this, 'save' ) );
		add_action( 'admin_post_aisuite_seo_pro_bulk', array( $this, 'run_bulk' ) );
		add_action( self::CRON_HOOK, array( $this, 'sweep' ) );
		add_action( self::CONTINUE_HOOK, array( $this, 'continue_bulk' ) );
		add_action( 'aisuite_job_completed_seo.analyze_post', array( $this, 'maybe_auto_apply' ), 20, 2 );

		if ( ! wp_next_scheduled( self::CRON_HOOK ) && $this->settings()['schedule_enabled'] ) {
			wp_schedule_event( time() + HOUR_IN_SECONDS, 'daily', self::CRON_HOOK );
		}
	}

	public function settings() {
		return wp_parse_args(
			(array) get_option( self::OPTION, array() ),
			array(
				'schedule_enabled' => false,
				'auto_apply_empty' => false,
				'daily_post_limit' => 50,
			)
		);
	}

	public static function license_key() {
		return (string) get_option( self::LICENSE_OPTION, '' );
	}

	public static function license_is_valid( $license ) {
		return (bool) preg_match( '/^AIS[PA]-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/', (string) $license );
	}

	public function menu() {
		add_submenu_page(
			'aisuite',
			__( 'SEO Pro', 'aisuite-seo-pro' ),
			__( 'SEO Pro', 'aisuite-seo-pro' ),
			'manage_options',
			'aisuite-seo-pro',
			array( $this, 'render' )
		);
	}

	public function render() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You do not have permission to view this.', 'aisuite-seo-pro' ) );
		}

		$settings = $this->settings();
		?>
		<div class="wrap aisuite-wrap">
			<h1><?php esc_html_e( 'SEO Pro', 'aisuite-seo-pro' ); ?></h1>

			<div class="aisuite-panel">
				<h2><?php esc_html_e( 'Automation', 'aisuite-seo-pro' ); ?></h2>

				<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
					<?php wp_nonce_field( 'aisuite_seo_pro_save' ); ?>
					<input type="hidden" name="action" value="aisuite_seo_pro_save" />

					<table class="form-table" role="presentation">
						<tr>
							<th scope="row"><?php esc_html_e( 'Daily sweep', 'aisuite-seo-pro' ); ?></th>
							<td>
								<label>
									<input type="checkbox" name="schedule_enabled" value="1" <?php checked( $settings['schedule_enabled'] ); ?> />
									<?php esc_html_e( 'Re-analyze posts changed since their last analysis, once a day.', 'aisuite-seo-pro' ); ?>
								</label>
							</td>
						</tr>
						<tr>
							<th scope="row"><?php esc_html_e( 'Auto-apply', 'aisuite-seo-pro' ); ?></th>
							<td>
								<label>
									<input type="checkbox" name="auto_apply_empty" value="1" <?php checked( $settings['auto_apply_empty'] ); ?> />
									<?php esc_html_e( 'Apply titles and descriptions automatically when the field is currently empty.', 'aisuite-seo-pro' ); ?>
								</label>
								<p class="description">
									<?php esc_html_e( 'Only fills gaps. Anything that would overwrite existing text still goes to the review queue.', 'aisuite-seo-pro' ); ?>
								</p>
							</td>
						</tr>
						<tr>
							<th scope="row"><label for="aisuite-limit"><?php esc_html_e( 'Daily post limit', 'aisuite-seo-pro' ); ?></label></th>
							<td>
								<input type="number" id="aisuite-limit" name="daily_post_limit" min="1" max="500" value="<?php echo esc_attr( $settings['daily_post_limit'] ); ?>" />
								<p class="description"><?php esc_html_e( 'Caps how many actions the sweep can spend per day.', 'aisuite-seo-pro' ); ?></p>
							</td>
						</tr>
						<tr>
							<th scope="row"><label for="aisuite-license"><?php esc_html_e( 'License key', 'aisuite-seo-pro' ); ?></label></th>
							<td>
								<input type="text" id="aisuite-license" name="license_key" class="regular-text" autocomplete="off" spellcheck="false" value="<?php echo esc_attr( self::license_key() ); ?>" placeholder="AISP-XXXX-XXXX-XXXX" />
								<p class="description"><?php esc_html_e( 'From your purchase receipt page. Required for plugin updates.', 'aisuite-seo-pro' ); ?></p>
							</td>
						</tr>
					</table>

					<?php submit_button( __( 'Save settings', 'aisuite-seo-pro' ) ); ?>
				</form>
			</div>

			<div class="aisuite-panel">
				<h2><?php esc_html_e( 'Bulk run', 'aisuite-seo-pro' ); ?></h2>
				<p><?php esc_html_e( 'Queues every published post and page that has never been analyzed.', 'aisuite-seo-pro' ); ?></p>

				<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
					<?php wp_nonce_field( 'aisuite_seo_pro_bulk' ); ?>
					<input type="hidden" name="action" value="aisuite_seo_pro_bulk" />
					<?php submit_button( __( 'Start bulk run', 'aisuite-seo-pro' ), 'primary', 'submit', false ); ?>
				</form>
			</div>
		</div>
		<?php
	}

	public function save() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You do not have permission to do that.', 'aisuite-seo-pro' ) );
		}

		check_admin_referer( 'aisuite_seo_pro_save' );

		$settings = array(
			'schedule_enabled' => ! empty( $_POST['schedule_enabled'] ),
			'auto_apply_empty' => ! empty( $_POST['auto_apply_empty'] ),
			'daily_post_limit' => isset( $_POST['daily_post_limit'] ) ? min( 500, max( 1, (int) $_POST['daily_post_limit'] ) ) : 50,
		);

		update_option( self::OPTION, $settings, false );

		if ( isset( $_POST['license_key'] ) ) {
			$license = strtoupper( sanitize_text_field( wp_unslash( $_POST['license_key'] ) ) );

			if ( '' !== $license && ! self::license_is_valid( $license ) ) {
				$license = '';
			}

			if ( $license !== self::license_key() ) {
				update_option( self::LICENSE_OPTION, $license, false );
				// The cached update response was fetched with the old key.
				delete_transient( AISuite_SEO_Pro_Updater::TRANSIENT );
			}
		}

		if ( $settings['schedule_enabled'] && ! wp_next_scheduled( self::CRON_HOOK ) ) {
			wp_schedule_event( time() + HOUR_IN_SECONDS, 'daily', self::CRON_HOOK );
		} elseif ( ! $settings['schedule_enabled'] ) {
			wp_clear_scheduled_hook( self::CRON_HOOK );
		}

		wp_safe_redirect( admin_url( 'admin.php?page=aisuite-seo-pro' ) );
		exit;
	}

	public function run_bulk() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You do not have permission to do that.', 'aisuite-seo-pro' ) );
		}

		check_admin_referer( 'aisuite_seo_pro_bulk' );

		$this->run_bulk_batch();

		wp_safe_redirect( admin_url( 'admin.php?page=aisuite-seo' ) );
		exit;
	}

	/**
	 * Continuation of a bulk run, fired by cron with no user. A single batch
	 * only covers BATCH_SIZE posts; the promise on the button is "every post
	 * that has never been analyzed", so keep scheduling follow-ups until the
	 * unanalyzed pool is empty or the account can't take more work.
	 */
	public function continue_bulk() {
		$this->run_bulk_batch();
	}

	protected function run_bulk_batch() {
		$outcome = $this->queue_batch( self::BATCH_SIZE, true );

		if ( 'stop' === $outcome['blocked'] ) {
			return;
		}

		// The local queue is full: try again once it has had time to drain.
		if ( 'retry' === $outcome['blocked'] ) {
			$this->schedule_continue( 10 * MINUTE_IN_SECONDS );
			return;
		}

		// A full batch means there may be more unanalyzed posts behind it.
		if ( $outcome['queued'] >= self::BATCH_SIZE ) {
			$this->schedule_continue( 2 * MINUTE_IN_SECONDS );
		}
	}

	protected function schedule_continue( $delay ) {
		if ( ! wp_next_scheduled( self::CONTINUE_HOOK ) ) {
			wp_schedule_single_event( time() + $delay, self::CONTINUE_HOOK );
		}
	}

	/**
	 * Daily sweep: re-analyze only posts actually edited since their last
	 * analysis (plus never-analyzed ones). Re-running unchanged posts would
	 * spend the customer's monthly actions on identical suggestions.
	 */
	public function sweep() {
		global $wpdb;

		$limit     = (int) $this->settings()['daily_post_limit'];
		$optimizer = new AISuite_SEO_Optimizer( false );
		$queued    = 0;
		$scanned   = 0;
		$cursor    = max( 0, (int) get_option( self::SWEEP_CURSOR, 0 ) );

		while ( $queued < $limit && $scanned < self::MAX_SCAN ) {
			// Stable ID cursor: ordering by "modified" restarted at the same newest
			// 1,000 posts every day, so older posts on large sites were never seen.
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$post_ids = $wpdb->get_col(
				$wpdb->prepare(
					'SELECT ID FROM %i
					WHERE ID > %d
					  AND post_status = %s
					  AND post_type IN (%s, %s)
					ORDER BY ID ASC
					LIMIT %d',
					$wpdb->posts,
					$cursor,
					'publish',
					'post',
					'page',
					min( 100, self::MAX_SCAN - $scanned )
				)
			);

			if ( empty( $post_ids ) ) {
				update_option( self::SWEEP_CURSOR, 0, false );
				break;
			}

			foreach ( $post_ids as $post_id ) {
				$post_id         = (int) $post_id;
				$previous_cursor = $cursor;
				$post            = get_post( $post_id );
				++$scanned;

				if ( ! $post ) {
					$cursor = $post_id;
					continue;
				}

				$analyzed = (int) get_post_meta( $post_id, '_aisuite_seo_analyzed', true );
				$modified = strtotime( $post->post_modified_gmt . ' GMT' );

				if ( $analyzed && $modified && $modified <= $analyzed ) {
					$cursor = $post_id;
					continue; // Unchanged since its last analysis.
				}

				$in_flight = (int) get_post_meta( $post_id, AISuite_SEO_Optimizer::META_QUEUED, true );

				if ( $in_flight && time() - $in_flight < DAY_IN_SECONDS ) {
					$cursor = $post_id;
					continue; // An analysis is already queued or running.
				}

				$result = $optimizer->analyze( $post_id, false );

				if ( is_wp_error( $result ) ) {
					if ( in_array( $result->get_error_code(), array( 'aisuite_queue_full', 'aisuite_out_of_credits', 'aisuite_not_connected' ), true ) ) {
						update_option( self::SWEEP_CURSOR, $previous_cursor, false );
						return;
					}
					$cursor = $post_id;
					continue;
				}

				++$queued;
				$cursor = $post_id;

				if ( $queued >= $limit ) {
					update_option( self::SWEEP_CURSOR, $cursor, false );
					return;
				}
			}

			update_option( self::SWEEP_CURSOR, $cursor, false );
		}
	}

	/**
	 * @param int  $limit      Max posts to queue.
	 * @param bool $never_only Only posts with no prior analysis.
	 * @return array { queued: int, blocked: ''|'retry'|'stop' }
	 */
	protected function queue_batch( $limit, $never_only ) {
		$meta_query = $never_only
			? array(
				'relation' => 'AND',
				array(
					'key'     => '_aisuite_seo_analyzed',
					'compare' => 'NOT EXISTS',
				),
				// Not already in flight from an earlier batch — completion is
				// what writes _aisuite_seo_analyzed, so without this a
				// continuation would re-queue (and re-charge) the same posts.
				// Markers older than a day are stale (the job queue times out
				// at a day) and must not exclude a post forever.
				array(
					'relation' => 'OR',
					array(
						'key'     => '_aisuite_seo_queued',
						'compare' => 'NOT EXISTS',
					),
					array(
						'key'     => '_aisuite_seo_queued',
						'value'   => time() - DAY_IN_SECONDS,
						'compare' => '<',
						'type'    => 'NUMERIC',
					),
				),
			)
			: array();

		$post_ids = get_posts(
			array(
				'post_type'      => array( 'post', 'page' ),
				'post_status'    => 'publish',
				'posts_per_page' => (int) $limit,
				'fields'         => 'ids',
				'orderby'        => 'modified',
				'order'          => 'DESC',
				'meta_query'     => $meta_query, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
			)
		);

		$optimizer = new AISuite_SEO_Optimizer( false );
		$enforce   = (bool) get_current_user_id(); // Cron continuations run with no user.
		$queued    = 0;
		$blocked   = '';

		foreach ( $post_ids as $post_id ) {
			$result = $optimizer->analyze( $post_id, $enforce );

			if ( ! is_wp_error( $result ) ) {
				++$queued;
				continue;
			}

			// Queue full drains on its own — worth retrying later. Credits and
			// connection problems need the customer, so stop entirely.
			if ( 'aisuite_queue_full' === $result->get_error_code() ) {
				$blocked = 'retry';
				break;
			}

			if ( in_array( $result->get_error_code(), array( 'aisuite_out_of_credits', 'aisuite_not_connected' ), true ) ) {
				$blocked = 'stop';
				break;
			}
		}

		return array(
			'queued'  => $queued,
			'blocked' => $blocked,
		);
	}

	/**
	 * Auto-apply gap fills only. Never overwrites something a human wrote.
	 */
	public function maybe_auto_apply( $result, $context ) {
		if ( ! $this->settings()['auto_apply_empty'] ) {
			return;
		}

		$post_id = isset( $context['post_id'] ) ? (int) $context['post_id'] : 0;

		if ( ! $post_id ) {
			return;
		}

		$optimizer   = new AISuite_SEO_Optimizer( false );
		$suggestions = AISuite_SEO_Store::query(
			array(
				'status'   => 'pending',
				'post_id'  => $post_id,
				'per_page' => 10,
			)
		);
		$returned    = array();

		foreach ( isset( $result['suggestions'] ) ? (array) $result['suggestions'] : array() as $suggestion ) {
			$field = isset( $suggestion['field'] ) ? sanitize_key( $suggestion['field'] ) : '';

			if ( in_array( $field, array( 'title', 'description' ), true ) ) {
				$value              = isset( $suggestion['value'] ) ? sanitize_text_field( $suggestion['value'] ) : '';
				$limit              = 'title' === $field ? 60 : 155;
				$returned[ $field ] = function_exists( 'mb_substr' ) ? mb_substr( $value, 0, $limit ) : substr( $value, 0, $limit );
			}
		}

		foreach ( $suggestions as $row ) {
			if ( ! in_array( $row->field, array( 'title', 'description' ), true ) ) {
				continue;
			}

			if ( ! isset( $returned[ $row->field ] ) || $returned[ $row->field ] !== (string) $row->suggested_value ) {
				continue; // Do not auto-apply an older pending suggestion.
			}

			if ( '' !== trim( (string) $row->current_value ) || '' !== trim( $optimizer->current_value( $post_id, $row->field ) ) ) {
				continue;
			}

			// Runs inside the gateway callback, where there is no current user.
			// The site owner authorized this by enabling auto-apply.
			$optimizer->apply( $row->id, false );
		}
	}
}
