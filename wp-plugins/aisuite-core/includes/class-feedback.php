<?php
/**
 * Native feedback form shared by the AI Suite plugin family.
 *
 * @package FounderPostAI_AI_Suite
 */

defined( 'ABSPATH' ) || exit;

/**
 * Renders and handles authenticated plugin feedback.
 */
class AISuite_Feedback {

	const CAP  = 'manage_options';
	const SLUG = 'aisuite-feedback';

	/**
	 * Shared Core runtime.
	 *
	 * @var AISuite_Core
	 */
	protected $core;

	/**
	 * Register feedback hooks.
	 *
	 * @param AISuite_Core $core Shared Core runtime.
	 */
	public function __construct( AISuite_Core $core ) {
		$this->core = $core;

		add_action( 'admin_menu', array( $this, 'menu' ), 40 );
		add_action( 'admin_enqueue_scripts', array( $this, 'assets' ) );
		add_action( 'admin_post_aisuite_feedback', array( $this, 'handle_submit' ) );
		add_filter( 'plugin_action_links_' . plugin_basename( AISUITE_CORE_FILE ), array( $this, 'plugin_action_links' ) );
	}

	/**
	 * Add the feedback submenu.
	 */
	public function menu() {
		add_submenu_page(
			'aisuite',
			__( 'Send feedback', 'founderpostai-ai-suite-core' ),
			__( 'Feedback', 'founderpostai-ai-suite-core' ),
			self::CAP,
			self::SLUG,
			array( $this, 'render' )
		);
	}

	/**
	 * Load the shared admin stylesheet on the feedback screen.
	 *
	 * @param string $hook Current admin page hook.
	 */
	public function assets( $hook ) {
		if ( false === strpos( $hook, self::SLUG ) ) {
			return;
		}

		wp_enqueue_style( 'aisuite-admin', AISUITE_CORE_URL . 'assets/admin.css', array(), AISUITE_CORE_VERSION );
	}

	/**
	 * Add a feedback shortcut on the Plugins screen.
	 *
	 * @param array $links Existing plugin action links.
	 * @return array
	 */
	public function plugin_action_links( $links ) {
		array_unshift(
			$links,
			sprintf(
				'<a href="%1$s">%2$s</a>',
				esc_url( self::url( 'core' ) ),
				esc_html__( 'Send feedback', 'founderpostai-ai-suite-core' )
			)
		);
		return $links;
	}

	/**
	 * Build the shared feedback screen URL.
	 *
	 * @param string $product Product slug to preselect.
	 * @return string
	 */
	public static function url( $product = 'core' ) {
		return add_query_arg(
			array(
				'page'    => self::SLUG,
				'product' => sanitize_key( $product ),
			),
			admin_url( 'admin.php' )
		);
	}

	/**
	 * Get installed AI Suite products and their versions.
	 *
	 * @return array<string,array<string,string>>
	 */
	protected function products() {
		$products = array(
			'core' => array(
				'label'   => __( 'AI Suite Core', 'founderpostai-ai-suite-core' ),
				'version' => AISUITE_CORE_VERSION,
			),
		);

		$seo_version = defined( 'FOUNDERPOSTAI_AISUITE_SEO_VERSION' )
			? FOUNDERPOSTAI_AISUITE_SEO_VERSION
			: ( defined( 'AISUITE_SEO_VERSION' ) ? AISUITE_SEO_VERSION : '' );
		if ( $seo_version ) {
			$products['seo'] = array(
				'label'   => __( 'AI Suite SEO', 'founderpostai-ai-suite-core' ),
				'version' => $seo_version,
			);
		}

		$seo_pro_version = defined( 'FOUNDERPOSTAI_AISUITE_SEO_PRO_VERSION' )
			? FOUNDERPOSTAI_AISUITE_SEO_PRO_VERSION
			: ( defined( 'AISUITE_SEO_PRO_VERSION' ) ? AISUITE_SEO_PRO_VERSION : '' );
		if ( $seo_pro_version ) {
			$products['seo-pro'] = array(
				'label'   => __( 'AI Suite SEO Pro', 'founderpostai-ai-suite-core' ),
				'version' => $seo_pro_version,
			);
		}

		return $products;
	}

