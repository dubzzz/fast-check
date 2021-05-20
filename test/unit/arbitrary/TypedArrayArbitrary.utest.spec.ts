import * as fc from '../../../lib/fast-check';
import { int8Array, IntArrayConstraints } from '../../../src/arbitrary/int8Array';
import { int16Array } from '../../../src/arbitrary/int16Array';
import { int32Array } from '../../../src/arbitrary/int32Array';
import { uint8Array } from '../../../src/arbitrary/uint8Array';
import { uint8ClampedArray } from '../../../src/arbitrary/uint8ClampedArray';
import { uint16Array } from '../../../src/arbitrary/uint16Array';
import { uint32Array } from '../../../src/arbitrary/uint32Array';
import { Arbitrary } from '../../../src/check/arbitrary/definition/Arbitrary';

import { mocked } from 'ts-jest/utils';
jest.mock('../../../src/arbitrary/array');
jest.mock('../../../src/arbitrary/integer');
import * as ArrayArbitraryMock from '../../../src/arbitrary/array';
import * as IntegerMock from '../../../src/arbitrary/integer';

const validArrayConstraintsArb = () =>
  fc.record({ minLength: fc.nat(), maxLength: fc.nat() }, { withDeletedKeys: true }).map((ct) => {
    if (ct.minLength !== undefined && ct.maxLength !== undefined && ct.minLength > ct.maxLength) {
      return { minLength: ct.maxLength, maxLength: ct.minLength };
    }
    return ct;
  });

const validIntegerConstraintsArb = (min: number, max: number) =>
  fc.record({ min: fc.integer(min, max), max: fc.integer(min, max) }, { withDeletedKeys: true }).map((ct) => {
    if (ct.min !== undefined && ct.max !== undefined && ct.min > ct.max) {
      return { min: ct.max, max: ct.min };
    }
    return ct;
  });

const invalidIntegerConstraintsArb = (min: number, max: number) =>
  fc.oneof(
    // min > max
    fc
      .record({ min: fc.integer(min, max), max: fc.integer(min, max) })
      .filter(({ min, max }) => min !== max)
      .map((ct) => (ct.min < ct.max ? { min: ct.max, max: ct.min } : ct)),
    // min < lowest
    fc.record({ min: fc.integer(Number.MIN_SAFE_INTEGER, min - 1) }),
    fc.record({ min: fc.integer(Number.MIN_SAFE_INTEGER, min - 1), max: fc.integer(min, max) }),
    // max > highest
    fc.record({ min: fc.integer(min, max), max: fc.integer(max + 1, Number.MAX_SAFE_INTEGER) }),
    fc.record({ max: fc.integer(max + 1, Number.MAX_SAFE_INTEGER) })
  );

beforeEach(() => {
  jest.clearAllMocks();
});
const previousGlobal = fc.readConfigureGlobal();
fc.configureGlobal({
  ...previousGlobal,
  beforeEach: () => {
    jest.clearAllMocks();
  },
});

describe('TypedArrayArbitrary', () => {
  describe('int8Array', () => assessValidIntTypedArray(int8Array, Int8Array, -128, 127));
  describe('uint8Array', () => assessValidIntTypedArray(uint8Array, Uint8Array, 0, 255));
  describe('uint8ClampedArray', () => assessValidIntTypedArray(uint8ClampedArray, Uint8ClampedArray, 0, 255));
  describe('int16Array', () => assessValidIntTypedArray(int16Array, Int16Array, -32768, 32767));
  describe('uint16Array', () => assessValidIntTypedArray(uint16Array, Uint16Array, 0, 65535));
  describe('int32Array', () => assessValidIntTypedArray(int32Array, Int32Array, -0x80000000, 0x7fffffff));
  describe('uint32Array', () => assessValidIntTypedArray(uint32Array, Uint32Array, 0, 0xffffffff));
});

// Helpers

function assessValidIntTypedArray<T>(
  arbFun: (ct?: IntArrayConstraints) => Arbitrary<T>,
  Class: { from: (data: number[]) => T },
  lowestInt: number,
  highestInt: number
): void {
  it('Should be configured with the right boundaries', () => {
    const unsafeFrom = (v: number) => (Class.from([v]) as any)[0];
    expect(unsafeFrom(lowestInt - 1)).not.toBe(lowestInt - 1);
    expect(unsafeFrom(lowestInt)).toBe(lowestInt);
    expect(unsafeFrom(highestInt)).toBe(highestInt);
    expect(unsafeFrom(highestInt + 1)).not.toBe(highestInt + 1);
  });

  it('Should default constraints when not specified', () => {
    // Arrange
    const { integer } = mocked(IntegerMock);
    const { array } = mocked(ArrayArbitraryMock);
    const integerArb = Symbol() as any;
    integer.mockReturnValue(integerArb);
    const arrayMap = jest.fn();
    array.mockReturnValue({ map: arrayMap as ReturnType<typeof array>['map'] } as ReturnType<typeof array>);

    // Act
    arbFun();

    // Assert
    expect(integer).toHaveBeenLastCalledWith({ min: lowestInt, max: highestInt });
    expect(array).toHaveBeenLastCalledWith(integerArb, {});
  });

  it('Should properly distribute constraints across arbitraries when receiving valid ones', () =>
    fc.assert(
      fc.property(validArrayConstraintsArb(), validIntegerConstraintsArb(lowestInt, highestInt), (ctArray, ctInt) => {
        // Arrange
        const { integer } = mocked(IntegerMock);
        const { array } = mocked(ArrayArbitraryMock);
        const integerArb = Symbol() as any;
        integer.mockReturnValue(integerArb);
        const arrayMap = jest.fn();
        array.mockReturnValue({ map: arrayMap as ReturnType<typeof array>['map'] } as ReturnType<typeof array>);

        // Act
        arbFun({ ...ctArray, ...ctInt });

        // Assert
        expect(integer).toHaveBeenLastCalledWith({ min: lowestInt, max: highestInt, ...ctInt });
        expect(array).toHaveBeenLastCalledWith(integerArb, ctArray);
      })
    ));

  it('Should reject invalid integer ranges', () =>
    fc.assert(
      fc.property(validArrayConstraintsArb(), invalidIntegerConstraintsArb(lowestInt, highestInt), (ctArray, ctInt) => {
        // Arrange
        const { integer } = mocked(IntegerMock);
        const { array } = mocked(ArrayArbitraryMock);
        const integerArb = Symbol() as any;
        integer.mockReturnValue(integerArb);
        const arrayMap = jest.fn();
        array.mockReturnValue({ map: arrayMap as ReturnType<typeof array>['map'] } as ReturnType<typeof array>);

        // Act / Assert
        expect(() => arbFun({ ...ctArray, ...ctInt })).toThrowError();
      })
    ));
}
