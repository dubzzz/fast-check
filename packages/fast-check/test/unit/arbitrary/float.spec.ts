import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';

import type { FloatConstraints } from '../../../src/arbitrary/float';
import { float } from '../../../src/arbitrary/float';
import {
  floatConstraints,
  float32raw,
  isNotNaN32bits,
  float64raw,
  isStrictlySmaller,
  defaultFloatRecordConstraints,
  is32bits,
} from './__test-helpers__/FloatingPointHelpers';
import {
  floatToIndex,
  indexToFloat,
  MIN_VALUE_32,
  MAX_VALUE_32,
} from '../../../src/arbitrary/_internals/helpers/FloatHelpers';

import { fakeArbitrary, fakeArbitraryStaticValue } from './__test-helpers__/ArbitraryHelpers';
import { fakeRandom } from './__test-helpers__/RandomHelpers';
import { declareCleaningHooksForSpies } from './__test-helpers__/SpyCleaner';

import {
  assertProduceCorrectValues,
  assertShrinkProducesStrictlySmallerValue,
  assertProduceSameValueGivenSameSeed,
  assertProduceValuesShrinkableWithoutContext,
  assertShrinkProducesSameValueWithoutInitialContext,
} from './__test-helpers__/ArbitraryAssertions';

import * as IntegerMock from '../../../src/arbitrary/integer';

function minMaxForConstraints(ct: FloatConstraints) {
  const noDefaultInfinity = ct.noDefaultInfinity;
  const {
    min = noDefaultInfinity ? -MAX_VALUE_32 : Number.NEGATIVE_INFINITY,
    max = noDefaultInfinity ? MAX_VALUE_32 : Number.POSITIVE_INFINITY,
  } = ct;
  return { min, max };
}

