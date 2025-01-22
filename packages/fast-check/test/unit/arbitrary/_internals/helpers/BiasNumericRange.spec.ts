import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  biasNumericRange,
  bigIntLogLike,
  integerLogLike,
} from '../../../../../src/arbitrary/_internals/helpers/BiasNumericRange';

describe('biasNumericRange', () => {
  it('should bias close to extreme values and zero if min and max have opposite signs', () =>
    fc.assert(
      fc.property(
        fc.integer({ min: Number.MIN_SAFE_INTEGER, max: -1 }),
        fc.integer({ min: 1, max: Number.MAX_SAFE_INTEGER }),
        (min, max) => {
          // Arrange / Act
          const ranges = biasNumericRange(min, max, integerLogLike);

          // Assert
          expect(ranges).toHaveLength(3);
          expect(ranges).toEqual([
            { min: expect.toBeWithinRange(min, 0), max: expect.toBeWithinRange(0, max) }, // close to zero
            { min: expect.toBeWithinRange(0, max), max: max }, // close to max
            { min: min, max: expect.toBeWithinRange(min, 0) }, // close to min
          ]);
        },
      ),
    ));

  it('should bias close to extreme values if min and max have same signs', () =>
    fc.assert(
      fc.property(
        fc.constantFrom(1, -1),
        fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }),
        fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }),
        (sign, minRaw, maxRaw) => {
          // Arrange
          fc.pre(minRaw !== maxRaw);
          const minRawSigned = sign * minRaw;
          const maxRawSigned = sign * maxRaw;
          const [min, max] = minRawSigned < maxRawSigned ? [minRawSigned, maxRawSigned] : [maxRawSigned, minRawSigned];

          // Act
          const ranges = biasNumericRange(min, max, integerLogLike);

          // Assert
          expect(ranges).toHaveLength(2);
          const closeToMin = { min: expect.toBeWithinRange(min + 1, max), max: max }; // close to max
          const closeToMax = { min: min, max: expect.toBeWithinRange(min, max - 1) }; // close to min
          if (sign > 0) expect(ranges).toEqual([closeToMax, closeToMin]);
          else expect(ranges).toEqual([closeToMin, closeToMax]);
        },
      ),
    ));

  it('should not bias anything for equal values of min and max', () =>
    fc.assert(
      fc.property(fc.maxSafeInteger(), (minMax) => {
        // Arrange / Act
        const ranges = biasNumericRange(minMax, minMax, integerLogLike);

        // Assert
        expect(ranges).toHaveLength(1);
        expect(ranges).toEqual([{ min: minMax, max: minMax }]); // no bias, cannot do more
      }),
    ));

  it('should always bias in valid ranges when using integerLogLike', () =>
    fc.assert(
      fc.property(fc.maxSafeInteger(), fc.maxSafeInteger(), (a, b) => {
        // Arrange
        const min = a < b ? a : b;
        const max = a < b ? b : a;

        // Act
        const ranges = biasNumericRange(min, max, integerLogLike);

        // Assert
        expect(ranges).not.toHaveLength(0);
        for (const range of ranges) {
          expect(range.max).toBeGreaterThanOrEqual(range.min);
          expect(min).toBeLessThanOrEqual(range.max);
          expect(max).toBeGreaterThanOrEqual(range.max);
          expect(min).toBeLessThanOrEqual(range.min);
          expect(max).toBeGreaterThanOrEqual(range.min);
        }
      }),
    ));

  it('should always bias in valid ranges when using bigIntLogLike', () =>
    fc.assert(
      fc.property(fc.bigInt(), fc.bigInt(), (a, b) => {
        // Arrange
        const min = a < b ? a : b;
        const max = a < b ? b : a;

        // Act
        const ranges = biasNumericRange(min, max, bigIntLogLike);

        // Assert
        expect(ranges).not.toHaveLength(0);
        for (const range of ranges) {
          expect(range.max).toBeGreaterThanOrEqual(range.min);
          expect(min).toBeLessThanOrEqual(range.max);
          expect(max).toBeGreaterThanOrEqual(range.max);
          expect(min).toBeLessThanOrEqual(range.min);
          expect(max).toBeGreaterThanOrEqual(range.min);
        }
      }),
    ));
});

// Helpers

expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling && !Number.isNaN(received);
    return {
      message: () => `expected ${received} ${pass ? 'not ' : ''} to be within range ${floor} - ${ceiling}`,
      pass,
    };
  },
});

interface CustomMatchers<R = unknown> {
  toBeWithinRange(a: number, b: number): R;
}

declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}
