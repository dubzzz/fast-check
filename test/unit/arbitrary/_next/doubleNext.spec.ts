import * as fc from '../../../../lib/fast-check';

import { doubleNext, DoubleNextConstraints } from '../../../../src/arbitrary/_next/doubleNext';

import { mocked } from 'ts-jest/utils';
import { arbitraryFor } from '../../check/arbitrary/generic/ArbitraryBuilder';
import * as stubRng from '../../stubs/generators';

import * as ArrayInt64ArbitraryMock from '../../../../src/arbitrary/_internals/ArrayInt64Arbitrary';
import {
  add64,
  ArrayInt64,
  isEqual64,
  substract64,
  Unit64,
} from '../../../../src/arbitrary/_internals/helpers/ArrayInt64';
import {
  defaultDoubleRecordConstraints,
  doubleNextConstraints,
  float64raw,
  isStrictlySmaller,
} from '../../check/arbitrary/generic/FloatingPointHelpers';
import { doubleToIndex, indexToDouble } from '../../../../src/arbitrary/_internals/helpers/DoubleHelpers';
jest.mock('../../../../src/arbitrary/_internals/ArrayInt64Arbitrary');

type Index = ReturnType<typeof doubleToIndex>;
const toIndex = (raw: bigint | string): Index => {
  const b = typeof raw === 'string' ? BigInt(raw) : raw;
  const pb = b < BigInt(0) ? -b : b;
  return { sign: b < BigInt(0) ? -1 : 1, data: [Number(pb >> BigInt(32)), Number(pb & BigInt(0xffffffff))] };
};
const toBigInt = (index: Index): bigint => {
  return BigInt(index.sign) * ((BigInt(index.data[0]) << BigInt(32)) + BigInt(index.data[1]));
};

const mrng = () => stubRng.mutable.nocall();

function minMaxForConstraints(ct: DoubleNextConstraints) {
  const noDefaultInfinity = ct.noDefaultInfinity;
  const {
    min = noDefaultInfinity ? -Number.MAX_VALUE : Number.NEGATIVE_INFINITY,
    max = noDefaultInfinity ? Number.MAX_VALUE : Number.POSITIVE_INFINITY,
  } = ct;
  return { min, max };
}