describe('float', () => {
  declareCleaningHooksForSpies();

  it('should accept any valid range of 32-bit floating point numbers (including infinity)', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { noInteger, ...withoutNoIntegerRecordConstraints } = defaultFloatRecordConstraints;

    fc.assert(
      fc.property(floatConstraints(withoutNoIntegerRecordConstraints), (ct) => {
        // Arrange
        spyInteger();

        // Act
        const arb = float(ct);

        // Assert
        expect(arb).toBeDefined();
      }),
    );
  });

  it('should accept any constraits defining min (32-bit float not-NaN) equal to max', () => {
    fc.assert(
      fc.property(
        float32raw(),
        fc.record({ noDefaultInfinity: fc.boolean(), noNaN: fc.boolean() }, { requiredKeys: [] }),
        (f, otherCt) => {
          // Arrange
          fc.pre(isNotNaN32bits(f));
          spyInteger();

          // Act
          const arb = float({ ...otherCt, min: f, max: f });

          // Assert
          expect(arb).toBeDefined();
        },
      ),
    );
  });

  it('should reject any constraints defining min (not-NaN) equal to max if one is exclusive', () => {
    fc.assert(
      fc.property(
        float32raw(),
        fc.record({ noDefaultInfinity: fc.boolean(), noNaN: fc.boolean() }, { requiredKeys: [] }),
        fc.constantFrom('min', 'max', 'both'),
        (f, otherCt, exclusiveMode) => {
          // Arrange
          fc.pre(isNotNaN32bits(f));
          spyInteger();

          // Act / Assert
          expect(() =>
            float({
              ...otherCt,
              min: f,
              max: f,
              minExcluded: exclusiveMode === 'min' || exclusiveMode === 'both',
              maxExcluded: exclusiveMode === 'max' || exclusiveMode === 'both',
            }),
          ).toThrowError();
        },
      ),
    );
  });

  it('should reject non-32-bit or NaN floating point numbers if specified for min', () => {
    fc.assert(
      fc.property(float64raw(), (f64) => {
        // Arrange
        fc.pre(!isNotNaN32bits(f64));
        const integer = spyInteger();

        // Act / Assert
        expect(() => float({ min: f64 })).toThrowError();
        expect(integer).not.toHaveBeenCalled();
      }),
    );
  });

  it('should reject non-32-bit or NaN floating point numbers if specified for max', () => {
    fc.assert(
      fc.property(float64raw(), (f64) => {
        // Arrange
        fc.pre(!isNotNaN32bits(f64));
        const integer = spyInteger();

        // Act / Assert
        expect(() => float({ max: f64 })).toThrowError();
        expect(integer).not.toHaveBeenCalled();
      }),
    );
  });

  it('should reject if specified min is strictly greater than max', () => {
    fc.assert(
      fc.property(float32raw(), float32raw(), (fa32, fb32) => {
        // Arrange
        fc.pre(isNotNaN32bits(fa32));
        fc.pre(isNotNaN32bits(fb32));
        fc.pre(!Object.is(fa32, fb32)); // Object.is can distinguish -0 from 0, while !== cannot
        const integer = spyInteger();
        const min = isStrictlySmaller(fa32, fb32) ? fb32 : fa32;
        const max = isStrictlySmaller(fa32, fb32) ? fa32 : fb32;

        // Act / Assert
        expect(() => float({ min, max })).toThrowError();
        expect(integer).not.toHaveBeenCalled();
      }),
    );
  });

  it('should reject impossible noDefaultInfinity-based ranges', () => {
    // Arrange
    const integer = spyInteger();

    // Act / Assert
    expect(() => float({ min: Number.POSITIVE_INFINITY, noDefaultInfinity: true })).toThrowError();
    expect(() => float({ max: Number.NEGATIVE_INFINITY, noDefaultInfinity: true })).toThrowError();
    expect(integer).not.toHaveBeenCalled();
  });

  it('should properly convert integer value for index between min and max into its associated float value', () => {
    const withoutExcludedConstraints = {
      ...defaultFloatRecordConstraints,
      minExcluded: fc.constant(false),
      maxExcluded: fc.constant(false),
      noInteger: fc.constant(false),
    };

    fc.assert(
      fc.property(
        fc.option(floatConstraints(withoutExcludedConstraints), { nil: undefined }),
        fc.maxSafeNat(),
        fc.option(fc.integer({ min: 2 }), { nil: undefined }),
        (ct, mod, biasFactor) => {
          // Arrange
          const { instance: mrng } = fakeRandom();
          const { min, max } = minMaxForConstraints(ct || {});
          const minIndex = floatToIndex(min);
          const maxIndex = floatToIndex(max);
          const arbitraryGeneratedIndex = (mod % (maxIndex - minIndex + 1)) + minIndex;
          spyIntegerWithValue(() => arbitraryGeneratedIndex);

          // Act
          const arb = float(ct);
          const { value_: f } = arb.generate(mrng, biasFactor);

          // Assert
          expect(f).toBe(indexToFloat(arbitraryGeneratedIndex));
        },
      ),
    );
  });

  describe('with NaN', () => {
    const withNaNRecordConstraints = {
      ...defaultFloatRecordConstraints,
      noNaN: fc.constant(false),
      noInteger: fc.constant(false),
    };

    it('should ask for a range with one extra value (far from zero)', () => {
      fc.assert(
        fc.property(floatConstraints(withNaNRecordConstraints), (ct) => {
          // Arrange
          const { max } = minMaxForConstraints(ct);
          const integer = spyInteger();

          // Act
          float({ ...ct, noNaN: true });
          float(ct);

          // Assert
          expect(integer).toHaveBeenCalledTimes(2);
          const integerConstraintsNoNaN = integer.mock.calls[0][0]!;
          const integerConstraintsWithNaN = integer.mock.calls[1][0]!;
          if (max > MIN_VALUE_32 || (max > 0 && !ct.maxExcluded)) {
            // max > 0  --> NaN will be added as the greatest value
            expect(integerConstraintsWithNaN.min).toBe(integerConstraintsNoNaN.min);
            expect(integerConstraintsWithNaN.max).toBe(integerConstraintsNoNaN.max! + 1);
          } else {
            // max <= 0 --> NaN will be added as the smallest value
            expect(integerConstraintsWithNaN.min).toBe(integerConstraintsNoNaN.min! - 1);
            expect(integerConstraintsWithNaN.max).toBe(integerConstraintsNoNaN.max);
          }
        }),
      );
    });

    it('should properly convert the extra value to NaN', () =>
      fc.assert(
        fc.property(
          floatConstraints(withNaNRecordConstraints),
          fc.option(fc.integer({ min: 2 }), { nil: undefined }),
          (ct, biasFactor) => {
            // Arrange
            // Setup mocks for integer
            const { instance: mrng } = fakeRandom();
            const arbitraryGenerated = { value: Number.NaN };
            const integer = spyIntegerWithValue(() => arbitraryGenerated.value);
            // Call float next to find out the value required for NaN
            float({ ...ct, noNaN: true });
            const arb = float(ct);
            // Extract NaN "index"
            const { min: minNonNaN } = integer.mock.calls[0][0]!;
            const { min: minNaN, max: maxNaN } = integer.mock.calls[1][0]!;
            const indexForNaN = minNonNaN !== minNaN ? minNaN : maxNaN;
            if (indexForNaN === undefined) throw new Error('No value available for NaN');
            arbitraryGenerated.value = indexForNaN;

            // Act
            const { value_: f } = arb.generate(mrng, biasFactor);

            // Assert
            expect(f).toBe(Number.NaN);
          },
        ),
      ));
  });

  describe('without NaN', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { noNaN, noInteger, ...noNaNRecordConstraints } = defaultFloatRecordConstraints;

    it('should ask integers between the indexes corresponding to min and max', () => {
      fc.assert(
        fc.property(floatConstraints(noNaNRecordConstraints), (ctDraft) => {
          // Arrange
          const ct = { ...ctDraft, noNaN: true };
          const integer = spyInteger();
          const { min, max } = minMaxForConstraints(ct);
          const minIndex = floatToIndex(min);
          const maxIndex = floatToIndex(max);
          const expectedMinIndex = ct.minExcluded ? minIndex + 1 : minIndex;
          const expectedMaxIndex = ct.maxExcluded ? maxIndex - 1 : maxIndex;

          // Act
          float(ct);

          // Assert
          expect(integer).toHaveBeenCalledTimes(1);
          expect(integer).toHaveBeenCalledWith({ min: expectedMinIndex, max: expectedMaxIndex });
        }),
      );
    });
  });
});

