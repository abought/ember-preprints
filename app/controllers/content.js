import Ember from 'ember';
import loadAll from 'ember-osf/utils/load-relationship';

export default Ember.Controller.extend({
    fullScreenMFR: false,
    expandedAuthors: true,

    // The currently selected file (defaults to primary)
    activeFile: null,

    hasTag: Ember.computed('model.tags', function() {
        return this.get('model.tags').length;
    }),

    getAuthors: Ember.observer('model', function() {
        // Cannot be called until preprint has loaded!
        var model = this.get('model');
        if (!model) return [];

        let contributors = Ember.A();
        loadAll(model, 'contributors', contributors).then(()=>
             this.set('authors', contributors));
    }),

    actions: {
        expandMFR() {
            this.toggleProperty('fullScreenMFR');
        },
        expandAuthors() {
            this.toggleProperty('expandedAuthors');
        },
        /**
         * Notify the parent view when a component selects a file
         * @method chooseFile
         * @param {File} fileItem
         */
        chooseFile(fileItem) {
            this.set('activeFile', fileItem);
        },
        /**
         * Update the UI for download count whenever a user chooses to download.
         * @method incrDownload
         * @param {File} fileItem
         */
        downloadFile(fileItem) {
            // Because we're modifying a nested property, this value persists in store, but doesn't get set
            fileItem.incrementProperty('extra.downloads', 1);
            window.location = fileItem.get('links.download');

        }
    },
});
