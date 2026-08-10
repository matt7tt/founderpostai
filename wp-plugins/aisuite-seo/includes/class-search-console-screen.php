<?php
/** Read-only Google Search Console opportunity and results dashboard. */

defined( 'ABSPATH' ) || exit;

class AISuite_SEO_Search_Console_Screen {

	const CAP              = 'manage_options';
	const SLUG             = 'founderpostai-ai-suite-search-console';
	const STATUS_TRANSIENT = 'aisuite_seo_gsc_status';
	const DATA_TRANSIENT   = 'aisuite_seo_gsc_performance';
	const DETAIL_TRANSIENT = 'aisuite_seo_gsc_detail_';

	public function __construct() {
		add_action( 'admin_menu', array( $this, 'menu' ), 22 );
		add_action( 'admin_enqueue_scripts', array( $this, 'assets' ) );
		add_action( 'admin_post_aisuite_seo_gsc_connect', array( $this, 'connect' ) );
		add_action( 'admin_post_aisuite_seo_gsc_property', array( $this, 'select_property' ) );
		add_action( 'admin_post_aisuite_seo_gsc_refresh', array( $this, 'refresh' ) );
		add_action( 'admin_post_aisuite_seo_gsc_disconnect', array( $this, 'disconnect' ) );
		add_action( 'aisuite_disconnected', array( $this, 'clear_cache' ) );
	}

	public function menu() {
		add_submenu_page(
			'aisuite',
			__( 'Search performance', 'founderpostai-ai-suite-seo' ),
			__( 'Search performance', 'founderpostai-ai-suite-seo' ),
			self::CAP,
			self::SLUG,
			array( $this, 'render' )
		);
	}

	public function assets( $hook ) {
		if ( false === strpos( $hook, self::SLUG ) ) {
			return;
		}

		wp_enqueue_style( 'aisuite-admin', AISUITE_CORE_URL . 'assets/admin.css', array(), AISUITE_CORE_VERSION );
		wp_enqueue_style( 'aisuite-seo-review', AISUITE_SEO_URL . 'assets/review.css', array( 'aisuite-admin' ), AISUITE_SEO_VERSION );
	}

	/** Render connection, property selection, or the live opportunity dashboard. */
	public function render() {
		if ( ! current_user_can( self::CAP ) ) {
			wp_die( esc_html__( 'You do not have permission to view this.', 'founderpostai-ai-suite-seo' ) );
		}

		$this->flash();

		if ( ! is_callable( array( aisuite()->gateway, 'search_console_status' ) ) ) {
			$this->render_shell_start();
			echo '<div class="notice notice-warning"><p>' . esc_html__( 'Update AI Suite Core with the SEO plugin to enable the Search Console connection.', 'founderpostai-ai-suite-seo' ) . '</p></div>';
			$this->render_shell_end();
			return;
		}

		$status = $this->status();
		$this->render_shell_start();

		if ( is_wp_error( $status ) ) {
			printf( '<div class="notice notice-error"><p>%s</p></div>', esc_html( $status->get_error_message() ) );
			$this->connection_panel( false );
			$this->render_shell_end();
			return;
		}

		if ( empty( $status['connected'] ) ) {
			$this->connection_panel( false );
			$this->render_shell_end();
			return;
		}

		if ( empty( $status['property'] ) ) {
			$this->property_panel( $status );
			$this->render_shell_end();
			return;
		}

		$data = $this->performance();
		if ( is_wp_error( $data ) ) {
			printf( '<div class="notice notice-error"><p>%s</p></div>', esc_html( $data->get_error_message() ) );
			$this->property_panel( $status );
			$this->render_shell_end();
			return;
		}

		$this->dashboard( $status, $data );
		$this->render_shell_end();
	}

	protected function render_shell_start() {
		?>
		<div class="wrap aisuite-wrap">
			<h1><?php esc_html_e( 'Search performance', 'founderpostai-ai-suite-seo' ); ?></h1>
			<a class="page-title-action" href="<?php echo esc_url( admin_url( 'admin.php?page=' . AISuite_SEO_Review_Screen::SLUG ) ); ?>"><?php esc_html_e( 'Review suggestions', 'founderpostai-ai-suite-seo' ); ?></a>
		<?php
	}

	protected function render_shell_end() {
		echo '</div>';
	}

