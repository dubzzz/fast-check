import { expect } from 'vitest';
import fc from 'fast-check';
import { fuzz } from '@fast-check/vitest';

fuzz('should pass', [fc.constant(null)], (value) => {
  expect(value).toBe(null);
});
