/**
@license
Copyright 2017 Neovici

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import '@webcomponents/shadycss/entrypoints/apply-shim';

import { PolymerElement } from '@polymer/polymer/polymer-element';
import '@polymer/iron-flex-layout/iron-flex-layout';
import '@polymer/paper-item/paper-item';
import '@polymer/paper-ripple/paper-ripple';
import '@neovici/paper-autocomplete';
import { translatable } from '@neovici/cosmoz-i18next';
import { microTask } from '@polymer/polymer/lib/utils/async';
import { html } from '@polymer/polymer/lib/utils/html-tag';

/**
 * `paper-autocomplete-chips` is a multi-selection autocomplete element.
 *
 * <paper-autocomplete-chips label="Search" items='["Red", "Blue", "Green", "Yellow", ""]'>
 * </paper-autocomplete-chips>
 *
 *
 * ### Styling
 *
 * `<paper-autocomplete-chips>` provides the following custom properties and mixins
 * for styling:
 *
 * Custom property | Description | Default
 * ----------------|-------------|----------
 * `--paper-autocomplete-chips-suggestions` | mixin to apply to the suggestions container | `{}`
 * `--paper-autocomplete-chips-suggestions-width` | width of the suggestions container |
 * `--paper-autocomplete-chips-suggestions-position` | position of the suggestions container | `absolute`
 *
 * @demo demo/index.html
 * @polymer
 * @customElement
 * @appliesMixin translatable
 */
class PaperAutocompleteChips extends translatable(PolymerElement) {
	static get template() { // eslint-disable-line max-lines-per-function
		return html`
		<style>
			:host {
				display: block;
				@apply --layout-vertical;
			}
			.box {
				min-width: 24px;
				background-color: red;
			}
			#chips {
				@apply --layout-horizontal;
				@apply --layout-end;
				@apply --layout-wrap;
			}
			.chip {
				border-radius: 500px;
				background-color: #e0e0e0;
				margin: 1px 4px 1px 0;
				white-space: nowrap;
				overflow: hidden;
				@apply --layout-horizontal;
				@apply --layout-center;
			}
			.chip > span {
				color: #424242;
				margin-left: 10px;
				font-size: 13px;
				overflow: hidden;
				text-overflow: ellipsis;
			}
			.chip iron-icon {
				margin: 2px 4px;
				color: #cdcdcd;
				background-color: #a6a6a6;
				border-radius: 500px;
				cursor: pointer;
				min-width: 16px;
				width: 16px;
				min-height: 16px;
				height: 16px;
			}
			paper-autocomplete {
				--suggestions-item: {
					white-space: nowrap;
				};
				--paper-autocomplete-suggestions-wrapper: {
					position: var(--paper-autocomplete-chips-suggestions-position, absolute);
					width: var(--paper-autocomplete-chips-suggestions-width, auto);
					min-width: var(--paper-autocomplete-chips-suggestions-min-width, 100%);
					@apply --paper-autocomplete-chips-suggestions;
				};
			}
		</style>
		<div id="chips">
			<template is="dom-repeat" items="[[ createChips(selectedItems.*, textProperty) ]]" as="chip">
				<div class="chip" title="[[ chip.title ]]">
					<span hidden="[[ chip.hidden ]]">[[ chip.description ]]</span><iron-icon icon="clear" on-click="_clearChipSelection"></iron-icon>
				</div>
			</template>
		</div>
		<paper-autocomplete id="ac" min-length="0" label="[[ label ]]" source="[[ source ]]"
			value="{{ _selection }}" text-property="[[ textProperty ]]" query-fn="[[ queryFn ]]"
			disable-show-clear text="{{ text }}" no-label-float show-results-on-focus="[[ showResultsOnFocus ]]"
			focused="{{ focused }}" disabled="[[ disabled ]]" error-message="[[ errorMessage ]]" invalid="[[ _acInvalid ]]">
			<slot name="prefix" slot="prefix"></slot>
			<slot name="suffix" slot="suffix"></slot>
			<slot name="autocomplete-custom-template" slot="autocomplete-custom-template">
				<template slot="autocomplete-custom-template">
					<paper-item id$="[[ _getSuggestionId(index) ]]" role="option" aria-selected="false" on-tap="_onSelect">
						<div inner-h-t-m-l="[[ item.html ]]"></div>
						<paper-ripple></paper-ripple>
					</paper-item>
				</template>
			</slot>
		</paper-autocomplete>
`;
	}