	/** Explain the data boundary before opening Google's consent screen. */
	protected function connection_panel( $connected ) {
		?>
		<div class="aisuite-panel aisuite-gsc-connect">
			<h2><?php echo $connected ? esc_html__( 'Reconnect Google Search Console', 'founderpostai-ai-suite-seo' ) : esc_html__( 'Connect Google Search Console', 'founderpostai-ai-suite-seo' ); ?></h2>
			<p><?php esc_html_e( 'See the queries and pages already earning Google impressions, then prioritize high-impression results with weak click-through rates or positions just outside the top results.', 'founderpostai-ai-suite-seo' ); ?></p>
			<p class="description"><?php esc_html_e( 'The connection requests read-only Search Console access. Google refresh tokens are encrypted and held by the FounderPostAI gateway; they are never stored in this WordPress database. Search performance is cached here for six hours and is not sent to an AI model.', 'founderpostai-ai-suite-seo' ); ?></p>
			<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
				<?php wp_nonce_field( 'aisuite_seo_gsc_connect' ); ?>
				<input type="hidden" name="action" value="aisuite_seo_gsc_connect" />
				<?php submit_button( __( 'Continue to Google', 'founderpostai-ai-suite-seo' ), 'primary', 'submit', false ); ?>
			</form>
		</div>
		<?php
	}

	/** Property selection is server-validated against Google's accessible list. */
	protected function property_panel( array $status ) {
		$properties = isset( $status['properties'] ) && is_array( $status['properties'] ) ? $status['properties'] : array();
		?>
		<div class="aisuite-panel">
			<h2><?php esc_html_e( 'Choose a Search Console property', 'founderpostai-ai-suite-seo' ); ?></h2>
			<?php if ( empty( $properties ) ) : ?>
				<p><?php esc_html_e( 'This Google account does not currently expose any Search Console properties. Add or verify the site in Search Console, then reconnect.', 'founderpostai-ai-suite-seo' ); ?></p>
				<?php $this->connection_panel( true ); ?>
			<?php else : ?>
				<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
					<?php wp_nonce_field( 'aisuite_seo_gsc_property' ); ?>
					<input type="hidden" name="action" value="aisuite_seo_gsc_property" />
					<select name="property" required>
						<option value=""><?php esc_html_e( 'Select a property', 'founderpostai-ai-suite-seo' ); ?></option>
						<?php foreach ( $properties as $property ) : ?>
							<?php if ( ! empty( $property['site_url'] ) ) : ?>
								<option value="<?php echo esc_attr( $property['site_url'] ); ?>"><?php echo esc_html( $property['site_url'] ); ?></option>
							<?php endif; ?>
						<?php endforeach; ?>
					</select>
					<?php submit_button( __( 'Use this property', 'founderpostai-ai-suite-seo' ), 'primary', 'submit', false ); ?>
				</form>
			<?php endif; ?>
		</div>
		<?php
	}

	/** KPI cards plus query/page opportunities ranked by likely upside. */
	protected function dashboard( array $status, array $data ) {
		$summary       = isset( $data['summary'] ) && is_array( $data['summary'] ) ? $data['summary'] : array();
		$previous      = isset( $data['previous'] ) && is_array( $data['previous'] ) ? $data['previous'] : array();
		$rows          = isset( $data['rows'] ) && is_array( $data['rows'] ) ? $data['rows'] : array();
		$opportunities = $this->opportunities( $rows );
		$top           = array_slice( $rows, 0, 10 );
		$period        = isset( $data['period'] ) && is_array( $data['period'] ) ? $data['period'] : array();
		?>
		<p class="description aisuite-health__intro">
			<?php
			printf(
				/* translators: 1: Search Console property, 2: start date, 3: end date */
				esc_html__( 'Property: %1$s · Finalized Google web-search data from %2$s through %3$s.', 'founderpostai-ai-suite-seo' ),
				esc_html( isset( $status['property'] ) ? $status['property'] : '' ),
				esc_html( isset( $period['startDate'] ) ? $period['startDate'] : '' ),
				esc_html( isset( $period['endDate'] ) ? $period['endDate'] : '' )
			);
			?>
		</p>

		<div class="aisuite-health__cards">
			<?php $this->metric( __( 'Clicks', 'founderpostai-ai-suite-seo' ), isset( $summary['clicks'] ) ? $summary['clicks'] : 0, $this->delta( $summary, $previous, 'clicks' ) ); ?>
			<?php $this->metric( __( 'Impressions', 'founderpostai-ai-suite-seo' ), isset( $summary['impressions'] ) ? $summary['impressions'] : 0, $this->delta( $summary, $previous, 'impressions' ) ); ?>
			<?php $this->metric( __( 'Average CTR', 'founderpostai-ai-suite-seo' ), number_format_i18n( 100 * ( isset( $summary['ctr'] ) ? $summary['ctr'] : 0 ), 1 ) . '%', $this->delta( $summary, $previous, 'ctr' ) ); ?>
			<?php $this->metric( __( 'Average position', 'founderpostai-ai-suite-seo' ), number_format_i18n( isset( $summary['position'] ) ? $summary['position'] : 0, 1 ), __( 'Lower is better', 'founderpostai-ai-suite-seo' ) ); ?>
		</div>

		<div class="aisuite-health__toolbar">
			<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
				<?php wp_nonce_field( 'aisuite_seo_gsc_refresh' ); ?>
				<input type="hidden" name="action" value="aisuite_seo_gsc_refresh" />
				<?php submit_button( __( 'Refresh Search Console data', 'founderpostai-ai-suite-seo' ), 'secondary', 'submit', false ); ?>
			</form>
			<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" onsubmit="return confirm('<?php echo esc_js( __( 'Disconnect Search Console and remove the encrypted Google token?', 'founderpostai-ai-suite-seo' ) ); ?>');">
				<?php wp_nonce_field( 'aisuite_seo_gsc_disconnect' ); ?>
				<input type="hidden" name="action" value="aisuite_seo_gsc_disconnect" />
				<?php submit_button( __( 'Disconnect', 'founderpostai-ai-suite-seo' ), 'link-delete', 'submit', false ); ?>
			</form>
		</div>

		<h2><?php esc_html_e( 'Best opportunities', 'founderpostai-ai-suite-seo' ); ?></h2>
		<p class="description"><?php esc_html_e( 'Ranked from finalized query-and-page rows using impressions, click-through rate, and average position. Use these as editorial priorities, not guarantees.', 'founderpostai-ai-suite-seo' ); ?></p>
		<?php $this->performance_table( array_slice( $opportunities, 0, 25 ), true ); ?>

		<h2><?php esc_html_e( 'Top search results', 'founderpostai-ai-suite-seo' ); ?></h2>
		<?php $this->performance_table( $top, false ); ?>
		<?php
	}

