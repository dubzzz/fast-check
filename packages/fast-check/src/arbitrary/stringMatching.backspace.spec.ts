import { describe, expect, it } from 'vitest';
import { stringMatching } from './stringMatching.js';
import { assertProduceCorrectValues } from './__test-helpers__/ArbitraryAssertions.js';

describe('stringMatching with backspace in character classes', () => {
  it.each(['', 'u'])('should generate and shrink matching strings with flags %j', async (flags) => {
    for (const source of ['^[\\b]$', '^[a\\b]+$', '^[^\\b]+$', '^[\\b-\\r]+$']) {
      const regex = new RegExp(source, flags);
      await assertProduceCorrectValues(
        () => stringMatching(regex),
        (value) => regex.test(value),
      );
    }
  });

  it.each(['', 'u'])('should accept backspace, not the letter b, with flags %j', (flags) => {
    const arb = stringMatching(new RegExp('^[\\b]$', flags));
    expect(arb.canShrinkWithoutContext('\b')).toBe(true);
    expect(arb.canShrinkWithoutContext('b')).toBe(false);
  });

  it.each([/\b/, /\B/])('should still reject unsupported word-boundary assertions %s', (regex) => {
    expect(() => stringMatching(regex)).toThrow('not implemented yet');
  });
});
