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

function inverseMap(data: Record<string, string | string[]>): Record<string, string> {
  const inverse: Record<string, string> = {};
  for (const name of Object.keys(data)) {
    const value = data[name];
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
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

/** @internal */
export type ResolvedUnicodeProperty = {
  type: 'UnicodeProperty';
  name: string;
  value: string;
  negative: boolean;
  shorthand: boolean;
  binary: boolean;
};

/**
 * Resolve a Unicode property escape specification into a structured token.
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
    };
  }

  if (isBinaryPropertyName(propertySpec)) {
    return {
      type: 'UnicodeProperty',
      name: propertySpec,
      value: propertySpec,
      negative,
      shorthand: false,
      binary: true,
    };
  }

  throw new Error(`Invalid Unicode property: ${propertySpec}`);
}
