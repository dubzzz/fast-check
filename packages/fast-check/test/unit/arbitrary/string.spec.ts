import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { string } from '../../../src/arbitrary/string';
import type { StringConstraints } from '../../../src/arbitrary/string';

import { Value } from '../../../src/check/arbitrary/definition/Value';
import {
  assertProduceValuesShrinkableWithoutContext,
  assertShrinkProducesSameValueWithoutInitialContext,
  assertProduceCorrectValues,
  assertProduceSameValueGivenSameSeed,
} from './__test-helpers__/ArbitraryAssertions';
import { buildShrinkTree, renderTree } from './__test-helpers__/ShrinkTree';
import { Arbitrary } from '../../../src/check/arbitrary/definition/Arbitrary';
import { Random } from '../../../src/random/generator/Random';
import { Stream } from '../../../src/stream/Stream';

describe('string (integration)', () => {
  type Extra = StringConstraints;
  const extraParameters: fc.Arbitrary<Extra> = fc
    .tuple(
      fc.nat({ max: 5 }),
      fc.nat({ max: 30 }),
      fc.boolean(),
      fc.boolean(),
      fc.constantFrom<StringConstraints['unit']>(
        undefined,
        'grapheme',
        'grapheme-composite',
        'grapheme-ascii',
        'binary',
        'binary-ascii',
        new PatternsArbitrary(['123', 'abc', '!']),
      ),
    )
    .map(([min, gap, withMin, withMax, unit]) => ({
      minLength: withMin ? min : undefined,
      maxLength: withMax ? min + gap : undefined,
      unit,
    }));

  const measureLengthFor = (value: string, extra: Extra): number => {
    if (typeof extra.unit === 'object') {
      return [...value.matchAll(/(abc|123|!)/g)].length;
    }
    switch (extra.unit) {
      case 'grapheme':
      case 'grapheme-composite':
      case 'grapheme-ascii':
      case undefined:
        // @ts-ignore
        const segmenter = new Intl.Segmenter();
        return [...segmenter.segment(value)].length;
      case 'binary':
      case 'binary-ascii':
        return [...value].length;
    }
  };

  const assertCorrectForUnit = (value: string, extra: Extra): void => {
    if (typeof extra.unit === 'object') {
      expect(value).toMatch(/^(abc|123|!)*$/); // based on PatternsArbitrary
      return;
    }
    switch (extra.unit) {
      case 'grapheme':
        return;
      case 'grapheme-composite':
        // @ts-ignore
        const segmenter = new Intl.Segmenter();
        expect([...segmenter.segment(value)].map((s) => s.segment)).toEqual([...value]); // assert: grapheme equivalent to code-point
        return;
      case 'grapheme-ascii':
      case undefined:
        expect([...value]).toEqual(value.split('')); // assert: code-point equivalent to char
        for (const c of value) {
          expect(c.charCodeAt(0)).toBeGreaterThanOrEqual(0x20);
          expect(c.charCodeAt(0)).toBeLessThanOrEqual(0x7e);
        }
        return;
      case 'binary':
        return;
      case 'binary-ascii':
        expect([...value]).toEqual(value.split('')); // assert: code-point equivalent to char
        for (const c of value) {
          expect(c.charCodeAt(0)).toBeGreaterThanOrEqual(0x00);
          expect(c.charCodeAt(0)).toBeLessThanOrEqual(0xff);
        }
        return;
    }
  };

  const isCorrect = (value: string, extra: Extra) => {
    const measuredLength = measureLengthFor(value, extra);
    if (extra.minLength !== undefined) {
      expect(measuredLength).toBeGreaterThanOrEqual(extra.minLength);
    }
    if (extra.maxLength !== undefined) {
      expect(measuredLength).toBeLessThanOrEqual(extra.maxLength);
    }
    assertCorrectForUnit(value, extra);
  };

  const stringBuilder = (extra: Extra) => string(extra);

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
    source                                                                      | constraints
    ${''}                                                                       | ${{}}
    ${'azerty'}                                                                 | ${{}}
    ${'ah! ah!'}                                                                | ${{}}
    ${'0123456789' /* by default maxLength = maxLengthFromMinLength(0) = 10 */} | ${{}}
    ${'\u{0061}\u{0300}'}                                                       | ${{ unit: 'binary', minLength: 2 }}
    ${'\u{0061}\u{0300}'}                                                       | ${{ unit: 'grapheme', maxLength: 1 }}
    ${'\u{0061}\u{0300}'}                                                       | ${{ unit: 'grapheme' }}
  `('should be able to generate $source with fc.string($constraints)', ({ source, constraints }) => {
    // Arrange / Act
    const arb = string(constraints);
    const out = arb.canShrinkWithoutContext(source);

    // Assert
    expect(out).toBe(true);
  });

  it.each`
    source                                                             | constraints
    ${'a\u{1f431}b' /* out-of-range character */}                      | ${{}}
    ${'ab' /* not large enough */}                                     | ${{ minLength: 3 }}
    ${'abcd' /* too large */}                                          | ${{ maxLength: 3 }}
    ${'\u{0061}\u{0300}' /* not large enough in terms of graphemes */} | ${{ unit: 'grapheme', minLength: 2 }}
    ${'\u{0061}\u{0300}' /* too large in terms of code-points */}      | ${{ unit: 'binary', maxLength: 1 }}
    ${'\u{0061}\u{0300}' /* out-of-range character */}                 | ${{ unit: 'grapheme-composite' }}
  `('should not be able to generate $source with fc.string($constraints)', ({ source, constraints }) => {
    // Arrange / Act
    const arb = string(constraints);
    const out = arb.canShrinkWithoutContext(source);

    // Assert
    expect(out).toBe(false);
  });

  it.each`
    rawValue
    ${'Hey!'}
    ${'0'.repeat(50) /* longer than default maxGeneratedLength but ok for shrink */}
  `('should be able to shrink $rawValue with fc.string()', ({ rawValue }) => {
    // Arrange
    const arb = string();
    const value = new Value(rawValue, undefined);

    // Act
    const renderedTree = renderTree(buildShrinkTree(arb, value, { numItems: 100 })).join('\n');

    // Assert
    expect(arb.canShrinkWithoutContext(rawValue)).toBe(true);
    expect(renderedTree).toMatchSnapshot();
  });
});

// Helpers

class PatternsArbitrary extends Arbitrary<string> {
  constructor(readonly patterns: string[]) {
    super();
  }
  generate(mrng: Random): Value<string> {
    return new Value(this.patterns[mrng.nextInt(0, this.patterns.length - 1)], undefined);
  }
  canShrinkWithoutContext(value: unknown): value is string {
    if (typeof value !== 'string') return false;
    return this.patterns.includes(value);
  }
  shrink(value: string): Stream<Value<string>> {
    const patternIndex = this.patterns.indexOf(value);
    if (patternIndex <= 0) {
      return Stream.nil();
    }
    return Stream.of(new Value(this.patterns[0], undefined));
  }
}
