import { describe, bench } from 'vitest';
import { fc } from './__test-helpers__/Imports.js';

// Benchmark
describe('runner', () => {
  bench('assert on sync predicate not returning anything', () => {
    // oxlint-disable-next-line no-empty-function
    return fc.assert(fc.property(fc.constant(1), (_c) => {}));
  });
  bench('assert on sync predicate returning true', () => {
    return fc.assert(fc.property(fc.constant(1), (_c) => true));
  });
  bench('assert on async predicate not returning anything', () => {
    // oxlint-disable-next-line typescript/require-await no-empty-function
    return fc.assert(fc.asyncProperty(fc.constant(1), async (_c) => {}));
  });
  bench('check on sync predicate not returning anything', () => {
    // oxlint-disable-next-line no-empty-function
    fc.check(fc.property(fc.constant(1), (_c) => {}));
  });
});
