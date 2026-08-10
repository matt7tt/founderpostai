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

		var suggestionId = editor.getAttribute( 'data-suggestion-id' );
		var applyValue = suggestionId ? document.querySelector( '[data-aisuite-apply-value="' + suggestionId + '"]' ) : null;
		if ( applyValue ) {
			applyValue.value = value;
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

	var bulkForm = document.querySelector( '[data-aisuite-bulk-form]' );
	var bulkBoxes = Array.from( document.querySelectorAll( '.aisuite-bulk-checkbox' ) );
	var selectAll = document.querySelector( '[data-aisuite-select-all]' );

	function updateBulk() {
		var checked = bulkBoxes.filter( function ( box ) { return box.checked; } );
		if ( checked.length > 20 ) {
			checked[ checked.length - 1 ].checked = false;
			window.alert( labels.maxBulk || 'You can apply up to 20 suggestions at once.' );
			checked = bulkBoxes.filter( function ( box ) { return box.checked; } );
		}
		var submit = document.querySelector( '[data-aisuite-bulk-submit]' );
		var count = document.querySelector( '[data-aisuite-selected-count]' );

		if ( submit ) {
			submit.disabled = 0 === checked.length;
		}
		if ( count ) {
			count.textContent = '(' + checked.length + ' ' + ( labels.selected || '' ) + ')';
		}
		if ( selectAll ) {
			selectAll.checked = bulkBoxes.length > 0 && checked.length === bulkBoxes.length;
			selectAll.indeterminate = checked.length > 0 && checked.length < bulkBoxes.length;
		}
	}

	bulkBoxes.forEach( function ( box ) { box.addEventListener( 'change', updateBulk ); } );
	if ( selectAll ) {
		selectAll.addEventListener( 'change', function () {
			bulkBoxes.forEach( function ( box, index ) { box.checked = selectAll.checked && index < 20; } );
			updateBulk();
		} );
	}

	if ( bulkForm ) {
		bulkForm.addEventListener( 'submit', function ( event ) {
			var checked = bulkBoxes.filter( function ( box ) { return box.checked; } ).slice( 0, 20 );
			bulkForm.querySelectorAll( '[data-aisuite-generated-bulk-value]' ).forEach( function ( input ) { input.remove(); } );
			checked.forEach( function ( box ) {
				var editor = document.querySelector( '[data-aisuite-suggestion][data-suggestion-id="' + box.value + '"]' );
				if ( editor ) {
					var input = document.createElement( 'input' );
					input.type = 'hidden';
					input.name = 'reviewed_values[' + box.value + ']';
					input.value = editor.value.trim();
					input.setAttribute( 'data-aisuite-generated-bulk-value', '' );
					bulkForm.appendChild( input );
				}
			} );
			if ( ! checked.length || ! window.confirm( labels.confirmBulk || 'Apply selected suggestions?' ) ) {
				event.preventDefault();
			}
		} );
	}
}() );
