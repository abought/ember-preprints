import UserAdapter from 'ember-osf/adapters/user';

/**
 * Extend user adapter with custom behavior for preprints: reduce network traffic by respecting embeds
 * for data that does not change often
 *
 * Sample use case: display of authors list.
 */
export default UserAdapter.extend({
    shouldBackgroundReloadRecord() {
        return false;
    },
    shouldBackgroundReloadAll() {
        return false;
    }
});
