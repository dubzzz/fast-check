import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { xorshift128plus } from 'pure-rand/generator/xorshift128plus';
import type { Float64ArrayConstraints } from '../../../src/arbitrary/float64Array.js';
import { float64Array } from '../../../src/arbitrary/float64Array.js';
import { Random } from '../../../src/random/generator/Random.js';

import {
  assertProduceCorrectValues,
  assertProduceSameValueGivenSameSeed,
  assertProduceValuesShrinkableWithoutContext,
  assertShrinkProducesSameValueWithoutInitialContext,
} from './__test-helpers__/ArbitraryAssertions.js';

describe('float64Array (integration)', () => {
  type Extra = Float64ArrayConstraints;
  const extraParameters: fc.Arbitrary<Extra> = fc
    .record(
      {
        minLength: fc.nat({ max: 5 }),
        maxLength: fc.nat({ max: 25 }),
        min: fc.double({ noDefaultInfinity: true, noNaN: true }),
        max: fc.double({ noDefaultInfinity: true, noNaN: true }),
        noDefaultInfinity: fc.boolean(),
        noNaN: fc.boolean(),
      },
      { requiredKeys: [] },
    )
    .map((rawConstraints) => {
      const constraints = { ...rawConstraints };
      if ('minLength' in constraints && 'maxLength' in constraints && constraints.minLength! > constraints.maxLength!) {
        [constraints.minLength, constraints.maxLength] = [constraints.maxLength, constraints.minLength];
      }
      if ('min' in constraints && 'max' in constraints && strictlyLowerThan(constraints.max!, constraints.min!)) {
        [constraints.min, constraints.max] = [constraints.max, constraints.min];
      }
      return constraints;
    });

  const isCorrect = (value: Float64Array, extra: Extra) => {
    expect(value).toBeInstanceOf(Float64Array);
    if ('minLength' in extra) {
      expect(value.length).toBeGreaterThanOrEqual(extra.minLength!);
    }
    if ('maxLength' in extra) {
      expect(value.length).toBeLessThanOrEqual(extra.maxLength!);
    }
  };

  const float64ArrayBuilder = (extra: Extra) => float64Array(extra);

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(float64ArrayBuilder, { extraParameters });
  });

  it('should only produce correct values', () => {
    assertProduceCorrectValues(float64ArrayBuilder, isCorrect, { extraParameters });
  });

  it('should produce values seen as shrinkable without any context', () => {
    assertProduceValuesShrinkableWithoutContext(float64ArrayBuilder, { extraParameters });
  });

  it('should be able to shrink to the same values without initial context', () => {
    assertShrinkProducesSameValueWithoutInitialContext(float64ArrayBuilder, { extraParameters });
  });

  it('should be able to produce non-canonical NaN bit patterns (see #6532)', () => {
    // Regression test for https://github.com/dubzzz/fast-check/issues/6532
    // NaN values are indistinguishable from each other at the language level (Number.isNaN, ===, Object.is...).
    // The only way to observe a difference is to look at the raw bytes once copied into the Float64Array.
    const canonicalNaNBytes = new Uint8Array(new Float64Array([Number.NaN]).buffer);
    const hasNonCanonicalNaN = (value: Float64Array): boolean => {
      const nanIndex = value.findIndex((v) => Number.isNaN(v));
      if (nanIndex === -1) return false;
      const nanBytes = new Uint8Array(value.slice(nanIndex, nanIndex + 1).buffer);
      return nanBytes.some((byte, index) => byte !== canonicalNaNBytes[index]);
    };
    // A non-canonical NaN only shows up on a single, boundary-adjacent index out of the whole range covered by
    // float64Array, so we sample generously and with a strong bias (biasFactor=2, fast-check's most aggressive
    // corner-case bias) to make sure we reliably stumble upon at least one.
    const arb = float64Array();
    let foundNonCanonicalNaN = false;
    for (let seed = 0; seed < 20_000 && !foundNonCanonicalNaN; ++seed) {
      const mrng = new Random(xorshift128plus(seed));
      const { value } = arb.generate(mrng, 2);
      foundNonCanonicalNaN = hasNonCanonicalNaN(value);
    }
    expect(foundNonCanonicalNaN).toBe(true);
  });
});

// Helper

function strictlyLowerThan(a: number, b: number): boolean {
  return a < b || (a === b && Object.is(a, -0) && Object.is(b, 0));
}