	protected function metric( $label, $value, $detail ) {
		$display = is_numeric( $value ) ? number_format_i18n( $value, floor( (float) $value ) === (float) $value ? 0 : 1 ) : $value;
		printf(
			'<div class="aisuite-health__metric aisuite-health__metric--good"><span>%1$s</span><strong>%2$s</strong><small>%3$s</small></div>',
			esc_html( $label ),
			esc_html( $display ),
			esc_html( $detail )
		);
	}

	protected function delta( array $current, array $previous, $key ) {
		$now = isset( $current[ $key ] ) ? (float) $current[ $key ] : 0;
		$old = isset( $previous[ $key ] ) ? (float) $previous[ $key ] : 0;

		if ( 0.0 === $old ) {
			return __( 'No prior-period baseline', 'founderpostai-ai-suite-seo' );
		}

		$change = ( $now - $old ) / $old * 100;
		return sprintf(
			/* translators: %s: signed percentage change */
			__( '%s vs previous period', 'founderpostai-ai-suite-seo' ),
			number_format_i18n( $change, 1 ) . '%'
		);
	}

	/** Deterministic opportunity scoring keeps reporting explainable. */
	public function opportunities( array $rows ) {
		$out = array();

		foreach ( $rows as $row ) {
			$impressions = isset( $row['impressions'] ) ? max( 0, (float) $row['impressions'] ) : 0;
			$position    = isset( $row['position'] ) ? max( 0, (float) $row['position'] ) : 0;
			$ctr         = isset( $row['ctr'] ) ? min( 1, max( 0, (float) $row['ctr'] ) ) : 0;

			if ( $impressions < 10 || $position < 3 || $position > 30 ) {
				continue;
			}

			$row['opportunity_score'] = $impressions * ( 1 - $ctr ) * max( 0.1, ( 31 - $position ) / 30 );
			$row['opportunity']       = $position <= 10 && $ctr < 0.04
				? __( 'Improve title and description', 'founderpostai-ai-suite-seo' )
				: __( 'Strengthen relevance and internal links', 'founderpostai-ai-suite-seo' );
			$out[]                    = $row;
		}

		usort(
			$out,
			function ( $a, $b ) {
				return $a['opportunity_score'] === $b['opportunity_score'] ? 0 : ( $a['opportunity_score'] < $b['opportunity_score'] ? 1 : -1 );
			}
		);

		return $out;
	}

