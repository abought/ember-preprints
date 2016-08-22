import Ember from 'ember';

import { validator, buildValidations } from 'ember-cp-validations';

import permissions from 'ember-osf/const/permissions';
import NodeActionsMixin from 'ember-osf/mixins/node-actions';
import loadAll from 'ember-osf/utils/load-relationship';

// Enum of available upload states
export const State = Object.freeze(Ember.Object.create({
    START: 'start',
    NEW: 'new',
    EXISTING: 'existing'
}));

/*****************************
  Form data and validations
 *****************************/
const BasicsValidations = buildValidations({
    basicsTitle: {
        description: 'Title',
        validators: [
            validator('presence', true),
            validator('length', {
                // minimum length for title?
                max: 200,
            })
        ]
    },
    basicsAbstract: {
        description: 'Abstract',
        validators: [
            validator('presence', true),
            validator('length', {
                // currently min of 20 characters -- this is what arXiv has as the minimum length of an abstract
                min: 20,
                max: 5000
            })
        ]
    },
    basicsDOI: {
        description: 'DOI',
        validators: [
            validator('format', {
                // Simplest regex- try not to diverge too much from the backend
                regex: /^10\.\S+\//,
                allowBlank: true,
                message: 'Please use a valid {description}'
            })
        ]
    }
});

/**
 * "Add preprint" page definitions
 */
