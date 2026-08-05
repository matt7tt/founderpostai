( function () {
	'use strict';

	var labels = window.AISuiteSEOReview || {};
	var canvas = document.createElement( 'canvas' );
	var context = canvas.getContext( '2d' );

	function pixelWidth( field, value ) {
		if ( ! context ) {
			return 0;
		}

		context.font = 'title' === field ? '20px Arial, sans-serif' : '14px Arial, sans-serif';
		return Math.round( context.measureText( value ).width );
	}

	function updateEditor( editor ) {
		var card = editor.closest( '.aisuite-card' );
		var metric = card ? card.querySelector( '.aisuite-suggestion-metric' ) : null;
		var preview = card ? card.querySelector( '[data-aisuite-serp]' ) : null;
		var field = editor.getAttribute( 'data-field' );
		var value = editor.value.trim();
		var characterCount = Array.from( value ).length;
		var maxCharacters = parseInt( editor.getAttribute( 'data-max-chars' ), 10 );
		var width = pixelWidth( field, value );
		var maxPixels = parseInt( editor.getAttribute( 'data-max-pixels' ), 10 );
		var minimum = 'title' === field ? 30 : 70;
		var fit = labels.goodFit || '';
		var tone = 'good';

		if ( characterCount < minimum ) {
			fit = labels.tooShort || '';
			tone = 'short';
		} else if ( characterCount > maxCharacters || width > maxPixels ) {
			fit = labels.tooLong || '';
			tone = 'long';
		}

		if ( metric ) {
			metric.className = 'aisuite-suggestion-metric aisuite-suggestion-metric--' + tone;
			metric.textContent = characterCount + '/' + maxCharacters + ' ' + ( labels.characters || '' ) + ' · ' + width + '/' + maxPixels + ' ' + ( labels.pixels || '' ) + ' · ' + fit;
		}

		if ( preview ) {
			var target = preview.querySelector( 'title' === field ? '[data-serp-title]' : '[data-serp-description]' );
			if ( target ) {
				target.textContent = value;
			}
		}
	}

	document.querySelectorAll( '[data-aisuite-suggestion]' ).forEach( function ( editor ) {
		updateEditor( editor );
		editor.addEventListener( 'input', function () {
			updateEditor( editor );
		} );
	} );

	document.querySelectorAll( '[data-aisuite-confirm-undo]' ).forEach( function ( button ) {
		button.addEventListener( 'click', function ( event ) {
			if ( ! window.confirm( labels.confirmUndo || 'Restore the previous value?' ) ) {
				event.preventDefault();
			}
		} );
	} );
}() );
