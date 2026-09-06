<?php
/** Site-wide SEO health audit and dashboard. */

defined( 'ABSPATH' ) || exit;

class FounderPostAI_AISuite_SEO_Health_Screen {

	const CAP       = 'edit_posts';
	const SLUG      = 'founderpostai-ai-suite-seo-health';
	const CACHE_KEY = 'founderpostai_aisuite_seo_health_snapshot';
	const PER_PAGE  = 50;

	public function __construct() {
		add_action( 'admin_menu', array( $this, 'menu' ), 21 );
		add_action( 'admin_enqueue_scripts', array( $this, 'assets' ) );
		add_action( 'admin_post_founderpostai_aisuite_seo_health_refresh', array( $this, 'handle_refresh' ) );
		add_action( 'admin_post_founderpostai_aisuite_seo_index_rebuild', array( $this, 'handle_index_rebuild' ) );
		add_action( 'save_post', array( __CLASS__, 'invalidate' ), 20 );
		add_action( 'deleted_post', array( __CLASS__, 'invalidate' ) );
	}

	/** Reset only the generated local index; canonical post content is untouched. */
	public function handle_index_rebuild() {
		if ( ! current_user_can( self::CAP ) ) {
			wp_die( esc_html__( 'You do not have permission to do that.', 'founderpostai-ai-suite-seo' ) );
		}

		check_admin_referer( 'founderpostai_aisuite_seo_index_rebuild' );
		FounderPostAI_AISuite_SEO_Site_Index::rebuild();

		wp_safe_redirect(
			add_query_arg(
				array(
					'page'        => self::SLUG,
					'founderpostai_aisuite_seo_msg' => 'indexing',
				),
				admin_url( 'admin.php' )
			)
		);
		exit;
	}

