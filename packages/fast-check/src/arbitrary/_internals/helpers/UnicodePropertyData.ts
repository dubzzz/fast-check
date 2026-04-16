/** @internal */
const NON_BINARY_ALIASES_TO_PROP_NAMES: Record<string, string> = {
  gc: 'General_Category',
  sc: 'Script',
  scx: 'Script_Extensions',
};

/** @internal */
const BINARY_PROP_NAMES_TO_ALIASES: Record<string, string> = {
  ASCII: 'ASCII',
  ASCII_Hex_Digit: 'AHex',
  Alphabetic: 'Alpha',
  Any: 'Any',
  Assigned: 'Assigned',
  Bidi_Control: 'Bidi_C',
  Bidi_Mirrored: 'Bidi_M',
  Case_Ignorable: 'CI',
  Cased: 'Cased',
  Changes_When_Casefolded: 'CWCF',
  Changes_When_Casemapped: 'CWCM',
  Changes_When_Lowercased: 'CWL',
  Changes_When_NFKC_Casefolded: 'CWKCF',
  Changes_When_Titlecased: 'CWT',
  Changes_When_Uppercased: 'CWU',
  Dash: 'Dash',
  Default_Ignorable_Code_Point: 'DI',
  Deprecated: 'Dep',
  Diacritic: 'Dia',
  Emoji: 'Emoji',
  Emoji_Component: 'Emoji_Component',
  Emoji_Modifier: 'Emoji_Modifier',
  Emoji_Modifier_Base: 'Emoji_Modifier_Base',
  Emoji_Presentation: 'Emoji_Presentation',
  Extended_Pictographic: 'Extended_Pictographic',
  Extender: 'Ext',
  Grapheme_Base: 'Gr_Base',
  Grapheme_Extend: 'Gr_Ext',
  Hex_Digit: 'Hex',
  IDS_Binary_Operator: 'IDSB',
  IDS_Trinary_Operator: 'IDST',
  ID_Continue: 'IDC',
  ID_Start: 'IDS',
  Ideographic: 'Ideo',
  Join_Control: 'Join_C',
  Logical_Order_Exception: 'LOE',
  Lowercase: 'Lower',
  Math: 'Math',
  Noncharacter_Code_Point: 'NChar',
  Pattern_Syntax: 'Pat_Syn',
  Pattern_White_Space: 'Pat_WS',
  Quotation_Mark: 'QMark',
  Radical: 'Radical',
  Regional_Indicator: 'RI',
  Sentence_Terminal: 'STerm',
  Soft_Dotted: 'SD',
  Terminal_Punctuation: 'Term',
  Unified_Ideograph: 'UIdeo',
  Uppercase: 'Upper',
  Variation_Selector: 'VS',
  White_Space: 'space',
  XID_Continue: 'XIDC',
  XID_Start: 'XIDS',
};

/** @internal */
const BINARY_ALIASES_TO_PROP_NAMES: Record<string, string> = inverseMap(BINARY_PROP_NAMES_TO_ALIASES);

/** @internal */
const GENERAL_CATEGORY_VALUE_TO_ALIASES: Record<string, string | string[]> = {
  Cased_Letter: 'LC',
  Close_Punctuation: 'Pe',
  Connector_Punctuation: 'Pc',
  Control: ['Cc', 'cntrl'],
  Currency_Symbol: 'Sc',
  Dash_Punctuation: 'Pd',
  Decimal_Number: ['Nd', 'digit'],
  Enclosing_Mark: 'Me',
  Final_Punctuation: 'Pf',
  Format: 'Cf',
  Initial_Punctuation: 'Pi',
  Letter: 'L',
  Letter_Number: 'Nl',
  Line_Separator: 'Zl',
  Lowercase_Letter: 'Ll',
  Mark: ['M', 'Combining_Mark'],
  Math_Symbol: 'Sm',
  Modifier_Letter: 'Lm',
  Modifier_Symbol: 'Sk',
  Nonspacing_Mark: 'Mn',
  Number: 'N',
  Open_Punctuation: 'Ps',
  Other: 'C',
  Other_Letter: 'Lo',
  Other_Number: 'No',
  Other_Punctuation: 'Po',
  Other_Symbol: 'So',
  Paragraph_Separator: 'Zp',
  Private_Use: 'Co',
  Punctuation: ['P', 'punct'],
  Separator: 'Z',
  Space_Separator: 'Zs',
  Spacing_Mark: 'Mc',
  Surrogate: 'Cs',
  Symbol: 'S',
  Titlecase_Letter: 'Lt',
  Unassigned: 'Cn',
  Uppercase_Letter: 'Lu',
};

/** @internal */
const GENERAL_CATEGORY_VALUE_ALIASES_TO_VALUES: Record<string, string> = inverseMap(GENERAL_CATEGORY_VALUE_TO_ALIASES);

