import * as fc from '../../../lib/fast-check';
import { fullUnicodeString } from '../../../src/arbitrary/fullUnicodeString';

import { convertToNext } from '../../../src/check/arbitrary/definition/Converters';
import { NextValue } from '../../../src/check/arbitrary/definition/NextValue';
import {
  assertGenerateProducesSameValueGivenSameSeed,
  assertGenerateProducesCorrectValues,
  assertGenerateProducesValuesFlaggedAsCanGenerate,
  assertShrinkProducesSameValueWithoutInitialContext,
  assertShrinkProducesCorrectValues,
  assertShrinkProducesValuesFlaggedAsCanGenerate,
} from '../check/arbitrary/generic/NextArbitraryAssertions';
import { buildNextShrinkTree, renderTree } from '../check/arbitrary/generic/ShrinkTree';

describe('fullUnicodeString (integration)', () => {
  type Extra = { minLength?: number; maxLength?: number };
  const extraParameters: fc.Arbitrary<Extra> = fc
    .tuple(fc.nat({ max: 30 }), fc.nat({ max: 30 }), fc.boolean(), fc.boolean())
    .map(([min, gap, withMin, withMax]) => ({
      minLength: withMin ? min : undefined,
      maxLength: withMax ? min + gap : undefined,
    }));

  const isCorrect = (value: string, extra: Extra) => {
    if (extra.minLength !== undefined) {
      expect([...value].length).toBeGreaterThanOrEqual(extra.minLength);
    }
    if (extra.maxLength !== undefined) {
      expect([...value].length).toBeLessThanOrEqual(extra.maxLength);
    }
    for (const c of [...value]) {
      if (c.length === 1) {
        const isSurrogate = c.charCodeAt(0) >= 0xd800 && c.charCodeAt(0) <= 0xdfff;
        expect(isSurrogate).toBe(false);
      } else {
        const firstIsHighSurrogate = c.charCodeAt(0) >= 0xd800 && c.charCodeAt(0) <= 0xdbff;
        const secondIsLowSurrogate = c.charCodeAt(1) >= 0xdc00 && c.charCodeAt(1) <= 0xdfff;
        expect(firstIsHighSurrogate).toBe(true);
        expect(secondIsLowSurrogate).toBe(true);
      }
    }
  };

  const fullUnicodeStringBuilder = (extra: Extra) => convertToNext(fullUnicodeString(extra));

  it('should generate the same values given the same seed', () => {
    assertGenerateProducesSameValueGivenSameSeed(fullUnicodeStringBuilder, { extraParameters });
  });

  it('should only generate correct values', () => {
    assertGenerateProducesCorrectValues(fullUnicodeStringBuilder, isCorrect, { extraParameters });
  });

  it('should recognize values that would have been generated using it during generate', () => {
    assertGenerateProducesValuesFlaggedAsCanGenerate(fullUnicodeStringBuilder, { extraParameters });
  });

  it('should shrink towards the same values given the same seed', () => {
    assertGenerateProducesSameValueGivenSameSeed(fullUnicodeStringBuilder, { extraParameters });
  });

  it('should be able to shrink without any context', () => {
    assertShrinkProducesSameValueWithoutInitialContext(fullUnicodeStringBuilder, { extraParameters });
  });

  it('should only shrink towards correct values', () => {
    assertShrinkProducesCorrectValues(fullUnicodeStringBuilder, isCorrect, { extraParameters });
  });

  it('should recognize values that would have been generated using it during shrink', () => {
    assertShrinkProducesValuesFlaggedAsCanGenerate(fullUnicodeStringBuilder, { extraParameters });
  });

  it.each`
    source
    ${''}
    ${'azerty'}
    ${'ah! ah!'}
    ${'a\uD83D\uDC31b'}
    ${'\u{1f431}\u{1f431}\u{1f431}\u{1f431}\u{1f431}\u{1f431}\u{1f431}\u{1f431}\u{1f431}\u{1f431}' /* by default maxLength = maxLengthFromMinLength(0) = 10 */}
    ${'\u{1f468}\u{1f3fe}\u{200d}\u{1f469}\u{1f3fc}'}
    ${'\u{1f468}\u{1f3fe}\u{200d}' /* accept incomplete graphemes */}
  `('should be able to generate $source with fc.fullUnicodeString()', ({ source }) => {
    // Arrange / Act
    const arb = convertToNext(fullUnicodeString());
    const out = arb.canShrinkWithoutContext(source);

    // Assert
    expect(out).toBe(true);
  });

  it.each`
    source
    ${'a\uD83Db' /* invalid string */}
    ${'\u{1f431}\u{1f431}\u{1f431}\u{1f431}\u{1f431}\u{1f431}\u{1f431}\u{1f431}\u{1f431}\u{1f431}\u{1f431}' /* by default maxLength = maxLengthFromMinLength(0) = 10 */}
  `('should not be able to generate $source with fc.fullUnicodeString()', ({ source }) => {
    // Arrange / Act
    const arb = convertToNext(fullUnicodeString());
    const out = arb.canShrinkWithoutContext(source);

    // Assert
    expect(out).toBe(false);
  });

  it.each`
    rawValue
    ${'Hey \u{1f431}!'}
  `('should be able to shrink $rawValue', ({ rawValue }) => {
    // Arrange
    const arb = convertToNext(fullUnicodeString());
    const value = new NextValue(rawValue);

    // Act
    const renderedTree = renderTree(buildNextShrinkTree(arb, value, { numItems: 100 })).join('\n');

    // Assert
    expect(renderedTree).toMatchSnapshot();
  });
});