	public function menu() {
		add_submenu_page(
			'aisuite',
			__( 'SEO health', 'founderpostai-ai-suite-seo' ),
			__( 'SEO health', 'founderpostai-ai-suite-seo' ),
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
		wp_enqueue_style( 'founderpostai-aisuite-seo-review', FOUNDERPOSTAI_AISUITE_SEO_URL . 'assets/review.css', array( 'aisuite-admin' ), FOUNDERPOSTAI_AISUITE_SEO_VERSION );
	}

	public static function invalidate() {
		FounderPostAI_AISuite_SEO_Health_Audit::invalidate();
	}

	public function handle_refresh() {
		if ( ! current_user_can( self::CAP ) ) {
			wp_die( esc_html__( 'You do not have permission to do that.', 'founderpostai-ai-suite-seo' ) );
		}

		check_admin_referer( 'founderpostai_aisuite_seo_health_refresh' );
		self::audit( true );

		wp_safe_redirect(
			add_query_arg(
				array(
					'page'        => self::SLUG,
					'founderpostai_aisuite_seo_msg' => 'refreshed',
				),
				admin_url( 'admin.php' )
			)
		);
		exit;
	}

	public function render() {
		if ( ! current_user_can( self::CAP ) ) {
			wp_die( esc_html__( 'You do not have permission to view this.', 'founderpostai-ai-suite-seo' ) );
		}

		$snapshot = self::audit();
		$index    = FounderPostAI_AISuite_SEO_Site_Index::progress();
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- display-only confirmation; the acting request was nonce checked.
		$message = isset( $_GET['founderpostai_aisuite_seo_msg'] ) ? sanitize_key( wp_unslash( $_GET['founderpostai_aisuite_seo_msg'] ) ) : '';
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only filter.
		$filter = isset( $_GET['health'] ) ? sanitize_key( wp_unslash( $_GET['health'] ) ) : 'all';
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only pagination.
		$page = isset( $_GET['paged'] ) ? max( 1, (int) $_GET['paged'] ) : 1;

		if ( ! in_array( $filter, array( 'all', 'action', 'missing', 'stale', 'errors', 'orphaned', 'optimized' ), true ) ) {
			$filter = 'all';
		}

		$total       = $snapshot['summary'][ 'all' === $filter ? 'total' : $filter ];
		$total_pages = max( 1, (int) ceil( $total / self::PER_PAGE ) );
		$page        = min( $page, $total_pages );
		$rows        = FounderPostAI_AISuite_SEO_Health_Audit::page( $snapshot, $filter, $page );
		$summary     = $snapshot['summary'];
		/* translators: 1: number of fully optimized posts, 2: total published posts */
		$coverage_detail = sprintf( __( '%1$d of %2$d current', 'founderpostai-ai-suite-seo' ), $summary['optimized'], $summary['total'] );
		?>
		<div class="wrap aisuite-wrap">
			<h1><?php esc_html_e( 'SEO health', 'founderpostai-ai-suite-seo' ); ?></h1>
			<a class="page-title-action" href="<?php echo esc_url( admin_url( 'admin.php?page=' . FounderPostAI_AISuite_SEO_Review_Screen::SLUG ) ); ?>"><?php esc_html_e( 'Review suggestions', 'founderpostai-ai-suite-seo' ); ?></a>

			<?php if ( ! empty( $snapshot['building'] ) || 'refreshed' === $message ) : ?>
				<div class="notice notice-info"><p><?php esc_html_e( 'The audit is rebuilding in background batches. The last complete results remain visible. Reload later; on low-traffic sites, configure a real WP-Cron runner.', 'founderpostai-ai-suite-seo' ); ?></p></div>
			<?php elseif ( 'indexing' === $message ) : ?>
				<div class="notice notice-info is-dismissible"><p><?php esc_html_e( 'The local content index is rebuilding in bounded background batches.', 'founderpostai-ai-suite-seo' ); ?></p></div>
			<?php endif; ?>

			<p class="description aisuite-health__intro">
				<?php
				printf(
					/* translators: %s: metadata provider name */
					esc_html__( 'Metadata source: %s. The audit covers every published public post type and counts links between those pages.', 'founderpostai-ai-suite-seo' ),
					esc_html( FounderPostAI_AISuite_SEO_Meta_Adapter::label( $snapshot['provider'] ) )
				);
				?>
			</p>

			<div class="aisuite-health__cards">
				<?php $this->metric( __( 'Optimization coverage', 'founderpostai-ai-suite-seo' ), $summary['coverage'] . '%', $coverage_detail, 'good' ); ?>
				<?php $this->metric( __( 'Missing metadata', 'founderpostai-ai-suite-seo' ), $summary['missing'], __( 'Title or description', 'founderpostai-ai-suite-seo' ), $summary['missing'] ? 'warn' : 'good' ); ?>
				<?php $this->metric( __( 'Needs re-analysis', 'founderpostai-ai-suite-seo' ), $summary['stale'], __( 'New or changed content', 'founderpostai-ai-suite-seo' ), $summary['stale'] ? 'warn' : 'good' ); ?>
				<?php $this->metric( __( 'Failed jobs', 'founderpostai-ai-suite-seo' ), $summary['errors'], __( 'Posts with an error', 'founderpostai-ai-suite-seo' ), $summary['errors'] ? 'bad' : 'good' ); ?>
				<?php $this->metric( __( 'Orphaned content', 'founderpostai-ai-suite-seo' ), $summary['orphaned'], __( 'No incoming content links', 'founderpostai-ai-suite-seo' ), $summary['orphaned'] ? 'warn' : 'good' ); ?>
				<?php $this->metric( __( 'Pending suggestions', 'founderpostai-ai-suite-seo' ), $summary['pending'], __( 'Waiting for review', 'founderpostai-ai-suite-seo' ), $summary['pending'] ? 'neutral' : 'good' ); ?>
			</div>

			<div class="aisuite-health__toolbar">
				<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
					<?php wp_nonce_field( 'founderpostai_aisuite_seo_health_refresh' ); ?>
					<input type="hidden" name="action" value="founderpostai_aisuite_seo_health_refresh" />
					<?php submit_button( __( 'Refresh site-wide audit', 'founderpostai-ai-suite-seo' ), 'secondary', 'submit', false ); ?>
				</form>
				<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
					<?php wp_nonce_field( 'founderpostai_aisuite_seo_index_rebuild' ); ?>
					<input type="hidden" name="action" value="founderpostai_aisuite_seo_index_rebuild" />
					<?php submit_button( __( 'Rebuild local content index', 'founderpostai-ai-suite-seo' ), 'secondary', 'submit', false ); ?>
				</form>
				<span class="description">
					<?php
					printf(
						/* translators: %s: audit date and time */
						esc_html__( 'Last scanned %s', 'founderpostai-ai-suite-seo' ),
						$snapshot['generated_at'] ? esc_html( date_i18n( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ), $snapshot['generated_at'] ) ) : esc_html__( 'not yet complete', 'founderpostai-ai-suite-seo' )
					);
					?>
				</span>
				<span class="description">
					<?php
					printf(
						/* translators: 1: indexed document count, 2: index status */
						esc_html__( 'Local index: %1$s documents · %2$s', 'founderpostai-ai-suite-seo' ),
						esc_html( number_format_i18n( $index['indexed'] ) ),
						$index['complete'] ? esc_html__( 'current', 'founderpostai-ai-suite-seo' ) : esc_html__( 'building', 'founderpostai-ai-suite-seo' )
					);
					?>
				</span>
			</div>

			<?php $this->filters( $filter, $snapshot ); ?>

			<table class="widefat striped aisuite-health__table">
				<thead>
					<tr>
						<th><?php esc_html_e( 'Content', 'founderpostai-ai-suite-seo' ); ?></th>
						<th><?php esc_html_e( 'Issues', 'founderpostai-ai-suite-seo' ); ?></th>
						<th><?php esc_html_e( 'Metadata', 'founderpostai-ai-suite-seo' ); ?></th>
						<th><?php esc_html_e( 'Internal links', 'founderpostai-ai-suite-seo' ); ?></th>
						<th><?php esc_html_e( 'Analysis', 'founderpostai-ai-suite-seo' ); ?></th>
					</tr>
				</thead>
				<tbody>
					<?php if ( empty( $rows ) ) : ?>
						<tr><td colspan="5"><?php esc_html_e( 'No content matches this view.', 'founderpostai-ai-suite-seo' ); ?></td></tr>
					<?php else : ?>
						<?php foreach ( $rows as $row ) : ?>
							<?php $this->row( $row ); ?>
						<?php endforeach; ?>
					<?php endif; ?>
				</tbody>
			</table>

			<?php if ( $total_pages > 1 ) : ?>
				<div class="tablenav"><div class="tablenav-pages">
					<?php
					echo wp_kses_post(
						paginate_links(
							array(
								'base'      => add_query_arg( array( 'page' => self::SLUG, 'health' => $filter, 'paged' => '%#%' ), admin_url( 'admin.php' ) ),
								'current'   => $page,
								'total'     => $total_pages,
								'prev_text' => __( '&laquo; Previous', 'founderpostai-ai-suite-seo' ),
								'next_text' => __( 'Next &raquo;', 'founderpostai-ai-suite-seo' ),
							)
						)
					);
					?>
				</div></div>
			<?php endif; ?>
		</div>
		<?php
	}

