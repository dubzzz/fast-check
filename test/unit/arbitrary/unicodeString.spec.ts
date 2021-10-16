import * as fc from '../../../lib/fast-check';
import { unicodeString } from '../../../src/arbitrary/unicodeString';

import { convertToNext } from '../../../src/check/arbitrary/definition/Converters';
import {
  assertProduceValuesShrinkableWithoutContext,
  assertShrinkProducesSameValueWithoutInitialContext,
  assertProduceCorrectValues,
  assertProduceSameValueGivenSameSeed,
} from './__test-helpers__/NextArbitraryAssertions';

describe('unicodeString (integration)', () => {
  type Extra = { minLength?: number; maxLength?: number };
  const extraParameters: fc.Arbitrary<Extra> = fc
    .tuple(fc.nat({ max: 5 }), fc.nat({ max: 30 }), fc.boolean(), fc.boolean())
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

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(unicodeStringBuilder, { extraParameters });
  });

  it('should only produce correct values', () => {
    assertProduceCorrectValues(unicodeStringBuilder, isCorrect, { extraParameters });
  });

  it('should produce values seen as shrinkable without any context', () => {
    assertProduceValuesShrinkableWithoutContext(unicodeStringBuilder, { extraParameters });
  });

  it('should be able to shrink to the same values without initial context', () => {
    assertShrinkProducesSameValueWithoutInitialContext(unicodeStringBuilder, { extraParameters });
  });
});
