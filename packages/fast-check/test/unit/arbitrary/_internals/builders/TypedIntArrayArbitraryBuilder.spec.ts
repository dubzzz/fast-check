import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { typedIntArrayArbitraryArbitraryBuilder } from '../../../../../src/arbitrary/_internals/builders/TypedIntArrayArbitraryBuilder';

import { FakeIntegerArbitrary, fakeArbitrary, fakeArbitraryStaticValue } from '../../__test-helpers__/ArbitraryHelpers';

import * as ArrayMock from '../../../../../src/arbitrary/array';
import {
  assertProduceCorrectValues,
  assertProduceSameValueGivenSameSeed,
  assertProduceValuesShrinkableWithoutContext,
  assertShrinkProducesSameValueWithoutInitialContext,
} from '../../__test-helpers__/ArbitraryAssertions';
import { declareCleaningHooksForSpies } from '../../__test-helpers__/SpyCleaner';

describe('typedIntArrayArbitraryArbitraryBuilder', () => {
  declareCleaningHooksForSpies();

  it('should default constraints for arbitraryBuilder to defaultMin/Max when not specified', () => {
    fc.assert(
      fc.property(
        defaultsMinMaxTypedInt8Arb(),
        validArrayConstraintsArb(),
        ({ defaultMin, defaultMax, TypedArrayClass }, arrayConstraints) => {
          // Arrange
          const array = vi.spyOn(ArrayMock, 'array');
          const { instance: arrayInstance } = fakeArbitraryStaticValue<unknown[]>(() => []);
          array.mockReturnValue(arrayInstance);
          const constraints = { ...arrayConstraints };
          const arbitraryBuilder = vi.fn();
          const { instance: arbitraryInstance } = fakeArbitrary<number>();
          arbitraryBuilder.mockReturnValue(arbitraryInstance);

          // Act
          typedIntArrayArbitraryArbitraryBuilder(
            constraints,
            defaultMin,
            defaultMax,
            TypedArrayClass,
            arbitraryBuilder,
          );

          // Assert
          expect(arbitraryBuilder).toHaveBeenLastCalledWith({ min: defaultMin, max: defaultMax });
        },
      ),
    );
  });

  it('should properly distribute constraints accross arbitraries when receiving valid ones', () => {
    fc.assert(
      fc.property(
        validArrayConstraintsArb(),
        validIntegerConstraintsArb(-128, 127),
        (arrayConstraints, integerConstraints) => {
          // Arrange
          const array = vi.spyOn(ArrayMock, 'array');
          const { instance: arrayInstance } = fakeArbitraryStaticValue<unknown[]>(() => []);
          array.mockReturnValue(arrayInstance);
          const constraints = { ...arrayConstraints, ...integerConstraints };
          const defaultMin = -128;
          const defaultMax = 127;
          const TypedArrayClass = Int8Array;
          const arbitraryBuilder = vi.fn();
          const { instance: arbitraryInstance } = fakeArbitrary<number>();
          arbitraryBuilder.mockReturnValue(arbitraryInstance);

          // Act
          typedIntArrayArbitraryArbitraryBuilder(
            constraints,
            defaultMin,
            defaultMax,
            TypedArrayClass,
            arbitraryBuilder,
          );

          // Assert
          expect(arbitraryBuilder).toHaveBeenLastCalledWith({
            min: defaultMin,
            max: defaultMax,
            ...integerConstraints,
          });
        },
      ),
    );
  });

  it('should reject invalid integer ranges', () => {
    fc.assert(
      fc.property(
        validArrayConstraintsArb(),
        invalidIntegerConstraintsArb(-128, 127),
        (arrayConstraints, integerConstraints) => {
          // Arrange
          const array = vi.spyOn(ArrayMock, 'array');
          const { instance: arrayInstance } = fakeArbitraryStaticValue<unknown[]>(() => []);
          array.mockReturnValue(arrayInstance);
          const constraints = { ...arrayConstraints, ...integerConstraints };
          const defaultMin = -128;
          const defaultMax = 127;
          const TypedArrayClass = Int8Array;
          const arbitraryBuilder = vi.fn();
          const { instance: arbitraryInstance } = fakeArbitrary<number>();
          arbitraryBuilder.mockReturnValue(arbitraryInstance);

          // Act / Assert
          expect(() =>
            typedIntArrayArbitraryArbitraryBuilder(
              constraints,
              defaultMin,
              defaultMax,
              TypedArrayClass,
              arbitraryBuilder,
            ),
          ).toThrowError();
        },
      ),
    );
  });
});