/** @internal */
const SCRIPT_VALUE_TO_ALIASES: Record<string, string | string[]> = {
  Adlam: 'Adlm',
  Ahom: 'Ahom',
  Anatolian_Hieroglyphs: 'Hluw',
  Arabic: 'Arab',
  Armenian: 'Armn',
  Avestan: 'Avst',
  Balinese: 'Bali',
  Bamum: 'Bamu',
  Bassa_Vah: 'Bass',
  Batak: 'Batk',
  Bengali: 'Beng',
  Bhaiksuki: 'Bhks',
  Bopomofo: 'Bopo',
  Brahmi: 'Brah',
  Braille: 'Brai',
  Buginese: 'Bugi',
  Buhid: 'Buhd',
  Canadian_Aboriginal: 'Cans',
  Carian: 'Cari',
  Caucasian_Albanian: 'Aghb',
  Chakma: 'Cakm',
  Cham: 'Cham',
  Cherokee: 'Cher',
  Common: 'Zyyy',
  Coptic: ['Copt', 'Qaac'],
  Cuneiform: 'Xsux',
  Cypriot: 'Cprt',
  Cyrillic: 'Cyrl',
  Deseret: 'Dsrt',
  Devanagari: 'Deva',
  Dogra: 'Dogr',
  Duployan: 'Dupl',
  Egyptian_Hieroglyphs: 'Egyp',
  Elbasan: 'Elba',
  Ethiopic: 'Ethi',
  Georgian: 'Geor',
  Glagolitic: 'Glag',
  Gothic: 'Goth',
  Grantha: 'Gran',
  Greek: 'Grek',
  Gujarati: 'Gujr',
  Gunjala_Gondi: 'Gong',
  Gurmukhi: 'Guru',
  Han: 'Hani',
  Hangul: 'Hang',
  Hanifi_Rohingya: 'Rohg',
  Hanunoo: 'Hano',
  Hatran: 'Hatr',
  Hebrew: 'Hebr',
  Hiragana: 'Hira',
  Imperial_Aramaic: 'Armi',
  Inherited: ['Zinh', 'Qaai'],
  Inscriptional_Pahlavi: 'Phli',
  Inscriptional_Parthian: 'Prti',
  Javanese: 'Java',
  Kaithi: 'Kthi',
  Kannada: 'Knda',
  Katakana: 'Kana',
  Kayah_Li: 'Kali',
  Kharoshthi: 'Khar',
  Khmer: 'Khmr',
  Khojki: 'Khoj',
  Khudawadi: 'Sind',
  Lao: 'Laoo',
  Latin: 'Latn',
  Lepcha: 'Lepc',
  Limbu: 'Limb',
  Linear_A: 'Lina',
  Linear_B: 'Linb',
  Lisu: 'Lisu',
  Lycian: 'Lyci',
  Lydian: 'Lydi',
  Mahajani: 'Mahj',
  Makasar: 'Maka',
  Malayalam: 'Mlym',
  Mandaic: 'Mand',
  Manichaean: 'Mani',
  Marchen: 'Marc',
  Medefaidrin: 'Medf',
  Masaram_Gondi: 'Gonm',
  Meetei_Mayek: 'Mtei',
  Mende_Kikakui: 'Mend',
  Meroitic_Cursive: 'Merc',
  Meroitic_Hieroglyphs: 'Mero',
  Miao: 'Plrd',
  Modi: 'Modi',
  Mongolian: 'Mong',
  Mro: 'Mroo',
  Multani: 'Mult',
  Myanmar: 'Mymr',
  Nabataean: 'Nbat',
  New_Tai_Lue: 'Talu',
  Newa: 'Newa',
  Nko: 'Nkoo',
  Nushu: 'Nshu',
  Ogham: 'Ogam',
  Ol_Chiki: 'Olck',
  Old_Hungarian: 'Hung',
  Old_Italic: 'Ital',
  Old_North_Arabian: 'Narb',
  Old_Permic: 'Perm',
  Old_Persian: 'Xpeo',
  Old_Sogdian: 'Sogo',
  Old_South_Arabian: 'Sarb',
  Old_Turkic: 'Orkh',
  Oriya: 'Orya',
  Osage: 'Osge',
  Osmanya: 'Osma',
  Pahawh_Hmong: 'Hmng',
  Palmyrene: 'Palm',
  Pau_Cin_Hau: 'Pauc',
  Phags_Pa: 'Phag',
  Phoenician: 'Phnx',
  Psalter_Pahlavi: 'Phlp',
  Rejang: 'Rjng',
  Runic: 'Runr',
  Samaritan: 'Samr',
  Saurashtra: 'Saur',
  Sharada: 'Shrd',
  Shavian: 'Shaw',
  Siddham: 'Sidd',
  SignWriting: 'Sgnw',
  Sinhala: 'Sinh',
  Sogdian: 'Sogd',
  Sora_Sompeng: 'Sora',
  Soyombo: 'Soyo',
  Sundanese: 'Sund',
  Syloti_Nagri: 'Sylo',
  Syriac: 'Syrc',
  Tagalog: 'Tglg',
  Tagbanwa: 'Tagb',
  Tai_Le: 'Tale',
  Tai_Tham: 'Lana',
  Tai_Viet: 'Tavt',
  Takri: 'Takr',
  Tamil: 'Taml',
  Tangut: 'Tang',
  Telugu: 'Telu',
  Thaana: 'Thaa',
  Thai: 'Thai',
  Tibetan: 'Tibt',
  Tifinagh: 'Tfng',
  Tirhuta: 'Tirh',
  Ugaritic: 'Ugar',
  Vai: 'Vaii',
  Warang_Citi: 'Wara',
  Yi: 'Yiii',
  Zanabazar_Square: 'Zanb',
};

