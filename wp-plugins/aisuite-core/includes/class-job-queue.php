<?php
/**
 * Background job queue.
 *
 * Three dispatch paths, in order of preference:
 *
 *   1. Action Scheduler, when a plugin on the site provides it.
 *   2. A non-blocking loopback request that runs the queue immediately.
 *   3. WP-Cron, which only fires on a page load.
 *
 * Job records live in non-autoloaded options rather than transients. Transients
 * are evictable when an object cache is present, and a job whose payload has
 * been evicted can never run. Cron args carry the reference only — never the
 * payload — because WP-Cron stores its schedule in an autoloaded option, and
 * post content in there is loaded on every single request to the site.
 */

defined( 'ABSPATH' ) || exit;

class AISuite_Job_Queue {

	const GROUP          = 'aisuite';
	const HOOK_SUBMIT    = 'aisuite_submit_job';
	const HOOK_RECONCILE = 'aisuite_reconcile_job';
	const HOOK_CLEANUP   = 'aisuite_cleanup_jobs';
	const HOOK_TRACK     = 'aisuite_track_job';
	const JOB_PREFIX     = 'aisuite_job_';
	const INDEX_OPTION   = 'aisuite_open_jobs';
	const LOOPBACK_TOKEN = 'aisuite_loopback_';
	const LOCK_PREFIX    = 'aisuite_lock_';
	const AJAX_ACTION    = 'aisuite_run_queue';

	/** Seconds one loopback pass will spend submitting before handing off. */
	const LOOPBACK_BUDGET = 25;

	/** Transient submit failures are retried this many times before giving up. */
	const MAX_ATTEMPTS = 3;

	/** Hard ceiling on tracked open jobs, so a broken gateway can't grow forever. */
	const MAX_OPEN = 500;

	/** Job records older than this are swept up. */
	const MAX_AGE = DAY_IN_SECONDS;

	/** @var AISuite_Gateway_Client */
	protected $gateway;

	/** @var bool One loopback per request, however many jobs were queued. */
	protected $dispatch_queued = false;

	public function __construct( AISuite_Gateway_Client $gateway ) {
		$this->gateway = $gateway;

		add_action( self::HOOK_SUBMIT, array( $this, 'run_submit' ), 10, 1 );
		add_action( self::HOOK_RECONCILE, array( $this, 'run_reconcile' ), 10, 1 );
		add_action( self::HOOK_CLEANUP, array( $this, 'run_cleanup' ) );
		add_action( self::HOOK_TRACK, array( $this, 'track_deferred' ), 10, 1 );
		add_action( 'aisuite_refresh_account', array( $this->gateway, 'get_account' ) );

		// Loopback entry point. Authenticated by a rotating token, not a nonce:
		// the caller is this site's own PHP process, with no user session.
		add_action( 'wp_ajax_nopriv_' . self::AJAX_ACTION, array( $this, 'handle_loopback' ) );
		add_action( 'wp_ajax_' . self::AJAX_ACTION, array( $this, 'handle_loopback' ) );
	}

	public static function has_action_scheduler() {
		return function_exists( 'as_schedule_single_action' );
	}

	/**
	 * How this site will actually run jobs. Shown in the admin so "why is this
	 * slow" has an answer.
	 *
	 * @return string action_scheduler|loopback|wp_cron
	 */
	public static function dispatch_mode() {
		if ( self::has_action_scheduler() ) {
			return 'action_scheduler';
		}

		if ( apply_filters( 'aisuite_allow_loopback', true ) ) {
			return 'loopback';
		}

		return 'wp_cron';
	}

