import * as fc from '../../../lib/fast-check';
import { fullUnicodeString } from '../../../src/arbitrary/fullUnicodeString';

import { NextValue } from '../../../src/check/arbitrary/definition/NextValue';
import {
  assertProduceValuesShrinkableWithoutContext,
  assertShrinkProducesSameValueWithoutInitialContext,
  assertProduceCorrectValues,
  assertProduceSameValueGivenSameSeed,
} from './__test-helpers__/NextArbitraryAssertions';
import { buildNextShrinkTree, renderTree } from './__test-helpers__/ShrinkTree';

describe('fullUnicodeString (integration)', () => {
  type Extra = { minLength?: number; maxLength?: number };
  const extraParameters: fc.Arbitrary<Extra> = fc
    .tuple(fc.nat({ max: 5 }), fc.nat({ max: 30 }), fc.boolean(), fc.boolean())
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

  const fullUnicodeStringBuilder = (extra: Extra) => fullUnicodeString(extra);

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(fullUnicodeStringBuilder, { extraParameters });
  });

  it('should only produce correct values', () => {
    assertProduceCorrectValues(fullUnicodeStringBuilder, isCorrect, { extraParameters });
  });

  it('should produce values seen as shrinkable without any context', () => {
    assertProduceValuesShrinkableWithoutContext(fullUnicodeStringBuilder, { extraParameters });
  });

  it('should be able to shrink to the same values without initial context', () => {
    assertShrinkProducesSameValueWithoutInitialContext(fullUnicodeStringBuilder, { extraParameters });
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
    const arb = fullUnicodeString();
    const out = arb.canShrinkWithoutContext(source);

    // Assert
    expect(out).toBe(true);
  });

  it.each`
    source                             | constraints
    ${'a\uD83Db' /* invalid string */} | ${{}}
    ${'ab' /* not large enough */}     | ${{ minLength: 3 }}
    ${'abcd' /* too large */}          | ${{ maxLength: 3 }}
  `('should not be able to generate $source with fc.fullUnicodeString($constraints)', ({ source, constraints }) => {
    // Arrange / Act
    const arb = fullUnicodeString(constraints);
    const out = arb.canShrinkWithoutContext(source);

    // Assert
    expect(out).toBe(false);
  });

  it.each`
    rawValue
    ${'Hey \u{1f431}!'}
    ${'\u{1f431}'.repeat(50) /* longer than default maxGeneratedLength but ok for shrink */}
  `('should be able to shrink $rawValue with fc.fullUnicodeString()', ({ rawValue }) => {
    // Arrange
    const arb = fullUnicodeString();
    const value = new NextValue(rawValue, undefined);

    // Act
    const renderedTree = renderTree(buildNextShrinkTree(arb, value, { numItems: 100 })).join('\n');

    // Assert
    expect(arb.canShrinkWithoutContext(rawValue)).toBe(true);
    expect(renderedTree).toMatchSnapshot();
  });
});
