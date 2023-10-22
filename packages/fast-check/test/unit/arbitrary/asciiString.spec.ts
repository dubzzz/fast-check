import * as fc from 'fast-check';
import { asciiString } from '../../../src/arbitrary/asciiString';

import { assertValidArbitrary } from './__test-helpers__/ArbitraryAssertions';

describe('asciiString (integration)', () => {
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
      expect(c.charCodeAt(0)).toBeGreaterThanOrEqual(0x00);
      expect(c.charCodeAt(0)).toBeLessThanOrEqual(0x7f);
    }
  };

  const asciiStringBuilder = (extra: Extra) => asciiString(extra);

  it('should be a valid arbitrary', () => {
    assertValidArbitrary(
      asciiStringBuilder,
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
