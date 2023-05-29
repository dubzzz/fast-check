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
    { regex: /\125/, noUnicode: true },
    { regex: /\x25/ },
    { regex: /\u0025/ },
    { regex: /\u{1f431}/ },
    { regex: /\u{1f43}/ },
    { regex: /\n/ },
    { regex: /\w/ },
    { regex: /[abc]/ },
    { regex: /[{]/ },
    //{ regex: /[.*]/ },
    { regex: /[\u{1f431}]/ },
    //{ regex: /[a-z]/ },
    //{ regex: /(ab|cd)/ },
    { regex: /\u{1[81]}/, noUnicode: true },
  ];

  it.each(allRegexes)('should properly tokenize the regex $regex', ({ regex }) => {
    const tokenized = tokenizeRegex(regex);
    expect(tokenized).toEqual(parse(regex).body);
  });

  it.each(allRegexes.filter((i) => !i.noUnicode))(
    'should properly tokenize the regex $regex in unicode mode',
    ({ regex }) => {
      const unicodeRegex = new RegExp(regex, 'u');
      const tokenized = tokenizeRegex(unicodeRegex);
      expect(tokenized).toEqual(parse(unicodeRegex).body);
    }
  );
});