	/**
	 * Render the native feedback screen.
	 */
	public function render() {
		if ( ! current_user_can( self::CAP ) ) {
			wp_die( esc_html__( 'You do not have permission to send AI Suite feedback.', 'founderpostai-ai-suite-core' ) );
		}

		$products = $this->products();
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- presentation-only product selection.
		$product = isset( $_GET['product'] ) ? sanitize_key( wp_unslash( $_GET['product'] ) ) : 'core';
		if ( ! isset( $products[ $product ] ) ) {
			$product = 'core';
		}
		$user = wp_get_current_user();
		?>
		<div class="wrap aisuite-wrap">
			<h1><?php esc_html_e( 'Send feedback', 'founderpostai-ai-suite-core' ); ?></h1>
			<p class="aisuite-feedback-intro">
				<?php esc_html_e( 'Found a bug, have an idea, or want to tell us how the plugin is working? Send it directly to the person building AI Suite.', 'founderpostai-ai-suite-core' ); ?>
			</p>

			<?php $this->render_flash(); ?>

			<?php if ( ! $this->core->is_connected() ) : ?>
				<div class="notice notice-warning inline">
					<p>
						<?php esc_html_e( 'The in-dashboard form uses your site connection to prevent spam and authenticate the submission.', 'founderpostai-ai-suite-core' ); ?>
						<a href="<?php echo esc_url( admin_url( 'admin.php?page=aisuite' ) ); ?>"><?php esc_html_e( 'Connect this site', 'founderpostai-ai-suite-core' ); ?></a>
						<?php esc_html_e( 'or', 'founderpostai-ai-suite-core' ); ?>
						<a href="mailto:support@founderpostai.com?subject=AI%20Suite%20feedback"><?php esc_html_e( 'email support@founderpostai.com', 'founderpostai-ai-suite-core' ); ?></a>.
					</p>
				</div>
			<?php else : ?>
				<div class="aisuite-panel aisuite-feedback-panel">
					<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
						<?php wp_nonce_field( 'aisuite_feedback' ); ?>
						<input type="hidden" name="action" value="aisuite_feedback" />

						<table class="form-table" role="presentation">
							<tr>
								<th scope="row"><label for="aisuite-feedback-product"><?php esc_html_e( 'Plugin', 'founderpostai-ai-suite-core' ); ?></label></th>
								<td>
									<select id="aisuite-feedback-product" name="product">
										<?php foreach ( $products as $slug => $details ) : ?>
											<option value="<?php echo esc_attr( $slug ); ?>" <?php selected( $slug, $product ); ?>><?php echo esc_html( $details['label'] ); ?></option>
										<?php endforeach; ?>
									</select>
								</td>
							</tr>
							<tr>
								<th scope="row"><label for="aisuite-feedback-category"><?php esc_html_e( 'Type', 'founderpostai-ai-suite-core' ); ?></label></th>
								<td>
									<select id="aisuite-feedback-category" name="category">
										<option value="bug"><?php esc_html_e( 'Bug or something broken', 'founderpostai-ai-suite-core' ); ?></option>
										<option value="feature"><?php esc_html_e( 'Feature or improvement idea', 'founderpostai-ai-suite-core' ); ?></option>
										<option value="feedback"><?php esc_html_e( 'General feedback', 'founderpostai-ai-suite-core' ); ?></option>
									</select>
								</td>
							</tr>
							<tr>
								<th scope="row"><label for="aisuite-feedback-message"><?php esc_html_e( 'What should we know?', 'founderpostai-ai-suite-core' ); ?></label></th>
								<td>
									<textarea id="aisuite-feedback-message" name="message" rows="7" maxlength="3000" class="large-text" required placeholder="<?php echo esc_attr__( 'What happened, what did you expect, or what would make the plugin more useful?', 'founderpostai-ai-suite-core' ); ?>"></textarea>
									<p class="description"><?php esc_html_e( 'Please do not include passwords, API keys, license keys, or private post content.', 'founderpostai-ai-suite-core' ); ?></p>
								</td>
							</tr>
							<tr>
								<th scope="row"><label for="aisuite-feedback-email"><?php esc_html_e( 'Reply email', 'founderpostai-ai-suite-core' ); ?></label></th>
								<td>
									<input id="aisuite-feedback-email" name="contact_email" type="email" class="regular-text" maxlength="254" value="<?php echo esc_attr( $user->user_email ); ?>" />
									<p class="description"><?php esc_html_e( 'Optional. Clear this if you do not want a reply.', 'founderpostai-ai-suite-core' ); ?></p>
								</td>
							</tr>
						</table>

						<p class="description aisuite-feedback-disclosure">
							<?php
							printf(
								/* translators: %s: privacy policy URL */
								wp_kses_post( __( 'Submitting sends your message, selected reply email, plugin and software versions, and connected site identity to FounderPostAI for support and product planning. See the <a href="%s">privacy policy</a>.', 'founderpostai-ai-suite-core' ) ),
								esc_url( 'https://founderpostai.com/privacy' )
							);
							?>
						</p>

						<?php submit_button( __( 'Send feedback', 'founderpostai-ai-suite-core' ) ); ?>
					</form>
				</div>
			<?php endif; ?>
		</div>
		<?php
	}