/** @internal */
const SCRIPT_VALUE_ALIASES_TO_VALUES: Record<string, string> = inverseMap(SCRIPT_VALUE_TO_ALIASES);

function inverseMap(data: Record<string, string | string[]>): Record<string, string> {
  const inverse: Record<string, string> = {};
  for (const name of Object.keys(data)) {
    const value = data[name];
    if (Array.isArray(value)) {
      for (let i = 0; i !== value.length; ++i) {
        inverse[value[i]] = name;
      }
    } else {
      inverse[value] = name;
    }
  }
  return inverse;
}

function isGeneralCategoryValue(value: string): boolean {
  return value in GENERAL_CATEGORY_VALUE_TO_ALIASES || value in GENERAL_CATEGORY_VALUE_ALIASES_TO_VALUES;
}

function isBinaryPropertyName(name: string): boolean {
  return name in BINARY_PROP_NAMES_TO_ALIASES || name in BINARY_ALIASES_TO_PROP_NAMES;
}

function getCanonicalName(name: string): string {
  if (name in NON_BINARY_ALIASES_TO_PROP_NAMES) {
    return NON_BINARY_ALIASES_TO_PROP_NAMES[name];
  }
  if (name in BINARY_ALIASES_TO_PROP_NAMES) {
    return BINARY_ALIASES_TO_PROP_NAMES[name];
  }
  if (
    name in BINARY_PROP_NAMES_TO_ALIASES ||
    name === 'General_Category' ||
    name === 'Script' ||
    name === 'Script_Extensions'
  ) {
    return name;
  }
  throw new Error(`Unknown Unicode property name: ${name}`);
}

function getCanonicalValue(value: string): string {
  if (value in GENERAL_CATEGORY_VALUE_ALIASES_TO_VALUES) {
    return GENERAL_CATEGORY_VALUE_ALIASES_TO_VALUES[value];
  }
  if (value in SCRIPT_VALUE_ALIASES_TO_VALUES) {
    return SCRIPT_VALUE_ALIASES_TO_VALUES[value];
  }
  if (value in BINARY_ALIASES_TO_PROP_NAMES) {
    return BINARY_ALIASES_TO_PROP_NAMES[value];
  }
  if (
    value in GENERAL_CATEGORY_VALUE_TO_ALIASES ||
    value in SCRIPT_VALUE_TO_ALIASES ||
    value in BINARY_PROP_NAMES_TO_ALIASES
  ) {
    return value;
  }
  throw new Error(`Unknown Unicode property value: ${value}`);
}

/** @internal */
export type ResolvedUnicodeProperty = {
  type: 'UnicodeProperty';
  name: string;
  value: string;
  negative: boolean;
  shorthand: boolean;
  binary: boolean;
  canonicalName: string;
  canonicalValue: string;
};

/**
 * Resolve a Unicode property escape specification into a structured token
 * that matches the regexp-tree AST format.
 *
 * @param propertySpec - The content between \p\{ and \}, e.g. "Letter", "Script=Latin", "Emoji"
 * @param negative - true for \P\{\}, false for \p\{\}
 * @internal
 */
export function resolveUnicodeProperty(propertySpec: string, negative: boolean): ResolvedUnicodeProperty {
  const equalIndex = propertySpec.indexOf('=');
  if (equalIndex !== -1) {
    // Explicit form: \p{Name=Value}
    const name = propertySpec.substring(0, equalIndex);
    const value = propertySpec.substring(equalIndex + 1);
    return {
      type: 'UnicodeProperty',
      name,
      value,
      negative,
      shorthand: false,
      binary: false,
      canonicalName: getCanonicalName(name),
      canonicalValue: getCanonicalValue(value),
    };
  }

  // Shorthand form: \p{Value}
  if (isGeneralCategoryValue(propertySpec)) {
    return {
      type: 'UnicodeProperty',
      name: 'General_Category',
      value: propertySpec,
      negative,
      shorthand: true,
      binary: false,
      canonicalName: 'General_Category',
      canonicalValue: getCanonicalValue(propertySpec),
    };
  }

  if (isBinaryPropertyName(propertySpec)) {
    const canonicalName = getCanonicalName(propertySpec);
    return {
      type: 'UnicodeProperty',
      name: propertySpec,
      value: propertySpec,
      negative,
      shorthand: false,
      binary: true,
      canonicalName,
      canonicalValue: canonicalName,
    };
  }

  throw new Error(`Invalid Unicode property: ${propertySpec}`);
}
