---
slug: /core-blocks/arbitraries/primitives/string/
---

# String

Generate string values.

:::tip
If you want to join several strings together: refer to our [combiners section](/docs/core-blocks/arbitraries/combiners/). We have some [built-in combiners working exclusively on string values](/docs/core-blocks/arbitraries/combiners/string/).
:::

## string

String containing characters produced by the character generator defined for `unit`. By default, `unit` defaults to `fc.char()`.

**Signatures:**

- `fc.string()`
- `fc.string({minLength?, maxLength?, size?, unit?})`

**with:**

- `unit?` — default: `'grapheme-ascii'` — _how to generate the characters that will be joined together to create the resulting string_
- `minLength?` — default: `0` — _minimal number of units (included)_
- `maxLength?` — default: `0x7fffffff` [more](/docs/configuration/larger-entries-by-default/#size-explained) — _maximal number of units (included)_
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
// Examples of generated values: "Trxlyb", "&&@%4", "s@IO", "0\"zM", "}#\"$"…

fc.string({ unit: 'grapheme' });
// Note: Any string made only of printable graphemes possibly made of multiple code points.
// With 'grapheme', minLength (resp. maxLength) refers to length in terms of graphemes (visual entities).
// As an example, "\u{0061}\u{0300}" has a length of 1 in this context, as it corresponds to the visual entity: "à".
// Examples of generated values: "length", "🡓𑨭", "🚌ﾱॶ🥄ၜ㏹", "key", "callஈcall"…

fc.string({ unit: 'grapheme-composite' });
// Note: Any string made only of printable graphemes.
// With 'grapheme-composite', minLength (resp. maxLength) refers to length in terms of code points (equivalent to visual entities for this type).
// Examples of generated values: "🭃𖼰𱍊alleef", "#", "𝕃ᖺꏪ🪓ሪ㋯𑼓𘠴𑑖", "", "\"isP"…

fc.string({ unit: 'grapheme-ascii' });
// Note: Any string made only of printable ascii characters.
// With 'grapheme-composite', minLength (resp. maxLength) refers to length in terms of code units aka chars (equivalent to code points and visual entities for this type).
// Examples of generated values: "+", "y\\m4", ")H", "}q% b'", "ZvT`W"…

fc.string({ unit: 'binary' });
// Note: Results in strings made of any possible combinations of code points no matter how they join between each others (except half surrogate pairs).
// With 'binary', minLength (resp. maxLength) refers to length in terms of code points (not in terms of visual entities).
// As an example, "\u{0061}\u{0300}" has a length of 2 in this context, even if it corresponds to a single visual entity: "à".
// Examples of generated values: "length", "𒇖ᴣ󠓋򹕎󥰆󕃝󗅛񞙢򂓥񋂐", "", "󹶇񺓯𢊊񦺖", "key"…

fc.string({ unit: 'binary-ascii' });
// Note: Results in strings made of any possible combinations of ascii characters (in 0000-007F range).
// With 'binary-ascii', minLength (resp. maxLength) refers to length in terms of code units aka chars (equivalent to code points for this type).
// Examples of generated values: "c\\3\f\u0000\u001f\u00047", "M\u0006\fD!U\u000fXss", "", "s\u0000", "\n\u0006tkK"…

fc.string({ unit: fc.constantFrom('Hello', 'World') });
// Note: With a custom arbitrary passed as unit, minLength (resp. maxLength) refers to length in terms of unit values.
// As an example, "HelloWorldHello" has a length of 3 in this context.
// Examples of generated values: "", "Hello", "HelloWorld", "HelloWorldHello", "WorldWorldHelloWorldHelloWorld"…
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/string.html).  
Available since 0.0.1.

## unicodeString

Unicode string containing characters produced by `fc.unicode()`.

**Signatures:**

- `fc.unicodeString()` — _deprecated since v3.22.0, prefer [string](https://fast-check.dev/docs/core-blocks/arbitraries/primitives/string/#string-1) (more details at [#5233](https://github.com/dubzzz/fast-check/pull/5233))_
- `fc.unicodeString({minLength?, maxLength?, size?})` — _deprecated since v3.22.0, prefer [string](https://fast-check.dev/docs/core-blocks/arbitraries/primitives/string/#string-1) (more details at [#5233](https://github.com/dubzzz/fast-check/pull/5233))_

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

## fullUnicodeString

Unicode string containing characters produced by `fc.fullUnicode()`.

**Signatures:**

- `fc.fullUnicodeString()` — _deprecated since v3.22.0, prefer [string](https://fast-check.dev/docs/core-blocks/arbitraries/primitives/string/#string-1) (more details at [#5233](https://github.com/dubzzz/fast-check/pull/5233))_
- `fc.fullUnicodeString({minLength?, maxLength?, size?})` — _deprecated since v3.22.0, prefer [string](https://fast-check.dev/docs/core-blocks/arbitraries/primitives/string/#string-1) (more details at [#5233](https://github.com/dubzzz/fast-check/pull/5233))_

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