	protected function metric( $label, $value, $detail, $tone ) {
		$display = is_numeric( $value ) ? number_format_i18n( $value ) : (string) $value;
		printf(
			'<div class="aisuite-health__metric aisuite-health__metric--%1$s"><span>%2$s</span><strong>%3$s</strong><small>%4$s</small></div>',
			esc_attr( $tone ),
			esc_html( $label ),
			esc_html( $display ),
			esc_html( $detail )
		);
	}

	protected function filters( $current, array $snapshot ) {
		$summary = $snapshot['summary'];
		$counts  = array(
			'all'       => $summary['total'],
			'action'    => $summary['action'],
			'missing'   => $summary['missing'],
			'stale'     => $summary['stale'],
			'errors'    => $summary['errors'],
			'orphaned'  => $summary['orphaned'],
			'optimized' => $summary['optimized'],
		);
		$labels = array(
			'all'       => __( 'All', 'founderpostai-ai-suite-seo' ),
			'action'    => __( 'Needs attention', 'founderpostai-ai-suite-seo' ),
			'missing'   => __( 'Missing metadata', 'founderpostai-ai-suite-seo' ),
			'stale'     => __( 'Needs analysis', 'founderpostai-ai-suite-seo' ),
			'errors'    => __( 'Failed', 'founderpostai-ai-suite-seo' ),
			'orphaned'  => __( 'Orphaned', 'founderpostai-ai-suite-seo' ),
			'optimized' => __( 'Current', 'founderpostai-ai-suite-seo' ),
		);

		echo '<ul class="subsubsub aisuite-health__filters">';
		foreach ( $labels as $key => $label ) {
			$url = add_query_arg( array( 'page' => self::SLUG, 'health' => $key ), admin_url( 'admin.php' ) );
			printf(
				'<li><a href="%1$s" class="%2$s">%3$s <span class="count">(%4$s)</span></a></li>',
				esc_url( $url ),
				$current === $key ? 'current' : '',
				esc_html( $label ),
				esc_html( number_format_i18n( $counts[ $key ] ) )
			);
		}
		echo '</ul>';
	}

