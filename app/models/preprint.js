import Model from 'ember-data/model';
import attr from 'ember-data/attr';

export default Model.extend({
    title: attr(),
    authors: attr(),
    date: attr(),
    subject: attr(),
    abstract: attr(),
    publisher: attr(),
    project: attr(),
    supplementalMaterials: attr(),
    figures: attr(),
    license: attr(),
    path: attr(),
    tags: attr(),
    doi: attr(),
});
