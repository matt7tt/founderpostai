<?php
/**
 * Core admin: connection, credit balance, brand context.
 *
 * Deliberately native wp-admin. Plugins that import their own design system
 * into the dashboard read as broken to WordPress users, so the only custom
 * element here is the credit meter.
 */

defined( 'ABSPATH' ) || exit;

class AISuite_Admin {

	const CAP  = 'manage_options';
	const SLUG = 'aisuite';

	/** @var AISuite_Core */
	protected $core;

	public function __construct( AISuite_Core $core ) {
		$this->core = $core;

		add_action( 'admin_menu', array( $this, 'menu' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'assets' ) );
		add_action( 'admin_post_aisuite_connect', array( $this, 'handle_connect' ) );
		add_action( 'admin_post_aisuite_disconnect', array( $this, 'handle_disconnect' ) );
		add_action( 'admin_post_aisuite_save_brand', array( $this, 'handle_save_brand' ) );
		add_action( 'admin_post_aisuite_billing_mode', array( $this, 'handle_billing_mode' ) );
		add_action( 'admin_post_aisuite_set_key', array( $this, 'handle_set_key' ) );
		add_action( 'admin_post_aisuite_clear_key', array( $this, 'handle_clear_key' ) );
		add_action( 'admin_post_aisuite_verify_callback', array( $this, 'handle_verify_callback' ) );
		add_action( 'admin_notices', array( $this, 'connection_notice' ) );
	}