	protected function row( array $row ) {
		$post         = get_post( $row['id'] );
		$analyze_url  = wp_nonce_url(
			add_query_arg( array( 'action' => 'founderpostai_aisuite_seo_analyze', 'post_id' => $row['id'] ), admin_url( 'admin-post.php' ) ),
			'founderpostai_aisuite_seo_analyze_' . $row['id']
		);
		/* translators: %d: title character count */
		$title_detail = sprintf( __( 'Title: %d chars', 'founderpostai-ai-suite-seo' ), $row['title_length'] );
		/* translators: %d: meta description character count */
		$description_detail = sprintf( __( 'Description: %d chars', 'founderpostai-ai-suite-seo' ), $row['description_length'] );
		/* translators: 1: incoming internal-link count, 2: outgoing internal-link count */
		$link_detail = sprintf( __( '%1$d in / %2$d out', 'founderpostai-ai-suite-seo' ), $row['incoming'], $row['outgoing'] );
		/* translators: %d: pending suggestion count */
		$pending_detail = sprintf( _n( '%d pending', '%d pending', $row['pending'], 'founderpostai-ai-suite-seo' ), $row['pending'] );
		?>
		<tr>
			<td>
				<strong><a href="<?php echo esc_url( get_edit_post_link( $row['id'] ) ); ?>"><?php echo esc_html( get_the_title( $row['id'] ) ); ?></a></strong>
				<div class="row-actions"><span><?php echo esc_html( $post ? $post->post_type : '' ); ?> | </span><a href="<?php echo esc_url( get_permalink( $row['id'] ) ); ?>"><?php esc_html_e( 'View', 'founderpostai-ai-suite-seo' ); ?></a></div>
			</td>
			<td><?php $this->badges( $row ); ?></td>
			<td>
					<?php echo esc_html( $title_detail ); ?><br />
					<?php echo esc_html( $description_detail ); ?>
			</td>
			<td>
					<?php echo esc_html( $link_detail ); ?>
			</td>
			<td>
				<?php if ( $row['error'] ) : ?>
					<span class="aisuite-health__error" title="<?php echo esc_attr( $row['error'] ); ?>"><?php esc_html_e( 'Failed', 'founderpostai-ai-suite-seo' ); ?></span>
				<?php elseif ( $row['queued'] ) : ?>
					<?php esc_html_e( 'Queued', 'founderpostai-ai-suite-seo' ); ?>
				<?php elseif ( $row['stale'] ) : ?>
					<a href="<?php echo esc_url( $analyze_url ); ?>"><?php echo $row['analyzed'] ? esc_html__( 'Re-analyze', 'founderpostai-ai-suite-seo' ) : esc_html__( 'Analyze', 'founderpostai-ai-suite-seo' ); ?></a>
				<?php else : ?>
					<?php esc_html_e( 'Current', 'founderpostai-ai-suite-seo' ); ?>
				<?php endif; ?>
					<?php if ( $row['pending'] ) : ?><br /><a href="<?php echo esc_url( admin_url( 'admin.php?page=' . FounderPostAI_AISuite_SEO_Review_Screen::SLUG ) ); ?>"><?php echo esc_html( $pending_detail ); ?></a><?php endif; ?>
			</td>
		</tr>
		<?php
	}

