import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { DictionaryConstraints } from '../../../src/arbitrary/dictionary';
import { dictionary } from '../../../src/arbitrary/dictionary';

import { Arbitrary } from '../../../src/check/arbitrary/definition/Arbitrary';
import { Value } from '../../../src/check/arbitrary/definition/Value';
import type { Random } from '../../../src/random/generator/Random';
import { Stream } from '../../../src/stream/Stream';
import {
  assertProduceSameValueGivenSameSeed,
  assertProduceCorrectValues,
  assertProduceValuesShrinkableWithoutContext,
} from './__test-helpers__/ArbitraryAssertions';

describe('dictionary (integration)', () => {
  type Extra = { keys: string[]; values: unknown[]; constraints?: DictionaryConstraints };
  const extraParameters: fc.Arbitrary<Extra> = fc.record(
    {
      keys: fc.uniqueArray(fc.string(), { minLength: 35 }), // enough keys to respect constraints
      values: fc.uniqueArray(fc.anything(), { minLength: 1 }),
      constraints: fc
        .tuple(
          fc.nat({ max: 5 }),
          fc.nat({ max: 30 }),
          fc.boolean(),
          fc.boolean(),
          fc.option(fc.boolean(), { nil: undefined }),
        )
        .map(([min, gap, withMin, withMax, noNullPrototype]) => ({
          minKeys: withMin ? min : undefined,
          maxKeys: withMax ? min + gap : undefined,
          noNullPrototype,
        })),
    },
    { requiredKeys: ['keys', 'values'] },
  );

  const isCorrect = (value: Record<string, unknown>, extra: Extra) => {
    if (extra.constraints !== undefined && extra.constraints.noNullPrototype) {
      expect(Object.getPrototypeOf(value)).toBe(Object.prototype);
    }
    for (const k of Object.keys(value)) {
      expect(extra.keys).toContain(k);
    }
    for (const v of Object.values(value)) {
      if (Number.isNaN(v)) expect(extra.values.includes(v)).toBe(true);
      else expect(extra.values).toContain(v); // exact same value (not a copy)
    }
    if (extra.constraints !== undefined) {
      if (extra.constraints.minKeys !== undefined) {
        expect(Object.keys(value).length).toBeGreaterThanOrEqual(extra.constraints.minKeys);
      }
      if (extra.constraints.maxKeys !== undefined) {
        expect(Object.keys(value).length).toBeLessThanOrEqual(extra.constraints.maxKeys);
      }
    }
  };

  const dictionaryBuilder = (extra: Extra) => {
    const keyArb = new FromValuesArbitrary(extra.keys);
    const valueArb = new FromValuesArbitrary(extra.values);
    const constraints = extra.constraints;
    return dictionary(keyArb, valueArb, constraints);
  };

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(dictionaryBuilder, { extraParameters });
  });

  it('should only produce correct values', () => {
    assertProduceCorrectValues(dictionaryBuilder, isCorrect, { extraParameters });
  });

  it('should produce values seen as shrinkable without any context (if underlyings do)', () => {
    assertProduceValuesShrinkableWithoutContext(dictionaryBuilder, { extraParameters });
  });
});

// Helpers

class FromValuesArbitrary<T> extends Arbitrary<T> {
  constructor(readonly source: T[]) {
    super();
  }
  generate(mrng: Random, _biasFactor: number): Value<T> {
    const index = mrng.nextInt(0, this.source.length - 1);
    return new Value(this.source[index], undefined);
  }
  canShrinkWithoutContext(value: unknown): value is T {
    // includes might mix 0 and -0
    return this.source.includes(value as any);
  }
  shrink(_value: T, _context?: unknown): Stream<Value<T>> {
    return Stream.nil();
  }
}