	public function menu() {
		add_menu_page(
			__( 'AI Suite', 'founderpostai-ai-suite-core' ),
			__( 'AI Suite', 'founderpostai-ai-suite-core' ),
			self::CAP,
			self::SLUG,
			array( $this, 'render' ),
			'dashicons-superhero-alt',
			58
		);

		add_submenu_page(
			self::SLUG,
			__( 'Connection', 'founderpostai-ai-suite-core' ),
			__( 'Connection', 'founderpostai-ai-suite-core' ),
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
	}

	public function connection_notice() {
		if ( ! current_user_can( self::CAP ) || $this->core->is_connected() ) {
			return;
		}

		$screen = get_current_screen();

		if ( $screen && false !== strpos( $screen->id, self::SLUG ) ) {
			return;
		}

		printf(
			'<div class="notice notice-info"><p>%s <a href="%s">%s</a></p></div>',
			esc_html__( 'AI Suite is installed but not connected yet.', 'founderpostai-ai-suite-core' ),
			esc_url( admin_url( 'admin.php?page=' . self::SLUG ) ),
			esc_html__( 'Connect your account', 'founderpostai-ai-suite-core' )
		);
	}

	public function render() {
		if ( ! current_user_can( self::CAP ) ) {
			wp_die( esc_html__( 'You do not have permission to manage AI Suite.', 'founderpostai-ai-suite-core' ) );
		}

		$connected = $this->core->is_connected();
		$account   = AISuite_Site_Auth::account();
		$brand     = $this->core->brand->get();
		?>
		<div class="wrap aisuite-wrap">
			<h1><?php esc_html_e( 'AI Suite', 'founderpostai-ai-suite-core' ); ?></h1>

			<?php $this->render_flash(); ?>

			<div class="aisuite-panel">
				<h2><?php esc_html_e( 'Connection', 'founderpostai-ai-suite-core' ); ?></h2>

				<?php if ( $connected ) : ?>
					<p class="aisuite-status aisuite-status--ok">
						<?php
						printf(
							/* translators: %s: site identifier */
							esc_html__( 'Connected as %s', 'founderpostai-ai-suite-core' ),
							'<code>' . esc_html( AISuite_Site_Auth::site_id() ) . '</code>'
						);
						?>
					</p>

					<?php $this->render_usage( $account ); ?>
					<?php $this->render_health(); ?>

					<div class="aisuite-actions">
						<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
							<?php wp_nonce_field( 'aisuite_verify_callback' ); ?>
							<input type="hidden" name="action" value="aisuite_verify_callback" />
							<?php submit_button( __( 'Test connection', 'founderpostai-ai-suite-core' ), 'secondary', 'submit', false ); ?>
						</form>

						<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
							<?php wp_nonce_field( 'aisuite_disconnect' ); ?>
							<input type="hidden" name="action" value="aisuite_disconnect" />
							<?php submit_button( __( 'Disconnect this site', 'founderpostai-ai-suite-core' ), 'secondary', 'submit', false ); ?>
						</form>
					</div>
				<?php else : ?>
					<p>
						<?php esc_html_e( 'Paste the connection code from your AI Suite dashboard. It is single-use and expires in 15 minutes.', 'founderpostai-ai-suite-core' ); ?>
					</p>

					<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
						<?php wp_nonce_field( 'aisuite_connect' ); ?>
						<input type="hidden" name="action" value="aisuite_connect" />
						<p>
							<label class="screen-reader-text" for="aisuite-token"><?php esc_html_e( 'Connection code', 'founderpostai-ai-suite-core' ); ?></label>
							<input type="text" id="aisuite-token" name="connect_token" class="regular-text" autocomplete="off" required />
						</p>
						<?php submit_button( __( 'Connect site', 'founderpostai-ai-suite-core' ) ); ?>
					</form>
				<?php endif; ?>

				<p class="description">
					<?php
					printf(
						/* translators: %s: gateway hostname */
						esc_html__( 'Content you submit for processing is sent to %s. Nothing is sent until you run an action.', 'founderpostai-ai-suite-core' ),
						'<code>' . esc_html( wp_parse_url( aisuite_gateway_url(), PHP_URL_HOST ) ) . '</code>'
					);
					?>
				</p>
			</div>

			<?php if ( $connected ) : ?>
				<?php $this->render_billing(); ?>
			<?php endif; ?>

			<div class="aisuite-panel">
				<h2><?php esc_html_e( 'Brand context', 'founderpostai-ai-suite-core' ); ?></h2>
				<p class="description">
					<?php esc_html_e( 'Every module reads this. Fill it in once and results stop sounding generic.', 'founderpostai-ai-suite-core' ); ?>
				</p>

				<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
					<?php wp_nonce_field( 'aisuite_save_brand' ); ?>
					<input type="hidden" name="action" value="aisuite_save_brand" />

					<table class="form-table" role="presentation">
						<tr>
							<th scope="row"><label for="aisuite-what"><?php esc_html_e( 'What the business does', 'founderpostai-ai-suite-core' ); ?></label></th>
							<td><textarea id="aisuite-what" name="what_you_do" rows="3" class="large-text"><?php echo esc_textarea( $brand['what_you_do'] ); ?></textarea></td>
						</tr>
						<tr>
							<th scope="row"><label for="aisuite-audience"><?php esc_html_e( 'Who it sells to', 'founderpostai-ai-suite-core' ); ?></label></th>
							<td><textarea id="aisuite-audience" name="audience" rows="3" class="large-text"><?php echo esc_textarea( $brand['audience'] ); ?></textarea></td>
						</tr>
						<tr>
							<th scope="row"><label for="aisuite-tone"><?php esc_html_e( 'Tone', 'founderpostai-ai-suite-core' ); ?></label></th>
							<td><input type="text" id="aisuite-tone" name="tone" class="regular-text" value="<?php echo esc_attr( $brand['tone'] ); ?>" /></td>
						</tr>
						<tr>
							<th scope="row"><label for="aisuite-market"><?php esc_html_e( 'Primary market', 'founderpostai-ai-suite-core' ); ?></label></th>
							<td><input type="text" id="aisuite-market" name="primary_market" class="regular-text" value="<?php echo esc_attr( $brand['primary_market'] ); ?>" /></td>
						</tr>
						<tr>
							<th scope="row"><label for="aisuite-avoid"><?php esc_html_e( 'Words to avoid', 'founderpostai-ai-suite-core' ); ?></label></th>
							<td>
								<input type="text" id="aisuite-avoid" name="avoid_phrases" class="large-text" value="<?php echo esc_attr( $brand['avoid_phrases'] ); ?>" />
								<p class="description"><?php esc_html_e( 'Comma separated. Claims you legally cannot make belong here.', 'founderpostai-ai-suite-core' ); ?></p>
							</td>
						</tr>
						<tr>
							<th scope="row"><label for="aisuite-style"><?php esc_html_e( 'Style notes', 'founderpostai-ai-suite-core' ); ?></label></th>
							<td><textarea id="aisuite-style" name="style_notes" rows="3" class="large-text"><?php echo esc_textarea( $brand['style_notes'] ); ?></textarea></td>
						</tr>
					</table>

					<?php submit_button( __( 'Save brand context', 'founderpostai-ai-suite-core' ) ); ?>
				</form>
			</div>

			<?php $this->render_modules(); ?>
		</div>
		<?php
	}

	/**
	 * Usage display. Two shapes, because a remaining-balance meter is
	 * meaningless when the customer is paying their own provider.
	 */
	protected function render_usage( array $account ) {
		$plan = isset( $account['plan'] ) ? $account['plan'] : __( 'Free', 'founderpostai-ai-suite-core' );

		if ( AISuite_Billing::is_byok() ) {
			$used = isset( $account['actions_used'] ) ? (int) $account['actions_used'] : 0;
			?>
			<div class="aisuite-meter aisuite-meter--byok">
				<div class="aisuite-meter__head">
					<span class="aisuite-meter__count"><?php echo esc_html( number_format_i18n( $used ) ); ?></span>
					<span class="aisuite-meter__label"><?php esc_html_e( 'actions run this month', 'founderpostai-ai-suite-core' ); ?></span>
				</div>
				<p class="aisuite-meter__plan">
					<?php
					printf(
						/* translators: %s: plan name */
						esc_html__( '%s — model usage is billed to your own provider account.', 'founderpostai-ai-suite-core' ),
						esc_html( $plan )
					);
					?>
				</p>
			</div>
			<?php
			return;
		}

		$remaining = isset( $account['credits_remaining'] ) ? (int) $account['credits_remaining'] : 0;
		$included  = isset( $account['credits_included'] ) ? max( 1, (int) $account['credits_included'] ) : max( 1, $remaining );
		$percent   = min( 100, max( 0, round( ( $remaining / $included ) * 100 ) ) );
		?>
		<div class="aisuite-meter">
			<div class="aisuite-meter__head">
				<span class="aisuite-meter__count"><?php echo esc_html( number_format_i18n( $remaining ) ); ?></span>
				<span class="aisuite-meter__label"><?php esc_html_e( 'actions left this month', 'founderpostai-ai-suite-core' ); ?></span>
			</div>
			<div class="aisuite-meter__track" role="img" aria-label="<?php echo esc_attr( sprintf( /* translators: %d: percentage */ __( '%d%% of monthly actions remaining', 'founderpostai-ai-suite-core' ), $percent ) ); ?>">
				<div class="aisuite-meter__fill" style="width: <?php echo esc_attr( $percent ); ?>%"></div>
			</div>
			<p class="aisuite-meter__plan"><?php echo esc_html( sprintf( /* translators: %s: plan name */ __( 'Plan: %s', 'founderpostai-ai-suite-core' ), $plan ) ); ?></p>
		</div>
		<?php
	}

	/**
	 * Callback reachability and dispatch mode — the two things that explain
	 * every "nothing happened" support ticket.
	 */
	protected function render_health() {
		$health = get_option( 'aisuite_callback_health', array() );
		$mode   = AISuite_Job_Queue::dispatch_mode();

		$labels = array(
			'action_scheduler' => __( 'Action Scheduler', 'founderpostai-ai-suite-core' ),
			'loopback'         => __( 'Loopback requests', 'founderpostai-ai-suite-core' ),
			'wp_cron'          => __( 'WP-Cron', 'founderpostai-ai-suite-core' ),
		);
		?>
		<ul class="aisuite-health">
			<li>
				<?php esc_html_e( 'Background jobs run via', 'founderpostai-ai-suite-core' ); ?>
				<strong><?php echo esc_html( isset( $labels[ $mode ] ) ? $labels[ $mode ] : $mode ); ?></strong>
			</li>
			<li>
				<?php esc_html_e( 'Results delivered by callback', 'founderpostai-ai-suite-core' ); ?>
				<?php if ( ! empty( $health['ok'] ) ) : ?>
					<strong class="aisuite-ok"><?php esc_html_e( 'reachable', 'founderpostai-ai-suite-core' ); ?></strong>
				<?php elseif ( isset( $health['ok'] ) ) : ?>
					<strong class="aisuite-warn"><?php esc_html_e( 'blocked — falling back to polling', 'founderpostai-ai-suite-core' ); ?></strong>
				<?php else : ?>
					<strong class="aisuite-muted"><?php esc_html_e( 'not tested yet', 'founderpostai-ai-suite-core' ); ?></strong>
				<?php endif; ?>
			</li>
		</ul>
		<?php
	}

	/**
	 * Billing mode and, for BYOK, the provider key.
	 */
	protected function render_billing() {
		$mode = AISuite_Billing::mode();
		$key  = AISuite_Billing::provider_key_status();
		$dash = aisuite_dashboard_url();
		?>
		<div class="aisuite-panel">
			<h2><?php esc_html_e( 'Billing', 'founderpostai-ai-suite-core' ); ?></h2>

			<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
				<?php wp_nonce_field( 'aisuite_billing_mode' ); ?>
				<input type="hidden" name="action" value="aisuite_billing_mode" />

				<fieldset class="aisuite-modes">
					<legend class="screen-reader-text"><?php esc_html_e( 'Billing mode', 'founderpostai-ai-suite-core' ); ?></legend>

					<label class="aisuite-mode">
						<input type="radio" name="mode" value="<?php echo esc_attr( AISuite_Billing::MODE_MANAGED ); ?>" <?php checked( AISuite_Billing::MODE_MANAGED, $mode ); ?> />
						<span class="aisuite-mode__title"><?php esc_html_e( 'Included actions', 'founderpostai-ai-suite-core' ); ?></span>
						<span class="aisuite-mode__desc"><?php esc_html_e( 'Your plan includes a monthly allowance. Nothing else to set up.', 'founderpostai-ai-suite-core' ); ?></span>
					</label>

					<label class="aisuite-mode">
						<input type="radio" name="mode" value="<?php echo esc_attr( AISuite_Billing::MODE_BYOK ); ?>" <?php checked( AISuite_Billing::MODE_BYOK, $mode ); ?> />
						<span class="aisuite-mode__title"><?php esc_html_e( 'Use my own API key', 'founderpostai-ai-suite-core' ); ?></span>
						<span class="aisuite-mode__desc"><?php esc_html_e( 'Flat plan fee, unlimited actions, model usage billed directly by your provider.', 'founderpostai-ai-suite-core' ); ?></span>
					</label>
				</fieldset>

				<?php submit_button( __( 'Save billing mode', 'founderpostai-ai-suite-core' ), 'secondary', 'submit', false ); ?>
			</form>

			<?php if ( AISuite_Billing::MODE_BYOK === $mode ) : ?>
				<hr />
				<h3><?php esc_html_e( 'Provider key', 'founderpostai-ai-suite-core' ); ?></h3>

				<?php if ( ! empty( $key['present'] ) ) : ?>
					<p class="aisuite-status aisuite-status--ok">
						<?php
						printf(
							/* translators: 1: provider name, 2: last four characters of the key */
							esc_html__( '%1$s key ending %2$s is active.', 'founderpostai-ai-suite-core' ),
							esc_html( AISuite_Billing::provider_label( $key['provider'] ) ),
							'<code>' . esc_html( $key['last4'] ) . '</code>'
						);
						?>
					</p>

					<?php if ( ! empty( $key['error'] ) ) : ?>
						<p class="aisuite-warn"><?php echo esc_html( $key['error'] ); ?></p>
					<?php endif; ?>

					<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
						<?php wp_nonce_field( 'aisuite_clear_key' ); ?>
						<input type="hidden" name="action" value="aisuite_clear_key" />
						<?php submit_button( __( 'Remove key', 'founderpostai-ai-suite-core' ), 'secondary', 'submit', false ); ?>
					</form>
				<?php else : ?>
					<p>
						<?php
						printf(
							/* translators: %s: dashboard link */
							esc_html__( 'The safest place to add your key is your account dashboard: %s. Adding it here works too, but the key passes through this website on its way to us.', 'founderpostai-ai-suite-core' ),
							'<a href="' . esc_url( $dash ) . '" target="_blank" rel="noopener">' . esc_html__( 'open dashboard', 'founderpostai-ai-suite-core' ) . '</a>'
						);
						?>
					</p>

					<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" autocomplete="off">
						<?php wp_nonce_field( 'aisuite_set_key' ); ?>
						<input type="hidden" name="action" value="aisuite_set_key" />

						<p>
							<label for="aisuite-provider"><?php esc_html_e( 'Provider', 'founderpostai-ai-suite-core' ); ?></label><br />
							<select id="aisuite-provider" name="provider">
								<?php foreach ( AISuite_Billing::PROVIDERS as $slug => $label ) : ?>
									<option value="<?php echo esc_attr( $slug ); ?>"><?php echo esc_html( $label ); ?></option>
								<?php endforeach; ?>
							</select>
						</p>

						<p>
							<label for="aisuite-key"><?php esc_html_e( 'API key', 'founderpostai-ai-suite-core' ); ?></label><br />
							<input type="password" id="aisuite-key" name="provider_key" class="regular-text" autocomplete="new-password" spellcheck="false" required />
						</p>

						<p class="description">
							<?php esc_html_e( 'The key is sent to the gateway and verified there. It is not saved in this WordPress site, so it never appears in your database, backups, or staging copies.', 'founderpostai-ai-suite-core' ); ?>
						</p>

						<?php submit_button( __( 'Save key', 'founderpostai-ai-suite-core' ), 'primary', 'submit', false ); ?>
					</form>
				<?php endif; ?>
			<?php endif; ?>
		</div>
		<?php
	}

	protected function render_modules() {
		$modules = $this->core->modules->all();
		?>
		<div class="aisuite-panel">
			<h2><?php esc_html_e( 'Modules', 'founderpostai-ai-suite-core' ); ?></h2>

			<?php if ( empty( $modules ) ) : ?>
				<p><?php esc_html_e( 'No modules installed yet. Install AI Suite SEO to start.', 'founderpostai-ai-suite-core' ); ?></p>
			<?php else : ?>
				<ul class="aisuite-modules">
					<?php foreach ( $modules as $slug => $module ) : ?>
						<li>
							<strong><?php echo esc_html( $module['name'] ); ?></strong>
							<?php if ( $module['description'] ) : ?>
								<span class="description"> — <?php echo esc_html( $module['description'] ); ?></span>
							<?php endif; ?>
							<?php if ( $module['settings_url'] ) : ?>
								<a href="<?php echo esc_url( $module['settings_url'] ); ?>"><?php esc_html_e( 'Open', 'founderpostai-ai-suite-core' ); ?></a>
							<?php endif; ?>
						</li>
					<?php endforeach; ?>
				</ul>
			<?php endif; ?>

			<?php if ( 'wp_cron' === AISuite_Job_Queue::dispatch_mode() ) : ?>
				<p class="description">
					<?php esc_html_e( 'Loopback requests are disabled on this site, so background jobs wait for WP-Cron, which only fires when someone visits. On a quiet site, results can take a few minutes.', 'founderpostai-ai-suite-core' ); ?>
				</p>
			<?php endif; ?>
		</div>
		<?php
	}

	protected function detail_key() {
		return 'aisuite_flash_' . get_current_user_id();
	}

	/**
	 * Messages are built lazily. The previous version constructed every entry
	 * up front, which called get_transient() four times per page load and left
	 * the error text in place to resurface on an unrelated later screen.
	 */
	protected function render_flash() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- display only; the acting request was nonce-checked.
		$code = isset( $_GET['aisuite_msg'] ) ? sanitize_key( wp_unslash( $_GET['aisuite_msg'] ) ) : '';

		if ( ! $code ) {
			return;
		}

		$success = array(
			'connected'     => __( 'Site connected.', 'founderpostai-ai-suite-core' ),
			'disconnected'  => __( 'Site disconnected. Stored credentials were removed.', 'founderpostai-ai-suite-core' ),
			'brand_saved'   => __( 'Brand context saved.', 'founderpostai-ai-suite-core' ),
			'billing_saved' => __( 'Billing mode updated.', 'founderpostai-ai-suite-core' ),
			'key_saved'     => __( 'Key saved and verified. It is stored on the gateway, not in this site.', 'founderpostai-ai-suite-core' ),
			'key_removed'   => __( 'Key removed.', 'founderpostai-ai-suite-core' ),
			'health_ok'     => __( 'Connection works in both directions.', 'founderpostai-ai-suite-core' ),
		);

		$failures = array(
			'connect_fail'    => __( 'Connection failed.', 'founderpostai-ai-suite-core' ),
			'billing_fail'    => __( 'Could not change billing mode.', 'founderpostai-ai-suite-core' ),
			'key_fail'        => __( 'That key could not be verified.', 'founderpostai-ai-suite-core' ),
			'key_remove_fail' => __( 'The provider key could not be removed.', 'founderpostai-ai-suite-core' ),
			'health_fail'     => __( 'Connection test failed.', 'founderpostai-ai-suite-core' ),
		);

		if ( isset( $success[ $code ] ) ) {
			$type    = 'success';
			$message = $success[ $code ];
		} elseif ( isset( $failures[ $code ] ) ) {
			$type    = 'error';
			$detail  = get_transient( $this->detail_key() );
			$message = is_string( $detail ) && '' !== $detail ? $detail : $failures[ $code ];
		} elseif ( 'health_blocked' === $code ) {
			$type    = 'warning';
			$message = __( 'We can reach the gateway, but its replies are being blocked before they arrive. Jobs will still finish — results just take a few minutes longer while we poll for them.', 'founderpostai-ai-suite-core' );
		} else {
			return;
		}

		// One-shot, so a stale error never reappears on a later screen.
		delete_transient( $this->detail_key() );

		printf(
			'<div class="notice notice-%s is-dismissible"><p>%s</p></div>',
			esc_attr( $type ),
			esc_html( $message )
		);
	}

