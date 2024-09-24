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
import type { Random } from '../../../src/random/generator/Random';
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
      case undefined: {
        // @ts-expect-error Not available with our current preset for TypeScript
        const segmenter = new Intl.Segmenter();
        return [...segmenter.segment(value)].length;
      }
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
      case 'grapheme-composite': {
        // @ts-expect-error Not available with our current preset for TypeScript
        const segmenter = new Intl.Segmenter();
        expect([...segmenter.segment(value)].map((s) => s.segment)).toEqual([...value]); // assert: grapheme equivalent to code-point
        return;
      }
      case 'grapheme-ascii':
      case undefined:
        expect([...value]).toEqual(value.split('')); // assert: code point equivalent to code unit aka char
        for (const c of value) {
          expect(c.charCodeAt(0)).toBeGreaterThanOrEqual(0x20);
          expect(c.charCodeAt(0)).toBeLessThanOrEqual(0x7e);
        }
        return;
      case 'binary':
        return;
      case 'binary-ascii':
        expect([...value]).toEqual(value.split('')); // assert: code point equivalent to code unit aka char
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

  const patterns = new PatternsArbitrary(['123', 'abc', '!']);
  const allExcept = (exclusionList: StringConstraints['unit'][]): StringConstraints['unit'][] => {
    const all: StringConstraints['unit'][] = [
      'grapheme' as const,
      'grapheme-composite' as const,
      'grapheme-ascii' as const,
      'binary' as const,
      'binary-ascii' as const,
      patterns,
    ];
    return all.filter((e) => !exclusionList.includes(e));
  };
  describe.each([
    { unit: undefined },
    { unit: 'grapheme' as const },
    { unit: 'grapheme-composite' as const },
    { unit: 'grapheme-ascii' as const },
    { unit: 'binary' as const },
    { unit: 'binary-ascii' as const },
    { unit: patterns },
  ])('based on unit=$unit', ({ unit }) => {
    it.each<{ source: string; constraints: Omit<StringConstraints, 'unit'>; supportedBy: StringConstraints['unit'][] }>(
      [
        // Empty string is valid for any unit as long as there is no minLength>0...
        { source: '', constraints: {}, supportedBy: allExcept([]) },
        // ...If we ask for minLength=1, it becomes invalid
        { source: '', constraints: { minLength: 1 }, supportedBy: [] },
        // Except patternsArbitrary all units are OK with the strings below as they don't break any constraints (neither content nor length)...
        { source: 'azerty', constraints: {}, supportedBy: allExcept([patterns]) },
        { source: 'ah! ah!', constraints: {}, supportedBy: allExcept([patterns]) },
        // ...just in case we play with the default implicit maxLength (=maxLengthFromMinLength(0)=10)...
        { source: '0123456789', constraints: {}, supportedBy: allExcept([patterns]) },
        // ...and just above it as when not provided we should still accept to shrink for any lengths even if we do not generate them.
        { source: '0123456789'.repeat(10), constraints: {}, supportedBy: allExcept([patterns]) },
        // On its own patternsArbitrary is also able to generate things but its language is way more limited (with our configuration)...
        { source: 'abc!123!', constraints: {}, supportedBy: allExcept([]) },
        // ...it does not count the length the same way as such 'abc', '123' or '!' are all considered to be a length 1.
        // So it is the only one to accept 'abc!123!' when asked for a maxLength of 4.
        { source: 'abc!123!', constraints: { maxLength: 4 }, supportedBy: [patterns] },
        // Regarding not supported characters we have many examples even for others:
        // - ascii versions do not support code-points out-side of the ascii range
        { source: 'a\u{1f431}b', constraints: {}, supportedBy: ['binary', 'grapheme', 'grapheme-composite'] },
        // - composite versions do not support decomposed code-points composing themselves with others (ascii neither)
        { source: '\u{0061}\u{0300}', constraints: {}, supportedBy: ['binary', 'grapheme'] },
        // - no one support half surrogate pairs (high or low)
        { source: '\u{d800}', constraints: {}, supportedBy: [] },
        { source: '\u{dfff}', constraints: {}, supportedBy: [] },
        // Then we may discard entries as they break the length rules:
        // - not large enough
        { source: 'ab', constraints: { minLength: 3 }, supportedBy: [] },
        { source: 'abc', constraints: { minLength: 4 }, supportedBy: [] },
        // - too large
        { source: 'abcd', constraints: { maxLength: 3 }, supportedBy: [] },
        { source: 'abcabcabc', constraints: { maxLength: 2 }, supportedBy: [] },
        { source: '0123456789', constraints: { maxLength: 9 }, supportedBy: [] },
        { source: '0123456789'.repeat(10), constraints: { maxLength: 10 }, supportedBy: [] },
        // But counting characters is different from one unit to another, not only just for patternsArbitrary.
        // For binary: '\u{0061}\u{0300}' is ['\u{0061}', '\u{0300}'] -> length 2
        // For grapheme: '\u{0061}\u{0300}' is ['\u{0061}\u{0300}']   -> length 1
        { source: '\u{0061}\u{0300}', constraints: { minLength: 2 }, supportedBy: ['binary'] },
        { source: '\u{0061}\u{0300}', constraints: { maxLength: 1 }, supportedBy: ['grapheme'] },
      ],
    )(
      'should be able to generate $source with fc.string($constraints) for $supportedBy',
      ({ source, constraints, supportedBy }) => {
        // Arrange / Act
        const arb = string({ ...constraints, unit });
        const out = arb.canShrinkWithoutContext(source);

        // Assert
        expect(out).toBe(supportedBy.includes(unit ?? 'grapheme-ascii'));
      },
    );
  });

  it.each([
    { unit: undefined, rawValue: 'Hey!' },
    { unit: undefined, rawValue: '0'.repeat(50) /* longer than default maxGeneratedLength but ok for shrink */ },
    { unit: undefined, rawValue: 'abc!123!' },
    { unit: patterns, rawValue: 'abc!123!' },
  ])('should be able to shrink $rawValue with fc.string({$unit})', ({ rawValue, unit }) => {
    // Arrange
    const arb = string({ unit });
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
