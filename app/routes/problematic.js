import Ember from 'ember';

export default Ember.Route.extend({
    model() {
        return Ember.RSVP.reject({'Bob': 'Uncle'});
    },

    actions: {
        error() {
            console.log('Handling it here, now what?');
            // As long as we return true, we can handle individual errors locally, AND still go to other error handlers (or error pages).
            //    (action bubbling)
            //return true;
        }
    }
});