	public function handle_connect() {
		$this->guard( 'aisuite_connect' );

		// phpcs:ignore WordPress.Security.NonceVerification.Missing -- guard() verifies this action's capability and nonce above.
		$token  = isset( $_POST['connect_token'] ) ? sanitize_text_field( wp_unslash( $_POST['connect_token'] ) ) : '';
		$result = $this->core->gateway->register_site( $token );

		if ( is_wp_error( $result ) ) {
			set_transient( $this->detail_key(), $result->get_error_message(), MINUTE_IN_SECONDS );
			$this->redirect( 'connect_fail' );
		}

		$this->redirect( 'connected' );
	}

	public function handle_disconnect() {
		$this->guard( 'aisuite_disconnect' );
		$this->core->jobs->fail_all( __( 'This job was cancelled because the site was disconnected.', 'founderpostai-ai-suite-core' ) );
		AISuite_Site_Auth::disconnect();
		$this->redirect( 'disconnected' );
	}

	public function handle_save_brand() {
		$this->guard( 'aisuite_save_brand' );

		// Merge over what's stored. Fields this form doesn't render — locale,
		// business_name — would otherwise be reset to defaults on every save.
		$input = $this->core->brand->get();

		// phpcs:ignore WordPress.Security.NonceVerification.Missing -- guard() verifies this action's capability and nonce above.
		foreach ( array( 'what_you_do', 'audience', 'tone', 'primary_market', 'avoid_phrases', 'style_notes' ) as $field ) {
			// phpcs:ignore WordPress.Security.NonceVerification.Missing -- guard() verifies this action's capability and nonce above.
			if ( isset( $_POST[ $field ] ) ) {
				// phpcs:ignore WordPress.Security.NonceVerification.Missing -- guard() verifies this action's capability and nonce above.
				$input[ $field ] = sanitize_textarea_field( wp_unslash( $_POST[ $field ] ) );
			}
		}

		$this->core->brand->save( $input );

		$this->redirect( 'brand_saved' );
	}

