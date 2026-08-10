<?php
/**
 * Internal link insertion.
 *
 * Replaces the regex approach, which mangled anchors that happened to fall
 * inside shortcodes, block comments, or existing markup. This walks the block
 * tree, and inside each eligible block walks text nodes with DOM, so an anchor
 * is only ever linked when it appears as plain readable text.
 *
 * Rules enforced here:
 *   - only core/paragraph and core/list-item content is touched
 *   - never inside an existing <a>, heading, <code>, <pre>, or shortcode
 *   - each link is inserted at most once, first eligible occurrence
 */

defined( 'ABSPATH' ) || exit;

class FounderPostAI_AISuite_SEO_Link_Inserter {

	/** Blocks whose text we're willing to modify. */
	const ELIGIBLE_BLOCKS = array( 'core/paragraph', 'core/list-item' );

	/** Never descend into these elements. */
	const SKIP_ELEMENTS = array( 'a', 'code', 'pre', 'kbd', 'script', 'style', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6' );

	/** @var array Links still waiting to be placed, keyed by target id. */
	protected $pending = array();

	/** @var array Links successfully placed. */
	protected $placed = array();

	/**
	 * @param string $content Post content.
	 * @param array  $links   Each: target_id, anchor, url.
	 * @return array|WP_Error { content, placed }
	 */
	public function insert( $content, array $links ) {
		if ( ! class_exists( 'DOMDocument' ) ) {
			return new WP_Error(
				'founderpostai_aisuite_seo_no_dom',
				__( 'This server is missing the PHP DOM extension, so links cannot be inserted safely.', 'founderpostai-ai-suite-seo' )
			);
		}

		$this->pending = array();
		$this->placed  = array();

		foreach ( $links as $link ) {
			if ( empty( $link['anchor'] ) || empty( $link['url'] ) ) {
				continue;
			}

			$this->pending[] = array(
				'target_id' => isset( $link['target_id'] ) ? (int) $link['target_id'] : 0,
				'anchor'    => (string) $link['anchor'],
				'url'       => (string) $link['url'],
			);
		}

		if ( empty( $this->pending ) ) {
			return new WP_Error( 'founderpostai_aisuite_seo_no_links', __( 'No usable links in this suggestion.', 'founderpostai-ai-suite-seo' ) );
		}

		$content = has_blocks( $content )
			? serialize_blocks( $this->walk_blocks( parse_blocks( $content ) ) )
			: $this->link_html( $content );

		if ( empty( $this->placed ) ) {
			return new WP_Error(
				'founderpostai_aisuite_seo_anchors_missing',
				__( 'None of the suggested anchor phrases appear as plain text in this post, so nothing was changed.', 'founderpostai-ai-suite-seo' )
			);
		}

		return array(
			'content' => $content,
			'placed'  => $this->placed,
		);
	}

	/**
	 * Rewrite eligible blocks, returning the block tree.
	 *
	 * Returns an ARRAY, never serialized markup — the recursive call assigns
	 * straight back into innerBlocks, and handing it a string there flattens
	 * every nested container (lists, groups, columns, quotes) into garbage.
	 *
	 * innerContent is what serialize_blocks() reads — null entries are
	 * placeholders for inner blocks and must keep their positions.
	 */
	protected function walk_blocks( array $blocks ) {
		foreach ( $blocks as $i => $block ) {
			if ( ! empty( $block['innerBlocks'] ) ) {
				$blocks[ $i ]['innerBlocks'] = $this->walk_blocks( $block['innerBlocks'] );
			}

			$name = isset( $block['blockName'] ) ? $block['blockName'] : '';

			if ( ! in_array( $name, self::ELIGIBLE_BLOCKS, true ) || empty( $this->pending ) ) {
				continue;
			}

			foreach ( (array) $block['innerContent'] as $j => $chunk ) {
				if ( ! is_string( $chunk ) || '' === trim( $chunk ) ) {
					continue;
				}

				$blocks[ $i ]['innerContent'][ $j ] = $this->link_html( $chunk );
			}

			if ( isset( $block['innerHTML'] ) && is_string( $block['innerHTML'] ) ) {
				// Keep innerHTML consistent for anything reading the parsed tree.
				$blocks[ $i ]['innerHTML'] = implode( '', array_filter( $blocks[ $i ]['innerContent'], 'is_string' ) );
			}
		}

		return $blocks;
	}

	/**
	 * Insert links into an HTML fragment by walking its text nodes.
	 */
	protected function link_html( $html ) {
		if ( empty( $this->pending ) || '' === trim( $html ) ) {
			return $html;
		}

		// Shortcodes are opaque: their output isn't in this string, and their
		// attributes must not be rewritten. Park them behind placeholders.
		$shielded = $this->shield_shortcodes( $html );

		$doc                     = new DOMDocument();
		$doc->preserveWhiteSpace = true;
		$previous                = libxml_use_internal_errors( true );

		$loaded = $doc->loadHTML(
			'<?xml encoding="utf-8" ?><div id="aisuite-root">' . $shielded['html'] . '</div>',
			LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD
		);

		libxml_clear_errors();
		libxml_use_internal_errors( $previous );

		if ( ! $loaded ) {
			return $html; // Leave it alone rather than risk corrupting it.
		}

		$root = $doc->getElementById( 'aisuite-root' );

		if ( ! $root ) {
			return $html;
		}

		$xpath = new DOMXPath( $doc );
		$nodes = $xpath->query( './/text()', $root );

		foreach ( $nodes as $node ) {
			if ( empty( $this->pending ) ) {
				break;
			}

			if ( $this->is_protected( $node ) ) {
				continue;
			}

			$this->link_text_node( $doc, $node );
		}

		$out = '';

		foreach ( $root->childNodes as $child ) {
			$out .= $doc->saveHTML( $child );
		}

		return $this->unshield_shortcodes( $out, $shielded['map'] );
	}

	/**
	 * True when this text node sits inside an element we must not touch.
	 */
	protected function is_protected( DOMNode $node ) {
		for ( $parent = $node->parentNode; $parent instanceof DOMElement; $parent = $parent->parentNode ) {
			if ( in_array( strtolower( $parent->nodeName ), self::SKIP_ELEMENTS, true ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Replace the first matching anchor phrase in this text node with a link.
	 */
	protected function link_text_node( DOMDocument $doc, DOMNode $node ) {
		$text = $node->nodeValue;

		foreach ( $this->pending as $key => $link ) {
			$found = $this->find_anchor( $text, $link['anchor'] );

			if ( false === $found ) {
				continue;
			}

			// Use the matched text's own byte length, not the needle's: a
			// case-insensitive unicode match can differ in length from the
			// anchor it matched, and slicing by the wrong length would split
			// a multibyte character.
			$offset = $found['offset'];
			$length = $found['length'];
			$before = substr( $text, 0, $offset );
			$match  = substr( $text, $offset, $length );
			$after  = substr( $text, $offset + $length );

			$anchor = $doc->createElement( 'a' );
			$anchor->setAttribute( 'href', $link['url'] );
			$anchor->appendChild( $doc->createTextNode( $match ) );

			$parent = $node->parentNode;
			$parent->insertBefore( $doc->createTextNode( $before ), $node );
			$parent->insertBefore( $anchor, $node );
			$parent->insertBefore( $doc->createTextNode( $after ), $node );
			$parent->removeChild( $node );

			$this->placed[] = $link;
			unset( $this->pending[ $key ] );

			// The node is gone; anything else waits for a later node.
			return;
		}
	}

	/**
	 * Case-insensitive search that still respects word boundaries, so "art"
	 * never links inside "started".
	 *
	 * @return array|false { offset, length } in bytes, or false.
	 */
	protected function find_anchor( $haystack, $needle ) {
		if ( '' === $needle ) {
			return false;
		}

		$pattern = '/\b' . preg_quote( $needle, '/' ) . '\b/iu';

		if ( ! preg_match( $pattern, $haystack, $matches, PREG_OFFSET_CAPTURE ) ) {
			return false;
		}

		return array(
			'offset' => $matches[0][1],
			'length' => strlen( $matches[0][0] ),
		);
	}

	/**
	 * Swap shortcodes for inert placeholders before parsing.
	 *
	 * @return array { html, map }
	 */
	protected function shield_shortcodes( $html ) {
		if ( false === strpos( $html, '[' ) ) {
			return array(
				'html' => $html,
				'map'  => array(),
			);
		}

		$map   = array();
		$index = 0;

		// WordPress's own regex knows which registered shortcodes are enclosing.
		// Shield the complete match so text inside [shortcode]...[/shortcode] is
		// not edited either. The fallback below still protects unknown tags.
		if ( function_exists( 'get_shortcode_regex' ) ) {
			$regex = get_shortcode_regex();

			if ( $regex ) {
				$html = preg_replace_callback(
					'/' . $regex . '/s',
					function ( $matches ) use ( &$map, &$index ) {
						$token         = '<!--aisuite-sc-' . $index . '-->';
						$map[ $token ] = $matches[0];
						++$index;
						return $token;
					},
					$html
				);
			}
		}

		$html = preg_replace_callback(
			'/\[[^\]]+\]/',
			function ( $matches ) use ( &$map, &$index ) {
					$token         = '<!--aisuite-sc-' . $index . '-->';
					$map[ $token ] = $matches[0];
					++$index;
				return $token;
			},
			$html
		);

		return array(
			'html' => $html,
			'map'  => $map,
		);
	}

	protected function unshield_shortcodes( $html, array $map ) {
		return empty( $map ) ? $html : strtr( $html, $map );
	}
}