	/**
	 * Enqueue a job for a module.
	 *
	 * @param string $type    Job type, e.g. 'seo.analyze_post'.
	 * @param array  $payload Job-specific data.
	 * @param array  $context Echoed back to the module on completion.
	 * @return string|WP_Error Local job reference.
	 */
	public function enqueue( $type, array $payload, array $context = array() ) {
		if ( ! AISuite_Site_Auth::is_connected() ) {
			return new WP_Error( 'aisuite_not_connected', __( 'Connect your AI Suite account before running this.', 'aisuite-core' ) );
		}

		$open = $this->tracked();

		if ( count( $open ) >= self::MAX_OPEN ) {
			return new WP_Error(
				'aisuite_queue_full',
				__( 'Too many jobs are already waiting. Let the queue drain before adding more.', 'aisuite-core' )
			);
		}

		$ref = wp_generate_uuid4();

		update_option(
			self::JOB_PREFIX . $ref,
			array(
				'type'    => $type,
				'payload' => $payload,
				'context' => $context,
				'status'  => 'queued',
				'queued'  => time(),
			),
			false
		);

		$this->track( $ref );
		$this->dispatch( $ref );

		return $ref;
	}

	/**
	 * Hand the job to whichever runner this site has.
	 */
	protected function dispatch( $ref ) {
		if ( self::has_action_scheduler() ) {
			as_schedule_single_action( time(), self::HOOK_SUBMIT, array( $ref ), self::GROUP );
			return;
		}

		// Backstop first, so a blocked loopback still resolves eventually.
		if ( ! wp_next_scheduled( self::HOOK_SUBMIT, array( $ref ) ) ) {
			wp_schedule_single_event( time() + 60, self::HOOK_SUBMIT, array( $ref ) );
		}

		if ( ! apply_filters( 'aisuite_allow_loopback', true ) ) {
			return;
		}

		// Queue one loopback for the whole request. Enqueueing ten posts must
		// not fire ten loopbacks, each invalidating the last one's token.
		if ( ! $this->dispatch_queued ) {
			$this->dispatch_queued = true;
			add_action( 'shutdown', array( $this, 'spawn_loopback' ), 100 );
		}
	}

	/**
	 * Fire and forget a request to our own admin-ajax.
	 *
	 * blocking => false means this returns in milliseconds; the admin screen
	 * that triggered it doesn't wait for the model.
	 */
	public function spawn_loopback() {
		$token = wp_generate_password( 32, false );

		set_transient( $this->loopback_key( $token ), 1, 5 * MINUTE_IN_SECONDS );

		wp_remote_post(
			admin_url( 'admin-ajax.php' ),
			array(
				'timeout'   => 0.01,
				'blocking'  => false,
					// phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- WordPress core's loopback SSL filter.
					'sslverify' => apply_filters( 'https_local_ssl_verify', false ),
				'body'      => array(
					'action' => self::AJAX_ACTION,
					'token'  => $token,
				),
			)
		);
	}

	/**
	 * Runs inside the loopback request: submit whatever is queued.
	 */
	public function handle_loopback() {
		// phpcs:ignore WordPress.Security.NonceVerification.Missing -- a single-use server-generated transient authenticates this non-user loopback.
		$given = isset( $_POST['token'] ) ? sanitize_text_field( wp_unslash( $_POST['token'] ) ) : '';
		$token = $given ? get_transient( $this->loopback_key( $given ) ) : false;

		if ( ! $token || ! $given ) {
			wp_die( '', '', array( 'response' => 403 ) );
		}

		delete_transient( $this->loopback_key( $given ) );

		// The originating request has already returned; don't die with it.
		ignore_user_abort( true );

		if ( function_exists( 'set_time_limit' ) ) {
			// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged, Squiz.PHP.DiscouragedFunctions.Discouraged -- background worker must outlive the originating request.
			@set_time_limit( 0 );
		}

		$started   = time();
		$remaining = false;

		foreach ( $this->tracked() as $ref ) {
			if ( time() - $started >= self::LOOPBACK_BUDGET ) {
				$remaining = true;
				break;
			}

			$record = $this->get( $ref );

			if ( empty( $record ) || 'queued' !== $record['status'] ) {
				continue;
			}

			$this->run_submit( $ref );
		}

		// More to do than one request should hold open: hand off to a fresh one.
		if ( $remaining ) {
			$this->spawn_loopback();
		}

		wp_die( '', '', array( 'response' => 200 ) );
	}

