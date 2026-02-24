import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { SetConstraints } from '../../../src/arbitrary/set.js';
import { set } from '../../../src/arbitrary/set.js';
import { nat } from '../../../src/arbitrary/nat.js';
import { constantFrom } from '../../../src/arbitrary/constantFrom.js';

import {
  assertProduceCorrectValues,
  assertProduceSameValueGivenSameSeed,
  assertProduceValuesShrinkableWithoutContext,
  assertShrinkProducesSameValueWithoutInitialContext,
} from './__test-helpers__/ArbitraryAssertions.js';

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
  };

  const setBuilder = (extra: Extra) => set(nat(10000), extra);

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
    assertProduceCorrectValues(
      () => set(constantFrom(-0, 0, Number.NaN, 1, 2)),
      (s) => {
        // In SameValueZero, -0 and +0 are considered equal, so we shouldn't have both
        const zeroCount = Array.from(s).filter((v) => v === 0).length; // "===" includes 0 and -0
        return zeroCount <= 1;
      },
    );
  });
});