	public function handle_billing_mode() {
		$this->guard( 'aisuite_billing_mode' );

		// phpcs:ignore WordPress.Security.NonceVerification.Missing -- guard() verifies this action's capability and nonce above.
		$mode   = isset( $_POST['mode'] ) ? sanitize_key( wp_unslash( $_POST['mode'] ) ) : AISuite_Billing::MODE_MANAGED;
		$result = $this->core->gateway->set_billing_mode(
			AISuite_Billing::MODE_BYOK === $mode ? AISuite_Billing::MODE_BYOK : AISuite_Billing::MODE_MANAGED
		);

		if ( is_wp_error( $result ) ) {
			set_transient( $this->detail_key(), $result->get_error_message(), MINUTE_IN_SECONDS );
			$this->redirect( 'billing_fail' );
		}

		$this->redirect( 'billing_saved' );
	}

	/**
	 * Forward a provider key. Note what is deliberately absent: no
	 * update_option, no set_transient, no error_log of the key itself.
	 */
	public function handle_set_key() {
		$this->guard( 'aisuite_set_key' );

		// phpcs:ignore WordPress.Security.NonceVerification.Missing -- guard() verifies this action's capability and nonce above.
		$provider = isset( $_POST['provider'] ) ? sanitize_key( wp_unslash( $_POST['provider'] ) ) : '';
		// phpcs:ignore WordPress.Security.NonceVerification.Missing, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- guard() verifies the nonce; the key is normalized and shape-validated below.
		$key = isset( $_POST['provider_key'] ) ? AISuite_Billing::normalize_key( wp_unslash( $_POST['provider_key'] ) ) : '';

		$valid = AISuite_Billing::validate_key_shape( $provider, $key );

		if ( is_wp_error( $valid ) ) {
			set_transient( $this->detail_key(), $valid->get_error_message(), MINUTE_IN_SECONDS );
			$this->redirect( 'key_fail' );
		}

		$result = $this->core->gateway->set_provider_key( $provider, $key );

		unset( $key, $_POST['provider_key'] );

		if ( is_wp_error( $result ) ) {
			set_transient( $this->detail_key(), $result->get_error_message(), MINUTE_IN_SECONDS );
			$this->redirect( 'key_fail' );
		}

		$this->redirect( 'key_saved' );
	}

