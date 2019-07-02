var test = require('tap').test;
var createLayout = require('../');

test('it throws when needed', function(t) {
  t.throws(createLayout, 'graph is required');
  t.end();
});
