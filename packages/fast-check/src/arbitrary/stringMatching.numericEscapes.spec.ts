import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';
import { stringMatching } from './stringMatching.js';
import { assertProduceCorrectValues } from './__test-helpers__/ArbitraryAssertions.js';

describe('stringMatching with legacy numeric escapes', () => {
  it.each([
    ['\\101', 'A'],
    ['\\12', '\n'],
    ['\\8', '8'],
    ['\\9', '9'],
    ['\\08', '\0' + '8'],
    ['\\018', '\x01' + '8'],
    ['\\377', '\xff'],
    ['\\400', ' 0'],
    ['\\777', '?7'],
    ['\\1234', 'S4'],
    ['\\89', '89'],
    ['(a)\\18', 'a\x01' + '8'],
    ['(a)\\01', 'a\x01'],
  ])('should decode %s as %j', async (source, expected) => {
    const regex = new RegExp(`^${source}$`);
    expect(regex.test(expected)).toBe(true);
    expect(await fc.sample(stringMatching(regex), { numRuns: 3 })).toEqual([expected, expected, expected]);
  });

  it.each(['[\\101-\\132]+', '[\\012]+', '[\\400]+', '[\\8\\9]+', '\\128+', '\\400+', '(a)[\\1]'])(
    'should generate and shrink matching strings for %s',
    async (source) => {
      const regex = new RegExp(`^${source}$`);
      await assertProduceCorrectValues(
        () => stringMatching(regex),
        (value) => regex.test(value),
      );
    },
  );

  it.each(['(a)\\1', '\\1(a)', '\\2(a)(b)', '(?<a>a)\\1', '\\2(?=(a))(b)', '\\12' + '(a)'.repeat(12)])(
    'should still reject actual backreferences in %s',
    (source) => {
      expect(() => stringMatching(new RegExp(source))).toThrow('Backreference nodes not implemented yet');
    },
  );

  it.each(['\\1\\(a\\)', '\\1[(]', '\\1(?:a)', '\\1[\\](]'])(
    'should not count literal or non-capturing parentheses in %s',
    async (source) => {
      const regex = new RegExp(`^${source}$`);
      await assertProduceCorrectValues(
        () => stringMatching(regex),
        (value) => regex.test(value),
      );
    },
  );
});
