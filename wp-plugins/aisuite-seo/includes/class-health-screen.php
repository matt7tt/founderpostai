<?php
/** Site-wide SEO health audit and dashboard. */

defined( 'ABSPATH' ) || exit;

class AISuite_SEO_Health_Screen {

	const CAP       = 'edit_posts';
	const SLUG      = 'founderpostai-ai-suite-seo-health';
	const CACHE_KEY = 'aisuite_seo_health_snapshot';
	const PER_PAGE  = 50;

	public function __construct() {
		add_action( 'admin_menu', array( $this, 'menu' ), 21 );
		add_action( 'admin_enqueue_scripts', array( $this, 'assets' ) );
		add_action( 'admin_post_aisuite_seo_health_refresh', array( $this, 'handle_refresh' ) );
		add_action( 'save_post', array( __CLASS__, 'invalidate' ), 20 );
		add_action( 'deleted_post', array( __CLASS__, 'invalidate' ) );
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
		wp_enqueue_style( 'aisuite-seo-review', AISUITE_SEO_URL . 'assets/review.css', array( 'aisuite-admin' ), AISUITE_SEO_VERSION );
	}

	public static function invalidate() {
		delete_transient( self::CACHE_KEY );
	}

	public function handle_refresh() {
		if ( ! current_user_can( self::CAP ) ) {
			wp_die( esc_html__( 'You do not have permission to do that.', 'founderpostai-ai-suite-seo' ) );
		}

		check_admin_referer( 'aisuite_seo_health_refresh' );
		self::audit( true );

		wp_safe_redirect(
			add_query_arg(
				array(
					'page'        => self::SLUG,
					'aisuite_msg' => 'refreshed',
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
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only filter.
		$filter = isset( $_GET['health'] ) ? sanitize_key( wp_unslash( $_GET['health'] ) ) : 'all';
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only pagination.
		$page = isset( $_GET['paged'] ) ? max( 1, (int) $_GET['paged'] ) : 1;

		if ( ! in_array( $filter, array( 'all', 'action', 'missing', 'stale', 'errors', 'orphaned', 'optimized' ), true ) ) {
			$filter = 'all';
		}

		$rows       = array_values( array_filter( $snapshot['rows'], array( $this, 'filter_' . $filter ) ) );
		$total      = count( $rows );
		$total_pages = max( 1, (int) ceil( $total / self::PER_PAGE ) );
		$page       = min( $page, $total_pages );
		$rows       = array_slice( $rows, ( $page - 1 ) * self::PER_PAGE, self::PER_PAGE );
		$summary    = $snapshot['summary'];
		/* translators: 1: number of fully optimized posts, 2: total published posts */
		$coverage_detail = sprintf( __( '%1$d of %2$d current', 'founderpostai-ai-suite-seo' ), $summary['optimized'], $summary['total'] );
		?>
		<div class="wrap aisuite-wrap">
			<h1><?php esc_html_e( 'SEO health', 'founderpostai-ai-suite-seo' ); ?></h1>
			<a class="page-title-action" href="<?php echo esc_url( admin_url( 'admin.php?page=' . AISuite_SEO_Review_Screen::SLUG ) ); ?>"><?php esc_html_e( 'Review suggestions', 'founderpostai-ai-suite-seo' ); ?></a>

			<?php // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- display-only confirmation. ?>
			<?php if ( isset( $_GET['aisuite_msg'] ) && 'refreshed' === sanitize_key( wp_unslash( $_GET['aisuite_msg'] ) ) ) : ?>
				<div class="notice notice-success is-dismissible"><p><?php esc_html_e( 'The site-wide SEO audit is up to date.', 'founderpostai-ai-suite-seo' ); ?></p></div>
			<?php endif; ?>

			<p class="description aisuite-health__intro">
				<?php
				printf(
					/* translators: %s: metadata provider name */
					esc_html__( 'Metadata source: %s. The audit covers every published public post type and counts links between those pages.', 'founderpostai-ai-suite-seo' ),
					esc_html( AISuite_SEO_Meta_Adapter::label( $snapshot['provider'] ) )
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
					<?php wp_nonce_field( 'aisuite_seo_health_refresh' ); ?>
					<input type="hidden" name="action" value="aisuite_seo_health_refresh" />
					<?php submit_button( __( 'Refresh site-wide audit', 'founderpostai-ai-suite-seo' ), 'secondary', 'submit', false ); ?>
				</form>
				<span class="description">
					<?php
					printf(
						/* translators: %s: audit date and time */
						esc_html__( 'Last scanned %s', 'founderpostai-ai-suite-seo' ),
						esc_html( date_i18n( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ), $snapshot['generated_at'] ) )
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
			'action'    => count( array_filter( $snapshot['rows'], array( $this, 'filter_action' ) ) ),
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
			add_query_arg( array( 'action' => 'aisuite_seo_analyze', 'post_id' => $row['id'] ), admin_url( 'admin-post.php' ) ),
			'aisuite_seo_analyze_' . $row['id']
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
					<?php if ( $row['pending'] ) : ?><br /><a href="<?php echo esc_url( admin_url( 'admin.php?page=' . AISuite_SEO_Review_Screen::SLUG ) ); ?>"><?php echo esc_html( $pending_detail ); ?></a><?php endif; ?>
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

	/** Build a complete audit snapshot, cached until content changes. */
	public static function audit( $force = false ) {
		if ( ! $force ) {
			$cached = get_transient( self::CACHE_KEY );
			if ( is_array( $cached ) && isset( $cached['rows'], $cached['summary'] ) ) {
				return $cached;
			}
		}

		$post_types = get_post_types( array( 'public' => true ), 'names' );
		$post_types = array_values( array_diff( (array) $post_types, array( 'attachment' ) ) );
		if ( empty( $post_types ) ) {
			$post_types = array( 'post', 'page' );
		}
		$posts      = get_posts(
			array(
				'post_type'        => $post_types,
				'post_status'      => 'publish',
				'posts_per_page'   => -1,
				'orderby'          => 'modified',
				'order'            => 'DESC',
					'suppress_filters' => false,
			)
		);
		$ids        = wp_list_pluck( $posts, 'ID' );
		$metadata   = AISuite_SEO_Meta_Adapter::read_many( $ids );
		$pending    = AISuite_SEO_Store::pending_counts_by_post();
		$url_map    = array();
		$incoming   = array_fill_keys( $ids, 0 );
		$outgoing   = array_fill_keys( $ids, 0 );

		foreach ( $posts as $post ) {
			$url_map[ self::normalize_url( get_permalink( $post ) ) ] = (int) $post->ID;
		}

		foreach ( $posts as $post ) {
			preg_match_all( '/<a\s[^>]*href\s*=\s*(["\'])(.*?)\1/isu', (string) $post->post_content, $matches );
			$targets = array();

			foreach ( isset( $matches[2] ) ? $matches[2] : array() as $href ) {
				$key = self::normalize_url( html_entity_decode( $href, ENT_QUOTES, 'UTF-8' ) );
				if ( isset( $url_map[ $key ] ) && (int) $url_map[ $key ] !== (int) $post->ID ) {
					$targets[ $url_map[ $key ] ] = true;
				}
			}

			$outgoing[ $post->ID ] = count( $targets );
			foreach ( array_keys( $targets ) as $target_id ) {
				++$incoming[ $target_id ];
			}
		}

		$rows = array();
		foreach ( $posts as $post ) {
			$post_id      = (int) $post->ID;
			$title        = isset( $metadata[ $post_id ]['title'] ) ? trim( $metadata[ $post_id ]['title'] ) : '';
			$description  = isset( $metadata[ $post_id ]['description'] ) ? trim( $metadata[ $post_id ]['description'] ) : '';
			$analyzed     = (int) get_post_meta( $post_id, AISuite_SEO_Optimizer::META_ANALYZED, true );
			$error        = (string) get_post_meta( $post_id, AISuite_SEO_Optimizer::META_ERROR, true );
			$current_meta = isset( $metadata[ $post_id ] ) ? $metadata[ $post_id ] : null;
			$stale        = ! AISuite_SEO_Optimizer::is_current( $post, $current_meta );
			$missing_t    = '' === $title;
			$missing_d    = '' === $description;
			$orphaned     = empty( $incoming[ $post_id ] );

			$rows[] = array(
				'id'                  => $post_id,
				'title_length'        => self::length( $title ),
				'description_length'  => self::length( $description ),
				'missing_title'       => $missing_t,
				'missing_description' => $missing_d,
				'analyzed'            => $analyzed,
				'stale'               => $stale,
				'queued'              => AISuite_SEO_Optimizer::is_queued( $post_id ),
				'error'               => $error,
				'incoming'            => isset( $incoming[ $post_id ] ) ? $incoming[ $post_id ] : 0,
				'outgoing'            => isset( $outgoing[ $post_id ] ) ? $outgoing[ $post_id ] : 0,
				'orphaned'            => $orphaned,
				'pending'             => isset( $pending[ $post_id ] ) ? $pending[ $post_id ] : 0,
				'optimized'           => ! $missing_t && ! $missing_d && ! $stale && ! $error,
			);
		}

		$total     = count( $rows );
		$optimized = count( array_filter( $rows, array( __CLASS__, 'row_optimized' ) ) );
		$snapshot  = array(
			'generated_at' => time(),
			'provider'     => AISuite_SEO_Meta_Adapter::provider(),
			'rows'         => $rows,
			'summary'      => array(
				'total'     => $total,
				'optimized' => $optimized,
				'coverage'  => $total ? (int) round( $optimized / $total * 100 ) : 100,
				'missing'   => count( array_filter( $rows, array( __CLASS__, 'row_missing' ) ) ),
				'stale'     => count( array_filter( $rows, array( __CLASS__, 'row_stale' ) ) ),
				'errors'    => count( array_filter( $rows, array( __CLASS__, 'row_error' ) ) ),
				'orphaned'  => count( array_filter( $rows, array( __CLASS__, 'row_orphaned' ) ) ),
				'pending'   => array_sum( $pending ),
			),
		);

		set_transient( self::CACHE_KEY, $snapshot, 6 * HOUR_IN_SECONDS );

		return $snapshot;
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

	protected static function normalize_url( $url ) {
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
		return '/' === $path ? '/' : untrailingslashit( $path );
	}

	protected static function length( $value ) {
		return function_exists( 'mb_strlen' ) ? mb_strlen( (string) $value, 'UTF-8' ) : strlen( (string) $value );
	}
}
