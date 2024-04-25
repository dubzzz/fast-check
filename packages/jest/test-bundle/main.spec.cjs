const { testProp, fc } = require('@fast-check/jest');
const { expect } = require('@jest/globals');

testProp('should pass', [fc.constant(null)], (value) => {
  expect(value).toBe(null);
});
