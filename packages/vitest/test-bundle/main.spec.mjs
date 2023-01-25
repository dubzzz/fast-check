import { expect } from 'vitest';
import { test, fc } from '@fast-check/vitest';

test.prop([fc.constant(null)])('should pass', (value) => {
  expect(value).toBe(null);
});
