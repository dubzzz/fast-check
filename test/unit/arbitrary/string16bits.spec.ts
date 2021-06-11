import * as fc from '../../../lib/fast-check';
import { string16bits } from '../../../src/arbitrary/string16bits';

import { convertToNext } from '../../../src/check/arbitrary/definition/Converters';
import {
  assertProduceValuesShrinkableWithoutContext,
  assertShrinkProducesSameValueWithoutInitialContext,
  assertProduceCorrectValues,
  assertProduceSameValueGivenSameSeed,
} from '../check/arbitrary/generic/NextArbitraryAssertions';

describe('string16bits (integration)', () => {
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
  };

  const string16bitsBuilder = (extra: Extra) => convertToNext(string16bits(extra));

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(string16bitsBuilder, { extraParameters });
  });

  it('should only produce correct values', () => {
    assertProduceCorrectValues(string16bitsBuilder, isCorrect, { extraParameters });
  });

  it('should produce values seen as shrinkable without any context', () => {
    assertProduceValuesShrinkableWithoutContext(string16bitsBuilder, { extraParameters });
  });

  it('should be able to shrink to the same values without initial context', () => {
    assertShrinkProducesSameValueWithoutInitialContext(string16bitsBuilder, { extraParameters });
  });
});
