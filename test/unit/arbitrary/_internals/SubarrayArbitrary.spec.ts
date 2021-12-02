import * as fc from '../../../../lib/fast-check';
import { SubarrayArbitrary } from '../../../../src/arbitrary/_internals/SubarrayArbitrary';

import {
  assertProduceSameValueGivenSameSeed,
  assertProduceCorrectValues,
  assertProduceValuesShrinkableWithoutContext,
  assertShrinkProducesSameValueWithoutInitialContext,
  assertShrinkProducesStrictlySmallerValue,
} from '../__test-helpers__/ArbitraryAssertions';

function beforeEachHook() {
  jest.resetModules();
  jest.restoreAllMocks();
  fc.configureGlobal({ beforeEach: beforeEachHook });
}
beforeEach(beforeEachHook);

describe('SubarrayArbitrary', () => {
  describe('constructor', () => {
    it('should raise an error whenever minLength is below zero', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer()),
          fc.nat(),
          fc.nat(),
          fc.boolean(),
          (originalArray, minLengthSeed, maxLengthSeed, isOrdered) => {
            // Arrange
            const minLength = -minLengthSeed - 1;
            const maxLength = maxLengthSeed % (originalArray.length + 1);

            // Act / Assert
            expect(() => {
              new SubarrayArbitrary(originalArray, isOrdered, minLength, maxLength);
            }).toThrowError(/minimal length to be between 0/);
          }
        )
      );
    });

    it('should raise an error whenever minLength is greater than array size', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer()),
          fc.nat(),
          fc.nat(),
          fc.boolean(),
          (originalArray, minLengthOffsetToLength, maxLengthSeed, isOrdered) => {
            // Arrange
            const minLength = originalArray.length + minLengthOffsetToLength + 1;
            const maxLength = maxLengthSeed % (originalArray.length + 1);

            // Act / Assert
            expect(() => {
              new SubarrayArbitrary(originalArray, isOrdered, minLength, maxLength);
            }).toThrowError(/minimal length to be between 0/);
          }
        )
      );
    });

    it('should raise an error whenever maxLength is below zero', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer()),
          fc.nat(),
          fc.nat(),
          fc.boolean(),
          (originalArray, maxLengthSeed, minLengthSeed, isOrdered) => {
            // Arrange
            const minLength = minLengthSeed % (originalArray.length + 1);
            const maxLength = -maxLengthSeed - 1;

            // Act / Assert
            expect(() => {
              new SubarrayArbitrary(originalArray, isOrdered, minLength, maxLength);
            }).toThrowError(/maximal length to be between 0/);
          }
        )
      );
    });

    it('should raise an error whenever maxLength is greater than array size', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer()),
          fc.nat(),
          fc.nat(),
          fc.boolean(),
          (originalArray, maxLengthOffsetToLength, minLengthSeed, isOrdered) => {
            // Arrange
            const minLength = minLengthSeed % (originalArray.length + 1);
            const maxLength = originalArray.length + maxLengthOffsetToLength + 1;

            // Act / Assert
            expect(() => {
              new SubarrayArbitrary(originalArray, isOrdered, minLength, maxLength);
            }).toThrowError(/maximal length to be between 0/);
          }
        )
      );
    });

    it('should raise an error whenever minLength is greater than maxLength', () => {
      fc.assert(
        fc.property(
          fc
            .tuple(fc.nat(100), fc.nat(100))
            .map(([a, b]) => (a < b ? [a, b] : [b, a]))
            .filter(([a, b]) => a !== b),
          fc.nat(100),
          fc.boolean(),
          (minMax, offset, isOrdered) => {
            // Arrange
            const [maxLength, minLength] = minMax;
            const originalArray = [...Array(minMax[1] + offset)].map((_) => 0);

            // Act / Assert
            expect(() => {
              new SubarrayArbitrary(originalArray, isOrdered, minLength, maxLength);
            }).toThrowError(/minimal length to be inferior or equal to the maximal length/);
          }
        )
      );
    });

    it('should accept any valid combination of inputs', () => {
      fc.assert(
        fc.property(
          fc
            .tuple(fc.nat(100), fc.nat(100))
            .map(([a, b]) => (a < b ? [a, b] : [b, a]))
            .filter(([a, b]) => a !== b),
          fc.nat(100),
          fc.boolean(),
          (minMax, offset, isOrdered) => {
            // Arrange
            const [minLength, maxLength] = minMax;
            const originalArray = [...Array(minMax[1] + offset)].map((_) => 0);

            // Act / Assert
            expect(() => {
              new SubarrayArbitrary(originalArray, isOrdered, minLength, maxLength);
            }).not.toThrow();
          }
        )
      );
    });
  });
});

describe('SubarrayArbitrary (integration)', () => {
  type Extra = {
    data: number[];
    isOrdered: boolean;
    minLength: number;
    maxLength: number;
  };
  const extraParameters: fc.Arbitrary<Extra> = fc
    .record({
      data: fc.array(fc.integer()),
      isOrdered: fc.boolean(),
      lengthA: fc.nat(),
      lengthB: fc.nat(),
    })
    .map((ct) => {
      const rescaledLengthA = ct.lengthA % (ct.data.length + 1);
      const rescaledLengthB = ct.lengthB % (ct.data.length + 1);
      return {
        data: ct.data,
        isOrdered: ct.isOrdered,
        minLength: Math.min(rescaledLengthA, rescaledLengthB),
        maxLength: Math.max(rescaledLengthA, rescaledLengthB),
      };
    });

  const isCorrect = (arr: number[], ct: Extra) => {
    expect(arr.length).toBeGreaterThanOrEqual(ct.minLength);
    expect(arr.length).toBeLessThanOrEqual(ct.maxLength);
    if (ct.isOrdered) expect(isOrderedSubarray(ct.data, arr)).toBe(true);
    else expect(isSubarray(ct.data, arr)).toBe(true);
  };

  const SubarrayArbitraryBuilder = (extra: Extra) =>
    new SubarrayArbitrary(extra.data, extra.isOrdered, extra.minLength, extra.maxLength);

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(SubarrayArbitraryBuilder, { extraParameters });
  });

  it('should only produce correct values', () => {
    assertProduceCorrectValues(SubarrayArbitraryBuilder, isCorrect, { extraParameters });
  });

  it('should produce values seen as shrinkable without any context', () => {
    assertProduceValuesShrinkableWithoutContext(SubarrayArbitraryBuilder, { extraParameters });
  });

  it('should be able to shrink to the same values without initial context', () => {
    assertShrinkProducesSameValueWithoutInitialContext(SubarrayArbitraryBuilder, { extraParameters });
  });

  it('should preserve strictly smaller ordering in shrink', () => {
    assertShrinkProducesStrictlySmallerValue(SubarrayArbitraryBuilder, isStrictlySmallerValue, { extraParameters });
  });
});

// Helpers

function isOrderedSubarray(originalArray: number[], subarray: number[]): boolean {
  let idxOriginal = 0;
  for (let idx = 0; idx !== subarray.length; ++idx) {
    while (originalArray[idxOriginal] !== subarray[idx]) {
      ++idxOriginal;
      if (idxOriginal >= originalArray.length) return false;
    }
    ++idxOriginal;
  }
  return true;
}

function isSubarray(originalArray: number[], subarray: number[]): boolean {
  return isOrderedSubarray(
    [...originalArray].sort((a, b) => a - b),
    [...subarray].sort((a, b) => a - b)
  );
}

function isStrictlySmallerValue(current: number[], prev: number[]): boolean {
  return isOrderedSubarray(prev, current);
}
