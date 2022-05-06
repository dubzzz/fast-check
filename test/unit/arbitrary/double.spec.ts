import * as fc from '../../../lib/fast-check';

import { double, DoubleConstraints } from '../../../src/arbitrary/double';
import {
  add64,
  ArrayInt64,
  isEqual64,
  substract64,
  Unit64,
} from '../../../src/arbitrary/_internals/helpers/ArrayInt64';
import {
  defaultDoubleRecordConstraints,
  doubleConstraints,
  float64raw,
  isStrictlySmaller,
} from './__test-helpers__/FloatingPointHelpers';
import { doubleToIndex, indexToDouble } from '../../../src/arbitrary/_internals/helpers/DoubleHelpers';

import { fakeNextArbitrary, fakeNextArbitraryStaticValue } from './__test-helpers__/NextArbitraryHelpers';
import { convertFromNextWithShrunkOnce, convertToNext } from '../../../src/check/arbitrary/definition/Converters';
import { fakeRandom } from './__test-helpers__/RandomHelpers';

import {
  assertProduceCorrectValues,
  assertShrinkProducesStrictlySmallerValue,
  assertProduceSameValueGivenSameSeed,
  assertProduceValuesShrinkableWithoutContext,
  assertShrinkProducesSameValueWithoutInitialContext,
} from './__test-helpers__/NextArbitraryAssertions';

import * as ArrayInt64ArbitraryMock from '../../../src/arbitrary/_internals/ArrayInt64Arbitrary';

function beforeEachHook() {
  jest.resetModules();
  jest.restoreAllMocks();
}
beforeEach(beforeEachHook);
fc.configureGlobal({
  ...fc.readConfigureGlobal(),
  beforeEach: beforeEachHook,
});

