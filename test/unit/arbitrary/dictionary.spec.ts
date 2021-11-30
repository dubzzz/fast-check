import * as fc from '../../../lib/fast-check';
import { dictionary } from '../../../src/arbitrary/dictionary';

import { Arbitrary } from '../../../src/check/arbitrary/definition/Arbitrary';
import { Value } from '../../../src/check/arbitrary/definition/Value';
import { Random } from '../../../src/random/generator/Random';
import { Stream } from '../../../src/stream/Stream';
import {
  assertProduceSameValueGivenSameSeed,
  assertProduceCorrectValues,
  assertProduceValuesShrinkableWithoutContext,
} from './__test-helpers__/NextArbitraryAssertions';

describe('dictionary (integration)', () => {
  type Extra = { keys: string[]; values: unknown[] };
  const extraParameters: fc.Arbitrary<Extra> = fc.record(
    {
      keys: fc.set(fc.string(), { minLength: 1 }),
      values: fc.set(fc.anything(), { minLength: 1 }),
    },
    { requiredKeys: ['keys', 'values'] }
  );

  const isCorrect = (value: Record<string, unknown>, extra: Extra) => {
    expect(value.constructor).toBe(Object);
    expect(value.__proto__).toBe(Object.prototype);
    for (const k of Object.keys(value)) {
      expect(extra.keys).toContain(k);
    }
    for (const v of Object.values(value)) {
      if (Number.isNaN(v)) expect(extra.values.includes(v)).toBe(true);
      else expect(extra.values).toContain(v); // exact same value (not a copy)
    }
  };

  const dictionaryBuilder = (extra: Extra) => {
    const keyArb = new FromValuesArbitrary(extra.keys);
    const valueArb = new FromValuesArbitrary(extra.values);
    return dictionary(keyArb, valueArb);
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
