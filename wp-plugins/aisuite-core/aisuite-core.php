<?php
/**
 * Plugin Name:       AI Suite Core
 * Plugin URI:        https://founderpostai.com
 * Description:       Shared runtime for the AI Suite modules: account connection, credit balance, brand context, and the background job queue every module runs on.
 * Version:           0.1.2
 * Requires at least: 6.5
 * Requires PHP:      7.4
 * Author:            FounderPostAI
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       aisuite-core
 *
 * External service disclosure lives in readme.txt and on the Connection screen.
 */

defined( 'ABSPATH' ) || exit;

define( 'AISUITE_CORE_VERSION', '0.1.2' );
define( 'AISUITE_CORE_FILE', __FILE__ );
define( 'AISUITE_CORE_DIR', plugin_dir_path( __FILE__ ) );
define( 'AISUITE_CORE_URL', plugin_dir_url( __FILE__ ) );

/**
 * Default gateway host. Filterable so staging sites can point elsewhere without
 * editing plugin files.
 */
function aisuite_gateway_url() {
	$url = defined( 'AISUITE_GATEWAY_URL' ) ? AISUITE_GATEWAY_URL : 'https://founderpostai.com/api/gateway';
	return untrailingslashit( apply_filters( 'aisuite_gateway_url', $url ) );
}

require_once AISUITE_CORE_DIR . 'includes/class-site-auth.php';
/**
 * Where customers manage their account. Distinct from the API host — pointing
 * a "open dashboard" link at the API root sends people to a 404.
 */
function aisuite_dashboard_url() {
	$url = defined( 'AISUITE_DASHBOARD_URL' ) ? AISUITE_DASHBOARD_URL : 'https://founderpostai.com/connect';
	return untrailingslashit( apply_filters( 'aisuite_dashboard_url', $url ) );
}

require_once AISUITE_CORE_DIR . 'includes/class-billing.php';
require_once AISUITE_CORE_DIR . 'includes/class-gateway-client.php';
require_once AISUITE_CORE_DIR . 'includes/class-job-queue.php';
require_once AISUITE_CORE_DIR . 'includes/class-rest-callback.php';
require_once AISUITE_CORE_DIR . 'includes/class-brand-context.php';
require_once AISUITE_CORE_DIR . 'includes/class-modules.php';
require_once AISUITE_CORE_DIR . 'includes/class-admin.php';

/**
 * Single entry point every module talks to.
 *
 * Modules should never call the gateway directly — they enqueue jobs here so
 * retries, credit accounting, and callback verification stay in one place.
 */
final class AISuite_Core {

	/** @var AISuite_Core|null */
	private static $instance = null;

	/** @var AISuite_Gateway_Client */
	public $gateway;

	/** @var AISuite_Job_Queue */
	public $jobs;

	/** @var AISuite_Brand_Context */
	public $brand;

	/** @var AISuite_Modules */
	public $modules;

	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {
		$this->gateway = new AISuite_Gateway_Client();
		$this->jobs    = new AISuite_Job_Queue( $this->gateway );
		$this->brand   = new AISuite_Brand_Context();
		$this->modules = new AISuite_Modules();

		new AISuite_REST_Callback();
		new AISuite_Admin( $this );
	}

	/** True when the site has completed the connection handshake. */
	public function is_connected() {
		return AISuite_Site_Auth::is_connected();
	}
}

/** Accessor used by every module: aisuite()->jobs->enqueue( ... ) */
function aisuite() {
	return AISuite_Core::instance();
}

add_action( 'plugins_loaded', 'aisuite', 5 );

register_activation_hook(
	__FILE__,
	function () {
		if ( ! wp_next_scheduled( 'aisuite_refresh_account' ) ) {
			wp_schedule_event( time() + 300, 'hourly', 'aisuite_refresh_account' );
		}

		if ( ! wp_next_scheduled( AISuite_Job_Queue::HOOK_CLEANUP ) ) {
			wp_schedule_event( time() + HOUR_IN_SECONDS, 'daily', AISuite_Job_Queue::HOOK_CLEANUP );
		}
	}
);

register_deactivation_hook(
	__FILE__,
	function () {
		wp_clear_scheduled_hook( 'aisuite_refresh_account' );
		wp_clear_scheduled_hook( AISuite_Job_Queue::HOOK_CLEANUP );
		wp_unschedule_hook( AISuite_Job_Queue::HOOK_SUBMIT );
		wp_unschedule_hook( AISuite_Job_Queue::HOOK_RECONCILE );
		wp_unschedule_hook( AISuite_Job_Queue::HOOK_TRACK );

		if ( function_exists( 'as_unschedule_all_actions' ) ) {
			as_unschedule_all_actions( AISuite_Job_Queue::HOOK_SUBMIT, array(), AISuite_Job_Queue::GROUP );
			as_unschedule_all_actions( AISuite_Job_Queue::HOOK_RECONCILE, array(), AISuite_Job_Queue::GROUP );
		}
	}
);
