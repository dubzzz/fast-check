import { test, fc } from '@fast-check/jest';
import { expect } from '@jest/globals';

test.prop([fc.constant(null)])('should pass', (value) => {
  expect(value).toBe(null);
});