	protected function performance_table( array $rows, $show_action ) {
		?>
		<table class="widefat striped aisuite-health__table aisuite-gsc-table">
			<thead><tr>
				<th><?php esc_html_e( 'Query', 'founderpostai-ai-suite-seo' ); ?></th>
				<th><?php esc_html_e( 'Page', 'founderpostai-ai-suite-seo' ); ?></th>
				<th><?php esc_html_e( 'Clicks', 'founderpostai-ai-suite-seo' ); ?></th>
				<th><?php esc_html_e( 'Impressions', 'founderpostai-ai-suite-seo' ); ?></th>
				<th><?php esc_html_e( 'CTR', 'founderpostai-ai-suite-seo' ); ?></th>
				<th><?php esc_html_e( 'Position', 'founderpostai-ai-suite-seo' ); ?></th>
				<?php
				if ( $show_action ) :
					?>
					<th><?php esc_html_e( 'Suggested focus', 'founderpostai-ai-suite-seo' ); ?></th><?php endif; ?>
			</tr></thead>
			<tbody>
			<?php if ( empty( $rows ) ) : ?>
				<tr><td colspan="<?php echo $show_action ? '7' : '6'; ?>"><?php esc_html_e( 'Not enough finalized data for this view yet.', 'founderpostai-ai-suite-seo' ); ?></td></tr>
			<?php else : ?>
				<?php foreach ( $rows as $row ) : ?>
					<tr>
						<td><strong><?php echo esc_html( isset( $row['query'] ) ? $row['query'] : '' ); ?></strong></td>
						<td><a href="<?php echo esc_url( isset( $row['page'] ) ? $row['page'] : '' ); ?>" target="_blank" rel="noopener noreferrer"><?php echo esc_html( $this->compact_url( isset( $row['page'] ) ? $row['page'] : '' ) ); ?></a></td>
						<td><?php echo esc_html( number_format_i18n( isset( $row['clicks'] ) ? $row['clicks'] : 0 ) ); ?></td>
						<td><?php echo esc_html( number_format_i18n( isset( $row['impressions'] ) ? $row['impressions'] : 0 ) ); ?></td>
						<td><?php echo esc_html( number_format_i18n( 100 * ( isset( $row['ctr'] ) ? $row['ctr'] : 0 ), 1 ) . '%' ); ?></td>
						<td><?php echo esc_html( number_format_i18n( isset( $row['position'] ) ? $row['position'] : 0, 1 ) ); ?></td>
						<?php
						if ( $show_action ) :
							?>
							<td><?php echo esc_html( isset( $row['opportunity'] ) ? $row['opportunity'] : '' ); ?></td><?php endif; ?>
					</tr>
				<?php endforeach; ?>
			<?php endif; ?>
			</tbody>
		</table>
		<?php
	}

	protected function compact_url( $url ) {
		$parts = wp_parse_url( (string) $url );
		return is_array( $parts ) && isset( $parts['host'] ) ? $parts['host'] . ( isset( $parts['path'] ) ? $parts['path'] : '' ) : (string) $url;
	}

	/** Request a one-time gateway authorization URL and leave WordPress safely. */
	public function connect() {
		$this->guard( 'aisuite_seo_gsc_connect' );
		$result = aisuite()->gateway->search_console_connect( admin_url( 'admin.php?page=' . self::SLUG ) );

		if ( is_wp_error( $result ) || empty( $result['authorization_url'] ) ) {
			$this->redirect_error( is_wp_error( $result ) ? $result->get_error_message() : __( 'The gateway did not return a Google authorization URL.', 'founderpostai-ai-suite-seo' ) );
		}

		$url  = esc_url_raw( $result['authorization_url'] );
		$host = wp_parse_url( $url, PHP_URL_HOST );

		if ( 'accounts.google.com' !== $host || 'https' !== wp_parse_url( $url, PHP_URL_SCHEME ) ) {
			$this->redirect_error( __( 'The Google authorization URL was invalid.', 'founderpostai-ai-suite-seo' ) );
		}

		add_filter( 'allowed_redirect_hosts', array( $this, 'allow_google_host' ) );
		wp_safe_redirect( $url );
		exit;
	}

	public function allow_google_host( $hosts ) {
		$hosts[] = 'accounts.google.com';
		return array_unique( $hosts );
	}

	public function select_property() {
		$this->guard( 'aisuite_seo_gsc_property' );
		// Keep the nonce assertion local so Plugin Check can verify the POST reads below.
		check_admin_referer( 'aisuite_seo_gsc_property' );

		if ( ! isset( $_POST['property'] ) || ! is_string( $_POST['property'] ) ) {
			$this->redirect_error( __( 'Choose a valid Search Console property.', 'founderpostai-ai-suite-seo' ) );
		}

		$property = sanitize_text_field( wp_unslash( $_POST['property'] ) );
		$property = function_exists( 'mb_substr' ) ? mb_substr( $property, 0, 2048, 'UTF-8' ) : substr( $property, 0, 2048 );
		$result   = aisuite()->gateway->search_console_select_property( $property );

		if ( is_wp_error( $result ) ) {
			$this->redirect_error( $result->get_error_message() );
		}

		$this->clear_cache();
		$this->redirect( 'selected' );
	}