describe('typedIntArrayArbitraryArbitraryBuilder (integration)', () => {
  type Extra = { minLength?: number; maxLength?: number; min?: number; max?: number };
  const extraParameters: fc.Arbitrary<Extra> = fc
    .record(
      {
        minLength: fc.nat({ max: 5 }),
        maxLength: fc.nat({ max: 25 }),
        min: fc.integer({ min: -128, max: 127 }),
        max: fc.integer({ min: -128, max: 127 }),
      },
      { requiredKeys: [] },
    )
    .map((rawConstraints) => {
      const constraints = { ...rawConstraints };
      if ('minLength' in constraints && 'maxLength' in constraints && constraints.minLength! > constraints.maxLength!) {
        [constraints.minLength, constraints.maxLength] = [constraints.maxLength, constraints.minLength];
      }
      if ('min' in constraints && 'max' in constraints && constraints.min! > constraints.max!) {
        [constraints.min, constraints.max] = [constraints.max, constraints.min];
      }
      return constraints;
    });

  const isCorrect = (value: Int8Array, extra: Extra) => {
    expect(value).toBeInstanceOf(Int8Array);
    if ('minLength' in extra) {
      expect(value.length).toBeGreaterThanOrEqual(extra.minLength!);
    }
    if ('maxLength' in extra) {
      expect(value.length).toBeLessThanOrEqual(extra.maxLength!);
    }
  };

  const typedIntArrayArbitraryArbitraryBuilderBuilder = (extra: Extra) =>
    typedIntArrayArbitraryArbitraryBuilder(
      extra,
      -128,
      127,
      Int8Array,
      ({ min = 0, max = min }) => new FakeIntegerArbitrary(min, max - min),
    );

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(typedIntArrayArbitraryArbitraryBuilderBuilder, { extraParameters });
  });

  it('should only produce correct values', () => {
    assertProduceCorrectValues(typedIntArrayArbitraryArbitraryBuilderBuilder, isCorrect, { extraParameters });
  });

  it('should produce values seen as shrinkable without any context', () => {
    assertProduceValuesShrinkableWithoutContext(typedIntArrayArbitraryArbitraryBuilderBuilder, { extraParameters });
  });

  it('should be able to shrink to the same values without initial context', () => {
    assertShrinkProducesSameValueWithoutInitialContext(typedIntArrayArbitraryArbitraryBuilderBuilder, {
      extraParameters,
    });
  });
});

// Helpers

function defaultsMinMaxTypedInt8Arb() {
  return fc
    .tuple(fc.integer({ min: -128, max: 127 }), fc.integer({ min: -128, max: 127 }))
    .map(([defaultA, defaultB]) => ({
      defaultMin: Math.min(defaultA, defaultB),
      defaultMax: Math.min(defaultA, defaultB),
      TypedArrayClass: Int8Array,
    }));
}

function validArrayConstraintsArb() {
  return fc.record({ minLength: fc.nat(), maxLength: fc.nat() }, { requiredKeys: [] }).map((ct) => {
    if (ct.minLength !== undefined && ct.maxLength !== undefined && ct.minLength > ct.maxLength) {
      return { minLength: ct.maxLength, maxLength: ct.minLength };
    }
    return ct;
  });
}

function validIntegerConstraintsArb(min: number, max: number) {
  return fc.record({ min: fc.integer({ min, max }), max: fc.integer({ min, max }) }, { requiredKeys: [] }).map((ct) => {
    if (ct.min !== undefined && ct.max !== undefined && ct.min > ct.max) {
      return { min: ct.max, max: ct.min };
    }
    return ct;
  });
}

function invalidIntegerConstraintsArb(min: number, max: number) {
  return fc.oneof(
    // min > max
    fc
      .record({ min: fc.integer({ min, max }), max: fc.integer({ min, max }) })
      .filter(({ min, max }) => min !== max)
      .map((ct) => (ct.min < ct.max ? { min: ct.max, max: ct.min } : ct)),
    // min < lowest
    fc.record({ min: fc.integer({ min: Number.MIN_SAFE_INTEGER, max: min - 1 }) }),
    fc.record({ min: fc.integer({ min: Number.MIN_SAFE_INTEGER, max: min - 1 }), max: fc.integer({ min, max }) }),
    // max > highest
    fc.record({ min: fc.integer({ min, max }), max: fc.integer({ min: max + 1, max: Number.MAX_SAFE_INTEGER }) }),
    fc.record({ max: fc.integer({ min: max + 1, max: Number.MAX_SAFE_INTEGER }) }),
  );
}
