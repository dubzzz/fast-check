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
    { regex: /🐱/ },
    { regex: /\125/, invalidWithUnicode: true },
    { regex: /\x25/ },
    { regex: /\u0025/ },
    { regex: /\u{1f431}/ },
    { regex: /\u{1f43}/ },
    { regex: /\n/ },
    { regex: /\w/ },
    { regex: /[abc]/ },
    { regex: /[{]/ },
    { regex: /[(]/ },
    { regex: /[.*]/ },
    { regex: /[.*[\\\](){}?]/ },
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
    { regex: /\u{1[81]}/, invalidWithUnicode: true },
    { regex: /[\u{1f431}-\u{1f434}]/u },
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
  ];

  describe('non-unicode regex', () => {
    it.each(allRegexes.filter((i) => !i.regex.flags.includes('u')))(
      'should properly tokenize the regex $regex',
      ({ regex }) => {
        const tokenized = tokenizeRegex(regex);
        expect(tokenized).toEqual(parse(regex).body);
      }
    );
  });

  describe('unicode regex', () => {
    it.each(allRegexes.filter((i) => !i.invalidWithUnicode))(
      'should properly tokenize the regex $regex in unicode mode',
      ({ regex }) => {
        const unicodeRegex = new RegExp(regex, 'u');
        const tokenized = tokenizeRegex(unicodeRegex);
        expect(tokenized).toEqual(parse(unicodeRegex).body);
      }
    );
  });
});
