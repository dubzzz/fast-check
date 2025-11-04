import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import type { SetConstraints } from '../../../src/arbitrary/set';
import { set } from '../../../src/arbitrary/set';
import { constantFrom } from '../../../src/arbitrary/constantFrom';
import { nat } from '../../../src/arbitrary/nat';

import { FakeIntegerArbitrary, fakeArbitrary } from './__test-helpers__/ArbitraryHelpers';

import * as UniqueArrayMock from '../../../src/arbitrary/uniqueArray';
import {
  assertProduceCorrectValues,
  assertProduceSameValueGivenSameSeed,
  assertProduceValuesShrinkableWithoutContext,
  assertShrinkProducesSameValueWithoutInitialContext,
} from './__test-helpers__/ArbitraryAssertions';
import { sizeRelatedGlobalConfigArb } from './__test-helpers__/SizeHelpers';
import { withConfiguredGlobal } from './__test-helpers__/GlobalSettingsHelpers';
import { declareCleaningHooksForSpies } from './__test-helpers__/SpyCleaner';

describe('set', () => {
  declareCleaningHooksForSpies();

  it('should instantiate uniqueArray with SameValueZero comparator for set(arb)', () => {
    fc.assert(
      fc.property(sizeRelatedGlobalConfigArb, (config) => {
        // Arrange
        const { instance: childInstance } = fakeArbitrary<unknown>();
        const { instance, map } = fakeArbitrary<Set<unknown>>();
        const uniqueArray = vi.spyOn(UniqueArrayMock, 'uniqueArray');
        const mappedArbitrary = fakeArbitrary<Set<unknown>>().instance;
        map.mockReturnValue(mappedArbitrary);
        uniqueArray.mockReturnValue(instance as any);

        // Act
        const arb = withConfiguredGlobal(config, () => set(childInstance));

        // Assert
        expect(uniqueArray).toHaveBeenCalledWith(childInstance, { comparator: 'SameValueZero' });
        expect(map).toHaveBeenCalled();
        expect(arb).toBe(mappedArbitrary);
      }),
    );
  });

  it('should instantiate uniqueArray with SameValueZero comparator for set(arb, constraints)', () => {
    fc.assert(
      fc.property(
        sizeRelatedGlobalConfigArb,
        fc.record(
          {
            minLength: fc.nat({ max: 5 }),
            maxLength: fc.nat({ max: 30 }),
            size: fc.constantFrom('xsmall', 'small', 'medium', 'large', 'xlarge', '=', '+1', '-1'),
            depthIdentifier: fc.string(),
          },
          { requiredKeys: [] },
        ),
        (config, constraints) => {
          // Arrange
          const { instance: childInstance } = fakeArbitrary<unknown>();
          const { instance, map } = fakeArbitrary<Set<unknown>>();
          const uniqueArray = vi.spyOn(UniqueArrayMock, 'uniqueArray');
          const mappedArbitrary = fakeArbitrary<Set<unknown>>().instance;
          map.mockReturnValue(mappedArbitrary);
          uniqueArray.mockReturnValue(instance as any);

          // Act
          const arb = withConfiguredGlobal(config, () => set(childInstance, constraints as SetConstraints));

          // Assert
          expect(uniqueArray).toHaveBeenCalledWith(childInstance, { ...constraints, comparator: 'SameValueZero' });
          expect(map).toHaveBeenCalled();
          expect(arb).toBe(mappedArbitrary);
        },
      ),
    );
  });
});

describe('set (integration)', () => {
  type Extra = SetConstraints;
  const extraParameters: fc.Arbitrary<Extra> = fc
    .tuple(fc.nat({ max: 5 }), fc.nat({ max: 30 }), fc.boolean(), fc.boolean())
    .map(([min, gap, withMin, withMax]) => ({
      minLength: withMin ? min : undefined,
      maxLength: withMax ? min + gap : undefined,
    }));

  const isCorrect = (value: Set<number>, extra: Extra) => {
    expect(value).toBeInstanceOf(Set);
    if (extra.minLength !== undefined) {
      expect(value.size).toBeGreaterThanOrEqual(extra.minLength);
    }
    if (extra.maxLength !== undefined) {
      expect(value.size).toBeLessThanOrEqual(extra.maxLength);
    }
    for (const v of value) {
      expect(typeof v).toBe('number');
    }
    // Verify uniqueness (Set should handle this naturally)
    const asArray = Array.from(value);
    expect(asArray.length).toBe(value.size);
  };

  const integerUpTo10000AndNaNOrMinusZero = new FakeIntegerArbitrary(-2, 10000).map(
    (v) => (v === -2 ? Number.NaN : v === -1 ? -0 : v),
    (v) => {
      if (typeof v !== 'number' || v === -1 || v === -2) throw new Error('');
      return Object.is(v, Number.NaN) ? -2 : Object.is(v, -0) ? -1 : v;
    },
  );
  const setBuilder = (extra: Extra) => set(integerUpTo10000AndNaNOrMinusZero, extra);

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(setBuilder, { extraParameters });
  });

  it('should only produce correct values', () => {
    assertProduceCorrectValues(setBuilder, isCorrect, { extraParameters });
  });

  it('should produce values seen as shrinkable without any context', () => {
    assertProduceValuesShrinkableWithoutContext(setBuilder, { extraParameters });
  });

  it('should be able to shrink to the same values without initial context', () => {
    assertShrinkProducesSameValueWithoutInitialContext(setBuilder, { extraParameters });
  });

  it('should handle special numeric values correctly (NaN, -0, +0)', () => {
    // Test that Set uses SameValueZero comparison which treats -0 and +0 as equal
    // but NaN as equal to itself
    const arb = set(constantFrom(-0, 0, Number.NaN, 1, 2));
    const sample = fc.sample(arb, { numRuns: 100 });

    for (const s of sample) {
      expect(s).toBeInstanceOf(Set);
      // In SameValueZero, -0 and +0 are considered equal, so we shouldn't have both
      // but we can have one or the other
      const zeroCount = Array.from(s).filter((v) => v === 0 || Object.is(v, -0)).length;
      expect(zeroCount).toBeLessThanOrEqual(1);
    }
  });

  it('should generate sets with unique values', () => {
    const arb = set(nat(100), { minLength: 5, maxLength: 20 });
    const samples = fc.sample(arb, { numRuns: 100 });

    for (const s of samples) {
      expect(s).toBeInstanceOf(Set);
      expect(s.size).toBeGreaterThanOrEqual(5);
      expect(s.size).toBeLessThanOrEqual(20);
      // Convert to array and verify uniqueness
      const asArray = Array.from(s);
      const asSet = new Set(asArray);
      expect(asSet.size).toBe(asArray.length);
    }
  });
});
