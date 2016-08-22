import Ember from 'ember';

/**
 * Allow a subject taxonomy item to store an extra property (a reference to the parent object)
 * @param {Taxonomy} taxonomyItem
 * @param {Taxonomy} parentItem The parent item (or null)
 * @returns {boolean}
 */
export default function taxonomyWithParent(taxonomyItem, parentItem) {
  return Ember.ObjectProxy.create({
      content: taxonomyItem,
      parentItem: parentItem || null
  });
}
