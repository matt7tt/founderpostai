<?php
/**
 * Lightweight behavioral harness for the DOM-based link inserter.
 *
 * Run with:
 * docker run --rm -v "$PWD:/workspace:ro" -w /workspace php:7.4-cli php tests/php/link-inserter-test.php
 */

define( 'ABSPATH', __DIR__ );

class WP_Error {
	public $code;
	public $message;

	public function __construct( $code, $message ) {
		$this->code    = $code;
		$this->message = $message;
	}
}

function __( $message ) {
	return $message;
}

function has_blocks() {
	return false;
}

function is_wp_error( $value ) {
	return $value instanceof WP_Error;
}

require dirname( __DIR__, 2 ) . '/wp-plugins/aisuite-seo/includes/class-link-inserter.php';

$failures = 0;

function aisuite_assert( $condition, $label ) {
	global $failures;

	if ( ! $condition ) {
		++$failures;
		fwrite( STDERR, "FAIL: {$label}\n" );
	} else {
		fwrite( STDOUT, "PASS: {$label}\n" );
	}
}

function aisuite_insert( $html, $anchor = 'target phrase' ) {
	$inserter = new FounderPostAI_AISuite_SEO_Link_Inserter();
	return $inserter->insert(
		$html,
		array(
			array(
				'target_id' => 42,
				'anchor'    => $anchor,
				'url'       => 'https://example.com/target/?a=1&b=2',
			),
		)
	);
}

$plain = aisuite_insert( '<p>A target phrase belongs here.</p>' );
aisuite_assert( ! is_wp_error( $plain ), 'plain text is linkable' );
aisuite_assert( 1 === substr_count( $plain['content'], '<a href=' ), 'anchor is inserted once' );
aisuite_assert( false !== strpos( $plain['content'], 'a=1&amp;b=2' ), 'URL attributes remain escaped' );

$twice = aisuite_insert( '<p>target phrase, then target phrase again.</p>' );
aisuite_assert( 1 === substr_count( $twice['content'], '<a href=' ), 'one suggestion is inserted at most once' );

$inside_word = aisuite_insert( '<p>pretendtarget phrasepost</p>' );
aisuite_assert( is_wp_error( $inside_word ), 'word boundaries prevent partial-word links' );

$protected = aisuite_insert( '<p><a href="/old">target phrase</a> and <code>target phrase</code></p>' );
aisuite_assert( is_wp_error( $protected ), 'existing links and code are never rewritten' );

$heading = aisuite_insert( '<h2>target phrase</h2><p>Nothing else.</p>' );
aisuite_assert( is_wp_error( $heading ), 'headings are protected' );

$shortcode = aisuite_insert( '<p>[gallery title="target phrase"] Nothing else.</p>' );
aisuite_assert( is_wp_error( $shortcode ), 'shortcode attributes are protected' );

$unicode = aisuite_insert( '<p>CAFÉ culture.</p>', 'café' );
aisuite_assert( ! is_wp_error( $unicode ), 'case-insensitive Unicode anchors do not corrupt text' );
aisuite_assert( false !== strpos( $unicode['content'], '>CAFÉ</a>' ), 'the original matched casing is preserved' );

$missing = aisuite_insert( '<p>No matching words.</p>' );
aisuite_assert( is_wp_error( $missing ), 'a missing anchor returns a no-change error' );

exit( $failures ? 1 : 0 );