describe('float (integration)', () => {
  type Extra = FloatConstraints | undefined;
  const extraParameters: fc.Arbitrary<Extra> = fc.option(floatConstraints(), { nil: undefined });

  const isCorrect = (v: number, extra: Extra) => {
    expect(typeof v).toBe('number'); // should always produce numbers
    expect(is32bits(v)).toBe(true); // should always produce 32-bit floats

    if (extra === undefined) {
      return; // no other constraints
    }
    if (extra.noInteger) {
      expect(v).toSatisfy((v) => !Number.isInteger(v)); // should not produce integer values
    }
    if (extra.noNaN) {
      expect(v).not.toBe(Number.NaN); // should not produce NaN if explicitely asked not too
    }
    if (extra.min !== undefined && !Number.isNaN(v)) {
      expect(v).toBeGreaterThanOrEqual(extra.min); // should always be greater than min when specified
    }
    if (extra.max !== undefined && !Number.isNaN(v)) {
      expect(v).toBeLessThanOrEqual(extra.max); // should always be smaller than max when specified
    }
    if (extra.noDefaultInfinity) {
      if (extra.min === undefined) {
        expect(v).not.toBe(Number.NEGATIVE_INFINITY); // should not produce -infinity when noInfinity and min unset
      }
      if (extra.max === undefined) {
        expect(v).not.toBe(Number.POSITIVE_INFINITY); // should not produce +infinity when noInfinity and max unset
      }
    }
  };

  const isStrictlySmaller = (fa: number, fb: number) =>
    Math.abs(fa) < Math.abs(fb) || //              Case 1: abs(a) < abs(b)
    (Object.is(fa, +0) && Object.is(fb, -0)) || // Case 2: +0 < -0  --> we shrink from -0 to +0
    (!Number.isNaN(fa) && Number.isNaN(fb)); //    Case 3: notNaN < NaN, NaN is one of the extreme values

  const floatBuilder = (extra: Extra) => float(extra);

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(floatBuilder, { extraParameters });
  });

  it('should only produce correct values', () => {
    assertProduceCorrectValues(floatBuilder, isCorrect, { extraParameters });
  });

  it('should produce values seen as shrinkable without any context', () => {
    assertProduceValuesShrinkableWithoutContext(floatBuilder, { extraParameters });
  });

  it('should be able to shrink to the same values without initial context', () => {
    assertShrinkProducesSameValueWithoutInitialContext(floatBuilder, { extraParameters });
  });

  it('should preserve strictly smaller ordering in shrink', () => {
    assertShrinkProducesStrictlySmallerValue(floatBuilder, isStrictlySmaller, { extraParameters });
  });
});

// Helpers

function spyInteger() {
  const { instance, map } = fakeArbitrary<number>();
  const { instance: mappedInstance } = fakeArbitrary();
  const integer = vi.spyOn(IntegerMock, 'integer');
  integer.mockReturnValue(instance);
  map.mockReturnValue(mappedInstance);
  return integer;
}

function spyIntegerWithValue(value: () => number) {
  const { instance } = fakeArbitraryStaticValue<number>(value);
  const integer = vi.spyOn(IntegerMock, 'integer');
  integer.mockReturnValue(instance);
  return integer;
}
