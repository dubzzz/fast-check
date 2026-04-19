import { describe, it, expect } from 'vitest';
import { TokenizerBlockMode, readFrom } from '../../../../../src/arbitrary/_internals/helpers/ReadRegex.js';

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
    expect(readFrom(source, 0, false, false, TokenizerBlockMode.Full)).toBe(expectedNonUnicode);
    if (expectedUnicode !== null) {
      expect(readFrom(source, 0, true, false, TokenizerBlockMode.Full)).toBe(expectedUnicode);
    } else {
      expect(() => readFrom(source, 0, true, false, TokenizerBlockMode.Full)).toThrowError();
    }
  });

  describe('unicodeSetsMode (v flag)', () => {
    it.each`
      source                 | expected
      ${'[[a-z]&&[^aeiou]]'} | ${'[[a-z]&&[^aeiou]]'}
      ${'[[a-z]--[aeiou]]'}  | ${'[[a-z]--[aeiou]]'}
      ${'[[abc][def]]'}      | ${'[[abc][def]]'}
      ${'[\\q{ab|cd}]'}      | ${'[\\q{ab|cd}]'}
      ${'[\\q{ab|cd}def]'}   | ${'[\\q{ab|cd}def]'}
      ${'[[[ab]--[b]]]'}     | ${'[[[ab]--[b]]]'}
    `('should extend read in v-mode for "$source"', ({ source, expected }) => {
      expect(readFrom(source, 0, true, true, TokenizerBlockMode.Full)).toBe(expected);
    });

    it.each`
      source  | expected
      ${'&&'} | ${'&&'}
      ${'--'} | ${'--'}
      ${'&a'} | ${'&'}
      ${'-a'} | ${'-'}
    `('should recognize set operators "$source" inside a class in v-mode', ({ source, expected }) => {
      expect(readFrom(source, 0, true, true, TokenizerBlockMode.Character)).toBe(expected);
    });

    it('should recognize \\q{...} as a single character-class sub-block in v-mode', () => {
      expect(readFrom('\\q{ab|cd}', 0, true, true, TokenizerBlockMode.Character)).toBe('\\q{ab|cd}');
    });

    it('should recognize a nested character class as a single character-class sub-block in v-mode', () => {
      expect(readFrom('[a-z]&&[^aeiou]', 0, true, true, TokenizerBlockMode.Character)).toBe('[a-z]');
    });

    it('should not treat && or -- as a two-char block outside of v-mode', () => {
      expect(readFrom('&&', 0, true, false, TokenizerBlockMode.Character)).toBe('&');
      expect(readFrom('--', 0, true, false, TokenizerBlockMode.Character)).toBe('-');
    });
  });
});
