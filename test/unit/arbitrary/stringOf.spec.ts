import * as fc from '../../../lib/fast-check';
import { stringOf } from '../../../src/arbitrary/stringOf';

import { convertFromNext, convertToNext } from '../../../src/check/arbitrary/definition/Converters';
import { NextArbitrary } from '../../../src/check/arbitrary/definition/NextArbitrary';
import { NextValue } from '../../../src/check/arbitrary/definition/NextValue';
import { Random } from '../../../src/random/generator/Random';
import { Stream } from '../../../src/stream/Stream';
import {
  assertGenerateProducesSameValueGivenSameSeed,
  assertGenerateProducesValuesFlaggedAsCanGenerate,
  assertShrinkProducesValuesFlaggedAsCanGenerate,
} from '../check/arbitrary/generic/NextArbitraryAssertions';

describe('stringOf (integration)', () => {
  type Extra = { minLength?: number; maxLength?: number; patterns: string[] };
  const extraParameters: fc.Arbitrary<Extra> = fc
    .tuple(
      fc.nat({ max: 30 }),
      fc.nat({ max: 30 }),
      fc.boolean(),
      fc.boolean(),
      // empty string not supported when trying to recognize stuff geenrated by this precise arbitrary
      fc.array(fc.fullUnicodeString({ minLength: 1 }), { minLength: 1 })
    )
    .map(([min, gap, withMin, withMax, patterns]) => ({
      minLength: withMin ? min : undefined,
      maxLength: withMax ? min + gap : undefined,
      patterns,
    }));

  const stringOfBuilder = (extra: Extra) =>
    convertToNext(stringOf(convertFromNext(new PatternsArbitrary(extra.patterns)), extra));

  it('should generate the same values given the same seed', () => {
    assertGenerateProducesSameValueGivenSameSeed(stringOfBuilder, { extraParameters });
  });

  it('should recognize values that would have been generated using it during generate', () => {
    assertGenerateProducesValuesFlaggedAsCanGenerate(stringOfBuilder, { extraParameters });
  });

  it('should shrink towards the same values given the same seed', () => {
    assertGenerateProducesSameValueGivenSameSeed(stringOfBuilder, { extraParameters });
  });

  // assertShrinkProducesSameValueWithoutInitialContext is not fully supported by stringOf
  // Indeed depending how much the source strings overlaps there are possibly many possible ways to build a given string
  // so also many possible ways to shrink it.

  it('should recognize values that would have been generated using it during shrink', () => {
    assertShrinkProducesValuesFlaggedAsCanGenerate(stringOfBuilder, { extraParameters });
  });
});

// Helpers

class PatternsArbitrary extends NextArbitrary<string> {
  constructor(readonly patterns: string[]) {
    super();
  }
  generate(mrng: Random): NextValue<string> {
    return new NextValue(this.patterns[mrng.nextInt(0, this.patterns.length - 1)]);
  }
  canGenerate(value: unknown): value is string {
    if (typeof value !== 'string') return false;
    return this.patterns.includes(value);
  }
  shrink(value: string): Stream<NextValue<string>> {
    const patternIndex = this.patterns.indexOf(value);
    if (patternIndex <= 0) {
      return Stream.nil();
    }
    return Stream.of(new NextValue(this.patterns[0]));
  }
}