	/**
	 * Submit a job to the gateway.
	 *
	 * @param string $ref Local job reference.
	 */
	public function run_submit( $ref ) {
		if ( ! $this->acquire_lock( 'submit_' . $ref ) ) {
			return;
		}

		try {
			$record = $this->get( $ref );

			if ( empty( $record ) || 'queued' !== $record['status'] ) {
				return; // Loopback and cron both arrived; first one wins.
			}

			// The option write alone is not a compare-and-swap. The lock above is
			// what makes this claim atomic across loopback, cron, and Action Scheduler.
			$record['status'] = 'submitting';
			$this->put( $ref, $record );

			$result = $this->gateway->submit_job( $record['type'], (array) $record['payload'], $ref );

			// The gateway may process the job and deliver the callback while this
			// request is still open. That callback resolves the job and deletes the
			// record — writing "running" over that would resurrect a finished job.
			$record = $this->get( $ref );

			if ( empty( $record ) || 'submitting' !== $record['status'] ) {
				return;
			}

			if ( ! is_wp_error( $result ) && ( empty( $result['job_id'] ) || ! is_scalar( $result['job_id'] ) ) ) {
				$result = new WP_Error( 'aisuite_bad_job_response', __( 'The gateway accepted the job but did not return a job identifier.', 'aisuite-core' ) );
			}

			if ( is_wp_error( $result ) ) {
				if ( $this->should_retry( $result, $record ) ) {
					$this->requeue( $ref, $record );
				} else {
					$this->fail( $ref, $result->get_error_message() );
				}
				return;
			}

			if ( isset( $result['account'] ) && is_array( $result['account'] ) ) {
				AISuite_Site_Auth::store_account( $result['account'] );
			}

			// Short jobs currently finish inline. If a callback is blocked but
			// the signed submit response already has the durable terminal result,
			// consume it immediately instead of waiting for the reconcile poll.
			if ( isset( $result['status'] ) && 'completed' === $result['status'] ) {
				$this->complete( $ref, isset( $result['result'] ) ? (array) $result['result'] : array() );
				return;
			}

			if ( isset( $result['status'] ) && 'failed' === $result['status'] ) {
				$this->fail( $ref, isset( $result['error'] ) ? $result['error'] : __( 'Job failed.', 'aisuite-core' ) );
				return;
			}

			$record['status'] = 'running';
			$record['job_id'] = sanitize_text_field( (string) $result['job_id'] );
			unset( $record['payload'] ); // Don't hold post content longer than needed.
			$this->put( $ref, $record );
			$this->schedule_reconcile( $ref, 180, 300 );
		} finally {
			$this->release_lock( 'submit_' . $ref );
		}
	}

	/**
	 * Whether a failed submit is worth another attempt.
	 *
	 * The gateway is idempotent on the job reference, so resubmitting after a
	 * timeout can never double-charge — a duplicate submit returns the job the
	 * first attempt actually created. Definitive rejections (bad credentials,
	 * out of credits, malformed request) are the only failures retrying can't fix.
	 */
	protected function should_retry( WP_Error $error, array $record ) {
		$attempts = isset( $record['attempts'] ) ? (int) $record['attempts'] : 0;

		if ( $attempts >= self::MAX_ATTEMPTS ) {
			return false;
		}

		if ( in_array( $error->get_error_code(), array( 'aisuite_out_of_credits', 'aisuite_unauthorized', 'aisuite_not_connected' ), true ) ) {
			return false;
		}

		$data   = $error->get_error_data();
		$status = is_array( $data ) && isset( $data['status'] ) ? (int) $data['status'] : 0;

		// 4xx (other than rate limiting) means the request itself is wrong.
		if ( $status >= 400 && $status < 500 && 429 !== $status ) {
			return false;
		}

		return true;
	}

	/**
	 * Put a job back in the queue with backoff for another submit attempt.
	 */
	protected function requeue( $ref, array $record ) {
		$record['status']   = 'queued';
		$record['attempts'] = isset( $record['attempts'] ) ? (int) $record['attempts'] + 1 : 1;
		$this->put( $ref, $record );

		$delay = 120 * $record['attempts'];

		if ( self::has_action_scheduler() ) {
			as_schedule_single_action( time() + $delay, self::HOOK_SUBMIT, array( $ref ), self::GROUP );
		} elseif ( ! wp_next_scheduled( self::HOOK_SUBMIT, array( $ref ) ) ) {
			wp_schedule_single_event( time() + $delay, self::HOOK_SUBMIT, array( $ref ) );
		}
	}

