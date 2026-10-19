import { describe, it, expect } from 'vitest';
import { parse } from 'regexp-tree';
import { tokenizeRegex } from './TokenizeRegex.js';
import { RegexesOfInterest } from './__test-helpers__/RegexesOfInterest.js';

describe('tokenizeRegex', () => {
  describe('non-unicode regex', () => {
    it.each(RegexesOfInterest.filter((i) => !i.regex.flags.includes('u')))(
      'should properly tokenize the regex $regex',
      ({ regex }) => {
        const tokenized = tokenizeRegex(regex);
        expect(tokenized).toEqual(parse(regex).body);
      },
    );
  });

  describe('unicode regex', () => {
    it.each(RegexesOfInterest.filter((i) => !i.invalidWithUnicode))(
      'should properly tokenize the regex $regex in unicode mode',
      ({ regex }) => {
        const unicodeRegex = new RegExp(regex, 'u');
        const tokenized = tokenizeRegex(unicodeRegex);
        expect(tokenized).toEqual(parse(unicodeRegex).body);
      },
    );

    it.each`
      regex
      ${/🐱/u}
      ${/🐱+/u}
      ${/[🐱🐴]/u}
      ${/[🐱-🐴]/u}
      ${/[a-🐱b-🐴]/u}
    `('should consider code-point as any other character when parsing $regex', ({ regex }) => {
      const catReplacement = '\ufff0';
      const horseReplacement = '\ufff4';
      const revampedRegex = new RegExp(
        regex.source.replace(/🐱/g, catReplacement).replace(/🐴/g, horseReplacement),
        regex.flag,
      );
      const tokenized = tokenizeRegex(regex);
      const tokenizedRevamped = tokenizeRegex(revampedRegex);
      const tokenizedRevampedUpdated = JSON.parse(
        JSON.stringify(tokenizedRevamped, (key, value) => {
          if (value === catReplacement) {
            return '🐱';
          }
          if (value === catReplacement.codePointAt(0)) {
            return '🐱'.codePointAt(0);
          }
          if (value === horseReplacement) {
            return '🐴';
          }
          if (value === horseReplacement.codePointAt(0)) {
            return '🐴'.codePointAt(0);
          }
          return value;
        }),
      );
      expect(tokenizedRevampedUpdated).toEqual(tokenized);
    });
  });
});
