import * as fc from '../../../../lib/fast-check';

import { floatNext, FloatNextConstraints } from '../../../../src/arbitrary/_next/floatNext';
import {
  floatNextConstraints,
  float32raw,
  isNotNaN32bits,
  float64raw,
  isStrictlySmaller,
  defaultFloatRecordConstraints,
  is32bits,
} from '../../check/arbitrary/generic/FloatingPointHelpers';
import { floatToIndex, indexToFloat, MAX_VALUE_32 } from '../../../../src/arbitrary/_internals/helpers/FloatHelpers';
import { convertFromNextWithShrunkOnce, convertToNext } from '../../../../src/check/arbitrary/definition/Converters';

import { fakeNextArbitrary, fakeNextArbitraryStaticValue } from '../../check/arbitrary/generic/NextArbitraryHelpers';
import { fakeRandom } from '../../check/arbitrary/generic/RandomHelpers';

import {
  assertProduceCorrectValues,
  assertShrinkProducesStrictlySmallerValue,
  assertProduceSameValueGivenSameSeed,
} from '../../check/arbitrary/generic/NextArbitraryAssertions';

import * as IntegerMock from '../../../../src/arbitrary/integer';

function beforeEachHook() {
  jest.resetModules();
  jest.restoreAllMocks();
}
beforeEach(beforeEachHook);
fc.configureGlobal({
  ...fc.readConfigureGlobal(),
  beforeEach: beforeEachHook,
});

function minMaxForConstraints(ct: FloatNextConstraints) {
  const noDefaultInfinity = ct.noDefaultInfinity;
  const {
    min = noDefaultInfinity ? -MAX_VALUE_32 : Number.NEGATIVE_INFINITY,
    max = noDefaultInfinity ? MAX_VALUE_32 : Number.POSITIVE_INFINITY,
  } = ct;
  return { min, max };
}

describe('floatNext', () => {
  it('should accept any valid range of 32-bit floating point numbers (including infinity)', () => {
    fc.assert(
      fc.property(floatNextConstraints(), (ct) => {
        // Arrange
        spyInteger();

        // Act
        const arb = floatNext(ct);

        // Assert
        expect(arb).toBeDefined();
      })
    );
  });

  it('should accept any constraits defining min (32-bit float not-NaN) equal to max', () => {
    fc.assert(
      fc.property(
        float32raw(),
        fc.record({ noDefaultInfinity: fc.boolean(), noNaN: fc.boolean() }, { withDeletedKeys: true }),
        (f, otherCt) => {
          // Arrange
          fc.pre(isNotNaN32bits(f));
          spyInteger();

          // Act
          const arb = floatNext({ ...otherCt, min: f, max: f });

          // Assert
          expect(arb).toBeDefined();
        }
      )
    );
  });

  it('should reject non-32-bit or NaN floating point numbers if specified for min', () => {
    fc.assert(
      fc.property(float64raw(), (f64) => {
        // Arrange
        fc.pre(!isNotNaN32bits(f64));
        const integer = spyInteger();

        // Act / Assert
        expect(() => floatNext({ min: f64 })).toThrowError();
        expect(integer).not.toHaveBeenCalled();
      })
    );
  });

  it('should reject non-32-bit or NaN floating point numbers if specified for max', () => {
    fc.assert(
      fc.property(float64raw(), (f64) => {
        // Arrange
        fc.pre(!isNotNaN32bits(f64));
        const integer = spyInteger();

        // Act / Assert
        expect(() => floatNext({ max: f64 })).toThrowError();
        expect(integer).not.toHaveBeenCalled();
      })
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
        expect(() => floatNext({ min, max })).toThrowError();
        expect(integer).not.toHaveBeenCalled();
      })
    );
  });

  it('should reject impossible noDefaultInfinity-based ranges', () => {
    // Arrange
    const integer = spyInteger();

    // Act / Assert
    expect(() => floatNext({ min: Number.POSITIVE_INFINITY, noDefaultInfinity: true })).toThrowError();
    expect(() => floatNext({ max: Number.NEGATIVE_INFINITY, noDefaultInfinity: true })).toThrowError();
    expect(integer).not.toHaveBeenCalled();
  });

  it('should properly convert integer value for index between min and max into its associated float value', () =>
    fc.assert(
      fc.property(fc.option(floatNextConstraints(), { nil: undefined }), fc.maxSafeNat(), (ct, mod) => {
        // Arrange
        const { instance: mrng } = fakeRandom();
        const { min, max } = minMaxForConstraints(ct || {});
        const minIndex = floatToIndex(min);
        const maxIndex = floatToIndex(max);
        const arbitraryGeneratedIndex = (mod % (maxIndex - minIndex + 1)) + minIndex;
        spyIntegerWithValue(() => arbitraryGeneratedIndex);

        // Act
        const arb = floatNext(ct);
        const { value_: f } = arb.generate(mrng);

        // Assert
        expect(f).toBe(indexToFloat(arbitraryGeneratedIndex));
      })
    ));

  describe('with NaN', () => {
    const withNaNRecordConstraints = { ...defaultFloatRecordConstraints, noNaN: fc.constant(false) };

    it('should ask for a range with one extra value (far from zero)', () => {
      fc.assert(
        fc.property(floatNextConstraints(withNaNRecordConstraints), (ct) => {
          // Arrange
          const { max } = minMaxForConstraints(ct);
          const integer = spyInteger();

          // Act
          floatNext({ ...ct, noNaN: true });
          floatNext(ct);

          // Assert
          expect(integer).toHaveBeenCalledTimes(2);
          const integerConstraintsNoNaN = integer.mock.calls[0][0];
          const integerConstraintsWithNaN = integer.mock.calls[1][0];
          if (max > 0) {
            // max > 0  --> NaN will be added as the greatest value
            expect(integerConstraintsWithNaN.min).toBe(integerConstraintsNoNaN.min);
            expect(integerConstraintsWithNaN.max).toBe(integerConstraintsNoNaN.max! + 1);
          } else {
            // max <= 0 --> NaN will be added as the smallest value
            expect(integerConstraintsWithNaN.min).toBe(integerConstraintsNoNaN.min! - 1);
            expect(integerConstraintsWithNaN.max).toBe(integerConstraintsNoNaN.max);
          }
        })
      );
    });

    it('should properly convert the extra value to NaN', () =>
      fc.assert(
        fc.property(floatNextConstraints(withNaNRecordConstraints), (ct) => {
          // Arrange
          // Setup mocks for integer
          const { instance: mrng } = fakeRandom();
          const arbitraryGenerated = { value: Number.NaN };
          const integer = spyIntegerWithValue(() => arbitraryGenerated.value);
          // Call float next to find out the value required for NaN
          floatNext({ ...ct, noNaN: true });
          const arb = floatNext(ct);
          // Extract NaN "index"
          const { min: minNonNaN } = integer.mock.calls[0][0];
          const { min: minNaN, max: maxNaN } = integer.mock.calls[1][0];
          const indexForNaN = minNonNaN !== minNaN ? minNaN : maxNaN;
          if (indexForNaN === undefined) throw new Error('No value available for NaN');
          arbitraryGenerated.value = indexForNaN;

          // Act
          const { value_: f } = arb.generate(mrng);

          // Assert
          expect(f).toBe(Number.NaN);
        })
      ));
  });

  describe('without NaN', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { noNaN, ...noNaNRecordConstraints } = defaultFloatRecordConstraints;

    it('should ask integers between the indexes corresponding to min and max', () => {
      fc.assert(
        fc.property(floatNextConstraints(noNaNRecordConstraints), (ctDraft) => {
          // Arrange
          const ct = { ...ctDraft, noNaN: true };
          const integer = spyInteger();
          const { min, max } = minMaxForConstraints(ct);
          const minIndex = floatToIndex(min);
          const maxIndex = floatToIndex(max);

          // Act
          floatNext(ct);

          // Assert
          expect(integer).toHaveBeenCalledTimes(1);
          expect(integer).toHaveBeenCalledWith({ min: minIndex, max: maxIndex });
        })
      );
    });
  });
});

