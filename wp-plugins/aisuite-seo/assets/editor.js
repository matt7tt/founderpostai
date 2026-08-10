( function ( wp, config ) {
	'use strict';

	if ( ! wp || ! wp.plugins || ! wp.editPost || ! wp.element || ! wp.apiFetch ) {
		return;
	}

	var el = wp.element.createElement;
	var useEffect = wp.element.useEffect;
	var useState = wp.element.useState;
	var Fragment = wp.element.Fragment;
	var PluginSidebar = wp.editPost.PluginSidebar;
	var PluginSidebarMoreMenuItem = wp.editPost.PluginSidebarMoreMenuItem;
	var Button = wp.components.Button;
	var Notice = wp.components.Notice;
	var SelectControl = wp.components.SelectControl;
	var Spinner = wp.components.Spinner;
	var TextControl = wp.components.TextControl;
	var TextareaControl = wp.components.TextareaControl;
	var __ = wp.i18n.__;
	var namespace = config && config.namespace ? config.namespace : '/aisuite-seo/v1';
	var pollMs = config && config.pollMs ? parseInt( config.pollMs, 10 ) : 5000;

	function apiError( error ) {
		return error && error.message ? error.message : __( 'Something went wrong. Please try again.', 'founderpostai-ai-suite-seo' );
	}

	function fieldLabel( field ) {
		if ( 'title' === field ) {
			return __( 'Search title', 'founderpostai-ai-suite-seo' );
		}
		if ( 'description' === field ) {
			return __( 'Meta description', 'founderpostai-ai-suite-seo' );
		}
		return __( 'Internal links', 'founderpostai-ai-suite-seo' );
	}

	function metric( field, value ) {
		var canvas = document.createElement( 'canvas' );
		var context = canvas.getContext( '2d' );
		var maxChars = 'title' === field ? 60 : 155;
		var maxPixels = 'title' === field ? 600 : 920;
		var width = 0;

		if ( context ) {
			context.font = 'title' === field ? '20px Arial, sans-serif' : '14px Arial, sans-serif';
			width = Math.round( context.measureText( value ).width );
		}

		return value.length + '/' + maxChars + ' ' + __( 'characters', 'founderpostai-ai-suite-seo' ) + ' · ' + width + '/' + maxPixels + ' ' + __( 'px wide', 'founderpostai-ai-suite-seo' );
	}

	function SerpPreview( props ) {
		return el( 'div', { className: 'aisuite-editor-serp' },
			el( 'span', { className: 'aisuite-editor-label' }, __( 'Search preview', 'founderpostai-ai-suite-seo' ) ),
			el( 'div', { className: 'aisuite-editor-serp__url' }, props.url ),
			el( 'div', { className: 'aisuite-editor-serp__title' }, props.title || __( 'Untitled', 'founderpostai-ai-suite-seo' ) ),
			el( 'div', { className: 'aisuite-editor-serp__description' }, props.description || __( 'No meta description yet.', 'founderpostai-ai-suite-seo' ) )
		);
	}

	function Suggestion( props ) {
		var suggestion = props.suggestion;
		var initial = 'string' === typeof suggestion.suggested_value ? suggestion.suggested_value : '';
		var state = useState( initial );
		var value = state[ 0 ];
		var setValue = state[ 1 ];
		var busyState = useState( false );
		var busy = busyState[ 0 ];
		var setBusy = busyState[ 1 ];

		function resolve( decision ) {
			setBusy( true );
			props.onAction( suggestion.id, decision, value ).finally( function () {
				setBusy( false );
			} );
		}

		if ( 'approved' === suggestion.status ) {
			return suggestion.can_undo ? el( 'div', { className: 'aisuite-editor-history' },
				el( 'span', null, fieldLabel( suggestion.field ) + ' ' + __( 'was applied.', 'founderpostai-ai-suite-seo' ) ),
				el( Button, { variant: 'tertiary', isBusy: busy, disabled: busy, onClick: function () { resolve( 'undo' ); } }, __( 'Undo', 'founderpostai-ai-suite-seo' ) )
			) : null;
		}

		var editor;
		function changeValue( nextValue ) {
			setValue( nextValue );
			props.onValueChange( suggestion.field, nextValue );
		}

		if ( 'title' === suggestion.field ) {
			editor = el( TextControl, { label: fieldLabel( suggestion.field ), value: value, maxLength: 60, onChange: changeValue } );
		} else if ( 'description' === suggestion.field ) {
			editor = el( TextareaControl, { label: fieldLabel( suggestion.field ), value: value, maxLength: 155, onChange: changeValue } );
		} else {
			editor = el( 'ul', { className: 'aisuite-editor-links' }, ( suggestion.suggested_value || [] ).map( function ( link ) {
				return el( 'li', { key: link.target_id + ':' + link.anchor }, el( 'code', null, link.anchor ), ' → ', link.url );
			} ) );
		}

		return el( 'div', { className: 'aisuite-editor-suggestion' },
			editor,
			( 'title' === suggestion.field || 'description' === suggestion.field ) && el( 'div', { className: 'aisuite-editor-metric' }, metric( suggestion.field, value ) ),
			suggestion.rationale && el( 'p', { className: 'aisuite-editor-rationale' }, suggestion.rationale ),
			el( 'div', { className: 'aisuite-editor-actions' },
				el( Button, { variant: 'primary', isBusy: busy, disabled: busy || ( 'internal_links' !== suggestion.field && ! value.trim() ), onClick: function () { resolve( 'apply' ); } }, __( 'Apply', 'founderpostai-ai-suite-seo' ) ),
				el( Button, { variant: 'secondary', disabled: busy, onClick: function () { resolve( 'reject' ); } }, __( 'Dismiss', 'founderpostai-ai-suite-seo' ) )
			)
		);
	}

	function Sidebar() {
		var postId = wp.data.select( 'core/editor' ).getCurrentPostId();
		var statePair = useState( null );
		var data = statePair[ 0 ];
		var setData = statePair[ 1 ];
		var loadingPair = useState( true );
		var loading = loadingPair[ 0 ];
		var setLoading = loadingPair[ 1 ];
		var errorPair = useState( '' );
		var error = errorPair[ 0 ];
		var setError = errorPair[ 1 ];
		var focusPair = useState( 'all' );
		var focus = focusPair[ 0 ];
		var setFocus = focusPair[ 1 ];
		var instructionPair = useState( '' );
		var instruction = instructionPair[ 0 ];
		var setInstruction = instructionPair[ 1 ];
		var actionPair = useState( false );
		var acting = actionPair[ 0 ];
		var setActing = actionPair[ 1 ];
		var editedPair = useState( {} );
		var edited = editedPair[ 0 ];
		var setEdited = editedPair[ 1 ];

		function load( quiet ) {
			if ( ! quiet ) {
				setLoading( true );
			}
			return wp.apiFetch( { path: namespace + '/post/' + postId } ).then( function ( response ) {
				setData( response );
				setError( '' );
				return response;
			} ).catch( function ( requestError ) {
				setError( apiError( requestError ) );
			} ).finally( function () {
				setLoading( false );
			} );
		}

		useEffect( function () {
			load( false );
		}, [ postId ] );

		useEffect( function () {
			if ( ! data || ! data.analysis || ! data.analysis.queued ) {
				return undefined;
			}
			var timer = window.setInterval( function () { load( true ); }, pollMs );
			return function () { window.clearInterval( timer ); };
		}, [ data && data.analysis ? data.analysis.queued : false, postId ] );

		function analyze( refined ) {
			setActing( true );
			setError( '' );
			wp.apiFetch( {
				path: namespace + '/post/' + postId + '/analyze',
				method: 'POST',
				data: { focus: refined ? focus : 'all', instruction: refined ? instruction : '' }
			} ).then( function () {
				setInstruction( '' );
				return load( true );
			} ).catch( function ( requestError ) {
				setError( apiError( requestError ) );
			} ).finally( function () {
				setActing( false );
			} );
		}

		function resolve( suggestionId, decision, value ) {
			setError( '' );
			return wp.apiFetch( {
				path: namespace + '/suggestion/' + suggestionId + '/' + decision,
				method: 'POST',
				data: 'apply' === decision ? { suggested_value: value } : {}
			} ).then( function ( response ) {
				setData( response );
				setEdited( {} );
				wp.data.dispatch( 'core/notices' ).createSuccessNotice(
					'undo' === decision ? __( 'The previous SEO value was restored.', 'founderpostai-ai-suite-seo' ) : __( 'SEO review updated.', 'founderpostai-ai-suite-seo' ),
					{ type: 'snackbar' }
				);
			} ).catch( function ( requestError ) {
				setError( apiError( requestError ) );
			} );
		}

		function editPreview( field, value ) {
			setEdited( function ( current ) {
				var next = Object.assign( {}, current );
				next[ field ] = value;
				return next;
			} );
		}

		var content;
		if ( loading && ! data ) {
			content = el( 'div', { className: 'aisuite-editor-loading' }, el( Spinner ), __( 'Loading SEO data…', 'founderpostai-ai-suite-seo' ) );
		} else if ( ! data ) {
			content = el( Notice, { status: 'error', isDismissible: false }, error || __( 'SEO data is unavailable.', 'founderpostai-ai-suite-seo' ) );
		} else {
			var pending = data.suggestions.filter( function ( item ) { return 'pending' === item.status; } );
			var history = data.suggestions.filter( function ( item ) { return 'approved' === item.status && item.can_undo; } );
			var titleSuggestion = pending.find( function ( item ) { return 'title' === item.field; } );
			var descriptionSuggestion = pending.find( function ( item ) { return 'description' === item.field; } );
			content = el( Fragment, null,
				error && el( Notice, { status: 'error', isDismissible: false }, error ),
				data.analysis.error && el( Notice, { status: 'warning', isDismissible: false }, data.analysis.error ),
				el( 'div', { className: 'aisuite-editor-status' }, data.analysis.queued ? el( Fragment, null, el( Spinner ), __( 'Analysis is running…', 'founderpostai-ai-suite-seo' ) ) : ( data.analysis.current ? __( 'Analysis is current', 'founderpostai-ai-suite-seo' ) : __( 'Analysis needed', 'founderpostai-ai-suite-seo' ) ) ),
				el( SerpPreview, {
					url: data.post.url,
					title: Object.prototype.hasOwnProperty.call( edited, 'title' ) ? edited.title : ( titleSuggestion ? titleSuggestion.suggested_value : data.preview.title ),
					description: Object.prototype.hasOwnProperty.call( edited, 'description' ) ? edited.description : ( descriptionSuggestion ? descriptionSuggestion.suggested_value : data.preview.description )
				} ),
				el( 'div', { className: 'aisuite-editor-run' },
					el( Button, { variant: 'primary', isBusy: acting || data.analysis.queued, disabled: acting || data.analysis.queued, onClick: function () { analyze( false ); } }, pending.length ? __( 'Regenerate all', 'founderpostai-ai-suite-seo' ) : __( 'Analyze this post', 'founderpostai-ai-suite-seo' ) ),
					el( SelectControl, {
						label: __( 'Refine', 'founderpostai-ai-suite-seo' ),
						value: focus,
						options: [
							{ label: __( 'All suggestions', 'founderpostai-ai-suite-seo' ), value: 'all' },
							{ label: __( 'Search title', 'founderpostai-ai-suite-seo' ), value: 'title' },
							{ label: __( 'Meta description', 'founderpostai-ai-suite-seo' ), value: 'description' },
							{ label: __( 'Internal links', 'founderpostai-ai-suite-seo' ), value: 'internal_links' }
						],
						onChange: setFocus
					} ),
					el( TextareaControl, { label: __( 'Optional direction', 'founderpostai-ai-suite-seo' ), value: instruction, maxLength: 500, onChange: setInstruction, placeholder: __( 'Example: emphasize the practical checklist and use a calmer tone.', 'founderpostai-ai-suite-seo' ) } ),
					el( Button, { variant: 'secondary', isBusy: acting, disabled: acting || data.analysis.queued, onClick: function () { analyze( true ); } }, __( 'Refine suggestions', 'founderpostai-ai-suite-seo' ) )
				),
				pending.length ? pending.map( function ( suggestion ) {
					return el( Suggestion, { key: suggestion.id, suggestion: suggestion, onAction: resolve, onValueChange: editPreview } );
				} ) : el( 'p', { className: 'aisuite-editor-empty' }, data.analysis.queued ? __( 'Suggestions will appear here when the analysis finishes.', 'founderpostai-ai-suite-seo' ) : __( 'No suggestions are waiting for review.', 'founderpostai-ai-suite-seo' ) ),
				history.length > 0 && el( 'div', { className: 'aisuite-editor-history-list' }, el( 'h3', null, __( 'Recent changes', 'founderpostai-ai-suite-seo' ) ), history.map( function ( suggestion ) {
					return el( Suggestion, { key: suggestion.id, suggestion: suggestion, onAction: resolve, onValueChange: editPreview } );
				} ) )
			);
		}

		return el( Fragment, null,
			el( PluginSidebarMoreMenuItem, { target: 'aisuite-seo-sidebar', icon: 'search' }, __( 'AI Suite SEO', 'founderpostai-ai-suite-seo' ) ),
			el( PluginSidebar, { name: 'aisuite-seo-sidebar', title: __( 'AI Suite SEO', 'founderpostai-ai-suite-seo' ), icon: 'search' }, el( 'div', { className: 'aisuite-editor' }, content ) )
		);
	}

	wp.plugins.registerPlugin( 'aisuite-seo-editor', { render: Sidebar, icon: 'search' } );
}( window.wp, window.AISuiteSEOEditor || {} ) );
