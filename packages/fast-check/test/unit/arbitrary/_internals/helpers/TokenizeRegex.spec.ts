import { describe, it, expect } from 'vitest';
import { parse } from 'regexp-tree';
import { tokenizeRegex } from '../../../../../src/arbitrary/_internals/helpers/TokenizeRegex.js';

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
    { regex: /(?<named>x)/ }, // named capturing group
    { regex: /(foo) (?<named>x) (bar)/ }, // named capturing group with anonymous capturing groups
    { regex: /(?:x)/ }, // non-capturing group
    { regex: /(foo) (?:x) (bar)/ }, // non-capturing group with anonymous capturing groups
    { regex: /(\))/ },
    { regex: /([)])/ },
    { regex: /([)\]])/ },
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
    // oxlint-disable-next-line no-control-regex
    { regex: /\1/, invalidWithUnicode: true },
    // @ts-expect-error Referencing non-existing group in Regex
    { regex: /\1000/, invalidWithUnicode: true }, // in non-unicode: \100 then 0
    { regex: /(a)\1/ },
    // @ts-expect-error Referencing non-existing group in Regex
    // oxlint-disable-next-line no-control-regex
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
    { regex: /(?<la>a(?<lb>b)c)/ },
    { regex: /(?<label>[A-Z][a-z]*) \k<label>/ },
    { regex: /(?<la>[A-Z][a-z]*) (?<lb>[A-Z][a-z]*) \k<lb> \k<la>/ },
    // @ts-expect-error Missing unicode mode on Regex
    { regex: /\P{Emoji_Presentation}/ },
    // @ts-expect-error Missing unicode mode on Regex
    { regex: /\P{Script_Extensions=Thaana}/ },
    // @ts-expect-error Missing unicode mode on Regex
    { regex: /[a-\p{Letter}]/, invalidWithUnicode: true },
    // Unicode property escapes
    { regex: /\p{Letter}/u },
    { regex: /\p{L}/u },
    { regex: /\p{Emoji}/u },
    { regex: /\p{Script=Latin}/u },
    { regex: /\p{sc=Latin}/u },
    { regex: /[\p{Letter}\d]/u },
    { regex: /[\p{Letter}-]/u },
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
      ({ regex }) => {
        const unicodeRegex = new RegExp(regex, 'u');
        const tokenized = tokenizeRegex(unicodeRegex);
        expect(tokenized).toEqual(parse(unicodeRegex).body);
      },
    );

    it.each(
      allRegexes
        .filter((i) => !i.invalidWithUnicode)
        // Exclude regexes that are outright invalid under the v flag (JavaScript throws at RegExp construction)
        .filter((i) => {
          try {
            // oxlint-disable-next-line no-new
            new RegExp(i.regex.source, 'v');
            return true;
          } catch {
            return false;
          }
        }),
    )(
      'should tokenize $regex identically in v-mode and u-mode when the regex uses no v-specific construct',
      ({ regex }) => {
        // regexp-tree does not support the v flag, so we validate v-mode against our own u-mode output instead
        const uRegex = new RegExp(regex.source, 'u');
        const vRegex = new RegExp(regex.source, 'v');
        expect(tokenizeRegex(vRegex)).toEqual(tokenizeRegex(uRegex));
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

  describe('v-mode regex', () => {
    // regexp-tree predates ES2024 and does not support the v flag, so expected ASTs are asserted explicitly.
    const simpleChar = (char: string) => ({
      type: 'Char',
      kind: 'simple',
      symbol: char,
      value: char,
      codePoint: char.codePointAt(0),
    });
    const charClass = (expressions: unknown[], negative?: true) => {
      const node: Record<string, unknown> = { type: 'CharacterClass', expressions };
      if (negative) node.negative = true;
      return node;
    };

    it('should parse intersection "[a&&b]"', () => {
      expect(tokenizeRegex(new RegExp('[a&&b]', 'v'))).toEqual(
        charClass([
          {
            type: 'ClassIntersection',
            left: charClass([simpleChar('a')]),
            right: charClass([simpleChar('b')]),
          },
        ]),
      );
    });

    it('should parse subtraction "[a--b]"', () => {
      expect(tokenizeRegex(new RegExp('[a--b]', 'v'))).toEqual(
        charClass([
          {
            type: 'ClassSubtraction',
            left: charClass([simpleChar('a')]),
            right: charClass([simpleChar('b')]),
          },
        ]),
      );
    });

    it('should parse \\q{...} string disjunction', () => {
      expect(tokenizeRegex(new RegExp('[\\q{ab|cd}]', 'v'))).toEqual(
        charClass([
          {
            type: 'ClassStringDisjunction',
            alternatives: [
              { type: 'Alternative', expressions: [simpleChar('a'), simpleChar('b')] },
              { type: 'Alternative', expressions: [simpleChar('c'), simpleChar('d')] },
            ],
          },
        ]),
      );
    });

    it('should parse \\q{} as a single empty alternative', () => {
      expect(tokenizeRegex(new RegExp('[\\q{}]', 'v'))).toEqual(
        charClass([
          {
            type: 'ClassStringDisjunction',
            alternatives: [{ type: 'Alternative', expressions: [] }],
          },
        ]),
      );
    });

    it('should bind negation to the full set-operation class "[^a&&b]"', () => {
      // [^a&&b] = complement of (a intersection b); negative flag must sit on the outer class
      expect(tokenizeRegex(new RegExp('[^a&&b]', 'v'))).toEqual(
        charClass(
          [
            {
              type: 'ClassIntersection',
              left: charClass([simpleChar('a')]),
              right: charClass([simpleChar('b')]),
            },
          ],
          true,
        ),
      );
    });

    it('should parse nested classes "[[a-z]&&[aeiou]]"', () => {
      const tokenized = tokenizeRegex(new RegExp('[[a-z]&&[aeiou]]', 'v'));
      // Assert the high-level shape with toMatchObject to avoid coupling to wrapping CharacterClass layers
      expect(tokenized).toMatchObject({
        type: 'CharacterClass',
        expressions: [
          {
            type: 'ClassIntersection',
            left: { type: 'CharacterClass' },
            right: { type: 'CharacterClass' },
          },
        ],
      });
    });

    it('should parse multiple operators left-associatively via nested classes', () => {
      // "[[abc]&&[def]&&[ghi]]" — mixing intersection operators is allowed when disambiguated by brackets
      const tokenized = tokenizeRegex(new RegExp('[[abc]&&[def]&&[ghi]]', 'v'));
      expect(tokenized).toMatchObject({
        type: 'CharacterClass',
        expressions: [
          {
            type: 'ClassIntersection',
            left: {
              type: 'ClassIntersection',
              left: { type: 'CharacterClass' },
              right: { type: 'CharacterClass' },
            },
            right: { type: 'CharacterClass' },
          },
        ],
      });
    });

    it('should not treat && or -- as operators outside Character mode', () => {
      // && and -- at the regex source level (not inside a class) are just two literal chars
      expect(tokenizeRegex(new RegExp('a&&b', 'v'))).toEqual({
        type: 'Alternative',
        expressions: [simpleChar('a'), simpleChar('&'), simpleChar('&'), simpleChar('b')],
      });
    });

    it('should still honour escaped "-" inside a class', () => {
      expect(tokenizeRegex(new RegExp('[a\\-b]', 'v'))).toMatchObject({
        type: 'CharacterClass',
        expressions: [{ type: 'Char', symbol: 'a' }, { type: 'Char', symbol: '-' }, { type: 'Char', symbol: 'b' }],
      });
    });

    it('should parse \\q{...} alternatives that contain escaped "|"', () => {
      const tokenized = tokenizeRegex(new RegExp('[\\q{a\\|b|c}]', 'v'));
      expect(tokenized).toMatchObject({
        type: 'CharacterClass',
        expressions: [
          {
            type: 'ClassStringDisjunction',
            alternatives: [
              {
                type: 'Alternative',
                // first alternative is "a\|b" — three blocks: "a", "\|", "b"
                expressions: [
                  { symbol: 'a' },
                  { symbol: '|', escaped: true },
                  { symbol: 'b' },
                ],
              },
              { type: 'Alternative', expressions: [{ symbol: 'c' }] },
            ],
          },
        ],
      });
    });
  });
});
