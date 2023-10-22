import * as fc from 'fast-check';
import { unicodeString } from '../../../src/arbitrary/unicodeString';

import { assertValidArbitrary } from './__test-helpers__/ArbitraryAssertions';

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

  const unicodeStringBuilder = (extra: Extra) => unicodeString(extra);

  it('should be a valid arbitrary', () => {
    assertValidArbitrary(
      unicodeStringBuilder,
      {
        sameValueGivenSameSeed: {},
        correctValues: { isCorrect },
        shrinkableWithoutContext: {},
        sameValueWithoutInitialContext: {},
      },
      { extraParameters },
    );
  });
});
