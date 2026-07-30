<?php
/**
 * Review queue.
 *
 * The whole pitch is here: the customer sees the current value and the proposed
 * value side by side, with the reason, and decides. Competitors show a score
 * and leave the work to the user; this screen does the work and asks for a nod.
 */

defined( 'ABSPATH' ) || exit;

class AISuite_SEO_Review_Screen {

	const CAP  = 'edit_posts';
	const SLUG = 'founderpostai-ai-suite-seo';

	/** Free tier: how many posts one batch run may queue. */
	const FREE_BATCH_LIMIT = 10;

	public function __construct() {
		add_action( 'admin_menu', array( $this, 'menu' ), 20 );
		add_action( 'admin_enqueue_scripts', array( $this, 'assets' ) );
		add_action( 'admin_post_aisuite_seo_resolve', array( $this, 'handle_resolve' ) );
		add_action( 'admin_post_aisuite_seo_analyze', array( $this, 'handle_analyze' ) );
		add_filter( 'post_row_actions', array( $this, 'row_action' ), 10, 2 );
		add_filter( 'page_row_actions', array( $this, 'row_action' ), 10, 2 );
	}

	public function menu() {
		$pending = AISuite_SEO_Store::count( 'pending' );
		$label   = __( 'SEO', 'founderpostai-ai-suite-seo' );

		if ( $pending ) {
			$label .= sprintf( ' <span class="awaiting-mod"><span class="pending-count">%d</span></span>', (int) $pending );
		}

		add_submenu_page(
			'aisuite',
			__( 'SEO', 'founderpostai-ai-suite-seo' ),
			$label,
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

	public function row_action( $actions, $post ) {
		if ( ! current_user_can( 'edit_post', $post->ID ) || ! function_exists( 'aisuite' ) ) {
			return $actions;
		}

		$url = wp_nonce_url(
			add_query_arg(
				array(
					'action'  => 'aisuite_seo_analyze',
					'post_id' => $post->ID,
				),
				admin_url( 'admin-post.php' )
			),
			'aisuite_seo_analyze_' . $post->ID
		);

		$actions['aisuite_seo'] = sprintf(
			'<a href="%s">%s</a>',
			esc_url( $url ),
			esc_html__( 'Optimize with AI Suite', 'founderpostai-ai-suite-seo' )
		);

		return $actions;
	}

	public function render() {
		if ( ! current_user_can( self::CAP ) ) {
			wp_die( esc_html__( 'You do not have permission to view this.', 'founderpostai-ai-suite-seo' ) );
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only filter.
		$status = isset( $_GET['status'] ) ? sanitize_key( wp_unslash( $_GET['status'] ) ) : 'pending';

		if ( ! in_array( $status, array( 'pending', 'approved', 'rejected' ), true ) ) {
			$status = 'pending';
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only pagination.
		$page_number = isset( $_GET['paged'] ) ? max( 1, (int) $_GET['paged'] ) : 1;
		$per_page    = 20;
		$total       = AISuite_SEO_Store::count( $status );
		$suggestions = AISuite_SEO_Store::query(
			array(
				'status'   => $status,
				'page'     => $page_number,
				'per_page' => $per_page,
			)
		);
		$conflict    = AISuite_SEO_Meta_Output::conflicting_plugin();
		?>
		<div class="wrap aisuite-wrap">
			<h1><?php esc_html_e( 'SEO review', 'founderpostai-ai-suite-seo' ); ?></h1>

			<?php $this->render_flash(); ?>

			<?php if ( $conflict ) : ?>
				<div class="notice notice-warning">
					<p>
						<?php
						printf(
							/* translators: %s: conflicting plugin name */
							esc_html__( '%s is active, so it controls the tags on your pages. Approved AI Suite titles and descriptions are passed to it through its integration filters.', 'founderpostai-ai-suite-seo' ),
							'<strong>' . esc_html( $conflict ) . '</strong>'
						);
						?>
					</p>
				</div>
			<?php endif; ?>

			<?php if ( ! aisuite()->brand->is_complete() ) : ?>
				<div class="notice notice-info">
					<p>
						<?php esc_html_e( 'Suggestions get noticeably better once brand context is filled in.', 'founderpostai-ai-suite-seo' ); ?>
						<a href="<?php echo esc_url( admin_url( 'admin.php?page=aisuite' ) ); ?>"><?php esc_html_e( 'Add it now', 'founderpostai-ai-suite-seo' ); ?></a>
					</p>
				</div>
			<?php endif; ?>

			<ul class="subsubsub">
				<?php
				foreach ( array(
					'pending'  => __( 'Pending', 'founderpostai-ai-suite-seo' ),
					'approved' => __( 'Applied', 'founderpostai-ai-suite-seo' ),
					'rejected' => __( 'Dismissed', 'founderpostai-ai-suite-seo' ),
					) as $key => $label ) :
						$status_url = add_query_arg(
							array(
								'page'   => self::SLUG,
								'status' => $key,
							),
							admin_url( 'admin.php' )
						);
						?>
						<li>
							<a href="<?php echo esc_url( $status_url ); ?>"
								class="<?php echo $status === $key ? 'current' : ''; ?>">
							<?php echo esc_html( $label ); ?>
							<span class="count">(<?php echo esc_html( number_format_i18n( AISuite_SEO_Store::count( $key ) ) ); ?>)</span>
						</a>
					</li>
				<?php endforeach; ?>
			</ul>

			<div class="aisuite-review">
				<?php if ( empty( $suggestions ) ) : ?>
					<?php $this->render_empty( $status ); ?>
				<?php else : ?>
					<?php foreach ( $suggestions as $row ) : ?>
						<?php $this->render_card( $row, $status ); ?>
					<?php endforeach; ?>
				<?php endif; ?>
			</div>

			<?php
			$total_pages = (int) ceil( $total / $per_page );

			if ( $total_pages > 1 ) {
				$pagination_url = add_query_arg(
					array(
						'page'   => self::SLUG,
						'status' => $status,
						'paged'  => 999999999,
					),
					admin_url( 'admin.php' )
				);

				echo wp_kses_post(
					paginate_links(
						array(
							'base'      => str_replace( '999999999', '%#%', $pagination_url ),
							'current'   => $page_number,
							'total'     => $total_pages,
							'prev_text' => __( '&laquo; Previous', 'founderpostai-ai-suite-seo' ),
							'next_text' => __( 'Next &raquo;', 'founderpostai-ai-suite-seo' ),
						)
					)
				);
			}
			?>
		</div>
		<?php
	}

	protected function render_empty( $status ) {
		if ( 'pending' !== $status ) {
			printf( '<p>%s</p>', esc_html__( 'Nothing here yet.', 'founderpostai-ai-suite-seo' ) );
			return;
		}
		?>
		<div class="aisuite-empty">
			<p><?php esc_html_e( 'No suggestions waiting. Pick a post and run an analysis to fill this queue.', 'founderpostai-ai-suite-seo' ); ?></p>
			<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
				<?php wp_nonce_field( 'aisuite_seo_analyze_batch' ); ?>
				<input type="hidden" name="action" value="aisuite_seo_analyze" />
				<input type="hidden" name="mode" value="batch" />
				<?php
				submit_button(
					sprintf(
						/* translators: %d: number of posts */
						__( 'Analyze my %d most recent posts', 'founderpostai-ai-suite-seo' ),
						self::FREE_BATCH_LIMIT
					),
					'primary',
					'submit',
					false
				);
				?>
			</form>
		</div>
		<?php
	}

	protected function render_card( $row, $status ) {
		$post  = get_post( $row->post_id );
		$label = array(
			'title'          => __( 'Search title', 'founderpostai-ai-suite-seo' ),
			'description'    => __( 'Meta description', 'founderpostai-ai-suite-seo' ),
			'internal_links' => __( 'Internal links', 'founderpostai-ai-suite-seo' ),
		);
		?>
		<article class="aisuite-card">
			<header class="aisuite-card__head">
				<span class="aisuite-card__field"><?php echo esc_html( isset( $label[ $row->field ] ) ? $label[ $row->field ] : $row->field ); ?></span>
				<?php if ( $post ) : ?>
					<a class="aisuite-card__post" href="<?php echo esc_url( get_edit_post_link( $post->ID ) ); ?>">
						<?php echo esc_html( get_the_title( $post ) ); ?>
					</a>
				<?php endif; ?>
			</header>

			<div class="aisuite-diff">
				<div class="aisuite-diff__side aisuite-diff__side--current">
					<span class="aisuite-diff__label"><?php esc_html_e( 'Now', 'founderpostai-ai-suite-seo' ); ?></span>
					<div class="aisuite-diff__value">
						<?php echo $row->current_value ? esc_html( $row->current_value ) : '<em>' . esc_html__( 'empty', 'founderpostai-ai-suite-seo' ) . '</em>'; ?>
					</div>
				</div>
				<div class="aisuite-diff__side aisuite-diff__side--suggested">
					<span class="aisuite-diff__label"><?php esc_html_e( 'Suggested', 'founderpostai-ai-suite-seo' ); ?></span>
					<div class="aisuite-diff__value">
						<?php echo wp_kses_post( $this->format_value( $row ) ); ?>
					</div>
				</div>

			</div>

			<?php if ( $row->rationale ) : ?>
				<p class="aisuite-card__why"><?php echo esc_html( $row->rationale ); ?></p>
			<?php endif; ?>

			<?php if ( 'pending' === $status ) : ?>
				<footer class="aisuite-card__actions">
					<?php $this->render_resolve_button( $row->id, 'apply', __( 'Apply', 'founderpostai-ai-suite-seo' ), 'button-primary' ); ?>
					<?php $this->render_resolve_button( $row->id, 'reject', __( 'Dismiss', 'founderpostai-ai-suite-seo' ), 'button-secondary' ); ?>
				</footer>
			<?php endif; ?>
		</article>
		<?php
	}

	protected function format_value( $row ) {
		if ( 'internal_links' !== $row->field ) {
			return esc_html( $row->suggested_value );
		}

		$links = json_decode( $row->suggested_value, true );

		if ( empty( $links ) ) {
			return esc_html__( 'No links', 'founderpostai-ai-suite-seo' );
		}

		$out = '<ul class="aisuite-links">';

		foreach ( $links as $link ) {
			$out .= sprintf(
				'<li><code>%s</code> &rarr; <a href="%s">%s</a></li>',
				esc_html( $link['anchor'] ),
				esc_url( $link['url'] ),
				esc_html( get_the_title( (int) $link['target_id'] ) )
			);
		}

		return $out . '</ul>';
	}

	protected function render_resolve_button( $id, $decision, $label, $class ) {
		?>
		<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
			<?php wp_nonce_field( 'aisuite_seo_resolve_' . $id ); ?>
			<input type="hidden" name="action" value="aisuite_seo_resolve" />
			<input type="hidden" name="suggestion_id" value="<?php echo esc_attr( $id ); ?>" />
			<input type="hidden" name="decision" value="<?php echo esc_attr( $decision ); ?>" />
			<button type="submit" class="button <?php echo esc_attr( $class ); ?>"><?php echo esc_html( $label ); ?></button>
		</form>
		<?php
	}

	public function handle_resolve() {
		$id = isset( $_POST['suggestion_id'] ) ? (int) $_POST['suggestion_id'] : 0;

		if ( ! current_user_can( self::CAP ) ) {
			wp_die( esc_html__( 'You do not have permission to do that.', 'founderpostai-ai-suite-seo' ) );
		}

		check_admin_referer( 'aisuite_seo_resolve_' . $id );

		$decision = isset( $_POST['decision'] ) ? sanitize_key( wp_unslash( $_POST['decision'] ) ) : '';

		if ( ! in_array( $decision, array( 'apply', 'reject' ), true ) ) {
			$this->redirect( 'error', __( 'Unknown review decision.', 'founderpostai-ai-suite-seo' ) );
		}

		$optimizer = new AISuite_SEO_Optimizer( false );

		$result = 'apply' === $decision ? $optimizer->apply( $id ) : $optimizer->reject( $id );

		if ( is_wp_error( $result ) ) {
			$this->redirect( 'error', $result->get_error_message() );
		}

		$this->redirect( 'apply' === $decision ? 'applied' : 'dismissed' );
	}

	public function handle_analyze() {
		if ( ! current_user_can( self::CAP ) ) {
			wp_die( esc_html__( 'You do not have permission to do that.', 'founderpostai-ai-suite-seo' ) );
		}

		$mode = isset( $_POST['mode'] ) ? sanitize_key( wp_unslash( $_POST['mode'] ) ) : 'single';

		if ( 'batch' === $mode ) {
			check_admin_referer( 'aisuite_seo_analyze_batch' );
			$post_ids = get_posts(
				array(
					'post_type'      => array( 'post', 'page' ),
					'post_status'    => 'publish',
					'posts_per_page' => self::FREE_BATCH_LIMIT,
					'fields'         => 'ids',
					'orderby'        => 'modified',
					'order'          => 'DESC',
				)
			);
		} else {
			$post_id = isset( $_GET['post_id'] ) ? (int) $_GET['post_id'] : 0;
			check_admin_referer( 'aisuite_seo_analyze_' . $post_id );
			$post_ids = array( $post_id );
		}

		$optimizer = new AISuite_SEO_Optimizer( false );
		$queued    = 0;
		$blocked   = null;

		foreach ( $post_ids as $post_id ) {
			$result = $optimizer->analyze( $post_id );

			if ( ! is_wp_error( $result ) ) {
				++$queued;
				continue;
			}

			// Account-level problems apply to every remaining post, so stop.
			// Anything post-specific just skips that one.
			if ( in_array( $result->get_error_code(), array( 'aisuite_queue_full', 'aisuite_out_of_credits', 'aisuite_not_connected' ), true ) ) {
				$blocked = $result;
				break;
			}
		}

		if ( ! $queued ) {
			$this->redirect(
				'error',
				$blocked ? $blocked->get_error_message() : __( 'Nothing could be queued.', 'founderpostai-ai-suite-seo' )
			);
		}

		$this->redirect( 'queued', (string) $queued );
	}

	/**
	 * Flash detail travels in a per-user transient, not the query string.
	 * add_query_arg() already encodes, so anything encoded before it went in
	 * came back out double-escaped — and error text in a URL is both ugly and
	 * a place for reflected content to hide.
	 */
	protected function detail_key() {
		return 'aisuite_seo_flash_' . get_current_user_id();
	}

	protected function render_flash() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- display only; the acting request was nonce-checked.
		$code = isset( $_GET['aisuite_msg'] ) ? sanitize_key( wp_unslash( $_GET['aisuite_msg'] ) ) : '';

		if ( ! $code ) {
			return;
		}

		$detail = get_transient( $this->detail_key() );
		$detail = is_string( $detail ) ? $detail : '';

		// One-shot: a stale message must not reappear on the next page load.
		delete_transient( $this->detail_key() );

		switch ( $code ) {
			case 'applied':
				$type    = 'success';
				$message = __( 'Applied. The post was updated and a revision was saved.', 'founderpostai-ai-suite-seo' );
				break;

			case 'dismissed':
				$type    = 'success';
				$message = __( 'Dismissed.', 'founderpostai-ai-suite-seo' );
				break;

			case 'queued':
				$count   = max( 0, (int) $detail );
				$type    = 'info';
				$message = sprintf(
					/* translators: %s: number of posts queued */
					_n( 'Queued %s post. Suggestions appear here as it finishes.', 'Queued %s posts. Suggestions appear here as they finish.', $count, 'founderpostai-ai-suite-seo' ),
					number_format_i18n( $count )
				);
				break;

			case 'error':
				$type    = 'error';
				$message = $detail ? $detail : __( 'Something went wrong.', 'founderpostai-ai-suite-seo' );
				break;

			default:
				return;
		}

		printf(
			'<div class="notice notice-%s is-dismissible"><p>%s</p></div>',
			esc_attr( $type ),
			esc_html( $message )
		);
	}

	protected function redirect( $code, $detail = '' ) {
		if ( '' !== $detail ) {
			set_transient( $this->detail_key(), (string) $detail, MINUTE_IN_SECONDS );
		}

		wp_safe_redirect(
			add_query_arg(
				array(
					'page'        => self::SLUG,
					'aisuite_msg' => $code,
				),
				admin_url( 'admin.php' )
			)
		);
		exit;
	}
}
