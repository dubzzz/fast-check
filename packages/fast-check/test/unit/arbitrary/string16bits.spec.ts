import * as fc from 'fast-check';
import { string16bits } from '../../../src/arbitrary/string16bits';

import { assertValidArbitrary } from './__test-helpers__/ArbitraryAssertions';

describe('string16bits (integration)', () => {
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
  };

  const string16bitsBuilder = (extra: Extra) => string16bits(extra);

  it('should be a valid arbitrary', () => {
    assertValidArbitrary(
      string16bitsBuilder,
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
