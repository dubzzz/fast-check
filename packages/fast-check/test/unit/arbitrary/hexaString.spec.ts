import * as fc from 'fast-check';
import { hexaString } from '../../../src/arbitrary/hexaString';

import {
  assertValidArbitrary
} from './__test-helpers__/ArbitraryAssertions';

describe('hexaString (integration)', () => {
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
      expect('0123456789abcdef'.split('')).toContainEqual(c);
    }
  };

  const hexaStringBuilder = (extra: Extra) => hexaString(extra);

  it('should be a valid arbitrary', () => {
    assertValidArbitrary(
      hexaStringBuilder,
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