	/**
	 * Poll for a result the callback never delivered.
	 */
	public function run_reconcile( $ref ) {
		$record = $this->get( $ref );

		if ( empty( $record ) || 'running' !== $record['status'] || empty( $record['job_id'] ) ) {
			return;
		}

		$result = $this->gateway->get_job( $record['job_id'] );

		if ( is_wp_error( $result ) ) {
			$this->schedule_reconcile( $ref, 300, 600 );
			return;
		}

		if ( isset( $result['account'] ) && is_array( $result['account'] ) ) {
			AISuite_Site_Auth::store_account( $result['account'] );
		}

		$status = isset( $result['status'] ) ? $result['status'] : '';

		if ( 'completed' === $status ) {
			$this->complete( $ref, isset( $result['result'] ) ? (array) $result['result'] : array() );
		} elseif ( 'failed' === $status ) {
			$this->fail( $ref, isset( $result['error'] ) ? $result['error'] : __( 'Job failed.', 'aisuite-core' ) );
		} else {
			$this->schedule_reconcile( $ref, 300, 600 );
		}
	}

	/** @return array */
	public function get( $ref ) {
		$record = get_option( self::JOB_PREFIX . $ref, array() );
		return is_array( $record ) ? $record : array();
	}

	protected function put( $ref, array $record ) {
		update_option( self::JOB_PREFIX . $ref, $record, false );
	}

	/**
	 * Fan the result out to whichever module owns this job type.
	 */
	public function complete( $ref, array $result ) {
		if ( ! $this->acquire_lock( 'finish_' . $ref ) ) {
			return;
		}

		try {
			$record = $this->get( $ref );

			if ( empty( $record ) ) {
				return; // Callback and reconcile both landed; ignore the second.
			}

			$type    = $record['type'];
			$context = isset( $record['context'] ) ? (array) $record['context'] : array();

			$this->finish( $ref );

			do_action( 'aisuite_job_completed_' . $type, $result, $context, $ref );
			do_action( 'aisuite_job_completed', $type, $result, $context, $ref );
		} finally {
			$this->release_lock( 'finish_' . $ref );
		}
	}

	public function fail( $ref, $message ) {
		if ( ! $this->acquire_lock( 'finish_' . $ref ) ) {
			return;
		}

		try {
			$record = $this->get( $ref );

			if ( empty( $record ) ) {
				return;
			}

			$type    = $record['type'];
			$context = isset( $record['context'] ) ? (array) $record['context'] : array();

			$this->finish( $ref );

			do_action( 'aisuite_job_failed_' . $type, $message, $context, $ref );
			do_action( 'aisuite_job_failed', $type, $message, $context, $ref );
		} finally {
			$this->release_lock( 'finish_' . $ref );
		}
	}

	/**
	 * Retire a job: drop its record and its pending cron events.
	 *
	 * Leaving the reconcile event scheduled would fire a pointless gateway poll
	 * minutes after the work is already done.
	 */
	protected function finish( $ref ) {
		delete_option( self::JOB_PREFIX . $ref );
		$this->untrack( $ref );

		wp_clear_scheduled_hook( self::HOOK_SUBMIT, array( $ref ) );
		wp_clear_scheduled_hook( self::HOOK_RECONCILE, array( $ref ) );

		if ( function_exists( 'as_unschedule_all_actions' ) ) {
			as_unschedule_all_actions( self::HOOK_SUBMIT, array( $ref ), self::GROUP );
			as_unschedule_all_actions( self::HOOK_RECONCILE, array( $ref ), self::GROUP );
		}
	}

