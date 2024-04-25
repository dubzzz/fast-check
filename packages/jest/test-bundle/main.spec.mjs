import { testProp, fc } from '@fast-check/jest';
import { expect } from '@jest/globals';

testProp('should pass', [fc.constant(null)], (value) => {
  expect(value).toBe(null);
});
