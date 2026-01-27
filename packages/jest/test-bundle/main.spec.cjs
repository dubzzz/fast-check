// Not working anymore until Jest adds support for require(esm)
// See https://github.com/jestjs/jest/issues/15275
const { test, fc } = require('@fast-check/jest');
const { expect } = require('@jest/globals');

test.prop([fc.constant(null)])('should pass', (value) => {
  expect(value).toBe(null);
});
