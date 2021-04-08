import * as fc from '../../../../lib/fast-check';

import {
  decomposeFloat,
  floatToIndex,
  indexToFloat,
  EPSILON_32,
  MAX_VALUE_32,
  MIN_VALUE_32,
  floatNext,
  FloatNextConstraints,
} from '../../../../src/check/arbitrary/FloatNextArbitrary';
import {
  floatNextConstraints,
  float32raw,
  isNotNaN32bits,
  float64raw,
  isStrictlySmaller,
  isFiniteNotNaN32bits,
  defaultFloatRecordConstraints,
} from './generic/FloatingPointHelpers';

import { mocked } from 'ts-jest/utils';
import { arbitraryFor } from './generic/ArbitraryBuilder';
import * as stubRng from '../../stubs/generators';

import * as IntegerMock from '../../../../src/arbitrary/integer';
jest.mock('../../../../src/arbitrary/integer');

const mrng = () => stubRng.mutable.nocall();

function minMaxForConstraints(ct: FloatNextConstraints) {
  const noDefaultInfinity = ct.noDefaultInfinity;
  const {
    min = noDefaultInfinity ? -MAX_VALUE_32 : Number.NEGATIVE_INFINITY,
    max = noDefaultInfinity ? MAX_VALUE_32 : Number.POSITIVE_INFINITY,
  } = ct;
  return { min, max };
}

function mockNoOpIntegerArb(opts: { single?: boolean } = {}) {
  // Mocking integer: not expecting any call there
  const { integer } = mocked(IntegerMock);
  if (opts.single) integer.mockImplementationOnce(() => arbitraryFor([]));
  else integer.mockImplementation(() => arbitraryFor([]));
  return integer;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.resetAllMocks();
});
const previousGlobal = fc.readConfigureGlobal();
fc.configureGlobal({
  ...previousGlobal,
  beforeEach: () => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  },
});

