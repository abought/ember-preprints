import Ember from 'ember';

export default Ember.Route.extend({
    model() {
        return this.modelFor('submit.project');
    },

    actions: {
        // We want to know whether mutating a field on the parent record persists (sans store save) when we transition to another child route
        mutateAndGo() {
            let model = this.controller.get('model');
            model.set('title', 'Fjordlington mcgee!');
            this.transitionTo('submit.project.basics');
        }

    }
});
