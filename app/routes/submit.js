import Ember from 'ember';

export default Ember.Route.extend({
    model() {
        // TODO: For demo purposes, do not specify a provider ID and rely on OSF defaults
        return this.store.createRecord('preprint');
    }
});
