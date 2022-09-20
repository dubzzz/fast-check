import * as fc from '../../src/fast-check';
import { seed } from './seed';

describe(`WithProvidedExamples (seed: ${seed})`, () => {
  it('should fail on one of the provided examples', () => {
    const out = fc.check(
      fc.property(fc.integer({ min: 1, max: 100 }), fc.integer({ min: 1, max: 100 }), (x, y) => x < y),
      {
        examples: [
          [1, 2],
          [42, 42],
          [1, 100],
        ],
        endOnFailure: true,
      }
    );
    expect(out.failed).toBe(true);
    expect(out.numRuns).toBe(2);
    expect(out.counterexample).toEqual([42, 42]);
  });
  it('should fail on one of the provided examples and shrink it', () => {
    const out = fc.check(
      fc.property(fc.integer({ min: 1, max: 100 }), fc.integer({ min: 1, max: 100 }), (x, y) => x < y),
      {
        examples: [
          [1, 2],
          [42, 42],
          [1, 100],
        ],
      }
    );
    expect(out.failed).toBe(true);
    expect(out.numRuns).toBe(2);
    expect(out.counterexample).toEqual([1, 1]);
  });
  it('should fail after examples', () => {
    const out = fc.check(
      fc.property(fc.integer(), fc.integer(), (x, y) => x < y),
      {
        examples: [
          [1, 2],
          [42, 43],
          [1, 100],
        ],
      }
    );
    expect(out.failed).toBe(true);
    expect(out.counterexample![0]).toBeGreaterThanOrEqual(out.counterexample![1]);
  });
});
