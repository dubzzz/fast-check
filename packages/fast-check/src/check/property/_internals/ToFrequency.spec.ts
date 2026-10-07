import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { runIdToFrequency } from './ToFrequency.js';

describe('runIdToFrequency', () => {
  it.each([
    [0, 2],
    [8, 2],
    [9, 3],
    [10, 3],
    [98, 3],
    [99, 4],
    [100, 4],
    [998, 4],
    [999, 5],
    [1000, 5],
    [9998, 5],
    [9999, 6],
    [10000, 6],
    [99998, 6],
    [99999, 7],
    [100000, 7],
    [999998, 7],
    [999999, 8],
    [1000000, 8],
  ])('should use the expected frequency for run %i', (runId, expected) => {
    expect(runIdToFrequency(runId)).toBe(expected);
  });

  it('should preserve the logarithmic formula for nonnegative safe integers', async () => {
    await fc.assert(
      fc.property(fc.maxSafeNat(), (runId) => {
        expect(runIdToFrequency(runId)).toBe(referenceFrequency(runId));
      }),
    );
  });

  it('should preserve the logarithmic formula throughout the fast path', async () => {
    await fc.assert(
      fc.property(fc.integer({ min: 0, max: 999998 }), (runId) => {
        expect(runIdToFrequency(runId)).toBe(referenceFrequency(runId));
      }),
    );
  });

  it('should preserve rounding around large powers of ten', async () => {
    await fc.assert(
      fc.property(fc.integer({ min: 6, max: 15 }), fc.integer({ min: -100, max: 100 }), (exponent, offset) => {
        const runId = 10 ** exponent + offset;
        expect(runIdToFrequency(runId)).toBe(referenceFrequency(runId));
      }),
      {
        examples: [
          [14, -2],
          [15, -2],
        ],
      },
    );
  });

  it.each([-1, -0, -0.9, 0.5, 8.999999999999998, 98.99999999999999, NaN, Infinity, -Infinity])(
    'should preserve the logarithmic formula for %s',
    (runId) => {
      expect(runIdToFrequency(runId)).toBe(referenceFrequency(runId));
    },
  );

  it('should preserve the logarithmic formula for other numeric inputs', async () => {
    await fc.assert(
      fc.property(fc.double(), (runId) => {
        expect(runIdToFrequency(runId)).toBe(referenceFrequency(runId));
      }),
    );
  });
});

function referenceFrequency(runId: number): number {
  return 2 + ~~(Math.log(runId + 1) * 0.4342944819032518);
}
