import * as fc from '../../../lib/fast-check';
import { unicodeString } from '../../../src/arbitrary/unicodeString';

import { convertToNext } from '../../../src/check/arbitrary/definition/Converters';
import {
  assertGenerateProducesSameValueGivenSameSeed,
  assertGenerateProducesCorrectValues,
  assertGenerateProducesValuesFlaggedAsCanGenerate,
  assertShrinkProducesSameValueWithoutInitialContext,
  assertShrinkProducesCorrectValues,
  assertShrinkProducesValuesFlaggedAsCanGenerate,
} from '../check/arbitrary/generic/NextArbitraryAssertions';

describe('unicodeString (integration)', () => {
  type Extra = { minLength?: number; maxLength?: number };
  const extraParameters: fc.Arbitrary<Extra> = fc
    .tuple(fc.nat({ max: 30 }), fc.nat({ max: 30 }), fc.boolean(), fc.boolean())
    .map(([min, gap, withMin, withMax]) => ({
      minLength: withMin ? min : undefined,
      maxLength: withMax ? min + gap : undefined,
    }));

  const isCorrect = (value: string, extra: Extra) => {
    if (extra.minLength !== undefined) {
      expect(value.length).toBeGreaterThanOrEqual(extra.minLength);
    }
    if (extra.maxLength !== undefined) {
      expect(value.length).toBeLessThanOrEqual(extra.maxLength);
    }
    for (const c of value.split('')) {
      const isSurrogate = c.charCodeAt(0) >= 0xd800 && c.charCodeAt(0) <= 0xdfff;
      expect(isSurrogate).toBe(false);
    }
  };

  const unicodeStringBuilder = (extra: Extra) => convertToNext(unicodeString(extra));

  it('should generate the same values given the same seed', () => {
    assertGenerateProducesSameValueGivenSameSeed(unicodeStringBuilder, { extraParameters });
  });

  it('should only generate correct values', () => {
    assertGenerateProducesCorrectValues(unicodeStringBuilder, isCorrect, { extraParameters });
  });

  it('should recognize values that would have been generated using it during generate', () => {
    assertGenerateProducesValuesFlaggedAsCanGenerate(unicodeStringBuilder, { extraParameters });
  });

  it('should shrink towards the same values given the same seed', () => {
    assertGenerateProducesSameValueGivenSameSeed(unicodeStringBuilder, { extraParameters });
  });

  it('should be able to shrink without any context', () => {
    assertShrinkProducesSameValueWithoutInitialContext(unicodeStringBuilder, { extraParameters });
  });

  it('should only shrink towards correct values', () => {
    assertShrinkProducesCorrectValues(unicodeStringBuilder, isCorrect, { extraParameters });
  });

  it('should recognize values that would have been generated using it during shrink', () => {
    assertShrinkProducesValuesFlaggedAsCanGenerate(unicodeStringBuilder, { extraParameters });
  });
});