describe('double', () => {
  it('should accept any valid range of floating point numbers (including infinity)', () => {
    fc.assert(
      fc.property(doubleConstraints(), (ct) => {
        // Arrange
        spyArrayInt64();

        // Act
        const arb = double(ct);

        // Assert
        expect(arb).toBeDefined();
      })
    );
  });

  it('should accept any constraits defining min (not-NaN) equal to max', () => {
    fc.assert(
      fc.property(
        float64raw(),
        fc.record({ noDefaultInfinity: fc.boolean(), noNaN: fc.boolean() }, { withDeletedKeys: true }),
        (f, otherCt) => {
          // Arrange
          fc.pre(!Number.isNaN(f));
          spyArrayInt64();

          // Act
          const arb = double({ ...otherCt, min: f, max: f });

          // Assert
          expect(arb).toBeDefined();
        }
      )
    );
  });

  it('should reject NaN if specified for min', () => {
    // Arrange
    const arrayInt64 = spyArrayInt64();

    // Act / Assert
    expect(() => double({ min: Number.NaN })).toThrowError();
    expect(arrayInt64).not.toHaveBeenCalled();
  });

  it('should reject NaN if specified for max', () => {
    // Arrange
    const arrayInt64 = spyArrayInt64();

    // Act / Assert
    expect(() => double({ max: Number.NaN })).toThrowError();
    expect(arrayInt64).not.toHaveBeenCalled();
  });

  it('should reject if specified min is strictly greater than max', () => {
    fc.assert(
      fc.property(float64raw(), float64raw(), (da, db) => {
        // Arrange
        fc.pre(!Number.isNaN(da));
        fc.pre(!Number.isNaN(db));
        fc.pre(!Object.is(da, db)); // Object.is can distinguish -0 from 0, while !== cannot
        const arrayInt64 = spyArrayInt64();
        const min = isStrictlySmaller(da, db) ? db : da;
        const max = isStrictlySmaller(da, db) ? da : db;

        // Act / Assert
        expect(() => double({ min, max })).toThrowError();
        expect(arrayInt64).not.toHaveBeenCalled();
      })
    );
  });

  it('should reject impossible noDefaultInfinity-based ranges', () => {
    // Arrange
    const arrayInt64 = spyArrayInt64();

    // Act / Assert
    expect(() => double({ min: Number.POSITIVE_INFINITY, noDefaultInfinity: true })).toThrowError();
    expect(() => double({ max: Number.NEGATIVE_INFINITY, noDefaultInfinity: true })).toThrowError();
    expect(arrayInt64).not.toHaveBeenCalled();
  });

  if (typeof BigInt !== 'undefined') {
    it('should properly convert integer value for index between min and max into its associated float value', () => {
      fc.assert(
        fc.property(fc.option(doubleConstraints(), { nil: undefined }), fc.bigUintN(64), (ct, mod) => {
          // Arrange
          const { instance: mrng } = fakeRandom();
          const { min, max } = minMaxForConstraints(ct || {});
          const minIndex = doubleToIndex(min);
          const maxIndex = doubleToIndex(max);
          const arbitraryGeneratedIndex = toIndex(
            (mod % (toBigInt(maxIndex) - toBigInt(minIndex) + BigInt(1))) + toBigInt(minIndex)
          );
          spyArrayInt64WithValue(() => arbitraryGeneratedIndex);

          // Act
          const arb = double(ct);
          const { value_: f } = arb.generate(mrng);

          // Assert
          expect(f).toBe(indexToDouble(arbitraryGeneratedIndex));
        })
      );
    });
  }

  describe('with NaN', () => {
    const withNaNRecordConstraints = { ...defaultDoubleRecordConstraints, noNaN: fc.constant(false) };

    it('should ask for a range with one extra value (far from zero)', () => {
      fc.assert(
        fc.property(doubleConstraints(withNaNRecordConstraints), (ct) => {
          // Arrange
          const { max } = minMaxForConstraints(ct);
          const arrayInt64 = spyArrayInt64();

          // Act
          double({ ...ct, noNaN: true });
          double(ct);

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
      );
    });

    it('should properly convert the extra value to NaN', () => {
      fc.assert(
        fc.property(doubleConstraints(withNaNRecordConstraints), (ct) => {
          // Arrange
          // Setup mocks for integer
          const { instance: mrng } = fakeRandom();
          const arbitraryGenerated = { value: { sign: 1, data: [Number.NaN, Number.NaN] } as ArrayInt64 };
          const arrayInt64 = spyArrayInt64WithValue(() => arbitraryGenerated.value);
          // Call float next to find out the value required for NaN
          double({ ...ct, noNaN: true });
          const arb = double(ct);
          // Extract NaN "index"
          const [minNonNaN] = arrayInt64.mock.calls[0];
          const [minNaN, maxNaN] = arrayInt64.mock.calls[1];
          const indexForNaN = !isEqual64(minNonNaN, minNaN) ? minNaN : maxNaN;
          if (indexForNaN === undefined) throw new Error('No value available for NaN');
          arbitraryGenerated.value = indexForNaN;

          // Act
          const { value_: f } = arb.generate(mrng);

          // Assert
          expect(f).toBe(Number.NaN);
        })
      );
    });
  });

  describe('without NaN', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { noNaN, ...noNaNRecordConstraints } = defaultDoubleRecordConstraints;

    it('should ask integers between the indexes corresponding to min and max', () => {
      fc.assert(
        fc.property(doubleConstraints(noNaNRecordConstraints), (ctDraft) => {
          // Arrange
          const ct = { ...ctDraft, noNaN: true };
          const arrayInt64 = spyArrayInt64();
          const { min, max } = minMaxForConstraints(ct);
          const minIndex = doubleToIndex(min);
          const maxIndex = doubleToIndex(max);

          // Act
          double(ct);

          // Assert
          expect(arrayInt64).toHaveBeenCalledTimes(1);
          expect(arrayInt64).toHaveBeenCalledWith(minIndex, maxIndex);
        })
      );
    });
  });
});

describe('double (integration)', () => {
  type Extra = DoubleConstraints | undefined;
  const extraParameters: fc.Arbitrary<Extra> = fc.option(doubleConstraints(), { nil: undefined });

  const isCorrect = (v: number, extra: Extra) => {
    expect(typeof v).toBe('number'); // should always produce numbers

    if (extra === undefined) {
      return; // no other constraints
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

  const doubleBuilder = (extra: Extra) => convertToNext(double(extra));

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(doubleBuilder, { extraParameters });
  });

  it('should only produce correct values', () => {
    assertProduceCorrectValues(doubleBuilder, isCorrect, { extraParameters });
  });

  it('should produce values seen as shrinkable without any context', () => {
    assertProduceValuesShrinkableWithoutContext(doubleBuilder, { extraParameters });
  });

  it('should be able to shrink to the same values without initial context', () => {
    assertShrinkProducesSameValueWithoutInitialContext(doubleBuilder, { extraParameters });
  });

  it('should preserve strictly smaller ordering in shrink', () => {
    assertShrinkProducesStrictlySmallerValue(doubleBuilder, isStrictlySmaller, { extraParameters });
  });
});

// Helpers

type Index = ReturnType<typeof doubleToIndex>;

function toIndex(raw: bigint | string): Index {
  const b = typeof raw === 'string' ? BigInt(raw) : raw;
  const pb = b < BigInt(0) ? -b : b;
  return { sign: b < BigInt(0) ? -1 : 1, data: [Number(pb >> BigInt(32)), Number(pb & BigInt(0xffffffff))] };
}

function toBigInt(index: Index): bigint {
  return BigInt(index.sign) * ((BigInt(index.data[0]) << BigInt(32)) + BigInt(index.data[1]));
}

function minMaxForConstraints(ct: DoubleConstraints) {
  const noDefaultInfinity = ct.noDefaultInfinity;
  const {
    min = noDefaultInfinity ? -Number.MAX_VALUE : Number.NEGATIVE_INFINITY,
    max = noDefaultInfinity ? Number.MAX_VALUE : Number.POSITIVE_INFINITY,
  } = ct;
  return { min, max };
}

function spyArrayInt64() {
  const { instance, map } = fakeNextArbitrary<ArrayInt64>();
  const { instance: mappedInstance } = fakeNextArbitrary();
  const arrayInt64 = jest.spyOn(ArrayInt64ArbitraryMock, 'arrayInt64');
  arrayInt64.mockImplementation(() => convertFromNextWithShrunkOnce(instance, undefined));
  map.mockReturnValue(mappedInstance);
  return arrayInt64;
}

function spyArrayInt64WithValue(value: () => ArrayInt64) {
  const { instance } = fakeNextArbitraryStaticValue<ArrayInt64>(value);
  const integer = jest.spyOn(ArrayInt64ArbitraryMock, 'arrayInt64');
  integer.mockImplementation(() => convertFromNextWithShrunkOnce(instance, undefined));
  return integer;
}