export default Ember.Controller.extend(BasicsValidations, NodeActionsMixin, {
    toast: Ember.inject.service('toast'),
    panelActions: Ember.inject.service('panelActions'),

    // Data for project picker; tracked internally on load
    user: null,
    userNodes: Ember.A(),

    // Information about the thing to be turned into a preprint
    node: null,
    selectedFile: null,
    contributors: Ember.A(),

    ///////////////////////////////////////
    // Validation rules for form sections
    uploadValid: Ember.computed.and('node', 'selectedFile'),
    // Basics fields are currently the only ones with validation. Make this more specific in the future if we add more form fields.
    basicsValid: Ember.computed.alias('validations.isValid'),
    // Must have at least one contributor. Backend enforces admin and bibliographic rules. If this form section is ever invalid, something has gone horribly wrong.
    authorsValid: Ember.computed.bool('contributors.length'),
    // Must select at least one subject. TODO: Verify this is the appropriate way to track
    subjectsValid: Ember.computed.bool('model.subjects.length'),

    ////////////////////////////////////////////////////
    // Fields used in the "basics" section of the form.
    // Proxy for "basics" section, to support autosave when fields change (created when model selected)
    basicsModel: Ember.computed.alias('node'),

    basicsTitle: Ember.computed.alias('basicsModel.title'),
    basicsAbstract: Ember.computed.alias('basicsModel.description'),
    basicsTags: Ember.computed.alias('basicsModel.tags'), // TODO: This may need to provide a default value (list)? Via default or field transform?
    basicsDOI: Ember.computed.alias('model.doi'),

    //// TODO: Turn off autosave functionality for now. Direct 2-way binding was causing a fight between autosave and revalidation, so autosave never fired. Fixme.
    // createAutosave: Ember.observer('node', function() {
    //     // Create autosave proxy only when a node has been loaded.
    //     // TODO: This could go badly if a request is in flight when trying to destroy the proxy
    //
    //     var controller = this;
    //     this.set('basicsModel', autosave('node', {
    //         save(model) {
    //             // Do not save fields if validation fails.
    //             console.log('trying autosave');
    //             if (controller.get('basicsValid')) {
    //                 console.log('decided to autosave');
    //                 model.save();
    //             }
    //         }
    //     }));
    // }),

    getContributors: Ember.observer('node', function() {
        // Cannot be called until a project has been selected!
        let node = this.get('node');
        let contributors = Ember.A();
        loadAll(node, 'contributors', contributors).then(()=>
             this.set('contributors', contributors));
    }),

    // Upload variables
    _State: State,
    filePickerState: State.START,
    uploadState: State.START,
    uploadFile: null,
    resolve: null,
    shouldCreateChild: false,
    dropzoneOptions: {
        uploadMultiple: false,
        method: 'PUT'
    },

    isAdmin: Ember.computed('node', function() {
        // FIXME: Workaround for isAdmin variable not making sense until a node has been loaded
        let userPermissions = this.get('node.currentUserPermissions') || [];
        return userPermissions.indexOf(permissions.ADMIN) >= 0;
    }),

    canEdit: Ember.computed('isAdmin', 'node', function() {
        return this.get('isAdmin') && !(this.get('node.registration'));
    }),

    searchResults: [],

    _names: ['upload', 'basics', 'subjects', 'authors', 'submit'].map(str => str.capitalize()),

    actions: {
        // Open next panel
        next(currentPanelName) {
            this.get('panelActions').open(this.get(`_names.${this.get('_names').indexOf(currentPanelName) + 1}`));
        },

        error(error /*, transition */) {
            this.get('toast').error(error);
        },
        /*
        * Upload section
        */
        changeState(newState) {
            this.set('filePickerState', newState);
        },
        changeUploadState(newState) {
            this.set('uploadState', newState);
        },
        createProject() {
            this.get('store').createRecord('node', {
                title: this.get('nodeTitle'),
                category: 'project',
                public: false // TODO: should this be public now or later, when it is turned into a preprint?  Default to the least upsetting option.
            }).save().then(node => {
                this.get('userNodes').pushObject(node);
                this.set('node', node);
                this.send('startUpload');
            });
        },
        // Override NodeActionsMixin.addChild
        addChild() {
            this._super(`${this.get('node.title')} Preprint`, this.get('node.description')).then(child => {
                this.get('userNodes').pushObject(child);
                this.set('node', child);
                this.send('startUpload');
            });
        },
        // nextAction: {action} callback for the next action to perform.
        deleteProject(nextAction) {
            // TODO: Do we really want the upload page to have a deletion button at all??
            // TODO: delete the previously created model, not the currently selected model
            if (this.get('node')) {
                this.get('node').destroyRecord().then(() => {
                    this.get('toast').info('Project deleted');
                });
                this.set('node', null);
                // TODO: reset dropzone, since uploaded file has no project
            }
            nextAction();
        },
        startUpload() {
            // TODO: retrieve and save fileid from uploaded file
            // TODO: deal with more than 10 files?
            this.set('_url', `${this.get('node.files').findBy('name', 'osfstorage').get('links.upload')}?kind=file&name=${this.get('uploadFile.name')}`);

            // TODO: Do not rely on cached resolve handlers, or toast for uploading. No file, no preprint- enforce workflow.
            this.get('resolve')();
            this.get('toast').info('File will upload in the background.');
            this.send('next', this.get('_names.0'));
        },
        selectExistingFile(file) {
            this.set('selectedFile', file);
        },

        /*
          Basics section
         */
        saveBasics() {
            // Save the model associated with basics field, then advance to next panel
            // If save fails, do not transition
            let node = this.get('node');
            node.save()
                .then(() => this.send('next', this.get('_names.1')))
                .catch(()=> this.send('error', 'Could not save information; please try again'));
        },

        saveSubjects(subjects) {
            // If save fails, do not transition
            this.set('model.subjects', subjects);
        },

        subjectsNext() {
            this.send('next', this.get('_names.2'));
        },
        /**
         * findContributors method.  Queries APIv2 users endpoint on full_name.  Fetches specified page of results.
         * TODO will eventually need to be changed to multifield query.
         *
         * @method findContributors
         * @param {String} query ID of user that will be a contributor on the node
         * @param {Integer} page Page number of results requested
         * @return {Record} Returns specified page of user records matching full_name query
         */
        findContributors(query, page) {
            return this.store.query('user', { filter: { full_name: query }, page: page }).then((contributors) => {
                this.set('searchResults', contributors);
                return contributors;
            }, () => {
                this.get('toast').error('Could not perform search query.');
                this.highlightSuccessOrFailure('author-search-box', this, 'error');
            });
        },
        /**
        * highlightSuccessOrFailure method. Element with specified ID flashes green or red depending on response success.
        *
        * @method highlightSuccessOrFailure
        * @param {string} elementId Element ID to change color
        * @param {Object} context "this" scope
        * @param {string} status "success" or "error"
        */
        highlightSuccessOrFailure(elementId, context, status) {
            Ember.run.next(Ember.Object.create({ elementId: elementId, context: context }), function() {
                var elementId = this.elementId;
                var _this = this.context;

                var highlightClass =  status === 'success' ? 'successHighlight' : 'errorHighlight';

                _this.$('#' + elementId).addClass(highlightClass);
                setTimeout(() => {
                    _this.$('#' + elementId).removeClass(highlightClass);
                }, 4000);
            });
        },
        /*
          Submit tab actions
         */
        savePreprint() {
            // TODO: Check validation status of all sections before submitting
            // TODO: Make sure subjects is working so request doesn't get rejected
            // TODO: Test and get this code working
            let model = this.get('model');
            model.setProperties({
                id: this.get('node.id'),
                primaryFile: this.get('selectedFile')
            });
            model.save()
                .then(() => console.log('Save succeeded. Should we transition somewhere?'))
                .catch(() => this.send('error', 'Could not save preprint; please try again later'));
        }
    }
});