	static get is() {
		return 'paper-autocomplete-chips';
	}
	static get properties() { // eslint-disable-line max-lines-per-function
		return {

			/**
			 * `<paper-autocomplete>`/`<paper-input>` `label`
			 */
			label: {
				type: String,
				value: 'Search'
			},

			/**
			 * `<paper-autocomplete>` `invalid`
			 */
			_acInvalid: {
				type: Boolean,
				value: false
			},

			/**
			* `errorMessage` The error message to display when the input is invalid.
			*/
			errorMessage: {
				type: String
			},

			/**
			 * `<paper-autocomplete>` `minLength`
			 */
			minLength: {
				type: Number,
				value: 0
			},

			/**
			 * Minimum limit of selected items, set to 0 to disable.
			 */
			min: {
				type: Number,
				value: 0
			},

			/**
			 * Maximum limit of selected items, set to 0 to disable.
			 */
			max: {
				type: Number,
				value: 0
			},

			/**
			 * `required` state for the component
			 */
			required: {
				type: Boolean,
				value: false
			},

			/**
			 * Set to `true` to show available suggestions on focus. This overrides the default behavior that only shows
			 * notifications after user types.
					 */
			showResultsOnFocus: {
				type: Boolean
			},

			noValueLabel: {
				type: String,
				computed: '_("No value", t)'
			},

			/**
			 * `<paper-autocomplete>` `queryFn`
			 */
			queryFn: {
				type: Function,
				value() { // eslint-disable-line max-lines-per-function
					const maxResults = 30,
						regexpResult = '<b>$1</b>',
						getResult = (item, textProp) => {
							if (typeof item === 'object') {
								const textValue = this.get(textProp, item);
								if (textValue == null) {
									return;
								}
								return {
									text: textValue.toString() === '' ? this.noValueLabel : textValue.toString(),
									value: item
								};
							}
							const objText = item.toString();
							return {
								text: objText === '' ? this.noValueLabel : objText,
								value: objText
							};
						},
						sortResult = results => {
							return results.sort((a, b) => {
								if (a.text === this.noValueLabel) {
									return -1;
								}
								if (b.text === this.noValueLabel) {
									return 1;
								}
								if (a.idx < b.idx) {
									return -1;
								}
								if (a.idx > b.idx) {
									return 1;
								}
								if (a.text < b.text) {
									return -1;
								}
								if (a.text > b.text) {
									return 1;
								}
								return 0;
							});
						},
						hasOtherObjectValue = value => {
							const prop = this.get(this.valueProperty, value);
							if (prop == null) {
								return;
							}
							return this.selectedItems.some(
								item => this.get(this.valueProperty, item) === prop
							);
						};


					return (datasource, query) => { // eslint-disable-line max-statements
						const results = [];

						for (let i = 0; i < datasource.length; i += 1) {
							const item = datasource[i];

							// already selected
							if (this.selectedItems.indexOf(item) !== -1) {
								continue;
							}

							const result = getResult(item, this.textProperty);

							if (result == null) {
								continue;
							}

							if (this.valueProperty && hasOtherObjectValue(result.value)) {
								continue;
							}
							result.idx = result.text.toLowerCase().indexOf(query);
							if (result.idx === -1) {
								continue;
							}

							const escapedQuery = query.replace(/[|\\{}()[\]^$+*?.-]/gu, '\\$&');
							if (result.text === this.noValueLabel) {
								result.html = '<i>' + result.text.replace(new RegExp('(' + escapedQuery + ')', 'igu'), regexpResult) + '</i>';
							} else {
								result.html = result.text.replace(new RegExp('(' + escapedQuery + ')', 'igu'), regexpResult);
							}
							results.push(result);

							if (results.length >= maxResults) {
								break;
							}
						}
						return sortResult(results);
					};
				}
			},

			/**
			 * Selected items from `source`
			 */
			selectedItems: {
				type: Array,
				notify: true,
				value() {
					return [];
				}
			},

			/**
			 * `<paper-autocomplete>` `source`
			 */
			source: {
				type: Array
			},

			/**
			 * `<paper-autocomplete>` `text`
			 */
			text: {
				type: String,
				notify: true
			},

			/**
			 * `<paper-autocomplete>` `textProperty`
			 */
			textProperty: {
				type: String,
				value: 'text'
			},

			/**
			 * `source` item value property to store in `selectedItems`
			 * if empty, use the whole object
			 */
			valueProperty: {
				type: String,
				value: 'value'
			},

			/**
			 * `focused` If true, the element currently has focus.
			 */
			focused: {
				type: Boolean,
				notify: true
			},

			/**
			 * disables `<paper-autocomplete>`
			 */
			disabled: {
				type: Boolean
			},

			/**
			 * `<paper-autocomplete>` `value` receiver
			 */
			_selection: {
				type: Object,
				observer: '_selectionChanged'
			}
		};
	}

