// This test relies on an experimental flag of node:
// --experimental-vm-modules
// Jest is currently adding support ES Modules based on this flag
// More on: https://github.com/facebook/jest/issues/9430

import { testProp, fc } from '@fast-check/jest';

// for all a, b, c strings
// b is a substring of a + b + c
testProp('should detect the substring', [fc.string(), fc.string(), fc.string()], (a, b, c) => {
  expect((a + b + c).includes(b)).toBe(true);
});
