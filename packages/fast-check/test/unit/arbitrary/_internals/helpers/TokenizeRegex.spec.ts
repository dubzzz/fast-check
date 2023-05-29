import { parse } from 'regexp-tree';
import { tokenizeRegex } from '../../../../../src/arbitrary/_internals/helpers/TokenizeRegex';

describe('tokenizeRegex', () => {
  const allRegexes = [
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
    { regex: /\125/, invalidWithUnicode: true },
    { regex: /\x25/ },
    { regex: /\u0025/ },
    { regex: /\u{1f431}/ },
    { regex: /\u{1f43}/ },
    { regex: /\n/ },
    { regex: /\w/ },
    { regex: /[abc]/ },
    { regex: /[{]/ },
    { regex: /[.*]/ },
    { regex: /[\u{1f431}]/ },
    { regex: /[a-z]/ },
    { regex: /[A-Za-z0-9-]/ },
    { regex: /[A-Za-z0-9-/]/ },
    { regex: /[ac-ez]/ },
    { regex: /[A-Z][a-z]*/ },
    { regex: /\u{1[81]}/, invalidWithUnicode: true },
    { regex: /[\u{1f431}-\u{1f434}]/, invalidWithNonUnicode: true },
    { regex: /[🐱-🐴]/, invalidWithNonUnicode: true },
  ];

  it.each(allRegexes.filter((i) => !i.invalidWithNonUnicode))(
    'should properly tokenize the regex $regex',
    ({ regex }) => {
      const tokenized = tokenizeRegex(regex);
      expect(tokenized).toEqual(parse(regex).body);
    }
  );

  it.each(allRegexes.filter((i) => !i.invalidWithUnicode))(
    'should properly tokenize the regex $regex in unicode mode',
    ({ regex }) => {
      const unicodeRegex = new RegExp(regex, 'u');
      const tokenized = tokenizeRegex(unicodeRegex);
      expect(tokenized).toEqual(parse(unicodeRegex).body);
    }
  );
});
