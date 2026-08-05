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
		add_action( 'admin_post_aisuite_seo_bulk_apply', array( $this, 'handle_bulk_apply' ) );
		add_action( 'admin_post_aisuite_seo_regenerate', array( $this, 'handle_regenerate' ) );
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
		wp_enqueue_script( 'aisuite-seo-review', AISUITE_SEO_URL . 'assets/review.js', array(), AISUITE_SEO_VERSION, true );
		wp_localize_script(
			'aisuite-seo-review',
			'AISuiteSEOReview',
			array(
				'characters'  => __( 'characters', 'founderpostai-ai-suite-seo' ),
				'pixels'      => __( 'px wide', 'founderpostai-ai-suite-seo' ),
				'goodFit'     => __( 'Good search-result fit', 'founderpostai-ai-suite-seo' ),
				'tooShort'    => __( 'Could use more detail', 'founderpostai-ai-suite-seo' ),
				'tooLong'     => __( 'May be truncated', 'founderpostai-ai-suite-seo' ),
				'confirmUndo' => __( 'Restore the exact value from before this change?', 'founderpostai-ai-suite-seo' ),
				'confirmBulk' => __( 'Apply every selected suggestion? Each item still receives stale-value and permission checks.', 'founderpostai-ai-suite-seo' ),
				'selected'    => __( 'selected', 'founderpostai-ai-suite-seo' ),
				'maxBulk'     => __( 'You can apply up to 20 suggestions at once.', 'founderpostai-ai-suite-seo' ),
			)
		);
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

		if ( ! in_array( $status, array( 'pending', 'approved', 'rejected', 'undone' ), true ) ) {
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
			<a class="page-title-action" href="<?php echo esc_url( admin_url( 'admin.php?page=' . AISuite_SEO_Health_Screen::SLUG ) ); ?>"><?php esc_html_e( 'SEO health', 'founderpostai-ai-suite-seo' ); ?></a>
			<?php if ( class_exists( 'AISuite_Feedback' ) && current_user_can( AISuite_Feedback::CAP ) ) : ?>
				<a class="page-title-action" href="<?php echo esc_url( AISuite_Feedback::url( 'seo' ) ); ?>"><?php esc_html_e( 'Send feedback', 'founderpostai-ai-suite-seo' ); ?></a>
			<?php endif; ?>

			<?php $this->render_flash(); ?>

			<?php if ( $conflict ) : ?>
				<div class="notice notice-warning">
					<p>
						<?php
						printf(
							/* translators: %s: conflicting plugin name */
							esc_html__( '%s is active, so approved AI Suite titles and descriptions are saved directly to its native metadata fields.', 'founderpostai-ai-suite-seo' ),
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
					'undone'   => __( 'Undone', 'founderpostai-ai-suite-seo' ),
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

			<?php if ( 'pending' === $status && $total ) : ?>
				<?php $this->render_bulk_toolbar(); ?>
			<?php endif; ?>

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
						__( 'Analyze my next %d posts', 'founderpostai-ai-suite-seo' ),
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
		$post     = get_post( $row->post_id );
		$editable = 'pending' === $status && in_array( $row->field, array( 'title', 'description' ), true );
		$label    = array(
			'title'          => __( 'Search title', 'founderpostai-ai-suite-seo' ),
			'description'    => __( 'Meta description', 'founderpostai-ai-suite-seo' ),
			'internal_links' => __( 'Internal links', 'founderpostai-ai-suite-seo' ),
		);
		?>
		<article class="aisuite-card">
			<header class="aisuite-card__head">
				<span class="aisuite-card__field">
					<?php if ( 'pending' === $status ) : ?>
						<input type="checkbox" class="aisuite-bulk-checkbox" name="suggestion_ids[]" value="<?php echo esc_attr( $row->id ); ?>" form="aisuite-bulk-apply" aria-label="<?php esc_attr_e( 'Select suggestion for bulk apply', 'founderpostai-ai-suite-seo' ); ?>" />
					<?php endif; ?>
					<?php echo esc_html( isset( $label[ $row->field ] ) ? $label[ $row->field ] : $row->field ); ?>
				</span>
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
					<span class="aisuite-diff__label"><?php echo $editable ? esc_html__( 'Suggested — edit before applying', 'founderpostai-ai-suite-seo' ) : esc_html__( 'Suggested', 'founderpostai-ai-suite-seo' ); ?></span>
					<div class="aisuite-diff__value">
						<?php if ( $editable ) : ?>
							<?php $this->render_suggestion_editor( $row ); ?>
						<?php else : ?>
							<?php echo wp_kses_post( $this->format_value( $row ) ); ?>
						<?php endif; ?>
					</div>
				</div>

			</div>

			<?php if ( $editable && $post ) : ?>
				<?php $this->render_serp_preview( $row, $post ); ?>
			<?php endif; ?>

			<?php if ( $row->rationale ) : ?>
				<p class="aisuite-card__why"><?php echo esc_html( $row->rationale ); ?></p>
			<?php endif; ?>

			<?php if ( 'pending' === $status ) : ?>
				<?php $this->render_refine_form( $row ); ?>
				<footer class="aisuite-card__actions">
					<?php $this->render_apply_button( $row ); ?>
					<?php $this->render_resolve_button( $row->id, 'reject', __( 'Dismiss', 'founderpostai-ai-suite-seo' ), 'button-secondary' ); ?>
				</footer>
			<?php elseif ( 'approved' === $status && $this->has_rollback( $row ) ) : ?>
				<footer class="aisuite-card__actions">
					<?php $this->render_resolve_button( $row->id, 'undo', __( 'Undo this change', 'founderpostai-ai-suite-seo' ), 'button-secondary', true ); ?>
					<span class="description"><?php esc_html_e( 'Undo is blocked if the live value changed afterward.', 'founderpostai-ai-suite-seo' ); ?></span>
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

	/** Render an editable title or description tied to its Apply form. */
	protected function render_suggestion_editor( $row ) {
		$metric_id  = 'aisuite-metric-' . (int) $row->id;
		$is_title   = 'title' === $row->field;
		$max_chars  = $is_title ? 60 : 155;
		$max_pixels = $is_title ? 600 : 920;
		$value      = (string) $row->suggested_value;
		?>
		<?php if ( $is_title ) : ?>
			<input type="text" class="widefat aisuite-suggestion-editor" value="<?php echo esc_attr( $value ); ?>" maxlength="<?php echo esc_attr( $max_chars ); ?>" required aria-describedby="<?php echo esc_attr( $metric_id ); ?>" data-aisuite-suggestion data-suggestion-id="<?php echo esc_attr( $row->id ); ?>" data-field="title" data-max-chars="<?php echo esc_attr( $max_chars ); ?>" data-max-pixels="<?php echo esc_attr( $max_pixels ); ?>" />
		<?php else : ?>
			<textarea class="widefat aisuite-suggestion-editor" rows="3" maxlength="<?php echo esc_attr( $max_chars ); ?>" required aria-describedby="<?php echo esc_attr( $metric_id ); ?>" data-aisuite-suggestion data-suggestion-id="<?php echo esc_attr( $row->id ); ?>" data-field="description" data-max-chars="<?php echo esc_attr( $max_chars ); ?>" data-max-pixels="<?php echo esc_attr( $max_pixels ); ?>"><?php echo esc_textarea( $value ); ?></textarea>
		<?php endif; ?>
		<span class="aisuite-suggestion-metric" id="<?php echo esc_attr( $metric_id ); ?>" aria-live="polite"></span>
		<?php
	}

	/** Render a Google-style preview that follows the editable field. */
	protected function render_serp_preview( $row, $post ) {
		$current_title       = AISuite_SEO_Meta_Adapter::read( $post->ID, 'title' );
		$current_description = AISuite_SEO_Meta_Adapter::read( $post->ID, 'description' );
		$preview_title       = 'title' === $row->field ? $row->suggested_value : $current_title;
		$preview_description = 'description' === $row->field ? $row->suggested_value : $current_description;
		$preview_title       = $preview_title ? $preview_title : get_the_title( $post );
		$preview_source      = $post->post_excerpt ? $post->post_excerpt : $post->post_content;
		$preview_description = $preview_description ? $preview_description : wp_trim_words( wp_strip_all_tags( $preview_source ), 24, '…' );
		?>
		<div class="aisuite-serp-preview" data-aisuite-serp>
			<span class="aisuite-diff__label"><?php esc_html_e( 'Search preview', 'founderpostai-ai-suite-seo' ); ?></span>
			<div class="aisuite-serp-preview__url"><?php echo esc_html( get_permalink( $post ) ); ?></div>
			<div class="aisuite-serp-preview__title" data-serp-title><?php echo esc_html( $preview_title ); ?></div>
			<div class="aisuite-serp-preview__description" data-serp-description><?php echo esc_html( $preview_description ); ?></div>
		</div>
		<?php
	}

	/** Apply form; editable fields elsewhere on the card target this form ID. */
	protected function render_apply_button( $row ) {
		$form_id = 'aisuite-apply-' . (int) $row->id;
		?>
		<form id="<?php echo esc_attr( $form_id ); ?>" method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
			<?php wp_nonce_field( 'aisuite_seo_resolve_' . $row->id ); ?>
			<input type="hidden" name="action" value="aisuite_seo_resolve" />
			<input type="hidden" name="suggestion_id" value="<?php echo esc_attr( $row->id ); ?>" />
			<input type="hidden" name="decision" value="apply" />
			<?php if ( in_array( $row->field, array( 'title', 'description' ), true ) ) : ?>
				<input type="hidden" name="suggested_value" value="<?php echo esc_attr( $row->suggested_value ); ?>" data-aisuite-apply-value="<?php echo esc_attr( $row->id ); ?>" />
			<?php endif; ?>
			<button type="submit" class="button button-primary"><?php esc_html_e( 'Apply reviewed change', 'founderpostai-ai-suite-seo' ); ?></button>
		</form>
		<?php
	}

	/** Bulk apply form; JavaScript serializes reviewed edits at submit time. */
	protected function render_bulk_toolbar() {
		?>
		<div class="aisuite-bulk-toolbar">
			<label><input type="checkbox" data-aisuite-select-all /> <?php esc_html_e( 'Select this page', 'founderpostai-ai-suite-seo' ); ?></label>
			<form id="aisuite-bulk-apply" method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" data-aisuite-bulk-form>
				<?php wp_nonce_field( 'aisuite_seo_bulk_apply' ); ?>
				<input type="hidden" name="action" value="aisuite_seo_bulk_apply" />
				<button type="submit" class="button button-primary" disabled data-aisuite-bulk-submit><?php esc_html_e( 'Apply selected', 'founderpostai-ai-suite-seo' ); ?> <span data-aisuite-selected-count>(0)</span></button>
			</form>
			<span class="description"><?php esc_html_e( 'Up to 20 at once. Newer manual edits are never overwritten.', 'founderpostai-ai-suite-seo' ); ?></span>
		</div>
		<?php
	}

	/** Per-suggestion regeneration with optional human direction. */
	protected function render_refine_form( $row ) {
		?>
		<details class="aisuite-refine">
			<summary><?php esc_html_e( 'Regenerate or refine', 'founderpostai-ai-suite-seo' ); ?></summary>
			<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
				<?php wp_nonce_field( 'aisuite_seo_regenerate_' . $row->id ); ?>
				<input type="hidden" name="action" value="aisuite_seo_regenerate" />
				<input type="hidden" name="suggestion_id" value="<?php echo esc_attr( $row->id ); ?>" />
				<label for="aisuite-refine-<?php echo esc_attr( $row->id ); ?>"><?php esc_html_e( 'Optional direction', 'founderpostai-ai-suite-seo' ); ?></label>
				<input type="text" class="regular-text" id="aisuite-refine-<?php echo esc_attr( $row->id ); ?>" name="instruction" maxlength="500" placeholder="<?php esc_attr_e( 'Example: make it more specific and less promotional', 'founderpostai-ai-suite-seo' ); ?>" />
				<button type="submit" class="button"><?php esc_html_e( 'Generate another version', 'founderpostai-ai-suite-seo' ); ?></button>
			</form>
		</details>
		<?php
	}

	/** Whether this applied row was created after rollback journaling existed. */
	protected function has_rollback( $row ) {
		return property_exists( $row, 'rollback_value' ) && property_exists( $row, 'applied_value' ) && null !== $row->rollback_value && null !== $row->applied_value;
	}

	protected function render_resolve_button( $id, $decision, $label, $class, $confirm = false ) {
		?>
		<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
			<?php wp_nonce_field( 'aisuite_seo_resolve_' . $id ); ?>
			<input type="hidden" name="action" value="aisuite_seo_resolve" />
			<input type="hidden" name="suggestion_id" value="<?php echo esc_attr( $id ); ?>" />
			<input type="hidden" name="decision" value="<?php echo esc_attr( $decision ); ?>" />
			<button type="submit" class="button <?php echo esc_attr( $class ); ?>"
			<?php
			if ( $confirm ) :
				?>
				data-aisuite-confirm-undo<?php endif; ?>><?php echo esc_html( $label ); ?></button>
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

		if ( ! in_array( $decision, array( 'apply', 'reject', 'undo' ), true ) ) {
			$this->redirect( 'error', __( 'Unknown review decision.', 'founderpostai-ai-suite-seo' ) );
		}

		$optimizer = new AISuite_SEO_Optimizer( false );

		switch ( $decision ) {
			case 'apply':
				if ( isset( $_POST['suggested_value'] ) && ! is_string( $_POST['suggested_value'] ) ) {
					$this->redirect( 'error', __( 'The edited suggestion is invalid.', 'founderpostai-ai-suite-seo' ) );
				}

				$edited_value = isset( $_POST['suggested_value'] ) ? sanitize_text_field( wp_unslash( $_POST['suggested_value'] ) ) : null;
				$result       = $optimizer->apply( $id, true, $edited_value );
				break;

			case 'undo':
				$result = $optimizer->undo( $id );
				break;

			default:
				$result = $optimizer->reject( $id );
				break;
		}

		if ( is_wp_error( $result ) ) {
			$this->redirect( 'error', $result->get_error_message() );
		}

		if ( 'undo' === $decision ) {
			$this->redirect( 'undone', '', 'undone' );
		}

		$this->redirect( 'apply' === $decision ? 'applied' : 'dismissed' );
	}

	/** Apply a bounded selection, preserving per-item stale and capability checks. */
	public function handle_bulk_apply() {
		if ( ! current_user_can( self::CAP ) ) {
			wp_die( esc_html__( 'You do not have permission to do that.', 'founderpostai-ai-suite-seo' ) );
		}

		check_admin_referer( 'aisuite_seo_bulk_apply' );

		$ids    = isset( $_POST['suggestion_ids'] ) && is_array( $_POST['suggestion_ids'] ) ? array_map( 'absint', wp_unslash( $_POST['suggestion_ids'] ) ) : array();
		$ids    = array_slice( array_values( array_unique( array_filter( $ids ) ) ), 0, 20 );
		$values = isset( $_POST['reviewed_values'] ) && is_array( $_POST['reviewed_values'] ) ? map_deep( wp_unslash( $_POST['reviewed_values'] ), 'sanitize_text_field' ) : array();

		if ( empty( $ids ) ) {
			$this->redirect( 'error', __( 'Select at least one suggestion.', 'founderpostai-ai-suite-seo' ) );
		}

		$optimizer = new AISuite_SEO_Optimizer( false );
		$applied   = 0;
		$failed    = 0;

		foreach ( $ids as $id ) {
			$row    = AISuite_SEO_Store::get( $id );
			$edited = null;

			if ( $row && in_array( $row->field, array( 'title', 'description' ), true ) && isset( $values[ $id ] ) && is_scalar( $values[ $id ] ) ) {
				$edited = sanitize_text_field( (string) $values[ $id ] );
			}

			$result = $optimizer->apply( $id, true, $edited );
			if ( is_wp_error( $result ) ) {
				++$failed;
			} else {
				++$applied;
			}
		}

		$this->redirect( 'bulk_applied', $applied . ',' . $failed );
	}

	/** Re-run analysis with an optional field-specific instruction. */
	public function handle_regenerate() {
		$id = isset( $_POST['suggestion_id'] ) ? (int) $_POST['suggestion_id'] : 0;

		if ( ! current_user_can( self::CAP ) ) {
			wp_die( esc_html__( 'You do not have permission to do that.', 'founderpostai-ai-suite-seo' ) );
		}

		check_admin_referer( 'aisuite_seo_regenerate_' . $id );
		$row = AISuite_SEO_Store::get( $id );

		if ( ! $row || 'pending' !== $row->status || ! current_user_can( 'edit_post', $row->post_id ) ) {
			$this->redirect( 'error', __( 'That suggestion can no longer be regenerated.', 'founderpostai-ai-suite-seo' ) );
		}

		if ( isset( $_POST['instruction'] ) && ! is_string( $_POST['instruction'] ) ) {
			$this->redirect( 'error', __( 'The refinement direction is invalid.', 'founderpostai-ai-suite-seo' ) );
		}

		$instruction = isset( $_POST['instruction'] ) ? sanitize_text_field( wp_unslash( $_POST['instruction'] ) ) : '';
		$instruction = function_exists( 'mb_substr' ) ? mb_substr( $instruction, 0, 500, 'UTF-8' ) : substr( $instruction, 0, 500 );
		$optimizer   = new AISuite_SEO_Optimizer( false );
		$result      = $optimizer->analyze(
			$row->post_id,
			true,
			array(
				'focus'       => $row->field,
				'instruction' => $instruction,
			)
		);

		if ( is_wp_error( $result ) ) {
			$this->redirect( 'error', $result->get_error_message() );
		}

		$this->redirect( 'queued', '1' );
	}

	public function handle_analyze() {
		if ( ! current_user_can( self::CAP ) ) {
			wp_die( esc_html__( 'You do not have permission to do that.', 'founderpostai-ai-suite-seo' ) );
		}

		$mode = isset( $_POST['mode'] ) ? sanitize_key( wp_unslash( $_POST['mode'] ) ) : 'single';

		if ( 'batch' === $mode ) {
			check_admin_referer( 'aisuite_seo_analyze_batch' );
			$post_ids = $this->batch_post_ids( self::FREE_BATCH_LIMIT );
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
			if ( 'batch' === $mode && empty( $post_ids ) ) {
				$this->redirect( 'current' );
			}

			$this->redirect(
				'error',
				$blocked ? $blocked->get_error_message() : __( 'Nothing could be queued.', 'founderpostai-ai-suite-seo' )
			);
		}

		$this->redirect( 'queued', (string) $queued );
	}

	/**
	 * Find the next recent posts whose analyzed inputs are no longer current.
	 *
	 * Pages are scanned beyond the newest ten so repeat batch runs progress
	 * through the site instead of charging for the same posts again.
	 *
	 * @param int $limit Maximum post IDs to return.
	 * @return int[]
	 */
	protected function batch_post_ids( $limit ) {
		$limit     = max( 1, (int) $limit );
		$page_size = max( 50, $limit * 5 );
		$page      = 1;
		$post_ids  = array();

		do {
			$posts = get_posts(
				array(
					'post_type'      => array( 'post', 'page' ),
					'post_status'    => 'publish',
					'posts_per_page' => $page_size,
					'paged'          => $page,
					'orderby'        => array(
						'modified' => 'DESC',
						'ID'       => 'DESC',
					),
					'no_found_rows'  => true,
				)
			);

			foreach ( $posts as $post ) {
				$can_edit = current_user_can( 'edit_post', $post->ID );
				$queued   = AISuite_SEO_Optimizer::is_queued( $post->ID );

				if ( ! $can_edit || $queued || AISuite_SEO_Optimizer::is_current( $post ) ) {
					continue;
				}

				$post_ids[] = (int) $post->ID;

				if ( count( $post_ids ) >= $limit ) {
					break 2;
				}
			}

			$post_count = count( $posts );
			++$page;
		} while ( $post_count === $page_size );

		return $post_ids;
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
				$message = __( 'Applied. The reviewed change is now live.', 'founderpostai-ai-suite-seo' );
				break;

			case 'undone':
				$type    = 'success';
				$message = __( 'Undone. The exact previous value was restored.', 'founderpostai-ai-suite-seo' );
				break;

			case 'bulk_applied':
				$parts   = array_map( 'absint', explode( ',', $detail ) );
				$applied = isset( $parts[0] ) ? $parts[0] : 0;
				$failed  = isset( $parts[1] ) ? $parts[1] : 0;
				$type    = $failed ? 'warning' : 'success';
				$message = sprintf(
					/* translators: 1: applied count, 2: safely skipped count */
					__( 'Applied %1$d selected suggestions. Safely skipped %2$d that were stale, invalid, or unavailable.', 'founderpostai-ai-suite-seo' ),
					$applied,
					$failed
				);
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

			case 'current':
				$type    = 'success';
				$message = __( 'Every published post and page is already current or in the analysis queue.', 'founderpostai-ai-suite-seo' );
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

	protected function redirect( $code, $detail = '', $status = '' ) {
		if ( '' !== $detail ) {
			set_transient( $this->detail_key(), (string) $detail, MINUTE_IN_SECONDS );
		}

		$query = array(
			'page'        => self::SLUG,
			'aisuite_msg' => $code,
		);

		if ( $status ) {
			$query['status'] = sanitize_key( $status );
		}

		wp_safe_redirect(
			add_query_arg(
				$query,
				admin_url( 'admin.php' )
			)
		);
		exit;
	}
}
