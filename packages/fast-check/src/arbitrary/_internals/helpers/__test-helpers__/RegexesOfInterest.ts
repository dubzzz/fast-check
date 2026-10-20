export const RegexesOfInterest: {
  regex: RegExp;
  invalidInUnicodeMode?: boolean; // invalid with the /u flag
  unmatchable?: boolean; // no string can match
  unsupportedByStringMatching?: boolean; // unsupported by `fc.stringMatching`
}[] = [
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
  { regex: /🐱/, invalidInUnicodeMode: true }, // handled separately
  // @ts-expect-error Referencing non-existing group in Regex
  { regex: /\125/, invalidInUnicodeMode: true, unsupportedByStringMatching: true }, // matches 'U'
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
  { regex: /[\w-z]/, invalidInUnicodeMode: true, unsupportedByStringMatching: true }, // matches any character from A–Z, a–z, 0–9, _ or -
  { regex: /[^abc]/ },
  { regex: /[^a-z]/ },
  { regex: /[abc^def]/ },
  { regex: /[a-z^A-Z]/ },
  // @ts-expect-error Missing unicode mode on Regex
  { regex: /\u{1[81]}/, invalidInUnicodeMode: true },
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
  { regex: /a^$b/, unmatchable: true }, // no match possible!
  { regex: /a*^$b*/, unsupportedByStringMatching: true }, // matches '', but not 'aa', seems equivalent to /^$/ ; not supported for now, considered to be a malformed regex
  { regex: /\^ab\$/ },
  // @ts-expect-error Referencing non-existing group in Regex
  // oxlint-disable-next-line no-control-regex
  { regex: /\1/, invalidInUnicodeMode: true },
  // @ts-expect-error Referencing non-existing group in Regex
  { regex: /\1000/, invalidInUnicodeMode: true, unsupportedByStringMatching: true }, // in non-unicode: \100 then 0 ; matches '@0'
  { regex: /(a)\1/, unsupportedByStringMatching: true },
  // @ts-expect-error Referencing non-existing group in Regex
  // oxlint-disable-next-line no-control-regex
  { regex: /(a)\2/, invalidInUnicodeMode: true }, // in non-unicode: \2 is considered as an octal
  { regex: /(?=a)/, unsupportedByStringMatching: true },
  { regex: /(?!a)/, unsupportedByStringMatching: true },
  { regex: /(?<=a)/, unsupportedByStringMatching: true },
  { regex: /(?<!a)/, unsupportedByStringMatching: true },
  { regex: /(?=(a+))/, unsupportedByStringMatching: true },
  { regex: /(?!(a+)b)/, unsupportedByStringMatching: true },
  { regex: /(?<=([ab]+)([bc]+))/, unsupportedByStringMatching: true },
  { regex: /a(2|)b/ },
  { regex: /a(|2)b/ },
  { regex: /(a(b)c)/ },
  { regex: /(?<la>a(?<lb>b)c)/ },
  { regex: /(?<label>[A-Z][a-z]*) \k<label>/, unsupportedByStringMatching: true },
  { regex: /(?<la>[A-Z][a-z]*) (?<lb>[A-Z][a-z]*) \k<lb> \k<la>/, unsupportedByStringMatching: true },
  // @ts-expect-error Missing unicode mode on Regex
  { regex: /\P{Emoji_Presentation}/ },
  // @ts-expect-error Missing unicode mode on Regex
  { regex: /\P{Script_Extensions=Thaana}/ },
  // @ts-expect-error Missing unicode mode on Regex
  { regex: /[a-\p{Letter}]/, invalidInUnicodeMode: true },
  // Unicode property escapes
  { regex: /\p{Letter}/u },
  { regex: /\p{L}/u },
  { regex: /\p{Emoji}/u },
  { regex: /\p{Script=Latin}/u },
  { regex: /\p{sc=Latin}/u },
  { regex: /[\p{Letter}\d]/u },
  { regex: /[\p{Letter}-]/u },
  // Proper handling of \0
  // oxlint-disable-next-line no-control-regex
  { regex: new RegExp('\0') },
  // oxlint-disable-next-line no-control-regex
  { regex: new RegExp('[\0-\0]') },
  // oxlint-disable-next-line no-control-regex
  { regex: new RegExp('[\\0-\\0]') },
];
