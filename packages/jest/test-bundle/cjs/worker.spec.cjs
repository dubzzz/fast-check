const { init, fc } = require('@fast-check/jest/worker');
const { pathToFileURL } = require('node:url');

const { test, expect } = init(pathToFileURL(__filename));

test.prop([fc.constant(null)])('should pass', (value) => {
  expect(value).toBe(null);
});
