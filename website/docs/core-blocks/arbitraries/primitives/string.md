---
slug: /core-blocks/arbitraries/primitives/string/
---

# String

Generate string values.

:::tip
If you want to join several strings together: refer to our [combiners section](/docs/core-blocks/arbitraries/combiners/). We have some [built-in combiners working exclusively on string values](/docs/core-blocks/arbitraries/combiners/string/).
:::

## hexaString

Hexadecimal string containing characters produced by `fc.hexa()`.

**Signatures:**

- `fc.hexaString()`
- `fc.hexaString({minLength?, maxLength?, size?})`

**with:**

- `minLength?` — default: `0` — _minimal number of characters (included)_
- `maxLength?` — default: `0x7fffffff` [more](/docs/configuration/larger-entries-by-default/#size-explained) — _maximal number of characters (included)_
- `size?` — default: `undefined` [more](/docs/configuration/larger-entries-by-default/#size-explained) — _how large should the generated values be?_

**Usages:**

```js
fc.hexaString();
// Examples of generated values: "251971", "", "a9", "742e6c86e", "39350b163"…

fc.hexaString({ maxLength: 3 });
// Note: Any hexadecimal string containing up to 3 (included) characters
// Examples of generated values: "1", "", "2ef", "2a", "6e3"…

fc.hexaString({ minLength: 3 });
// Note: Any hexadecimal string containing at least 3 (included) characters
// Examples of generated values: "1021a292c2d306", "e4660fd014ae290", "2ef914a5d7ffe9df", "2a212", "05dd1"…

fc.hexaString({ minLength: 4, maxLength: 6 });
// Note: Any hexadecimal string containing between 4 (included) and 6 (included) characters
// Examples of generated values: "b4ccb", "e51d", "b3e093", "383f", "27bd"…
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/hexaString.html).  
Available since 0.0.1.

## string

String containing characters produced by `fc.char()`.

**Signatures:**

- `fc.string()`
- `fc.string({minLength?, maxLength?, size?})`

**with:**

- `minLength?` — default: `0` — _minimal number of characters (included)_
- `maxLength?` — default: `0x7fffffff` [more](/docs/configuration/larger-entries-by-default/#size-explained) — _maximal number of characters (included)_
- `size?` — default: `undefined` [more](/docs/configuration/larger-entries-by-default/#size-explained) — _how large should the generated values be?_

**Usages:**

```js
fc.string();
// Examples of generated values: "JT>\"C9k", "h]iD\"27;", "S", "n\\Ye", ""…

fc.string({ maxLength: 3 });
// Note: Any string containing up to 3 (included) characters
// Examples of generated values: "", "ref", "?D", "key", "}"…

fc.string({ minLength: 3 });
// Note: Any string containing at least 3 (included) characters
// Examples of generated values: "Pv-^X_t", "bind", "?DM", "iEjK.b?^O", "}~}S"…

fc.string({ minLength: 4, maxLength: 6 });
// Note: Any string containing between 4 (included) and 6 (included) characters
// Examples of generated values: "Trxall", "&&@%4", "s@IO", "0\"zM", "}#\"$"…
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/string.html).  
Available since 0.0.1.

## asciiString

ASCII string containing characters produced by `fc.ascii()`.

**Signatures:**

- `fc.asciiString()`
- `fc.asciiString({minLength?, maxLength?, size?})`

**with:**

- `minLength?` — default: `0` — _minimal number of characters (included)_
- `maxLength?` — default: `0x7fffffff` [more](/docs/configuration/larger-entries-by-default/#size-explained) — _maximal number of characters (included)_
- `size?` — default: `undefined` [more](/docs/configuration/larger-entries-by-default/#size-explained) — _how large should the generated values be?_

**Usages:**

```js
fc.asciiString();
// Examples of generated values: "\f@D", "hp", "q#dO~?@", "Qad", "5eHqc"…

fc.asciiString({ maxLength: 3 });
// Note: Any ascii string containing up to 3 (included) characters
// Examples of generated values: "6", "", "ty", ",", "k"…

fc.asciiString({ minLength: 3 });
// Note: Any ascii string containing at least 3 (included) characters
// Examples of generated values: "603e", "6W\u001b^tR-\n\n|", "efproto_\u001abhasOw", "$\u001c&\u0000R", "apply"…

fc.asciiString({ minLength: 4, maxLength: 6 });
// Note: Any ascii string containing between 4 (included) and 6 (included) characters
// Examples of generated values: "<&\u001e\u001b ", "bind", "dnGn\\2", "& % !", "__defi"…
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/asciiString.html).  
Available since 0.0.1.

## unicodeString

Unicode string containing characters produced by `fc.unicode()`.

**Signatures:**

- `fc.unicodeString()`
- `fc.unicodeString({minLength?, maxLength?, size?})`

**with:**

- `minLength?` — default: `0` — _minimal number of characters (included)_
- `maxLength?` — default: `0x7fffffff` [more](/docs/configuration/larger-entries-by-default/#size-explained) — _maximal number of characters (included)_
- `size?` — default: `undefined` [more](/docs/configuration/larger-entries-by-default/#size-explained) — _how large should the generated values be?_

**Usages:**

```js
fc.unicodeString();
// Examples of generated values: ",", "뇇ⷍ돠", "", "穿ﺥ羊汉ힸ౨", "穙셣킲햗䊢鏶눏"…

fc.unicodeString({ maxLength: 3 });
// Note: Any unicode (from BMP-plan) string containing up to 3 (included) characters
// Examples of generated values: "", "꙰", "툌", "㮟୆", "a"…

fc.unicodeString({ minLength: 3 });
// Note: Any unicode (from BMP-plan) string containing at least 3 (included) characters
// Examples of generated values: "떚碱縢鰷釬ڤ撙", "竑૱toS", "꙰ꁺ蜱⫄ั", "__d", "툌뀪凛瞸㾡끴"…

fc.unicodeString({ minLength: 4, maxLength: 6 });
// Note: Any unicode (from BMP-plan) string containing between 4 (included) and 6 (included) characters
// Examples of generated values: "뿐噻⪃嫿垈", "ڣۡ觌뱇", "apply", "￹톥薦￾", "namea"…
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/unicodeString.html).  
Available since 0.0.11.

## string16bits

String containing characters produced by `fc.char16bits()`.

Be aware that the generated string might appear invalid regarding the unicode standard as it might contain incomplete pairs of surrogate.

**Signatures:**

- `fc.string16bits()`
- `fc.string16bits({minLength?, maxLength?, size?})`

**with:**

- `minLength?` — default: `0` — _minimal number of characters (included)_
- `maxLength?` — default: `0x7fffffff` [more](/docs/configuration/larger-entries-by-default/#size-explained) — _maximal number of characters (included)_
- `size?` — default: `undefined` [more](/docs/configuration/larger-entries-by-default/#size-explained) — _how large should the generated values be?_

**Usages:**

```js
fc.string16bits();
// Examples of generated values: "", "沉蹻!쯼&)￹噕￶￻", "獏", "嚷爇꡽邏䨫Ꝺ䟌", "ۆ딛楯씺"…

fc.string16bits({ maxLength: 3 });
// Note: Any string (not really legal ones sometimes) containing up to 3 (included) characters
// Examples of generated values: "", "ꃷ", "톽va", "뿤䵎悧", ""…

fc.string16bits({ minLength: 3 });
// Note: Any string (not really legal ones sometimes) containing at least 3 (included) characters
// Examples of generated values: "㝟佷㟧࿝譽먔", "ꃷ￱￷￻ꢒ￺￸", "톽valueOf", "key", "app"…

fc.string16bits({ minLength: 4, maxLength: 6 });
// Note: Any string (not really legal ones sometimes) containing between 4 (included) and 6 (included) characters
// Examples of generated values: "apply", "鹽\udc68鯻שּׂ", "땺\uda2f熑鉈뗻", "__def", "㓐줫曧ᒢ"…
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/string16bits.html).  
Available since 0.0.11.

## fullUnicodeString

Unicode string containing characters produced by `fc.fullUnicode()`.

**Signatures:**

- `fc.fullUnicodeString()`
- `fc.fullUnicodeString({minLength?, maxLength?, size?})`

**with:**

- `minLength?` — default: `0` — _minimal number of characters (included)_
- `maxLength?` — default: `0x7fffffff` [more](/docs/configuration/larger-entries-by-default/#size-explained) — _maximal number of characters (included)_
- `size?` — default: `undefined` [more](/docs/configuration/larger-entries-by-default/#size-explained) — _how large should the generated values be?_

_Be aware that the length is considered in terms of the number of glyphs in the string and not the number of UTF-16 characters. As a consequence `generatedString.length` might be greater than the asked maximal length but `[...generatedString].length` will not and always be in the required range_

**Usages:**

```js
fc.fullUnicodeString();
// Examples of generated values: "򎅯񳓃󲢱򟭂", "󁵺涫򣤲󋣈󪷆", "󋅶񏵞󒽡󫺊񏽵", "􍄵򒂾󃉓", "񡚈"…

fc.fullUnicodeString({ maxLength: 3 });
// Note: Any unicode string containing up to 3 (included) code-points
// Examples of generated values: "򅉞񸟤󐋚", "􏿴", "􇢺", "", "󏫭"…

fc.fullUnicodeString({ minLength: 3 });
// Note: Any unicode string containing at least 3 (included) code-points
// Examples of generated values: "򅉞񸟤󐋚򲮃󺮞􍶈󂾓񅙎򼝄󒂁񌸩򌻜󎼿񺡓", "bind", "􇢺󣓺in", "%4􏿻propertyIs", "𒝰􇋧􏿫􏿱񧌫"…

fc.fullUnicodeString({ minLength: 4, maxLength: 6 });
// Note: Any unicode string containing between 4 (included) and 6 (included) code-points
// Examples of generated values: "call", "񛰖񞑑󱈋𨤎", "񉓁򔶍򣵵乀򠍾󢏘", ",valu", "󐣙󼃞񫎢󖫩𫅰𪂀"…
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/fullUnicodeString.html).  
Available since 0.0.11.
