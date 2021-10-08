import * as fc from '../../../lib/fast-check';
import { string } from '../../../src/arbitrary/string';

import { convertToNext } from '../../../src/check/arbitrary/definition/Converters';
import { NextValue } from '../../../src/check/arbitrary/definition/NextValue';
import {
  assertProduceValuesShrinkableWithoutContext,
  assertShrinkProducesSameValueWithoutInitialContext,
  assertProduceCorrectValues,
  assertProduceSameValueGivenSameSeed,
} from './__test-helpers__/NextArbitraryAssertions';
import { buildNextShrinkTree, renderTree } from './__test-helpers__/ShrinkTree';

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

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(stringBuilder, { extraParameters });
  });

  it('should only produce correct values', () => {
    assertProduceCorrectValues(stringBuilder, isCorrect, { extraParameters });
  });

  it('should produce values seen as shrinkable without any context', () => {
    assertProduceValuesShrinkableWithoutContext(stringBuilder, { extraParameters });
  });

  it('should be able to shrink to the same values without initial context', () => {
    assertShrinkProducesSameValueWithoutInitialContext(stringBuilder, { extraParameters });
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
    const out = arb.canShrinkWithoutContext(source);

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
    const out = arb.canShrinkWithoutContext(source);

    // Assert
    expect(out).toBe(false);
  });

  it.each`
    rawValue
    ${'Hey!'}
  `('should be able to shrink $rawValue', ({ rawValue }) => {
    // Arrange
    const arb = convertToNext(string());
    const value = new NextValue(rawValue, undefined);

    // Act
    const renderedTree = renderTree(buildNextShrinkTree(arb, value, { numItems: 100 })).join('\n');

    // Assert
    expect(arb.canShrinkWithoutContext(rawValue)).toBe(true);
    expect(renderedTree).toMatchSnapshot();
  });
});
