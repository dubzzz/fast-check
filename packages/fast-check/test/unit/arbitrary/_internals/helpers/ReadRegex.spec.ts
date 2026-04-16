import { describe, it, expect } from 'vitest';
import {
  TokenizerBlockMode,
  UnicodeMode,
  readFrom,
} from '../../../../../src/arbitrary/_internals/helpers/ReadRegex.js';

describe('readFrom', () => {
  it.each`
    source                       | expected
    ${'a'}                       | ${'a'}
    ${'.'}                       | ${'.'}
    ${'*'}                       | ${'*'}
    ${'\\1'}                     | ${'\\1'}
    ${'\\12'}                    | ${'\\12'}
    ${'\\127'}                   | ${'\\127'}
    ${'\\1274'}                  | ${['\\127', '\\1274']}
    ${'\\x25'}                   | ${'\\x25'}
    ${'\\u2525'}                 | ${'\\u2525'}
    ${'\\u{1f431}'}              | ${['\\u', '\\u{1f431}']}
    ${'\\u{1f43}'}               | ${['\\u', '\\u{1f43}']}
    ${'\\u{1f4}'}                | ${['\\u', '\\u{1f4}']}
    ${'\\u{1f}'}                 | ${['\\u', '\\u{1f}']}
    ${'\\u{1}'}                  | ${['\\u', '\\u{1}']}
    ${'\\\\'}                    | ${'\\\\'}
    ${'\\*'}                     | ${'\\*'}
    ${'{1}'}                     | ${'{1}'}
    ${'{1,}'}                    | ${'{1,}'}
    ${'{1,3}'}                   | ${'{1,3}'}
    ${'{1[2]3}'}                 | ${'{'}
    ${'{,1}'}                    | ${'{'}
    ${'{1, 3}'}                  | ${'{'}
    ${'{}'}                      | ${'{'}
    ${'[A-Za-z0-9]'}             | ${'[A-Za-z0-9]'}
    ${'[\\u{1f431}]'}            | ${'[\\u{1f431}]'}
    ${'[{]'}                     | ${'[{]'}
    ${'[\\u{1f431}]'}            | ${'[\\u{1f431}]'}
    ${'[\\]]'}                   | ${'[\\]]'}
    ${'(abc|cde)'}               | ${'(abc|cde)'}
    ${'(\\))'}                   | ${'(\\))'}
    ${'([)])'}                   | ${'([)])'}
    ${'([)\\]])'}                | ${'([)\\]])'}
    ${'(?=a)'}                   | ${'(?=a)'}
    ${'(?<=a)'}                  | ${'(?<=a)'}
    ${'(?=(a+))'}                | ${'(?=(a+))'}
    ${'(?!(a+)b\\2c)'}           | ${'(?!(a+)b\\2c)'}
    ${'(?<=([ab]+)([bc]+))'}     | ${'(?<=([ab]+)([bc]+))'}
    ${'\\p{a}'}                  | ${['\\p', '\\p{a}']}
    ${'\\p{Emoji_Presentation}'} | ${['\\p', '\\p{Emoji_Presentation}']}
    ${'\\P{Emoji_Presentation}'} | ${['\\P', '\\P{Emoji_Presentation}']}
    ${'\\p{Emoji_Presentation'}  | ${['\\p', null]}
    ${'\\P{Emoji_Presentation'}  | ${['\\P', null]}
    ${'\\k<a>'}                  | ${'\\k<a>'}
    ${'\\k<group_name>'}         | ${'\\k<group_name>'}
    ${'\\k<group_name'}          | ${['\\k', null]}
    ${'(?<la>a(?<lb>b)c)'}       | ${'(?<la>a(?<lb>b)c)'}
    ${'🐱'}                      | ${['\ud83d', '🐱']}
    ${'\\🐱'}                    | ${['\\\ud83d', '\\🐱']}
  `('should properly extract first block of "$source"', ({ source, expected }) => {
    const expectedNonUnicode = typeof expected === 'string' ? expected : expected[0];
    const expectedUnicode = typeof expected === 'string' ? expected : expected[1];
    expect(readFrom(source, 0, UnicodeMode.None, TokenizerBlockMode.Full)).toBe(expectedNonUnicode);
    if (expectedUnicode !== null) {
      expect(readFrom(source, 0, UnicodeMode.Unicode, TokenizerBlockMode.Full)).toBe(expectedUnicode);
    } else {
      expect(() => readFrom(source, 0, UnicodeMode.Unicode, TokenizerBlockMode.Full)).toThrowError();
    }
  });

  describe('v-mode (UnicodeSets)', () => {
    it.each`
      source                | expected
      ${'[[a]&&[b]]'}       | ${'[[a]&&[b]]'}
      ${'[a--[bc]]'}        | ${'[a--[bc]]'}
      ${'[\\q{ab|cd}]'}     | ${'[\\q{ab|cd}]'}
      ${'[[a&&b]--[c]]'}    | ${'[[a&&b]--[c]]'}
      ${'[\\q{a\\|b}]'}     | ${'[\\q{a\\|b}]'}
      ${'[\\q{}]'}          | ${'[\\q{}]'}
    `('should extract the full "$source" block in v-mode', ({ source, expected }) => {
      expect(readFrom(source, 0, UnicodeMode.UnicodeSets, TokenizerBlockMode.Full)).toBe(expected);
    });

    it.each`
      source    | expected
      ${'&&'}   | ${'&&'}
      ${'--'}   | ${'--'}
      ${'&'}    | ${'&'}
      ${'-'}    | ${'-'}
      ${'&a'}   | ${'&'}
      ${'-a'}   | ${'-'}
    `('should return "$expected" for "$source" in Character mode under v-mode', ({ source, expected }) => {
      expect(readFrom(source, 0, UnicodeMode.UnicodeSets, TokenizerBlockMode.Character)).toBe(expected);
    });

    it.each`
      source    | expected
      ${'&&'}   | ${'&'}
      ${'--'}   | ${'-'}
    `('should NOT fuse "$source" into a single block outside v-mode', ({ source, expected }) => {
      expect(readFrom(source, 0, UnicodeMode.None, TokenizerBlockMode.Character)).toBe(expected);
      expect(readFrom(source, 0, UnicodeMode.Unicode, TokenizerBlockMode.Character)).toBe(expected);
    });

    it('should throw on unterminated \\q{', () => {
      expect(() => readFrom('\\q{ab', 0, UnicodeMode.UnicodeSets, TokenizerBlockMode.Character)).toThrowError();
    });

    it('should throw on unterminated nested [', () => {
      expect(() => readFrom('[[a&&', 0, UnicodeMode.UnicodeSets, TokenizerBlockMode.Full)).toThrowError();
    });

    it('should not treat \\q{...} as a block outside Character mode', () => {
      // In Full mode, \q is a generic escape returning \q (length 2)
      expect(readFrom('\\q{ab}', 0, UnicodeMode.UnicodeSets, TokenizerBlockMode.Full)).toBe('\\q');
    });

    it('should not treat \\q{...} as a block when not in v-mode', () => {
      // In Unicode (u flag) Character mode, \q is not special: single escaped char
      expect(readFrom('\\q{ab}', 0, UnicodeMode.Unicode, TokenizerBlockMode.Character)).toBe('\\q');
    });

    it('should not treat a nested [...] as a block when not in v-mode', () => {
      // In Unicode (u flag) Character mode, a "[" inside a class is just a literal '['
      expect(readFrom('[abc]', 0, UnicodeMode.Unicode, TokenizerBlockMode.Character)).toBe('[');
    });
  });
});
