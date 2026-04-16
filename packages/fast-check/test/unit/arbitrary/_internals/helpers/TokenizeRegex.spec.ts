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

  describe('unicodeSets regex (v flag)', () => {
    // For regexes whose shape is identical under u and v (no v-only syntax),
    // the only AST diff is `unicodeSets: true` added to character class nodes.
    // We tokenize both and assert structural equality after stripping that flag.
    function stripUnicodeSetsFlag(node: unknown): unknown {
      if (Array.isArray(node)) return node.map(stripUnicodeSetsFlag);
      if (node !== null && typeof node === 'object') {
        const out: Record<string, unknown> = {};
        for (const k of Object.keys(node as Record<string, unknown>)) {
          if (k === 'unicodeSets') continue;
          out[k] = stripUnicodeSetsFlag((node as Record<string, unknown>)[k]);
        }
        return out;
      }
      return node;
    }

    it.each`
      source
      ${'abc'}
      ${'a|b|c'}
      ${'(foo)+'}
      ${'\\d{2,4}'}
      ${'[a-z]'}
      ${'[^A-Za-z0-9_]'}
      ${'\\p{Letter}'}
      ${'(?<name>x)'}
    `('should tokenize $source identically under /v and /u (modulo unicodeSets flag)', ({ source }) => {
      const vRegex = new RegExp(source, 'v');
      const uRegex = new RegExp(source, 'u');
      const vTokenized = tokenizeRegex(vRegex);
      const uTokenized = tokenizeRegex(uRegex);
      expect(stripUnicodeSetsFlag(vTokenized)).toEqual(uTokenized);
    });

    it('should tokenize a nested character class', () => {
      const tokenized = tokenizeRegex(new RegExp('[[abc]]', 'v'));
      expect(tokenized).toEqual({
        type: 'CharacterClass',
        unicodeSets: true,
        negative: undefined,
        expressions: [
          {
            type: 'CharacterClass',
            unicodeSets: true,
            negative: undefined,
            expressions: [
              { type: 'Char', kind: 'simple', symbol: 'a', value: 'a', codePoint: 97 },
              { type: 'Char', kind: 'simple', symbol: 'b', value: 'b', codePoint: 98 },
              { type: 'Char', kind: 'simple', symbol: 'c', value: 'c', codePoint: 99 },
            ],
          },
        ],
      });
    });

    it('should tokenize a class intersection', () => {
      const tokenized = tokenizeRegex(new RegExp('[[a-z]&&[^aeiou]]', 'v'));
      expect(tokenized).toMatchObject({
        type: 'CharacterClass',
        unicodeSets: true,
        expressions: [
          {
            type: 'ClassIntersection',
            left: { type: 'CharacterClass', unicodeSets: true },
            right: { type: 'CharacterClass', unicodeSets: true, negative: true },
          },
        ],
      });
    });

    it('should tokenize a class subtraction', () => {
      const tokenized = tokenizeRegex(new RegExp('[[a-z]--[aeiou]]', 'v'));
      expect(tokenized).toMatchObject({
        type: 'CharacterClass',
        unicodeSets: true,
        expressions: [
          {
            type: 'ClassSubtraction',
            left: { type: 'CharacterClass', unicodeSets: true },
            right: { type: 'CharacterClass', unicodeSets: true },
          },
        ],
      });
    });

    it('should tokenize a chained intersection left-associatively', () => {
      const tokenized = tokenizeRegex(new RegExp('[[a-z]&&[b-y]&&[c-x]]', 'v'));
      expect(tokenized).toMatchObject({
        type: 'CharacterClass',
        unicodeSets: true,
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

    it('should throw on \\q{...} string literals in a class (not supported yet)', () => {
      expect(() => tokenizeRegex(new RegExp('[\\q{abc|def}]', 'v'))).toThrowError(/\\q\{\.\.\.\}/);
    });

    it('should tokenize a string-valued unicode property', () => {
      const tokenized = tokenizeRegex(new RegExp('\\p{RGI_Emoji}', 'v'));
      expect(tokenized).toMatchObject({
        type: 'UnicodeProperty',
        name: 'RGI_Emoji',
        binary: true,
        isString: true,
        negative: false,
      });
    });

    it('should reject \\p{RGI_Emoji} when not in v mode', () => {
      // We can't construct /\p{RGI_Emoji}/u — Node throws. Build it manually.
      const regex = Object.create(RegExp.prototype) as RegExp;
      Object.defineProperty(regex, 'flags', { value: 'u' });
      Object.defineProperty(regex, 'source', { value: '\\p{RGI_Emoji}' });
      expect(() => tokenizeRegex(regex)).toThrowError(/Invalid Unicode property/);
    });

    it('should reject \\P{RGI_Emoji} (negated string property) under v', () => {
      // /\P{RGI_Emoji}/v is itself rejected by the RegExp constructor in Node.
      // Build it manually to exercise the tokenizer-side guard.
      const regex = Object.create(RegExp.prototype) as RegExp;
      Object.defineProperty(regex, 'flags', { value: 'v' });
      Object.defineProperty(regex, 'source', { value: '\\P{RGI_Emoji}' });
      expect(() => tokenizeRegex(regex)).toThrowError(/negation of string-valued/);
    });
  });
});