	/**
	 * Clear the selected chip.
	 * @param {object} event Polymer event object.
	 * @returns {void}
	 */
	_clearChipSelection(event) {
		const chip = event.model.chip;
		let selectedIndex = this.selectedItems.indexOf(chip.description);
		if (selectedIndex === -1) {
			selectedIndex = this.selectedItems.findIndex(item => item[this.textProperty] === chip.description);
		}
		// This will remove from the DOM the source element of the processed event ...
		this.splice('selectedItems', selectedIndex, 1);
		// ... so we must prevent further propagation of this event, because its source is now invalid.
		// (This has caused troubles in app-drawer-layout click event handler).
		event.preventDefault();
		event.stopPropagation();
	}
	createChips(itemList, textProperty) {
		if (itemList == null || !Array.isArray(itemList.base)) {
			return [];
		}
		return itemList.base.map(chip => {
			if (typeof chip === 'object') {
				const localDescription = this.get(textProperty, chip) || chip.text;
				return {
					...chip,
					hidden: !localDescription,
					description: localDescription || '',
					title: localDescription || this.noValueLabel
				};
			}
			return {
				description: chip || '',
				title: chip || this.noValueLabel,
				hidden: !chip
			};
		});
	}
	/**
	 * Update the selected items and request handle of suggestions.
	 * @param {object} newSelection Selected item.
	 * @returns {void}
	 */
	_selectionChanged(newSelection) {
		if (newSelection === null) {
			return;
		}
		this.push('selectedItems', newSelection);
		microTask.run(() => {
			this.$.ac.clear();
			// FIXME
			this.$.ac.$.paperAutocompleteSuggestions._handleSuggestions({
				target: {
					value: ''
				}
			});
		});
	}
	/**
	 * Check whether the input is valid or not.
	 * @returns {boolean} Whether the input is valid or not.
	 */
	validate() {
		if (this.required && this.selectedItems.length === 0) {
			this.set('_acInvalid', true);
			this.set('errorMessage', this.gettext('Something must be selected in the list.'));
			return false;
		}

		if (this.min && this.min > this.selectedItems.length) {
			this.set('_acInvalid', true);
			this.set('errorMessage', this.gettext('Select at least {0} in the list.', this.min));
			return false;
		}

		if (this.max && this.max < this.selectedItems.length) {
			this.set('_acInvalid', true);
			this.set('errorMessage', this.gettext('Select maximum {0} in the list.', this.max));
			return false;
		}

		this.set('_acInvalid', false);
		this.set('errorMessage', '');
		return true;
	}
}
customElements.define(PaperAutocompleteChips.is, PaperAutocompleteChips);