	/**
	 * Validate and submit the feedback form.
	 */
	public function handle_submit() {
		if ( ! current_user_can( self::CAP ) ) {
			wp_die( esc_html__( 'You do not have permission to do that.', 'founderpostai-ai-suite-core' ) );
		}

		check_admin_referer( 'aisuite_feedback' );

		$products = $this->products();
		// phpcs:ignore WordPress.Security.NonceVerification.Missing -- nonce checked above.
		$product = isset( $_POST['product'] ) ? sanitize_key( wp_unslash( $_POST['product'] ) ) : 'core';
		// phpcs:ignore WordPress.Security.NonceVerification.Missing -- nonce checked above.
		$category = isset( $_POST['category'] ) ? sanitize_key( wp_unslash( $_POST['category'] ) ) : 'feedback';
		// phpcs:ignore WordPress.Security.NonceVerification.Missing -- nonce checked above.
		$message = isset( $_POST['message'] ) ? sanitize_textarea_field( wp_unslash( $_POST['message'] ) ) : '';
		// phpcs:ignore WordPress.Security.NonceVerification.Missing -- nonce checked above.
		$email = isset( $_POST['contact_email'] ) ? sanitize_email( wp_unslash( $_POST['contact_email'] ) ) : '';

		if ( ! isset( $products[ $product ] ) ) {
			$product = 'core';
		}
		if ( ! in_array( $category, array( 'bug', 'feature', 'feedback' ), true ) ) {
			$category = 'feedback';
		}
		if ( function_exists( 'mb_substr' ) ) {
			$message = mb_substr( $message, 0, 3000 );
		} else {
			$message = substr( $message, 0, 3000 );
		}

		if ( strlen( trim( $message ) ) < 10 ) {
			$this->set_error( __( 'Please add at least a little more detail before sending.', 'founderpostai-ai-suite-core' ) );
			$this->redirect( 'error', $product );
		}
		if ( '' !== $email && ! is_email( $email ) ) {
			$this->set_error( __( 'Enter a valid reply email or leave the field blank.', 'founderpostai-ai-suite-core' ) );
			$this->redirect( 'error', $product );
		}

		$result = $this->core->gateway->submit_feedback(
			array(
				'product'        => $product,
				'category'       => $category,
				'message'        => $message,
				'contact_email'  => $email,
				'plugin_version' => $products[ $product ]['version'],
				'core_version'   => AISUITE_CORE_VERSION,
				'wp_version'     => get_bloginfo( 'version' ),
				'php_version'    => PHP_VERSION,
			)
		);

		if ( is_wp_error( $result ) ) {
			$this->set_error( $result->get_error_message() );
			$this->redirect( 'error', $product );
		}

		$this->redirect( 'sent', $product );
	}

	/**
	 * Get the current user's one-shot error key.
	 *
	 * @return string
	 */
	protected function flash_key() {
		return 'aisuite_feedback_flash_' . get_current_user_id();
	}

	/**
	 * Store a one-shot submission error.
	 *
	 * @param string $message Error message.
	 */
	protected function set_error( $message ) {
		set_transient( $this->flash_key(), sanitize_text_field( $message ), MINUTE_IN_SECONDS );
	}

	/**
	 * Render one submission result notice.
	 */
	protected function render_flash() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- display only; submissions are nonce-checked.
		$status = isset( $_GET['aisuite_feedback'] ) ? sanitize_key( wp_unslash( $_GET['aisuite_feedback'] ) ) : '';
		if ( 'sent' === $status ) {
			printf(
				'<div class="notice notice-success is-dismissible"><p>%s</p></div>',
				esc_html__( 'Thank you — your feedback is in the FounderPostAI review inbox.', 'founderpostai-ai-suite-core' )
			);
			return;
		}
		if ( 'error' !== $status ) {
			return;
		}

		$message = get_transient( $this->flash_key() );
		delete_transient( $this->flash_key() );
		printf(
			'<div class="notice notice-error"><p>%s</p></div>',
			esc_html( is_string( $message ) ? $message : __( 'Feedback could not be sent. Please try again.', 'founderpostai-ai-suite-core' ) )
		);
	}

	/**
	 * Return to the feedback screen after a submission.
	 *
	 * @param string $status  Result code.
	 * @param string $product Product slug.
	 */
	protected function redirect( $status, $product ) {
		wp_safe_redirect(
			add_query_arg(
				'aisuite_feedback',
				$status,
				self::url( $product )
			)
		);
		exit;
	}
}