	public function handle_clear_key() {
		$this->guard( 'aisuite_clear_key' );

		$result = $this->core->gateway->delete_provider_key();

		if ( is_wp_error( $result ) ) {
			set_transient( $this->detail_key(), $result->get_error_message(), MINUTE_IN_SECONDS );
			$this->redirect( 'key_remove_fail' );
		}

		$this->redirect( 'key_removed' );
	}

	public function handle_verify_callback() {
		$this->guard( 'aisuite_verify_callback' );

		$result = $this->core->gateway->verify_callback();

		if ( is_wp_error( $result ) ) {
			update_option(
				'aisuite_callback_health',
				array(
					'ok'      => false,
					'checked' => time(),
					'error'   => $result->get_error_message(),
				),
				false
			);
			set_transient( $this->detail_key(), $result->get_error_message(), MINUTE_IN_SECONDS );
			$this->redirect( 'health_fail' );
		}

		update_option(
			'aisuite_callback_health',
			array(
				'ok'      => ! empty( $result['callback_reachable'] ),
				'checked' => time(),
				'error'   => isset( $result['error'] ) ? sanitize_text_field( $result['error'] ) : '',
			),
			false
		);

		$this->redirect( empty( $result['callback_reachable'] ) ? 'health_blocked' : 'health_ok' );
	}

	protected function guard( $action ) {
		if ( ! current_user_can( self::CAP ) ) {
			wp_die( esc_html__( 'You do not have permission to do that.', 'founderpostai-ai-suite-core' ) );
		}

		check_admin_referer( $action );
	}

	protected function redirect( $code ) {
		wp_safe_redirect( add_query_arg( 'aisuite_msg', $code, admin_url( 'admin.php?page=' . self::SLUG ) ) );
		exit;
	}
}
