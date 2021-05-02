import * as fc from '../../../lib/fast-check';
import { string } from '../../../src/arbitrary/string';

import { convertToNext } from '../../../src/check/arbitrary/definition/Converters';
import {
  assertGenerateProducesSameValueGivenSameSeed,
  assertGenerateProducesCorrectValues,
  assertGenerateProducesValuesFlaggedAsCanGenerate,
  assertShrinkProducesSameValueWithoutInitialContext,
  assertShrinkProducesCorrectValues,
  assertShrinkProducesValuesFlaggedAsCanGenerate,
} from '../check/arbitrary/generic/NextArbitraryAssertions';

describe('string (integration)', () => {
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
      expect(c.charCodeAt(0)).toBeGreaterThanOrEqual(0x20);
      expect(c.charCodeAt(0)).toBeLessThanOrEqual(0x7e);
    }
  };

  const stringBuilder = (extra: Extra) => convertToNext(string(extra));

  it('should generate the same values given the same seed', () => {
    assertGenerateProducesSameValueGivenSameSeed(stringBuilder, { extraParameters });
  });

  it('should only generate correct values', () => {
    assertGenerateProducesCorrectValues(stringBuilder, isCorrect, { extraParameters });
  });

  it('should recognize values that would have been generated using it during generate', () => {
    assertGenerateProducesValuesFlaggedAsCanGenerate(stringBuilder, { extraParameters });
  });

  it('should shrink towards the same values given the same seed', () => {
    assertGenerateProducesSameValueGivenSameSeed(stringBuilder, { extraParameters });
  });

  it('should be able to shrink without any context', () => {
    assertShrinkProducesSameValueWithoutInitialContext(stringBuilder, { extraParameters });
  });

  it('should only shrink towards correct values', () => {
    assertShrinkProducesCorrectValues(stringBuilder, isCorrect, { extraParameters });
  });

  it('should recognize values that would have been generated using it during shrink', () => {
    assertShrinkProducesValuesFlaggedAsCanGenerate(stringBuilder, { extraParameters });
  });

  it.each`
    source
    ${''}
    ${'azerty'}
    ${'ah! ah!'}
    ${'0123456789' /* by default maxLength = maxLengthFromMinLength(0) = 10 */}
  `('should be able to generate $source with fc.string()', ({ source }) => {
    // Arrange / Act
    const arb = convertToNext(string());
    const out = arb.canGenerate(source);

    // Assert
    expect(out).toBe(true);
  });

  it.each`
    source
    ${'01234567890' /* by default maxLength = maxLengthFromMinLength(0) = 10 */}
    ${'a\u{1f431}b' /* out-of-range character */}
  `('should not be able to generate $source with fc.string()', ({ source }) => {
    // Arrange / Act
    const arb = convertToNext(string());
    const out = arb.canGenerate(source);

    // Assert
    expect(out).toBe(false);
  });
});
