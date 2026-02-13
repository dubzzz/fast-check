import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { DictionaryConstraints } from '../../../src/arbitrary/dictionary.js';
import { dictionary } from '../../../src/arbitrary/dictionary.js';

import { Arbitrary } from '../../../src/check/arbitrary/definition/Arbitrary.js';
import { Value } from '../../../src/check/arbitrary/definition/Value.js';
import type { Random } from '../../../src/random/generator/Random.js';
import { Stream } from '../../../src/stream/Stream.js';
import {
  assertProduceSameValueGivenSameSeed,
  assertProduceCorrectValues,
  assertProduceValuesShrinkableWithoutContext,
} from './__test-helpers__/ArbitraryAssertions.js';

describe('dictionary (integration)', () => {
  type Extra = { keys: PropertyKey[]; values: unknown[]; constraints?: DictionaryConstraints };
  const extraParameters: fc.Arbitrary<Extra> = fc.record(
    {
      keys: fc.uniqueArray(fc.oneof(fc.string(), fc.nat(), fc.string().map(Symbol)), {
        // Enough keys to respect constraints.
        minLength: 35,
        // Numbers will become strings when used in an object.
        selector: (key) => (typeof key === 'number' ? String(key) : key),
      }),
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

  const isCorrect = (value: Record<PropertyKey, unknown>, extra: Extra) => {
    if (extra.constraints !== undefined && extra.constraints.noNullPrototype) {
      expect(Object.getPrototypeOf(value)).toBe(Object.prototype);
    }
    const extraKeys = extra.keys.map((key) =>
      // Numbers will become strings when used in an object.
      typeof key === 'number' ? String(key) : key,
    );
    const keys = Reflect.ownKeys(value);
    for (const k of keys) {
      expect(extraKeys).toContain(k);
    }
    const values = keys.map((key) => Reflect.get(value, key));
    for (const v of values) {
      if (Number.isNaN(v)) expect(extra.values.includes(v)).toBe(true);
      else expect(extra.values).toContain(v); // exact same value (not a copy)
    }
    if (extra.constraints !== undefined) {
      if (extra.constraints.minKeys !== undefined) {
        expect(keys.length).toBeGreaterThanOrEqual(extra.constraints.minKeys);
      }
      if (extra.constraints.maxKeys !== undefined) {
        expect(keys.length).toBeLessThanOrEqual(extra.constraints.maxKeys);
      }
    }
  };

  const dictionaryBuilder = (extra: Extra) => {
    const keyArb = new FromKeysArbitrary(extra.keys);
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

class FromKeysArbitrary<K extends PropertyKey> extends Arbitrary<K> {
  readonly keys: PropertyKey[];
  constructor(readonly source: K[]) {
    super();
    // Numbers will become strings when used in an object.
    this.keys = source.map((source) => (typeof source === 'number' ? String(source) : source));
  }
  generate(mrng: Random, _biasFactor: number): Value<K> {
    const index = mrng.nextInt(0, this.source.length - 1);
    return new Value(this.source[index], undefined);
  }
  canShrinkWithoutContext(value: unknown): value is K {
    return this.keys.includes(value as any);
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
    // includes might mix 0 and -0
    return this.source.includes(value as any);
  }
  shrink(_value: V, _context?: unknown): Stream<Value<V>> {
    return Stream.nil();
  }
}