describe('floatNext (integration)', () => {
  type Extra = FloatNextConstraints | undefined;
  const extraParameters: fc.Arbitrary<Extra> = fc.option(floatNextConstraints(), { nil: undefined });

  const isCorrect = (v: number, extra: Extra) => {
    expect(typeof v).toBe('number'); // should always produce numbers
    expect(is32bits(v)).toBe(true); // should always produce 32-bit floats
    if (Number.isNaN(v)) {
      expect(extra === undefined || !extra.noNaN).toBe(true); // should not produce NaN if explicitely asked not too
    }
    expect(extra === undefined || extra.min === undefined || v >= extra.min).toBe(true); // should always be greater than min when specified
    expect(extra === undefined || extra.max === undefined || v <= extra.max).toBe(true); // should always be smaller than max when specified
    if (extra !== undefined && extra.noDefaultInfinity) {
      expect(extra.min !== undefined || v !== Number.NEGATIVE_INFINITY).toBe(true); // should not produce -infinity when noInfinity and min unset
      expect(extra.max !== undefined || v !== Number.POSITIVE_INFINITY).toBe(true); // should not produce +infinity when noInfinity and max unset
    }
  };

  const isStrictlySmaller = (fa: number, fb: number) =>
    Math.abs(fa) < Math.abs(fb) || //              Case 1: abs(a) < abs(b)
    (Object.is(fa, +0) && Object.is(fb, -0)) || // Case 2: +0 < -0  --> we shrink from -0 to +0
    (!Number.isNaN(fa) && Number.isNaN(fb)); //    Case 3: notNaN < NaN, NaN is one of the extreme values

  const floatNextBuilder = (extra: Extra) => convertToNext(floatNext(extra));

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(floatNextBuilder, { extraParameters });
  });

  it('should only produce correct values', () => {
    assertProduceCorrectValues(floatNextBuilder, isCorrect, { extraParameters });
  });

  // Not Implemented Yet!
  //it('should produce values seen as shrinkable without any context', () => {
  //  assertProduceValuesShrinkableWithoutContext(floatNextBuilder, { extraParameters });
  //});

  // Not Implemented Yet!
  //it('should be able to shrink to the same values without initial context', () => {
  //  assertShrinkProducesSameValueWithoutInitialContext(floatNextBuilder, { extraParameters });
  //});

  it('should preserve strictly smaller ordering in shrink', () => {
    assertShrinkProducesStrictlySmallerValue(floatNextBuilder, isStrictlySmaller, { extraParameters });
  });
});

// Helpers

function spyInteger() {
  const { instance, map } = fakeNextArbitrary<number>();
  const { instance: mappedInstance } = fakeNextArbitrary();
  const integer = jest.spyOn(IntegerMock, 'integer');
  integer.mockImplementation(() => convertFromNextWithShrunkOnce(instance, undefined));
  map.mockReturnValue(mappedInstance);
  return integer;
}

function spyIntegerWithValue(value: () => number) {
  const { instance } = fakeNextArbitraryStaticValue<number>(value);
  const integer = jest.spyOn(IntegerMock, 'integer');
  integer.mockImplementation(() => convertFromNextWithShrunkOnce(instance, undefined));
  return integer;
}
