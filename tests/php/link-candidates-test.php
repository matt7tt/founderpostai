<?php
/** Behavioral test for whole-site relevance ranking. */

define( 'ABSPATH', __DIR__ );

function wp_strip_all_tags( $value ) {
	return strip_tags( $value );
}

require dirname( __DIR__, 2 ) . '/wp-plugins/aisuite-seo/includes/class-link-candidates.php';

$source = (object) array(
	'ID'                => 1,
	'post_title'        => 'WordPress internal linking strategy',
	'post_excerpt'      => 'Improve SEO with relevant internal links.',
	'post_content'      => 'A practical WordPress guide to internal linking, anchor text, and search visibility.',
	'post_modified_gmt' => '2026-01-01 00:00:00',
);

$posts = array(
	(object) array(
		'ID'                => 2,
		'post_title'        => 'Office lunch ideas',
		'post_excerpt'      => 'Quick recipes for teams.',
		'post_content'      => 'Sandwiches, salads, and soups.',
		'post_modified_gmt' => '2026-07-01 00:00:00',
	),
	(object) array(
		'ID'                => 3,
		'post_title'        => 'Internal links for WordPress SEO',
		'post_excerpt'      => 'Choose useful anchor text and related pages.',
		'post_content'      => 'Build a stronger internal linking structure.',
		'post_modified_gmt' => '2025-01-01 00:00:00',
	),
);

$ranked = FounderPostAI_AISuite_SEO_Link_Candidates::rank( $source, $posts, 2 );

if ( 2 !== count( $ranked ) || 3 !== (int) $ranked[0]->ID ) {
	fwrite( STDERR, "FAIL: topical relevance did not outrank recency\n" );
	exit( 1 );
}

fwrite( STDOUT, "PASS: whole-site candidates are ranked by topical relevance\n" );
