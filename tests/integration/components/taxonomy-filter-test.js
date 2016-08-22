import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('taxonomy-filter', 'Integration | Component | taxonomy filter', {
  integration: true
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{taxonomy-filter}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#taxonomy-filter}}
      template block text
    {{/taxonomy-filter}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
