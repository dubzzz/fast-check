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

import { mocked } from 'ts-jest/utils';
import { arbitraryFor } from '../../check/arbitrary/generic/ArbitraryBuilder';
import * as stubRng from '../../stubs/generators';

import * as IntegerMock from '../../../../src/arbitrary/integer';
import { floatToIndex, indexToFloat, MAX_VALUE_32 } from '../../../../src/arbitrary/_internals/helpers/FloatHelpers';
jest.mock('../../../src/arbitrary/integer');

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
        fc.property(floatNextConstraints(withNaNRecordConstraints), (ct) => {
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
        fc.property(floatNextConstraints(withNaNRecordConstraints), (ct) => {
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
