import * as fc from '../../../../lib/fast-check';

import { floatNext, FloatNextConstraints } from '../../../../src/arbitrary/_next/floatNext';
import {
  floatNextConstraints,
  float32raw,
  isNotNaN32bits,
  float64raw,
  isStrictlySmaller,
  defaultFloatRecordConstraints,
} from '../../check/arbitrary/generic/FloatingPointHelpers';
import { floatToIndex, indexToFloat, MAX_VALUE_32 } from '../../../../src/arbitrary/_internals/helpers/FloatHelpers';
import { convertFromNextWithShrunkOnce } from '../../../../src/check/arbitrary/definition/Converters';

import { fakeNextArbitrary, fakeNextArbitraryStaticValue } from '../../check/arbitrary/generic/NextArbitraryHelpers';
import { fakeRandom } from '../../check/arbitrary/generic/RandomHelpers';

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
