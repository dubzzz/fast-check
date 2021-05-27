import * as fc from '../../../lib/fast-check';
import { dictionary } from '../../../src/arbitrary/dictionary';

import { convertFromNext, convertToNext } from '../../../src/check/arbitrary/definition/Converters';
import { NextArbitrary } from '../../../src/check/arbitrary/definition/NextArbitrary';
import { NextValue } from '../../../src/check/arbitrary/definition/NextValue';
import { Random } from '../../../src/random/generator/Random';
import { Stream } from '../../../src/stream/Stream';
import {
  assertGenerateProducesSameValueGivenSameSeed,
  assertGenerateProducesCorrectValues,
  assertGenerateProducesValuesFlaggedAsCanGenerate,
} from '../check/arbitrary/generic/NextArbitraryAssertions';

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
    const keyArb = convertFromNext(new FromValuesArbitrary(extra.keys));
    const valueArb = convertFromNext(new FromValuesArbitrary(extra.values));
    return convertToNext(dictionary(keyArb, valueArb));
  };

  it('should generate the same values given the same seed', () => {
    assertGenerateProducesSameValueGivenSameSeed(dictionaryBuilder, { extraParameters });
  });

  it('should only generate correct values', () => {
    assertGenerateProducesCorrectValues(dictionaryBuilder, isCorrect, { extraParameters });
  });

  it('should recognize values that would have been generated using it during generate', () => {
    assertGenerateProducesValuesFlaggedAsCanGenerate(dictionaryBuilder, { extraParameters });
  });
});

// Helpers

class FromValuesArbitrary<T> extends NextArbitrary<T> {
  constructor(readonly source: T[]) {
    super();
  }
  generate(mrng: Random, _biasFactor: number): NextValue<T> {
    const index = mrng.nextInt(0, this.source.length - 1);
    return new NextValue(this.source[index], undefined);
  }
  canShrinkWithoutContext(value: unknown): value is T {
    // includes might mix 0 and -0
    return this.source.includes(value as any);
  }
  shrink(_value: T, _context?: unknown): Stream<NextValue<T>> {
    return Stream.nil();
  }
}
