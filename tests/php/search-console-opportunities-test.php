<?php
/** Verifies explainable Search Console opportunity ranking. */

define( 'ABSPATH', __DIR__ );

function add_action() {}
function __( $message ) {
	return $message;
}

require dirname( __DIR__, 2 ) . '/wp-plugins/aisuite-seo/includes/class-search-console-screen.php';

$screen = new AISuite_SEO_Search_Console_Screen();
$rows   = array(
	array(
		'query'       => 'high upside',
		'impressions' => 1000,
		'ctr'         => 0.01,
		'position'    => 8,
	),
	array(
		'query'       => 'low volume',
		'impressions' => 20,
		'ctr'         => 0.02,
		'position'    => 7,
	),
	array(
		'query'       => 'already first',
		'impressions' => 5000,
		'ctr'         => 0.5,
		'position'    => 1,
	),
);

$ranked = $screen->opportunities( $rows );

if ( 2 !== count( $ranked ) || 'high upside' !== $ranked[0]['query'] || 'Improve title and description' !== $ranked[0]['opportunity'] ) {
	fwrite( STDERR, "FAIL: Search Console opportunities were not filtered and ranked\n" );
	exit( 1 );
}

fwrite( STDOUT, "PASS: Search Console opportunities prioritize explainable high-upside rows\n" );
