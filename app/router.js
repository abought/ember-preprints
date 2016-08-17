import Ember from 'ember';
import config from './config/environment';

const Router = Ember.Router.extend({
    location: config.locationType,
    rootURL: config.rootURL
});

Router.map(function() {
  this.route('preprints', { path: '/preprints/:file_id' }, function() {
      this.route('view', { path: '/' });
      this.route('edit', { path: '/edit' });
  });

  this.route('add-preprint', { path: '/preprints/add' });

  this.route('browse');

  this.route('page-not-found', { path: '/*wildcard' });
  this.route('submit', function() {
    this.route('project', { path: '/:node_id' }, function() {
      this.route('upload');
      this.route('basics');
      this.route('authors');
      this.route('submit');
    });
  });
});

export default Router;
