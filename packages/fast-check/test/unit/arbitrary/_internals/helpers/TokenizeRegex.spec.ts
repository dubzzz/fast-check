import { describe, it, expect } from 'vitest';
import { parse } from 'regexp-tree';
import { tokenizeRegex } from '../../../../../src/arbitrary/_internals/helpers/TokenizeRegex';

describe('tokenizeRegex', () => {
  const allRegexes = [
    // Regexes declared with the /u flag,
    // will not be executed against non-unicode tests
    { regex: /./ },
    { regex: /.*/ },
    { regex: /.+/ },
    { regex: /.{1}/ },
    { regex: /.{1,4}/ },
    { regex: /.{1,}/ },
    { regex: /.?/ },
    { regex: /.*?/ },
    { regex: /.??/ },
    { regex: /.{1,4}?/ },
    { regex: /a/ },
    { regex: /🐱/, invalidWithUnicode: true }, // handled separately
    // @ts-expect-error Referencing non-existing group in Regex
    { regex: /\125/, invalidWithUnicode: true },
    { regex: /\x25/ },
    { regex: /\u0025/ },
    // @ts-expect-error Missing unicode mode on Regex
    { regex: /\u{1f431}/ },
    // @ts-expect-error Missing unicode mode on Regex
    { regex: /\u{1f43}/ },
    { regex: /\n/ },
    { regex: /\w/ },
    { regex: /[abc]/ },
    { regex: /[{]/ },
    { regex: /[(]/ },
    { regex: /[.*]/ },
    { regex: /[.*[\\\](){}?]/ },
    // @ts-expect-error Missing unicode mode on Regex
    { regex: /[\u{1f431}]/ },
    { regex: /[a-z]/ },
    { regex: /[A-Za-z0-9-]/ },
    { regex: /[A-Za-z0-9-/]/ },
    { regex: /[ac-ez]/ },
    { regex: /[A-Z][a-z]*/ },
    { regex: /[a\-z]/ },
    { regex: /[\wz]/ },
    { regex: /[.-f]/ },
    { regex: /[\w-z]/, invalidWithUnicode: true }, // equivalent to [w-z]
    { regex: /[^abc]/ },
    { regex: /[^a-z]/ },
    { regex: /[abc^def]/ },
    { regex: /[a-z^A-Z]/ },
    // @ts-expect-error Missing unicode mode on Regex
    { regex: /\u{1[81]}/, invalidWithUnicode: true },
    { regex: /[\u{1f431}-\u{1f434}]/u },
    { regex: /(foo)/ }, // capturing group
    { regex: /(foo) (bar) (baz)/ }, // multiple capturing groups
    // @ts-expect-error ES2018+ Regex
    { regex: /(?<named>x)/ }, // named capturing group
    // @ts-expect-error ES2018+ Regex
    { regex: /(foo) (?<named>x) (bar)/ }, // named capturing group with anonymous capturing groups
    { regex: /(?:x)/ }, // non-capturing group
    { regex: /(foo) (?:x) (bar)/ }, // non-capturing group with anonymous capturing groups
    { regex: /(\))/ },
    { regex: /([)])/ },
    { regex: /([)\]])/ },
    // @ts-expect-error ES2018+ Regex
    { regex: /(function\s+)(?<name>[$_A-Z][$_A-Za-z0-9]*)/ },
    { regex: /a|b/ }, // 'or' with only two operands containing a single token each
    { regex: /a|b|c/ }, // 'or' with strictly more than two operands containing a single token each
    { regex: /abc|def/ }, // 'or' with only two operands containing a multiple tokens each
    { regex: /abc|def|h|jkl/ }, // 'or' with strictly more than two operands
    { regex: /abc|[|]/ }, // 'or' with operands having pipe in it
    { regex: /abc|\|/ }, // 'or' with operands having escaped pipe in it
    { regex: /a\w+c|d.*|e[f-k]l/ }, // 'or' with complex operands
    { regex: /(abc|def)/ },
    { regex: /^ab$/ },
    { regex: /[^a][b$]/ },
    { regex: /[a^][$b]/ },
    { regex: /(^|a)(b|$)/ },
    { regex: /(a|^)($|b)/ },
    { regex: /a^$b/ },
    { regex: /a*^$b*/ }, // matches '', but not 'aa', seems equivalent to /^$/
    { regex: /\^ab\$/ },
    // @ts-expect-error Referencing non-existing group in Regex
    { regex: /\1/, invalidWithUnicode: true },
    // @ts-expect-error Referencing non-existing group in Regex
    { regex: /\1000/, invalidWithUnicode: true }, // in non-unicode: \100 then 0
    { regex: /(a)\1/ },
    // @ts-expect-error Referencing non-existing group in Regex
    { regex: /(a)\2/, invalidWithUnicode: true }, // in non-unicode: \2 is considered as an octal
    { regex: /(?=a)/ },
    { regex: /(?!a)/ },
    { regex: /(?<=a)/ },
    { regex: /(?<!a)/ },
    { regex: /(?=(a+))/ },
    { regex: /(?!(a+)b)/ },
    { regex: /(?<=([ab]+)([bc]+))/ },
    { regex: /a(2|)b/ },
    { regex: /a(|2)b/ },
    { regex: /(a(b)c)/ },
    // @ts-expect-error ES2018+ Regex
    { regex: /(?<la>a(?<lb>b)c)/ },
    // @ts-expect-error ES2018+ Regex
    { regex: /(?<label>[A-Z][a-z]*) \k<label>/ },
    // @ts-expect-error ES2018+ Regex
    { regex: /(?<la>[A-Z][a-z]*) (?<lb>[A-Z][a-z]*) \k<lb> \k<la>/ },
    // @ts-expect-error Missing unicode mode on Regex
    { regex: /\P{Emoji_Presentation}/, expectThrowUnicode: true }, // not supported for now
    // @ts-expect-error Missing unicode mode on Regex
    { regex: /\P{Script_Extensions=Thaana}/, expectThrowUnicode: true }, // not supported for now
  ];

  describe('non-unicode regex', () => {
    it.each(allRegexes.filter((i) => !i.regex.flags.includes('u')))(
      'should properly tokenize the regex $regex',
      ({ regex }) => {
        const tokenized = tokenizeRegex(regex);
        expect(tokenized).toEqual(parse(regex).body);
      },
    );
  });

  describe('unicode regex', () => {
    it.each(allRegexes.filter((i) => !i.invalidWithUnicode))(
      'should properly tokenize the regex $regex in unicode mode',
      ({ regex, expectThrowUnicode }) => {
        const unicodeRegex = new RegExp(regex, 'u');
        if (!expectThrowUnicode) {
          const tokenized = tokenizeRegex(unicodeRegex);
          expect(tokenized).toEqual(parse(unicodeRegex).body);
        } else {
          expect(() => tokenizeRegex(unicodeRegex)).toThrowError();
        }
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