	protected function badges( array $row ) {
		$badges = array();
		if ( $row['missing_title'] ) {
			$badges[] = __( 'No title', 'founderpostai-ai-suite-seo' );
		}
		if ( $row['missing_description'] ) {
			$badges[] = __( 'No description', 'founderpostai-ai-suite-seo' );
		}
		if ( $row['orphaned'] ) {
			$badges[] = __( 'Orphaned', 'founderpostai-ai-suite-seo' );
		}
		if ( $row['stale'] ) {
			$badges[] = $row['analyzed'] ? __( 'Changed', 'founderpostai-ai-suite-seo' ) : __( 'Not analyzed', 'founderpostai-ai-suite-seo' );
		}
		if ( $row['error'] ) {
			$badges[] = __( 'Failed', 'founderpostai-ai-suite-seo' );
		}

		if ( empty( $badges ) ) {
			echo '<span class="aisuite-health__badge aisuite-health__badge--good">' . esc_html__( 'Healthy', 'founderpostai-ai-suite-seo' ) . '</span>';
			return;
		}

		foreach ( $badges as $badge ) {
			echo '<span class="aisuite-health__badge">' . esc_html( $badge ) . '</span> ';
		}
	}

	public function filter_all( $row = null ) {
		return true;
	}

	public function filter_action( $row ) {
		return ! $row['optimized'] || $row['orphaned'];
	}

	public function filter_missing( $row ) {
		return $row['missing_title'] || $row['missing_description'];
	}

	public function filter_stale( $row ) {
		return $row['stale'];
	}

	public function filter_errors( $row ) {
		return (bool) $row['error'];
	}

	public function filter_orphaned( $row ) {
		return $row['orphaned'];
	}

	public function filter_optimized( $row ) {
		return $row['optimized'];
	}

	/** Reads the last complete snapshot; never scans content in an admin request. */
	public static function audit( $force = false ) {
		return FounderPostAI_AISuite_SEO_Health_Audit::snapshot( $force );
	}

	public static function build_row( $post, $metadata, $pending ) {
		$id = (int) $post->ID;
		$title = trim( isset( $metadata['title'] ) ? $metadata['title'] : '' );
		$description = trim( isset( $metadata['description'] ) ? $metadata['description'] : '' );
		$error = (string) get_post_meta( $id, FounderPostAI_AISuite_SEO_Optimizer::META_ERROR, true );
		$stale = ! FounderPostAI_AISuite_SEO_Optimizer::is_current( $post, $metadata );
		return array(
			'id' => $id, 'title_length' => self::length( $title ), 'description_length' => self::length( $description ),
			'missing_title' => '' === $title, 'missing_description' => '' === $description,
			'analyzed' => (int) get_post_meta( $id, FounderPostAI_AISuite_SEO_Optimizer::META_ANALYZED, true ),
			'stale' => $stale, 'queued' => FounderPostAI_AISuite_SEO_Optimizer::is_queued( $id ),
			'error' => $error, 'incoming' => 0, 'outgoing' => 0, 'orphaned' => true,
			'pending' => (int) $pending, 'optimized' => '' !== $title && '' !== $description && ! $stale && ! $error,
		);
	}
	public static function row_optimized( $row ) {
		return $row['optimized'];
	}

	public static function row_missing( $row ) {
		return $row['missing_title'] || $row['missing_description'];
	}

	public static function row_stale( $row ) {
		return $row['stale'];
	}

	public static function row_error( $row ) {
		return (bool) $row['error'];
	}

	public static function row_orphaned( $row ) {
		return $row['orphaned'];
	}

	public static function normalize_url( $url ) {
		if ( ! is_string( $url ) || '' === trim( $url ) || '#' === substr( trim( $url ), 0, 1 ) ) {
			return '';
		}

		$parts     = wp_parse_url( trim( $url ) );
		$home_host = wp_parse_url( home_url( '/' ), PHP_URL_HOST );

		if (
			false === $parts ||
			( isset( $parts['scheme'] ) && ! in_array( strtolower( $parts['scheme'] ), array( 'http', 'https' ), true ) ) ||
			( isset( $parts['host'] ) && strtolower( $parts['host'] ) !== strtolower( (string) $home_host ) )
		) {
			return '';
		}

		$path = isset( $parts['path'] ) ? rawurldecode( $parts['path'] ) : '/';
		$path = '/' === $path ? '/' : untrailingslashit( $path );
		// Preserve plain-permalink IDs: /?p=1 and /?p=2 are different pages.
		return $path . ( empty( $parts['query'] ) ? '' : '?' . $parts['query'] );
	}

	protected static function length( $value ) {
		return function_exists( 'mb_strlen' ) ? mb_strlen( (string) $value, 'UTF-8' ) : strlen( (string) $value );
	}
}
