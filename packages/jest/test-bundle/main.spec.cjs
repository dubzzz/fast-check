const { test, fc } = require('@fast-check/jest');
const { expect } = require('@jest/globals');

test.prop([fc.constant(null)])('should pass', (value) => {
  expect(value).toBe(null);
});
