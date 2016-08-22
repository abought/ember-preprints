import Ember from 'ember';

/**
 * @module ember-preprints
 * @submodule components
 */

/**
 * A combo box that allows selecting an item from a filtered list of options
 *
 * Sample usage
 *
 * {{filtered-selector
  *   choices=someArray
 *   filterField='text'
 *   toggleAction=anAction}}
 *
 * @class filtered-selector
 */
export default Ember.Component.extend({

    /**
     * The list of select box choices to display
     */
    choices: Ember.A(),

    /**
     * For each item in the choices array, filter on this field
     * @property filterField
     */
    filterField: null,

    /**
     * An action to fire when something is selected. Takes one argument
     * @method toggleAction
     * @param selectedItem The item selected
     */
    toggleAction: null,

    // Internal state
    _filterText: '',
    _selectedItem: null,

    // Calculated properties
    _displayChoices: Ember.computed('choices.[]', '_filterText', 'filterField', function() {
        let items = this.get('choices') || [];
        let filterText = this.get('_filterText').toLowerCase();
        let filterField = this.get('filterField');
        if (filterField && filterText) {
            return items.filter(item => item.get(filterField).toLowerCase().includes(filterText));
        } else {
            return items;
        }
    }),


    actions: {
        toggleSelect(item) {
            let existingSelection = this.get('_selectedItem');
            if (existingSelection) {
                this.set('_selectedItem', null);
            } else {
                this.set('_selectedItem', item);
            }
            this.sendAction('toggleAction');
        }
    }
});