	public function refresh() {
		$this->guard( 'aisuite_seo_gsc_refresh' );
		delete_transient( self::DATA_TRANSIENT );
		$data = $this->performance( true );

		if ( is_wp_error( $data ) ) {
			$this->redirect_error( $data->get_error_message() );
		}

		$this->redirect( 'refreshed' );
	}

	public function disconnect() {
		$this->guard( 'aisuite_seo_gsc_disconnect' );
		$result = aisuite()->gateway->search_console_disconnect();

		if ( is_wp_error( $result ) ) {
			$this->redirect_error( $result->get_error_message() );
		}

		$this->clear_cache();
		$this->redirect( 'disconnected' );
	}

	protected function guard( $nonce ) {
		if ( ! current_user_can( self::CAP ) ) {
			wp_die( esc_html__( 'You do not have permission to do that.', 'founderpostai-ai-suite-seo' ) );
		}
		check_admin_referer( $nonce );
	}

	protected function status( $force = false ) {
		if ( ! AISuite_Site_Auth::is_connected() ) {
			$this->clear_cache();
			return array(
				'connected'  => false,
				'property'   => '',
				'properties' => array(),
			);
		}

		$status = $force ? false : get_transient( self::STATUS_TRANSIENT );
		if ( is_array( $status ) ) {
			return $status;
		}

		$status = aisuite()->gateway->search_console_status();
		if ( ! is_wp_error( $status ) ) {
			set_transient( self::STATUS_TRANSIENT, $status, 10 * MINUTE_IN_SECONDS );
		}
		return $status;
	}

	protected function performance( $force = false ) {
		$data = $force ? false : get_transient( self::DATA_TRANSIENT );
		if ( is_array( $data ) ) {
			return $data;
		}

		$data = aisuite()->gateway->search_console_performance( 28 );
		if ( ! is_wp_error( $data ) ) {
			set_transient( self::DATA_TRANSIENT, $data, 6 * HOUR_IN_SECONDS );
		}
		return $data;
	}

	public function clear_cache() {
		delete_transient( self::STATUS_TRANSIENT );
		delete_transient( self::DATA_TRANSIENT );
	}

	protected function flash() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- display-only result; state-changing requests are nonce checked and OAuth uses one-time state.
		$code = isset( $_GET['aisuite_gsc'] ) ? sanitize_key( wp_unslash( $_GET['aisuite_gsc'] ) ) : '';

		if ( ! $code ) {
			return;
		}

		if ( 'connected' === $code ) {
			$this->clear_cache();
		}

		$messages = array(
			'connected'    => __( 'Google Search Console connected. Choose a property to begin.', 'founderpostai-ai-suite-seo' ),
			'denied'       => __( 'Google access was not granted. Nothing was connected.', 'founderpostai-ai-suite-seo' ),
			'selected'     => __( 'Search Console property selected.', 'founderpostai-ai-suite-seo' ),
			'refreshed'    => __( 'Search performance refreshed.', 'founderpostai-ai-suite-seo' ),
			'disconnected' => __( 'Search Console disconnected and its gateway token removed.', 'founderpostai-ai-suite-seo' ),
		);
		$detail   = get_transient( self::DETAIL_TRANSIENT . get_current_user_id() );
		$message  = 'error' === $code && is_string( $detail ) ? $detail : ( isset( $messages[ $code ] ) ? $messages[ $code ] : '' );

		delete_transient( self::DETAIL_TRANSIENT . get_current_user_id() );
		if ( $message ) {
			printf( '<div class="notice notice-%1$s is-dismissible"><p>%2$s</p></div>', 'error' === $code || 'denied' === $code ? 'warning' : 'success', esc_html( $message ) );
		}
	}

	protected function redirect_error( $message ) {
		set_transient( self::DETAIL_TRANSIENT . get_current_user_id(), sanitize_text_field( $message ), MINUTE_IN_SECONDS );
		$this->redirect( 'error' );
	}

	protected function redirect( $code ) {
		wp_safe_redirect(
			add_query_arg(
				array(
					'page'        => self::SLUG,
					'aisuite_gsc' => sanitize_key( $code ),
				),
				admin_url( 'admin.php' )
			)
		);
		exit;
	}
}