function mockNoOpArrayInt64Arb(opts: { single?: boolean } = {}) {
  // Mocking integer: not expecting any call there
  const { arrayInt64 } = mocked(ArrayInt64ArbitraryMock);
  if (opts.single) arrayInt64.mockImplementationOnce(() => arbitraryFor([]));
  else arrayInt64.mockImplementation(() => arbitraryFor([]));
  return arrayInt64;
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

describe('doubleNext', () => {
  it('Should accept any valid range of floating point numbers (including infinity)', () =>
    fc.assert(
      fc.property(doubleNextConstraints(), (ct) => {
        mockNoOpArrayInt64Arb();
        expect(doubleNext(ct)).toBeDefined();
      })
    ));
  it('Should accept any constraits defining min (not-NaN) equal to max', () =>
    fc.assert(
      fc.property(
        float64raw(),
        fc.record({ noDefaultInfinity: fc.boolean(), noNaN: fc.boolean() }, { withDeletedKeys: true }),
        (f, otherCt) => {
          fc.pre(!Number.isNaN(f));
          mockNoOpArrayInt64Arb();
          expect(doubleNext({ ...otherCt, min: f, max: f })).toBeDefined();
        }
      )
    ));
  it('Should reject NaN if specified for min', () => {
    mockNoOpArrayInt64Arb();
    expect(() => doubleNext({ min: Number.NaN })).toThrowError();
  });
  it('Should reject NaN if specified for max', () => {
    mockNoOpArrayInt64Arb();
    expect(() => doubleNext({ max: Number.NaN })).toThrowError();
  });
  it('Should reject if specified min is strictly greater than max', () =>
    fc.assert(
      fc.property(float64raw(), float64raw(), (da, db) => {
        fc.pre(!Number.isNaN(da));
        fc.pre(!Number.isNaN(db));
        fc.pre(!Object.is(da, db)); // Object.is can distinguish -0 from 0, while !== cannot
        mockNoOpArrayInt64Arb();
        const min = isStrictlySmaller(da, db) ? db : da;
        const max = isStrictlySmaller(da, db) ? da : db;
        expect(() => doubleNext({ min, max })).toThrowError();
      })
    ));
  it('Should reject impossible noDefaultInfinity-based ranges', () => {
    mockNoOpArrayInt64Arb();
    expect(() => doubleNext({ min: Number.POSITIVE_INFINITY, noDefaultInfinity: true })).toThrowError();
    expect(() => doubleNext({ max: Number.NEGATIVE_INFINITY, noDefaultInfinity: true })).toThrowError();
  });

  if (typeof BigInt !== 'undefined') {
    it('Should properly convert integer value for index between min and max into its associated float value', () =>
      fc.assert(
        fc.property(fc.option(doubleNextConstraints(), { nil: undefined }), fc.bigUintN(64), (ct, mod) => {
          // Arrange
          const { arrayInt64 } = mocked(ArrayInt64ArbitraryMock);
          const { min, max } = minMaxForConstraints(ct || {});
          const minIndex = doubleToIndex(min);
          const maxIndex = doubleToIndex(max);
          const arbitraryGeneratedIndex = toIndex(
            (mod % (toBigInt(maxIndex) - toBigInt(minIndex) + BigInt(1))) + toBigInt(minIndex)
          );
          arrayInt64.mockImplementationOnce(() => arbitraryFor([{ value: arbitraryGeneratedIndex }]));

          // Act
          const arb = doubleNext(ct);
          const { value_: f } = arb.generate(mrng());

          // Assert
          expect(f).toBe(indexToDouble(arbitraryGeneratedIndex));
        })
      ));
  }

  describe('with NaN', () => {
    const withNaNRecordConstraints = { ...defaultDoubleRecordConstraints, noNaN: fc.constant(false) };

    it('Should ask for a range with one extra value (far from zero)', () =>
      fc.assert(
        fc.property(doubleNextConstraints(withNaNRecordConstraints), (ct) => {
          // Arrange
          const { max } = minMaxForConstraints(ct);
          const arrayInt64 = mockNoOpArrayInt64Arb();

          // Act
          doubleNext({ ...ct, noNaN: true });
          doubleNext(ct);

          // Assert
          expect(arrayInt64).toHaveBeenCalledTimes(2);
          const constraintsNoNaN = arrayInt64.mock.calls[0];
          const constraintsWithNaN = arrayInt64.mock.calls[1];
          if (max > 0) {
            // max > 0  --> NaN will be added as the greatest value
            expect(constraintsWithNaN[0]).toEqual(constraintsNoNaN[0]);
            expect(constraintsWithNaN[1]).toEqual(add64(constraintsNoNaN[1], Unit64));
          } else {
            // max <= 0 --> NaN will be added as the smallest value
            expect(constraintsWithNaN[0]).toEqual(substract64(constraintsNoNaN[0], Unit64));
            expect(constraintsWithNaN[1]).toEqual(constraintsNoNaN[1]);
          }
        })
      ));
    it('Should properly convert the extra value to NaN', () =>
      fc.assert(
        fc.property(doubleNextConstraints(withNaNRecordConstraints), (ct) => {
          // Arrange
          // Setup mocks for integer
          const arbitraryGenerated = { value: { sign: 1, data: [Number.NaN, Number.NaN] } as ArrayInt64 };
          const arrayInt64 = mockNoOpArrayInt64Arb({ single: true });
          arrayInt64.mockImplementationOnce(() => arbitraryFor([arbitraryGenerated]));
          // Call float next to find out the value required for NaN
          doubleNext({ ...ct, noNaN: true });
          const arb = doubleNext(ct);
          // Extract NaN "index"
          const [minNonNaN] = arrayInt64.mock.calls[0];
          const [minNaN, maxNaN] = arrayInt64.mock.calls[1];
          const indexForNaN = !isEqual64(minNonNaN, minNaN) ? minNaN : maxNaN;
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
    const { noNaN, ...noNaNRecordConstraints } = defaultDoubleRecordConstraints;

    it('Should ask integers between the indexes corresponding to min and max', () =>
      fc.assert(
        fc.property(doubleNextConstraints(noNaNRecordConstraints), (ctDraft) => {
          // Arrange
          const ct = { ...ctDraft, noNaN: true };
          const arrayInt64 = mockNoOpArrayInt64Arb();
          const { min, max } = minMaxForConstraints(ct);
          const minIndex = doubleToIndex(min);
          const maxIndex = doubleToIndex(max);

          // Act
          doubleNext(ct);

          // Assert
          expect(arrayInt64).toHaveBeenCalledTimes(1);
          expect(arrayInt64).toHaveBeenCalledWith(minIndex, maxIndex);
        })
      ));
  });
});
