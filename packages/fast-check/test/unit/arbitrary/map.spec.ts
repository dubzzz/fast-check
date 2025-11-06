import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { MapConstraints } from '../../../src/arbitrary/map';
import { map } from '../../../src/arbitrary/map';

import { Arbitrary } from '../../../src/check/arbitrary/definition/Arbitrary';
import { Value } from '../../../src/check/arbitrary/definition/Value';
import type { Random } from '../../../src/random/generator/Random';
import { Stream } from '../../../src/stream/Stream';
import {
  assertProduceSameValueGivenSameSeed,
  assertProduceCorrectValues,
  assertProduceValuesShrinkableWithoutContext,
} from './__test-helpers__/ArbitraryAssertions';

describe('map (integration)', () => {
  type Extra = { keys: unknown[]; values: unknown[]; constraints?: MapConstraints };
  const extraParameters: fc.Arbitrary<Extra> = fc.record(
    {
      keys: fc.uniqueArray(fc.anything(), {
        // Enough keys to respect constraints.
        minLength: 35,
        // Keys equal in terms of SameValueZero will be merged together in a Map.
        comparator: 'SameValueZero',
      }),
      values: fc.uniqueArray(fc.anything(), { minLength: 1 }),
      constraints: fc
        .tuple(fc.nat({ max: 5 }), fc.nat({ max: 30 }), fc.boolean(), fc.boolean())
        .map(([min, gap, withMin, withMax]) => ({
          minKeys: withMin ? min : undefined,
          maxKeys: withMax ? min + gap : undefined,
        })),
    },
    { requiredKeys: ['keys', 'values'] },
  );

  const isCorrect = (value: Map<unknown, unknown>, extra: Extra) => {
    // Check that all keys are from the expected set
    const extraKeysSet = new Set(extra.keys);
    for (const k of value.keys()) {
      expect(extraKeysSet.has(k)).toBe(true); // exact same key (not a copy) in terms of SameValueZero (comparator used by keys of a Map)
    }
    // Check that all values are from the expected set
    for (const v of value.values()) {
      if (Number.isNaN(v)) expect(extra.values.some((ev) => Number.isNaN(ev))).toBe(true);
      else expect(extra.values).toContain(v); // exact same value (not a copy)
    }
    if (extra.constraints !== undefined) {
      if (extra.constraints.minKeys !== undefined) {
        expect(value.size).toBeGreaterThanOrEqual(extra.constraints.minKeys);
      }
      if (extra.constraints.maxKeys !== undefined) {
        expect(value.size).toBeLessThanOrEqual(extra.constraints.maxKeys);
      }
    }
  };

  const mapBuilder = (extra: Extra) => {
    const keyArb = new FromKeysArbitrary(extra.keys);
    const valueArb = new FromValuesArbitrary(extra.values);
    const constraints = extra.constraints;
    return map(keyArb, valueArb, constraints);
  };

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(mapBuilder, { extraParameters });
  });

  it('should only produce correct values', () => {
    assertProduceCorrectValues(mapBuilder, isCorrect, { extraParameters });
  });

  it('should produce values seen as shrinkable without any context (if underlyings do)', () => {
    assertProduceValuesShrinkableWithoutContext(mapBuilder, { extraParameters });
  });
});

// Helpers

class FromKeysArbitrary<K> extends Arbitrary<K> {
  readonly sourceAsSet: Set<K>;
  constructor(readonly source: K[]) {
    super();
    this.sourceAsSet = new Set(source);
  }
  generate(mrng: Random, _biasFactor: number): Value<K> {
    const index = mrng.nextInt(0, this.source.length - 1);
    return new Value(this.source[index], undefined);
  }
  canShrinkWithoutContext(value: unknown): value is K {
    return this.sourceAsSet.has(value as K);
  }
  shrink(_value: K, _context?: unknown): Stream<Value<K>> {
    return Stream.nil();
  }
}

class FromValuesArbitrary<V> extends Arbitrary<V> {
  constructor(readonly source: V[]) {
    super();
  }
  generate(mrng: Random, _biasFactor: number): Value<V> {
    const index = mrng.nextInt(0, this.source.length - 1);
    return new Value(this.source[index], undefined);
  }
  canShrinkWithoutContext(value: unknown): value is V {
    return this.source.some((v) => Object.is(v, value));
  }
  shrink(_value: V, _context?: unknown): Stream<Value<V>> {
    return Stream.nil();
  }
}
