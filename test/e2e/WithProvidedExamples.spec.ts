import * as fc from '../../src/fast-check';
import { seed } from './seed';

describe(`WithProvidedExamples (seed: ${seed})`, () => {
  it('should fail on one of the provided examples', () => {
    // no shrink on examples for the moment
    const out = fc.check(
      fc.property(fc.integer(-100, -1), fc.integer(1, 100), (x, y) => x < y),
      {
        examples: [
          [0, 1],
          [42, 42],
          [1, 100],
        ],
      }
    );
    expect(out.failed).toBe(true);
    expect(out.counterexample).toEqual([42, 42]);
  });
  it('should fail after examples', () => {
    const out = fc.check(
      fc.property(fc.integer(), fc.integer(), (x, y) => x < y),
      {
        examples: [
          [0, 1],
          [42, 43],
          [1, 100],
        ],
      }
    );
    expect(out.failed).toBe(true);
    expect(out.counterexample![0]).toBeGreaterThanOrEqual(out.counterexample![1]);
  });
});