describe('FloatNextArbitrary', () => {
  describe('floatNext', () => {
    it('Should accept any valid range of 32-bit floating point numbers (including infinity)', () =>
      fc.assert(
        fc.property(floatNextConstraints(), (ct) => {
          mockNoOpIntegerArb();
          expect(floatNext(ct)).toBeDefined();
        })
      ));
    it('Should accept any constraits defining min (32-bit float not-NaN) equal to max', () =>
      fc.assert(
        fc.property(
          float32raw(),
          fc.record({ noDefaultInfinity: fc.boolean(), noNaN: fc.boolean() }, { withDeletedKeys: true }),
          (f, otherCt) => {
            fc.pre(isNotNaN32bits(f));
            mockNoOpIntegerArb();
            expect(floatNext({ ...otherCt, min: f, max: f })).toBeDefined();
          }
        )
      ));
    it('Should reject non-32-bit or NaN floating point numbers if specified for min', () =>
      fc.assert(
        fc.property(float64raw(), (f64) => {
          fc.pre(!isNotNaN32bits(f64));
          mockNoOpIntegerArb();
          expect(() => floatNext({ min: f64 })).toThrowError();
        })
      ));
    it('Should reject non-32-bit or NaN floating point numbers if specified for max', () =>
      fc.assert(
        fc.property(float64raw(), (f64) => {
          fc.pre(!isNotNaN32bits(f64));
          mockNoOpIntegerArb();
          expect(() => floatNext({ max: f64 })).toThrowError();
        })
      ));
    it('Should reject if specified min is strictly greater than max', () =>
      fc.assert(
        fc.property(float32raw(), float32raw(), (fa32, fb32) => {
          fc.pre(isNotNaN32bits(fa32));
          fc.pre(isNotNaN32bits(fb32));
          fc.pre(!Object.is(fa32, fb32)); // Object.is can distinguish -0 from 0, while !== cannot
          mockNoOpIntegerArb();
          const min = isStrictlySmaller(fa32, fb32) ? fb32 : fa32;
          const max = isStrictlySmaller(fa32, fb32) ? fa32 : fb32;
          expect(() => floatNext({ min, max })).toThrowError();
        })
      ));
    it('Should reject impossible noDefaultInfinity-based ranges', () => {
      mockNoOpIntegerArb();
      expect(() => floatNext({ min: Number.POSITIVE_INFINITY, noDefaultInfinity: true })).toThrowError();
      expect(() => floatNext({ max: Number.NEGATIVE_INFINITY, noDefaultInfinity: true })).toThrowError();
    });
    it('Should properly convert integer value for index between min and max into its associated float value', () =>
      fc.assert(
        fc.property(fc.option(floatNextConstraints(), { nil: undefined }), fc.maxSafeNat(), (ct, mod) => {
          // Arrange
          const { integer } = mocked(IntegerMock);
          const { min, max } = minMaxForConstraints(ct || {});
          const minIndex = floatToIndex(min);
          const maxIndex = floatToIndex(max);
          const arbitraryGeneratedIndex = (mod % (maxIndex - minIndex + 1)) + minIndex;
          integer.mockImplementationOnce(() => arbitraryFor([{ value: arbitraryGeneratedIndex }]));

          // Act
          const arb = floatNext(ct);
          const { value_: f } = arb.generate(mrng());

          // Assert
          expect(f).toBe(indexToFloat(arbitraryGeneratedIndex));
        })
      ));

    describe('with NaN', () => {
      const withNaNRecordConstraints = { ...defaultFloatRecordConstraints, noNaN: fc.constant(false) };

      it('Should ask for a range with one extra value (far from zero)', () =>
        fc.assert(
          fc.property(floatNextConstraints(withNaNRecordConstraints), fc.maxSafeInteger(), (ct) => {
            // Arrange
            const { max } = minMaxForConstraints(ct);
            const integer = mockNoOpIntegerArb();

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
        ));
      it('Should properly convert the extra value to NaN', () =>
        fc.assert(
          fc.property(floatNextConstraints(withNaNRecordConstraints), fc.maxSafeNat(), (ct) => {
            // Arrange
            // Setup mocks for integer
            const arbitraryGenerated = { value: Number.NaN };
            const integer = mockNoOpIntegerArb({ single: true });
            integer.mockImplementationOnce(() => arbitraryFor([arbitraryGenerated]));
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
            const { value_: f } = arb.generate(mrng());

            // Assert
            expect(f).toBe(Number.NaN);
          })
        ));
    });

    describe('without NaN', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { noNaN, ...noNaNRecordConstraints } = defaultFloatRecordConstraints;

      it('Should ask integers between the indexes corresponding to min and max', () =>
        fc.assert(
          fc.property(floatNextConstraints(noNaNRecordConstraints), (ctDraft) => {
            // Arrange
            const ct = { ...ctDraft, noNaN: true };
            const integer = mockNoOpIntegerArb();
            const { min, max } = minMaxForConstraints(ct);
            const minIndex = floatToIndex(min);
            const maxIndex = floatToIndex(max);

            // Act
            floatNext(ct);

            // Assert
            expect(integer).toHaveBeenCalledTimes(1);
            expect(integer).toHaveBeenCalledWith({ min: minIndex, max: maxIndex });
          })
        ));
    });
  });

  describe('decomposeFloat (@internal)', () => {
    it('Should properly decompose basic values', () => {
      expect(decomposeFloat(0)).toEqual({ exponent: -126, significand: 0 });
      expect(decomposeFloat(1)).toEqual({ exponent: 0, significand: 1 });
      expect(decomposeFloat(128)).toEqual({ exponent: 7, significand: 1 });
      expect(decomposeFloat(201)).toEqual({ exponent: 7, significand: 1.5703125 });
    });
    it('Should properly decompose negative values', () => {
      expect(decomposeFloat(-0)).toEqual({ exponent: -126, significand: -0 });
      expect(decomposeFloat(-1)).toEqual({ exponent: 0, significand: -1 });
    });
    it('Should properly decompose extreme values', () => {
      expect(decomposeFloat(MAX_VALUE_32)).toEqual({ exponent: 127, significand: 1 + (2 ** 23 - 1) / 2 ** 23 });
      expect(decomposeFloat(MIN_VALUE_32)).toEqual({ exponent: -126, significand: 2 ** -23 });
      expect(decomposeFloat(EPSILON_32)).toEqual({ exponent: -23, significand: 1 });
      expect(decomposeFloat(1 + EPSILON_32)).toEqual({ exponent: 0, significand: 1 + 2 ** -23 });
    });
    it('Should decompose a 32-bit float into its equivalent (significand, exponent)', () =>
      fc.assert(
        fc.property(float32raw(), (f32) => {
          fc.pre(isFiniteNotNaN32bits(f32));
          const { exponent, significand } = decomposeFloat(f32);
          expect(significand * 2 ** exponent).toBe(f32);
        })
      ));
  });

  describe('floatToIndex (@internal)', () => {
    it('Should properly compute indexes', () => {
      expect(floatToIndex(0)).toBe(0);
      expect(floatToIndex(MIN_VALUE_32)).toBe(1);
      expect(floatToIndex(2 * MIN_VALUE_32)).toBe(2);
      expect(floatToIndex(3 * MIN_VALUE_32)).toBe(3);
      // EPSILON_32 === 1. * 2**-23 --> m = 1, e = -23
      // index(EPSILON_32) = 2**24 + (-23 - (-126) -1) * 2**23
      expect(floatToIndex(EPSILON_32)).toBe(872415232);
      // index(1 - EPSILON_32 / 2) = index(1) - 1
      expect(floatToIndex(1 - EPSILON_32 / 2)).toEqual(1065353215);
      // 1 === 1. * 2**0 --> m = 1, e = 0
      // index(1) = 2**24 + (0 - (-126) -1) * 2**23
      expect(floatToIndex(1)).toEqual(1065353216);
      // index(1 + EPSILON_32) = index(1) + 1
      expect(floatToIndex(1 + EPSILON_32)).toEqual(1065353217);
      // index(2 - EPSILON_32) = index(2) - 1 = index(1 + (2 ** 23 - 1) * EPSILON_32)
      expect(floatToIndex(2 - EPSILON_32)).toEqual(1073741823);
      // 1 === 1. * 2**1 --> m = 1, e = 1
      // index(2) = index(1) + 2**23
      expect(floatToIndex(2)).toEqual(1073741824);
      expect(floatToIndex(MAX_VALUE_32)).toBe(2139095039);
    });
    it('Should properly compute negative indexes', () => {
      expect(floatToIndex(-0)).toEqual(-1);
      expect(floatToIndex(-MIN_VALUE_32)).toBe(-2);
      expect(floatToIndex(-MAX_VALUE_32)).toBe(-2139095040);
    });
    it('Should properly compute indexes for infinity', () => {
      expect(floatToIndex(Number.NEGATIVE_INFINITY)).toBe(floatToIndex(-MAX_VALUE_32) - 1);
      expect(floatToIndex(Number.POSITIVE_INFINITY)).toBe(floatToIndex(MAX_VALUE_32) + 1);
    });
    it('Should be able to infer index for negative float from the positive one', () =>
      fc.assert(
        fc.property(float32raw(), (f) => {
          fc.pre(isNotNaN32bits(f));
          const posD = f > 0 || 1 / f > 0 ? f : -f;
          const indexPos = floatToIndex(posD);
          const indexNeg = floatToIndex(-posD);
          expect(indexNeg).toEqual(-indexPos - 1);
        })
      ));
    it('Should return index +1 for the successor of a given float', () =>
      fc.assert(
        fc.property(
          fc.integer({ min: -126, max: +127 }),
          fc.integer({ min: 0, max: 2 ** 24 - 1 }),
          (exponent, rescaledSignificand) => {
            fc.pre(exponent === -126 || rescaledSignificand >= 2 ** 23); // valid
            fc.pre(exponent !== 127 || rescaledSignificand !== 2 ** 24 - 1); // not max
            const current = rescaledSignificand * EPSILON_32 * 2 ** exponent;
            const next = (rescaledSignificand + 1) * EPSILON_32 * 2 ** exponent;
            expect(floatToIndex(next)).toEqual(floatToIndex(current) + 1);
          }
        )
      ));
    it('Should preserve ordering between two floats', () =>
      fc.assert(
        fc.property(float32raw(), float32raw(), (fa32, fb32) => {
          fc.pre(isNotNaN32bits(fa32) && isNotNaN32bits(fb32));
          if (isStrictlySmaller(fa32, fb32)) expect(floatToIndex(fa32)).toBeLessThan(floatToIndex(fb32));
          else expect(floatToIndex(fa32)).toBeGreaterThanOrEqual(floatToIndex(fb32));
        })
      ));
  });

  describe('indexToFloat (@internal)', () => {
    it('Should properly find floats corresponding to well-known values', () => {
      expect(indexToFloat(-2139095041)).toBe(Number.NEGATIVE_INFINITY);
      expect(indexToFloat(-2139095040)).toBe(-MAX_VALUE_32);
      expect(indexToFloat(-1)).toBe(-0);
      expect(indexToFloat(0)).toBe(0);
      expect(indexToFloat(872415232)).toBe(EPSILON_32);
      expect(indexToFloat(2139095039)).toBe(MAX_VALUE_32);
      expect(indexToFloat(2139095040)).toBe(Number.POSITIVE_INFINITY);
    });
    it('Should only produce 32-bit floating point numbers (excluding NaN)', () =>
      fc.assert(
        fc.property(fc.integer(-2139095041, 2139095040), (index) => {
          const f = indexToFloat(index);
          expect(f).toBe(new Float32Array([f])[0]);
        })
      ));
    it('Should reverse floatToIndex', () =>
      fc.assert(
        fc.property(float32raw(), (f32) => {
          fc.pre(isNotNaN32bits(f32));
          expect(indexToFloat(floatToIndex(f32))).toBe(f32);
        })
      ));
    it('Should be reversed by floatToIndex', () =>
      fc.assert(
        fc.property(fc.integer(-2139095041, 2139095040), (index) => {
          // The test below checks that indexToFloat(floatToIndex) is identity
          // It does not confirm that floatToIndex(indexToFloat)) is identity
          expect(floatToIndex(indexToFloat(index))).toBe(index);
        })
      ));
  });
});
