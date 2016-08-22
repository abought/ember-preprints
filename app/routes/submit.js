import Ember from 'ember';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

import loadAll from 'ember-osf/utils/load-relationship';
import taxonomyWithParent from '../utils/taxonomy-with-parent';

export default Ember.Route.extend(AuthenticatedRouteMixin, {
    currentUser: Ember.inject.service('currentUser'),
    model() {
        // Store the empty preprint to be created on the model hook for page. Node will be fetched
        //  internally during submission process.
        // TODO: In future allow user to select a provider
        return this.store.createRecord('preprint');
    },

    setupController(controller) {
        // Fetch values required to operate the page, that can be loaded in the background
        let userNodes = Ember.A();
        controller.set('userNodes', userNodes);

        this.get('currentUser').load()
            .then((user) => {
                controller.set('user', user);
                return user;
            }).then((user) => loadAll(user, 'nodes', userNodes));

        // Fetch top-level subjects for category picker
        this.store.query('taxonomy', { filter: { parent_ids: null }, page: { size: 100 } })
            .then(subjects => subjects.map((item) => taxonomyWithParent(item)))
            .then(subjectWrappers => this.set('level0Subjects', subjectWrappers));

        return this._super(...arguments);
    }
});