	/**
	 * Daily sweep. A gateway that goes dark mid-flight would otherwise leave
	 * records and index entries behind forever.
	 */
	public function run_cleanup() {
		$open = $this->tracked();

		foreach ( $open as $ref ) {
			$record = $this->get( $ref );

			if ( empty( $record ) ) {
				$this->untrack( $ref );
				continue;
			}

			$age = time() - ( isset( $record['queued'] ) ? (int) $record['queued'] : 0 );

			if ( $age > self::MAX_AGE ) {
				$this->fail( $ref, __( 'This job timed out before a result came back.', 'aisuite-core' ) );
				continue;
			}
		}
	}

	/**
	 * Open-job index. Transients aren't enumerable on object-cache sites, so
	 * the refs are tracked in one non-autoloaded option.
	 */
	protected function track( $ref ) {
		if ( ! $this->acquire_lock( 'index', 10, true ) ) {
			if ( ! wp_next_scheduled( self::HOOK_TRACK, array( $ref ) ) ) {
				wp_schedule_single_event( time() + 5, self::HOOK_TRACK, array( $ref ) );
			}
			return;
		}

		$open = $this->tracked();

		if ( ! in_array( $ref, $open, true ) ) {
			$open[] = $ref;
			update_option( self::INDEX_OPTION, $open, false );
		}

		$this->release_lock( 'index' );
	}

	protected function untrack( $ref ) {
		if ( ! $this->acquire_lock( 'index', 10, true ) ) {
			return;
		}

		$open = $this->tracked();
		$next = array_values( array_diff( $open, array( $ref ) ) );

		if ( count( $next ) !== count( $open ) ) {
			update_option( self::INDEX_OPTION, $next, false );
		}

		$this->release_lock( 'index' );
	}

	/** @return array */
	public function tracked() {
		$open = get_option( self::INDEX_OPTION, array() );
		$open = is_array( $open ) ? $open : array();

		return array_values(
			array_unique(
				array_filter(
					$open,
					function ( $ref ) {
						return is_string( $ref ) && (bool) preg_match( '/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i', $ref );
					}
				)
			)
		);
	}

	/** Queued or in-flight job count, for the admin. */
	public function open_count() {
		return count( $this->tracked() );
	}

	/** Retry an index write that briefly lost contention with another request. */
	public function track_deferred( $ref ) {
		if ( $this->get( $ref ) ) {
			$this->track( $ref );
		}
	}

	/** Fail every local job before credentials are removed. */
	public function fail_all( $message ) {
		foreach ( $this->tracked() as $ref ) {
			$this->fail( $ref, $message );
		}
	}

	protected function schedule_reconcile( $ref, $action_scheduler_delay, $cron_delay ) {
		if ( self::has_action_scheduler() ) {
			if ( ! function_exists( 'as_next_scheduled_action' ) || ! as_next_scheduled_action( self::HOOK_RECONCILE, array( $ref ), self::GROUP ) ) {
				as_schedule_single_action( time() + $action_scheduler_delay, self::HOOK_RECONCILE, array( $ref ), self::GROUP );
			}
		} elseif ( ! wp_next_scheduled( self::HOOK_RECONCILE, array( $ref ) ) ) {
			wp_schedule_single_event( time() + $cron_delay, self::HOOK_RECONCILE, array( $ref ) );
		}
	}

	protected function loopback_key( $token ) {
		return self::LOOPBACK_TOKEN . md5( (string) $token );
	}

	/**
	 * add_option() is an atomic INSERT because option_name is unique. That gives
	 * the queue a small cross-request mutex without requiring a cache backend.
	 */
	protected function acquire_lock( $name, $ttl = 300, $wait = false ) {
		$key      = self::LOCK_PREFIX . md5( (string) $name );
		$attempts = $wait ? 50 : 1;

		for ( $attempt = 0; $attempt < $attempts; $attempt++ ) {
			if ( add_option( $key, time(), '', false ) ) {
				return true;
			}

			$created = (int) get_option( $key, 0 );

			if ( $created && time() - $created > $ttl ) {
				delete_option( $key );
				continue;
			}

			if ( $wait ) {
				usleep( 20000 );
			}
		}

		return false;
	}

	protected function release_lock( $name ) {
		delete_option( self::LOCK_PREFIX . md5( (string) $name ) );
	}
}
