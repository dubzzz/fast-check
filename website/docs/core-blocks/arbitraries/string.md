---
sidebar_position: 3
slug: /core-blocks/arbitraries/string
---

# String

## Single character

### hexa

One lowercase hexadecimal character — ie.: _one character in `0123456789abcdef`_.

**Signatures:**

- `fc.hexa()`

**Usages:**

```js
fc.hexa();
// Examples of generated values: "3", "e", "2", "d", "1"…
```

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/hexa.html).  
Available since 0.0.1.

### base64

One base64 character — _ie.: one character in `A-Z`, `a-z`, `0-9`, `+` or `/`_.

**Signatures:**

- `fc.base64()`

**Usages:**

```js
fc.base64();
// Examples of generated values: "U", "M", "z", "b", "4"…
```

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/base64.html).  
Available since 0.0.1.

### char

One printable character — _ie.: one character between `0x20` (included) and `0x7e` (included), corresponding to printable characters (see https://www.ascii-code.com/)_.

**Signatures:**

- `fc.char()`

**Usages:**

```js
fc.char();
// Examples of generated values: "#", "&", "}", "A", "J"…
```

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/char.html).  
Available since 0.0.1.

### ascii

One ascii character — _ie.: one character between `0x00` (included) and `0x7f` (included)_.

**Signatures:**

- `fc.ascii()`

**Usages:**

```js
fc.ascii();
// Examples of generated values: "5", "\u001a", "7", "}", "A"…
```

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/ascii.html).  
Available since 0.0.1.

### unicode

One unicode character from BMP-plan — _ie.: one character between `0x0000` (included) and `0xffff` (included) but excluding surrogate pairs (between `0xd800` and `0xdfff`)_.

Generate any character of UCS-2 which is a subset of UTF-16 (restricted to BMP plan).

**Signatures:**

- `fc.unicode()`

**Usages:**

```js
fc.unicode();
// Examples of generated values: "", "熇", "ዢ", "⢥", "\""…
```

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/unicode.html).  
Available since 0.0.11.

### char16bits

One unicode character from BMP-plan (including part of surrogate pair) — _ie.: one character between `0x0000` (included) and `0xffff` (included)_.

Generate any 16 bits character. Be aware the values within `0xd800` and `0xdfff` which constitutes the surrogate pair characters are also generated meaning that some generated characters might appear invalid regarding UCS-2 and UTF-16 encoding.

**Signatures:**

- `fc.char16bits()`
  **Usages:**

```js
fc.char16bits();
// Examples of generated values: "￻", "훺", ")", "", "￰"…
```

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/char16bits.html).  
Available since 0.0.11.

### fullUnicode

One unicode character — _ie.: one character between `0x0000` (included) and `0x10ffff` (included) but excluding surrogate pairs (between `0xd800` and `0xdfff`)_.

Its length can be greater than one as it potentially contains multiple UTF-16 characters for a single glyph (eg.: `"\u{1f434}".length === 2`).

**Signatures:**

- `fc.fullUnicode()`

**Usages:**

```js
fc.fullUnicode();
// Examples of generated values: "񗣺", "󡏒", "񖘬", "󁸻", "񄴑"…
```

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/fullUnicode.html).  
Available since 0.0.11.

## Multiple characters

### hexaString

Hexadecimal string containing characters produced by `fc.hexa()`.

**Signatures:**

- `fc.hexaString()`
- `fc.hexaString({minLength?, maxLength?, size?})`
- _`fc.hexaString(maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_
- _`fc.hexaString(minLength, maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_

**with:**

- `minLength?` — default: `0` — _minimal number of characters (included)_
- `maxLength?` — default: `0x7fffffff` [more](#size-explained) — _maximal number of characters (included)_
- `size?` — default: `undefined` [more](#size-explained) — _how large should the generated values be?_

**Usages:**

```js
fc.hexaString();
// Examples of generated values: "3c4", "bf2", "f", "a9cb", "02e25e"…

fc.hexaString({ maxLength: 3 });
// Note: Any hexadecimal string containing up to 3 (included) characters
// Examples of generated values: "", "c", "0", "1", "c0"…

fc.hexaString({ minLength: 3 });
// Note: Any hexadecimal string containing at least 3 (included) characters
// Examples of generated values: "132", "c63baf", "064133", "1e412e", "0e479d13"…

fc.hexaString({ minLength: 4, maxLength: 6 });
// Note: Any hexadecimal string containing between 4 (included) and 6 (included) characters
// Examples of generated values: "c3108", "f911e", "db35", "00fa", "09a7ba"…
```

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/hexaString.html).  
Available since 0.0.1.

### base64String

Base64 string containing characters produced by `fc.base64()`.

Provide valid base64 strings: length always multiple of 4 padded with '=' characters.

**Signatures:**

- `fc.base64String()`
- `fc.base64String({minLength?, maxLength?, size?})`
- _`fc.base64String(maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_
- _`fc.base64String(minLength, maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_

**with:**

- `minLength?` — default: `0` — _minimal number of characters (included)_
- `maxLength?` — default: `0x7fffffff` [more](#size-explained) — _maximal number of characters (included if multiple of 4)_
- `size?` — default: `undefined` [more](#size-explained) — _how large should the generated values be?_

_When using `minLength` and `maxLength` make sure that they are compatible together. For instance: asking for `minLength=2` and `maxLength=3` is impossible for base64 strings as produced by the framework_

**Usages:**

```js
fc.base64String();
// Examples of generated values: "rgk=", "It==", "RD/Evefg", "xBE=", "FoRD"…

fc.base64String({ maxLength: 8 });
// Note: Any base64 string containing up to 8 (included) characters
// Examples of generated values: "", "AcWxDA==", "y/==", "DGFHcB==", "xBk="…

fc.base64String({ minLength: 8 });
// Note: Any base64 string containing at least 8 (included) characters
// Examples of generated values: "F8ACBC9B", "Bxp+l5valueO", "7WXEBForaLaj2H8mGc==", "AcWxDA+KMsIEQg0B6MC=", "constructor="…

fc.base64String({ minLength: 4, maxLength: 12 });
// Note: Any base64 string containing between 4 (included) and 12 (included) characters
// Examples of generated values: "rUs8bJfAngr=", "9DtEEy==", "Yv+EZD==", "call", "C379"…
```

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/base64String.html).  
Available since 0.0.1.

### string

String containing characters produced by `fc.char()`.

**Signatures:**

- `fc.string()`
- `fc.string({minLength?, maxLength?, size?})`
- _`fc.string(maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_
- _`fc.string(minLength, maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_

**with:**

- `minLength?` — default: `0` — _minimal number of characters (included)_
- `maxLength?` — default: `0x7fffffff` [more](#size-explained) — _maximal number of characters (included)_
- `size?` — default: `undefined` [more](#size-explained) — _how large should the generated values be?_

**Usages:**

```js
fc.string();
// Examples of generated values: ".A%", "aM{]xTH&)", "^NLpz5/y", "", "eqr"…

fc.string({ maxLength: 3 });
// Note: Any string containing up to 3 (included) characters
// Examples of generated values: "", "~*2", "{Z", "CD", "jlZ"…

fc.string({ minLength: 3 });
// Note: Any string containing at least 3 (included) characters
// Examples of generated values: "W=*$Fm V4Yf4<qC", "%T[$2", "~*2[s\\,qgwio", "nDL?K[,", "{Z:gG\")"…

fc.string({ minLength: 4, maxLength: 6 });
// Note: Any string containing between 4 (included) and 6 (included) characters
// Examples of generated values: "x<H+`", "bind", "0xine", "%&zpr", "hIx~"…
```

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/string.html).  
Available since 0.0.1.

### asciiString

ASCII string containing characters produced by `fc.ascii()`.

**Signatures:**

- `fc.asciiString()`
- `fc.asciiString({minLength?, maxLength?, size?})`
- _`fc.asciiString(maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_
- _`fc.asciiString(minLength, maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_

**with:**

- `minLength?` — default: `0` — _minimal number of characters (included)_
- `maxLength?` — default: `0x7fffffff` [more](#size-explained) — _maximal number of characters (included)_
- `size?` — default: `undefined` [more](#size-explained) — _how large should the generated values be?_

**Usages:**

```js
fc.asciiString();
// Examples of generated values: "2u1\u001aWQ", "", "*y", "\bT\u0013.\u0017|h&>", "si3\u0016`kA\u0017\u0004"…

fc.asciiString({ maxLength: 3 });
// Note: Any ascii string containing up to 3 (included) characters
// Examples of generated values: " ", "vC", "", "'\u0010*", "l"…

fc.asciiString({ minLength: 3 });
// Note: Any ascii string containing at least 3 (included) characters
// Examples of generated values: " prototype#p", "vCkn&}{", "\u0006& ", "'\u0010*6ua\u0017JEpG\u000bg<#\u0007", "caller"…

fc.asciiString({ minLength: 4, maxLength: 6 });
// Note: Any ascii string containing between 4 (included) and 6 (included) characters
// Examples of generated values: "\u001b0E\"!", "!.Qj?-", "V\u0002\u0014z\fT", "name", "\u0007U\u0006t#"…
```

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/asciiString.html).  
Available since 0.0.1.

### unicodeString

Unicode string containing characters produced by `fc.unicode()`.

**Signatures:**

- `fc.unicodeString()`
- `fc.unicodeString({minLength?, maxLength?, size?})`
- _`fc.unicodeString(maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_
- _`fc.unicodeString(minLength, maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_

**with:**

- `minLength?` — default: `0` — _minimal number of characters (included)_
- `maxLength?` — default: `0x7fffffff` [more](#size-explained) — _maximal number of characters (included)_
- `size?` — default: `undefined` [more](#size-explained) — _how large should the generated values be?_

**Usages:**

```js
fc.unicodeString();
// Examples of generated values: "", "咉ٻ!&)￹￶￻", "᭏", "娇\u001eᨫ㽹矌", "┛䅯퉳"…

fc.unicodeString({ maxLength: 3 });
// Note: Any unicode (from BMP-plan) string containing up to 3 (included) characters
// Examples of generated values: "(", "", "⇾燏", "on", "ሖꧾㆳ"…

fc.unicodeString({ minLength: 3 });
// Note: Any unicode (from BMP-plan) string containing at least 3 (included) characters
// Examples of generated values: "toLocaleString", "杮಴⿆뎶蝐母쪀㩑ᶔ䰚搞慢䲉欐", "⇾燏ᅙ秱뵴ꇺ꿵玽鄧돟鐎䕝ᑿ", "apply", "call䪎"…

fc.unicodeString({ minLength: 4, maxLength: 6 });
// Note: Any unicode (from BMP-plan) string containing between 4 (included) and 6 (included) characters
// Examples of generated values: "紫ᡔ楬莼媛", "￵!릭(", "ꤘ廯￶$ﭙ+", "call", "랂巻ᗽ"…
```

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/unicodeString.html).  
Available since 0.0.11.

### string16bits

String containing characters produced by `fc.char16bits()`.

Be aware that the generated string might appear invalid regarding the unicode standard as it might contain incomplete pairs of surrogate.

**Signatures:**

- `fc.string16bits()`
- `fc.string16bits({minLength?, maxLength?, size?})`
- _`fc.string16bits(maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_
- _`fc.string16bits(minLength, maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_

**with:**

- `minLength?` — default: `0` — _minimal number of characters (included)_
- `maxLength?` — default: `0x7fffffff` [more](#size-explained) — _maximal number of characters (included)_
- `size?` — default: `undefined` [more](#size-explained) — _how large should the generated values be?_

**Usages:**

```js
fc.string16bits();
// Examples of generated values: "埫쒠爤", "\udb48p", "૑ᚃ⵿⫄㖯孞℠", "⤱黁醙", "⦕끅Ȩ鋑\uda43"…

fc.string16bits({ maxLength: 3 });
// Note: Any string (not really legal ones sometimes) containing up to 3 (included) characters
// Examples of generated values: "", "!", "ऻ㨖ẗ", "-꜆+", "㓱"…

fc.string16bits({ minLength: 3 });
// Note: Any string (not really legal ones sometimes) containing at least 3 (included) characters
// Examples of generated values: "‶!￺", "!ᩱ￾", "ऻ㨖ẗ倄쾁伅周쀫", "\"䴜੖", "apply"…

fc.string16bits({ minLength: 4, maxLength: 6 });
// Note: Any string (not really legal ones sometimes) containing between 4 (included) and 6 (included) characters
// Examples of generated values: "孢\udbcd퉭⻵", "↩㄁\ude77䟾鏹撜", "ṇ貄/&䵃", "\"廤⾛￲\ud870", "䵬ଛ쩀蛩‮৶"…
```

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/string16bits.html).  
Available since 0.0.11.

### fullUnicodeString

Unicode string containing characters produced by `fc.fullUnicode()`.

**Signatures:**

- `fc.fullUnicodeString()`
- `fc.fullUnicodeString({minLength?, maxLength?, size?})`
- _`fc.fullUnicodeString(maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_
- _`fc.fullUnicodeString(minLength, maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_

**with:**

- `minLength?` — default: `0` — _minimal number of characters (included)_
- `maxLength?` — default: `0x7fffffff` [more](#size-explained) — _maximal number of characters (included)_
- `size?` — default: `undefined` [more](#size-explained) — _how large should the generated values be?_

_Be aware that the length is considered in terms of the number of glyphs in the string and not the number of UTF-16 characters. As a consequence `generatedString.length` might be greater than the asked maximal length but `[...generatedString].length` will not and always be in the required range_

**Usages:**

```js
fc.fullUnicodeString();
// Examples of generated values: "𾪖򘔼򭐂񿈋𰥞", "񦆏(􏿮񪞆", "󘅽󘺂򦀵򈄓񧟵", "󥐫򱡭􌺛愋Ꚁ𻧗ᨘ񀄮􍹣", "$$􏿻'()􋇶/\"󥟐"…

fc.fullUnicodeString({ maxLength: 3 });
// Note: Any unicode string containing up to 3 (included) code-points
// Examples of generated values: "🷣", "𪇍򱲆", "", "\"", "𫕈"…

fc.fullUnicodeString({ minLength: 3 });
// Note: Any unicode string containing at least 3 (included) code-points
// Examples of generated values: "🷣󸯜򎪳񖶌󪊀򳘟𙂄󟠷󄏧𰷡", "𪇍򱲆𖰌󣉄𵨡𻥕𰆏򦇘󜁳򁿳򎗯􈤘񖇅󑃙񡳏", "缭򁤇𫍯", "􂋳.􏿬􂣐𐼾", "𞄊􊪆󧁴𦳫󇗋𨖸񉵊򫧏𞩻󓖞򼦃𘅏񀔾"…

fc.fullUnicodeString({ minLength: 4, maxLength: 6 });
// Note: Any unicode string containing between 4 (included) and 6 (included) code-points
// Examples of generated values: "񅈡򅰻񱅜򾐬񲆗񃯹", "+񙷦-򽺺􏿮", "􏿶r𼻃!in", "call", "name"…
```

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/fullUnicodeString.html).  
Available since 0.0.11.

### stringOf

String containing characters produced by the passed character generator.

**Signatures:**

- `fc.stringOf(charArb)`
- `fc.stringOf(charArb, {minLength?, maxLength?, size?})`
- _`fc.stringOf(charArb, maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_
- _`fc.stringOf(charArb, minLength, maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_

**with:**

- `charArb` — _arbitrary able to generate random strings (possibly multiple characters)_
- `minLength?` — default: `0` — _minimal number of characters (included)_
- `maxLength?` — default: `0x7fffffff` [more](#size-explained) — _maximal number of characters (included)_
- `size?` — default: `undefined` [more](#size-explained) — _how large should the generated values be?_

**Usages:**

```js
fc.stringOf(fc.hexa());
// Examples of generated values: "6c2be", "5acc", "d2535", "bdbb078e3", "407d300602"…

fc.stringOf(fc.char(), { maxLength: 3 });
// Note: Any string containing up to 3 (included) characters extracted from `fc.char()`
// Examples of generated values: "+", "y\\", ")H", "", "Z"…

fc.stringOf(fc.char(), { minLength: 4, maxLength: 6 });
// Note: Any string containing between 4 (included) and 6 (included) characters extracted from `fc.char()`
// Examples of generated values: "*jlRI", "}<6Fm", "Q #(Q", "Qz&:", "ZgIk"…

fc.stringOf(fc.constantFrom('a', 'b'), { maxLength: 5 });
// Note: Any string containing between 0 (included) and 5 (included) characters extracted from `fc.constantFrom('a', 'b')`
// Examples of generated values: "bbb", "b", "", "ab", "baa"…

fc.stringOf(fc.constantFrom('Hello', 'World'), { minLength: 1, maxLength: 3 });
// Note: It might produce strings like "WorldWorldWorld" or "WorldHelloWorld"…
// Examples of generated values: "WorldWorldHello", "World", "HelloHello", "Hello", "WorldHello"…
```

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/stringOf.html).  
Available since 1.1.3.

## More specific strings

### json

JSON compatible string representations of instances. Can produce string representations of basic primitives but also of deep objects.

The generated values can be parsed by `JSON.parse`.
All the string values (from keys to values) are generated using `fc.string()`.

**Signatures:**

- `fc.json()`
- `fc.json({depthSize?, maxDepth?})`

**with:**

- `depthSize?` — default: `undefined` [more](#depth-size-explained) — _how much we allow our recursive structures to be deep?_
- `maxDepth?` — default: `Number.POSITIVE_INFINITY` — _maximal depth of generated objects_

**Usages:**

```js
fc.json();
// Examples of generated values:
// • "{\"\":{\"\":null,\"xj)R+qu\\\"2\":[null,\"U.\",null,null,\"Dk$XNl\",\">]\"],\"<m$%t\":null,\"Cy;Dce\":true},\"^QkBb\":{},\"3[SVCv\":2.0364684381114386e-246}"
// • "null"
// • "{\"4\":null,\"im$\":\"Jb_Cv\",\"nY\":[-46689949447452340,-1.6163619845542715e+137,null],\"'@]D';_'3\":true,\"r};H WuVH\":null,\"AN!_@{\":false,\"\":\"3h+t*n4j\",\"5ipv5Qi\":2.746262896796308e-272}"
// • "[]"
// • "{\"1Cu*#{v\":null,\"xgd*\":null,\"B]\":{\"X1=H\":\"H\\\" ^\",\"Kk'v\\\"\":1.2869227629115377e-192,\"Rq\\\"J5\":\"TG\",\"1\\\"N\":-1.2231328876345182e+204,\"Jy'S>'\":-1.4262405083011623e-24,\"H+-e\":null,\"2o0e\":6.012904381937362e+299},\"M~\\\\\":\"\",\"zW\":null,\"F|m:\":1.1837792418144415e+223}"
// • …

fc.json({ maxDepth: 0 });
// Examples of generated values: "null", "2.393389240281231e+175", "false", "true", "\"E\""…

fc.json({ maxDepth: 1 });
// Examples of generated values:
// • "{\"mTZw9f!~2\":\"N'!U6\",\"9=\":-3.6221384866363086e-275,\"\":\"cq\",\"re\":null,\"~all\\\"calle\":false,\"HoB)<PLf S\":null,\"!9$\":null}"
// • "{\"UzMWL`G@{_\":null,\"znC\":\"nY\",\"J\":3.849085080516248e-191,\"r3$\\\\\":\"`vl9%HJT)\",\"jHSz2\":3413124726.2879148,\"\":\"`L\"}"
// • "{}"
// • "{\"Q|t9};*Iow\":true,\"r(>uO\":false,\"I$2`I_6@\":false,\"qO[OhM7\":9.314698990394179e+30,\"&!j*hIk\":\"H\\\"\\\"~\",\"`bcc\":2.5169346616860097e+70,\"!2 +k;_\":-4.469218455495708e+292,\"#AhOnL@1\":\")A)gi\"}"
// • "[1.73e-322,-2.043903585838636e-34,null,true,null,null,\"8+~U`\"]"
// • …

fc.json({ depthSize: 'medium' });
// Examples of generated values:
// • "1.1084525170506737e-156"
// • "[\"co\",{\"r*,M9|W?c\":[false,null,\"bxV\",null,false,7.171087774329574e+120,true,2.122763095763206e-112,5.371783952168317e-166,false]},{\"XLL8w\":null}]"
// • "[{\"4\":null,\"Dn\":2.4426060849173823e-107,\"1pISp\":false,\"*_BU-!U\":1.300167092106387e+131,\":\":-5.1320442429180716e-297,\"y\":\"\",\"lY\":2.196066668993201e-230,\"[|Q\\\\G-=K?Y\":\"HZ\",\"ikX?aw\":null,\"-y@`)3mh\":\"f|M\"},[]]"
// • "[\"_\",\" {_xR<tiQ\",null,{\"uc2~2XP0\":null,\"6Y\\\\j|g/DhM\":\")1yN\",\"%\\\\!K4qL!}\":false,\"^%79'x3\":null,\"x3(>2 \":null,\"+\":-1.345402215261541e-31,\"\\\"{Xb.&4d_u\":{\"$ D^DE2V33\":false,\"P\":true},\"s\":\"(!>\"},false,\"B\"]"
// • "true"
// • …
```

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/json.html).  
Available since 0.0.7.

### unicodeJson

JSON compatible string representations of instances. Can produce string representations of basic primitives but also of deep objects.

The generated values can be parsed by `JSON.parse`.
All the string values (from keys to values) are generated using `fc.unicodeString()`.

**Signatures:**

- `fc.unicodeJson()`
- `fc.unicodeJson({depthSize?, maxDepth?})`

**with:**

- `depthSize?` — default: `undefined` [more](#depth-size-explained) — _how much we allow our recursive structures to be deep?_
- `maxDepth?` — default: `Number.POSITIVE_INFINITY` — _maximal depth of generated objects_

**Usages:**

```js
fc.unicodeJson();
// Examples of generated values:
// • "[[]]"
// • "{\"r\":\"\",\"螘餪╁鏽螽\":\"\",\"￶i\":\"bind\",\"/￲\":\"￱\",\"瓬쟡뵺ꙏԏầ\":true,\"caller\":1.797693134862314e+308}"
// • "{\"\":null}"
// • "{}"
// • "{\"迵끀꧋좡ꏶ塣\":[],\"뒓䬹Ⱝ䧎﹥ï飸\":-8.224504184276682e+98,\"旞荫㹢ފ\":{\"畵콆쳑Ｈ᜞\":22332369363.887035,\"㍮ㅜޞ\":null,\"ꉶ瀞뿱끮筡팹᧊\":\"곺缇㱐\",\"⮦ﺕ끨꿸\":\"薀ɿ⫝̸挖\",\"緢픳䪔쬤顅蓦\":null,\"뀙䙔炽ঞ弩\":\"ჷ\"},\"\":true,\"∗㋈쪺驎쓭籺뗪\":null}"
// • …

fc.unicodeJson({ maxDepth: 0 });
// Examples of generated values: "false", "\"&ޔ넡+/,\"", "null", "\"倣\"", "4.1604273853370814e+265"…

fc.unicodeJson({ maxDepth: 1 });
// Examples of generated values:
// • "false"
// • "true"
// • "\"㬻켔㣃Ꚗ⧅ޔ\""
// • "[\"⩡傒胀녠鯑\",null,null,\"犨녎짨\",null,false,true,false,2.2882899833357617e-235,\"㋈塓씃鞥ֶ\"]"
// • "-2.787348602876926e-78"
// • …

fc.unicodeJson({ depthSize: 'medium' });
// Examples of generated values:
// • "{\"讆層ꦍ쩖䊼\":6.422585986069521e+229,\"\":[null,true,true,false,null,null,false],\"톙띨ᓘ箜\":\"景\",\"犟ﯼ⛺㴞撟㨕\":[1.502368761936634e+269,true,false],\"脓境鲖㽾抳뫞ຳ\":false,\"阠\":-3.440279645467618e+252,\"髇૱ꩀ杨垹佡⍳\":false,\"꦳\":null,\"悪뤶⛬厕놳鑤䴆뛰稾\":\"刕䥮鋅舻쓋\"}"
// • "1.7398076905782003e-265"
// • "\"㩵詫,\""
// • "[]"
// • "{\"햧ཧ觌♘䣯Ⓖ崊䏓䵊\":{},\"㋄ǋ膮朲㌦냔ℋፋ\":{\"㋂\":{\"戹⾤礓\":2.1056912914512038e+48},\"\":false,\"絉泤璱鱾ق媀\":-4.1425806591889986e+212,\"샭 隆ἑ킷받붇ᡡ\":-3.3861837092165883e-127,\"ꪞ쳍爽\":true,\"⍚뮚䑥ᝳ륿ಒ菑\":\"挩聆ᝮ櫸树ޞ\"}}"
// • …
```

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/unicodeJson.html).  
Available since 0.07.

### lorem

Lorem ipsum values.

**Signatures:**

- `fc.lorem()`
- `fc.lorem({maxCount?, mode?, size?})`

**with:**

- `maxCount?` — default: `0x7fffffff` [more](#size-explained) — if `mode` is `"words"`: lorem ipsum sentence containing at most `maxCount` sentences, otherwise: containing at most `maxCount` words\_
- `mode?` — default: `"words"` — _enable sentence mode by setting its value to `"sentences"`_
- `size?` — default: `undefined` [more](#size-explained) — _how large should the generated values be?_

**Usages:**

```js
fc.lorem();
// Examples of generated values:
// • "arcu fusce lorem fermentum in consectetur enim praesent convallis pede"
// • "dolor mi dignissim cubilia"
// • "felis lacus suscipit ipsum"
// • "ligula nec curae sed enim est"
// • "tincidunt vivamus massa tempus in et iaculis amet placerat at"
// • …

fc.lorem({ maxCount: 3 });
// Examples of generated values: "praesent libero sodales", "mi adipiscing", "ut duis vitae", "mi elementum gravida", "non"…

fc.lorem({ maxCount: 3, mode: 'sentences' });
// Examples of generated values:
// • "Sed faucibus, sit praesent. Justo id, nisl fusce tempor sit convallis. Non consectetur in scelerisque mauris morbi sollicitudin augue, nulla mauris leo."
// • "Tempus. Tristique."
// • "Diam faucibus lorem fermentum mauris lorem dignissim consequat semper nunc."
// • "Id, cubilia in mi enim in proin adipiscing ut, risus."
// • "Rhoncus in hendrerit faucibus sed sapien et."
// • …
```

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/lorem.html).  
Available since 0.0.1.

### ipV4

IP v4 addresses.

**Signatures:**

- `fc.ipV4()`

**Usages:**

```js
fc.ipV4();
// Examples of generated values: "7.149.25.7", "7.7.6.6", "254.21.210.1", "98.5.251.31", "221.2.9.255"…
```

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/ipV4.html).  
Available since 1.14.0.

### ipV4Extended

IP v4 addresses including all the formats supported by WhatWG standard (for instance: 0x6f.9).

**Signatures:**

- `fc.ipV4Extended()`

**Usages:**

```js
fc.ipV4Extended();
// Examples of generated values: "160.0372.0x3", "5.031355510", "0x92df1683", "0x85b09ec1", "0x45.0103.03236"…
```

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/ipV4Extended.html).  
Available since 1.17.0.

### ipV6

IP v6 addresses.

**Signatures:**

- `fc.ipV6()`

**Usages:**

```js
fc.ipV6();
// Examples of generated values: "5998:7144:3dc:ff:b:5ae5:3::", "::c1e0:b3a:3:5.249.0.0", "59::9:150.144.165.251", "d::fa8f", "::f3:be0:0c2a:e:252.1.4.153"…
```

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/ipV6.html).  
Available since 1.14.0.

### uuid

UUID values including versions 1 to 5.

**Signatures:**

- `fc.uuid()`

**Usages:**

```js
fc.uuid();
// Examples of generated values:
// • "0000000f-ca95-1bc1-9399-f11900000017"
// • "00000017-0016-1000-8000-001c00000016"
// • "fffffffe-7e15-511f-800b-6ed200000009"
// • "8d6aee62-0002-1000-bfff-ffffbdd4f31f"
// • "c2156fdd-0018-1000-bd96-0109ffffffef"
// • …
```

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/uuid.html).  
Available since 1.17.0.

### uuidV

UUID values for a specific UUID version (only 1 to 5) only digits in 0-9a-f.

**Signatures:**

- `fc.uuidV(version)`

**with:**

- `version` — _version of the uuid to produce: 1, 2, 3, 4 or 5_

**Usages:**

```js
fc.uuidV(3);
// Examples of generated values:
// • "05cfea14-bcac-3b1b-8d87-f0d2ffffffe8"
// • "7f4a63cc-0010-3000-bfff-ffeeffffffeb"
// • "b18820b3-04b5-347a-a800-88270000000c"
// • "e6dfee9b-0003-3000-8000-0018d16c26be"
// • "4339edf8-0000-3000-92e8-dd5800000000"
// • …

fc.uuidV(5);
// Examples of generated values:
// • "d9951cc0-000f-5000-886d-743b90c0903c"
// • "b4f42187-7bd2-5385-8000-000794a930da"
// • "c2faeae2-2bd2-51a4-81e8-3f5800000007"
// • "65c2d0a5-0004-5000-8000-000e579a5fa4"
// • "00000002-0008-5000-8000-000b1bc90950"
// • …
```

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/uuidV.html).  
Available since 1.17.0.

### domain

Domain name values with extension.

Following RFC 1034, RFC 1123 and WHATWG URL Standard.

**Signatures:**

- `fc.domain()`
- `fc.domain({size?})`

**with:**

- `size?` — default: `undefined` [more](#size-explained) — _how large should the generated values be?_

**Usages:**

```js
fc.domain();
// Examples of generated values: "j6ib52zarmf.bit", "00.kc", "35b10n-w.7xe2.xai", "0.h6a4sfyde.nz", "c.na"…

fc.domain({ size: '-1' });
// Note: Generate smaller domain name compared to default. As default size is 'small' (if unchanged), it is equivalent to 'xsmall'
// Examples of generated values: "ec.ob", "1nl.0it.oxt", "za.kjs", "3tu.d.lc", "rn.d0.kfx"…

fc.domain({ size: '+1' });
// Note: Generate larger domain name compared to default. As default size is 'small' (if unchanged), it is equivalent to 'medium'
// Examples of generated values:
// • "e3lmceoiktylhwob3i097i07lbqe.g.ew2a5jzl4dm7y4.f767sc9.a8mp77soh3743x58n3bx85s-a8bkfnda8-bbnke3gjrr7ui57nqt.ez-ns69b5k6g8ugc1t7zvwsf0dzq1wywm7okkc1w6pt2.w.b5q7l242x-fcosehdxghwp1js5oykwo14t-7y5x.7gftao9au5u-ynym-yq027d9kc.bltzefaey"
// • "1n2983iaqbaqqez.j5exoz885-r97uinqna5rb0u35junfiav5p6q3xrw-ceribgdz.umyncrdcuyzcbs"
// • "z72rbhb9tjfoqq4whcj589.r94hzbjrbnrt2r8s0b3zu83fa0ysem2dbaf0quiow7d.7wp9ypk-fddyaf-4dqibdap.dn.56.572ggc.eahn5fa5z-fwxc04d88-59bq7wcdgyybxicl8p7rff9ub2y58arh3cqyoaf.f6kargturvbsm7tw-oech4ibo.9ocddldahtd8be8ftdfrc87bawmfhdh66md8.ubxqd"
// • "3twerafs1lktsebj9o0p2g6p2adbdu63vwsr7kw57-lkbeb3p7ef1383xqmej69.80h5rjtsk4n2c82ecntzsy1tt0-1udt3fsc2rdctnnu68w6x3re1yk9gp.6.6ah5085en0kni5y25swn0aoahmhknzf00.15czrzh4wu00hes7p4860s6ui8-htm5x4b-cquy9rbal6.4.mt"
// • "rq42wt9mq67kg30r5iz55yh9.5g4zvgp29o.mrgob7gvx4r85rpwosrgr1dpw6dlvn6--pneig1.7co96i0-5d0zaw7thxb30jt9eyq6c67v7o0tnz4xhc8twkiyy46h.7tpqwpzihjluq4h4d0hwtcikxiyackva3xkk78.98b2cnk7yr-1kdxkq4vlikoly658f6d1j8ddrzo95.q739viaqbdk2u3etgcclbe4u7-kqnoe2i.ire"
// • …
```

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/domain.html).  
Available since 1.14.0.

### webAuthority

Web authority values.

Following RFC 3986.

**Signatures:**

- `fc.webAuthority()`
- `fc.webAuthority({withIPv4?, withIPv4Extended?, withIPv6?, withPort?, withUserInfo?, size?})`

**with:**

- `withIPv4?` — default: `false` — \_enable ip v4
- `withIPv4Extended?` — default: `false` — _enable ip v4 extended_
- `withIPv6?` — default: `false` — _enable ip v6_
- `withPort?` — default: `false` — _enable port_
- `withUserInfo?` — default: `false` — _enable user info_
- `size?` — default: `undefined` [more](#size-explained) — _how large should the generated values be?_

**Usages:**

```js
fc.webAuthority();
// Examples of generated values: "qj5h7-5.d6je1ud1x.yy", "52c.cnb", "qbaqf84.e.tzy", "vyd-xdhj.vu94x4.nl", "5sr6j0ayq2et.a.eur"…

fc.webAuthority({
  withIPv4: true,
});
// Examples of generated values: "227.252.4.231", "6.1.143.3", "nlefeaoklaq7.ijm", "1ce9.kt", "6.3.255.158"…

fc.webAuthority({
  withIPv4Extended: true,
});
// Examples of generated values: "4fc6-arq.j9m.voe", "0xa", "0xefebe5f3", "6keyb.auf", "0345.077777767"…

fc.webAuthority({
  withIPv4: true,
  withIPv4Extended: true,
  withIPv6: true,
  withPort: true,
});
// Examples of generated values: "0352.0x89bbdd:3", "154.0372.0xbd3d", "[4522:29:b:fc75:83e:964c:108::]:12037", "250.102.83.229:13", "025:13850"…
```

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/webAuthority.html).  
Available since 1.14.0.

### webFragments

Fragments to build an URI.

Fragment is the optional part right after the # in an URI.

**Signatures:**

- `fc.webFragments()`
- `fc.webFragments({size?})`

**with:**

- `size?` — default: `undefined` [more](#size-explained) — _how large should the generated values be?_

**Usages:**

```js
fc.webFragments();
// Examples of generated values: "hip", "c&", "K/z=)RtC", "E7y", "%F0%B5%81%85:w,+"…
```

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/webFragments.html).  
Available since 1.14.0.

### webPath

Web path.

Following the specs specified by RFC 3986 and WHATWG URL Standard.

**Signatures:**

- `fc.webPath()`
- `fc.webPath({size?})`

**with:**

- `size?` — default: `undefined` [more](#size-explained) — _how large should the generated values be?_

**Usages:**

```js
fc.webPath();
// Examples of generated values: "", "/AwBKGBUB", "/%F4%85%A2%88%F0%91%90%B5dU'", "/key", "/O"…

fc.webPath({ size: '+1' });
// Examples of generated values:
// • "/%F0%BE%81%918%F2%9E%9F%BA=p"
// • "/a%F4%8F%BF%BBe/r%F1%83%B5%8C"
// • "/sCG%F2%9E%AB%BASA/6;+b=%2af@b/8VadfgM/V%F1%90%B8%B3%F0%92%A6%9E!hP/%F0%BF%9C%ADJ8/~6/Eo!B"
// • "/.YAG/Lg3b//'wz%F4%8F%80%91/;8l':P!7/%F2%BA%A9%89pf+tX/I+uHD!//c%F3%80%B0%88u/Bq%F1%B0%A3%9D1"
// • "/a)=I1:B/z/VdPcVeh!J7"
// • …
```

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/webPath.html).  
Available since 3.3.0.

### webQueryParameters

Query parameters to build an URI.

Query parameters part is the optional part right after the ? in an URI.

**Signatures:**

- `fc.webQueryParameters()`
- `fc.webQueryParameters({size?})`

**with:**

- `size?` — default: `undefined` [more](#size-explained) — _how large should the generated values be?_

**Usages:**

```js
fc.webQueryParameters();
// Examples of generated values: "52mi", "L3ns-", "X%F3%AB%BA%8AksM", "bSO", "g"…
```

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/webQueryParameters.html).  
Available since 1.14.0.

### webSegment

Web URL path segment.

**Signatures:**

- `fc.webSegment()`
- `fc.webSegment({size?})`

**with:**

- `size?` — default: `undefined` [more](#size-explained) — _how large should the generated values be?_

**Usages:**

```js
fc.webSegment();
// Examples of generated values: "ref", "097", "e", "BgyH", "applyh"…
```

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/webSegment.html).  
Available since 1.14.0.

### webUrl

Web URL values.

Following the specs specified by RFC 3986 and WHATWG URL Standard.

**Signatures:**

- `fc.webUrl()`
- `fc.webUrl({authoritySettings?, validSchemes?, withFragments?, withQueryParameters?, size?})`

**with:**

- `authoritySettings?` — default: `{}` — _[constraints](https://dubzzz.github.io/fast-check/interfaces/webauthorityconstraints.html) on the web authority_
- `validSchemes?` — default: `['http', 'https']` — _list all the valid schemes_
- `withFragments?` — default: `false` — _enable fragments_
- `withQueryParameters?` — default: `false` — _enable query parameters_
- `size?` — default: `undefined` [more](#size-explained) — _how large should the generated values be?_

**Usages:**

```js
fc.webUrl();
// Examples of generated values: "https://lo.ui", "https://4.xlm", "https://710n-lu1.s.zl", "https://ao1.ia/YisProt", "https://6uzbj4.pr"…

fc.webUrl({
  validSchemes: ['ftp', 'ftps'],
});
// Examples of generated values:
// • "ftps://lrefd.fuoaa.ecv/C9by:U)xN1"
// • "ftps://5ana.x02y.be/B%F2%9D%86%96;x%F1%8D%9D%BE.g-"
// • "ftp://f.d.nl/1"
// • "ftp://d3mhpf.xtb"
// • "ftps://4.ap"
// • …

fc.webUrl({
  withFragments: true,
  withQueryParameters: true,
});
// Examples of generated values:
// • "https://6teotdbx.nle?N=#d/e"
// • "http://ntgafkj31t.8x7x09flrvhg.yd?ez#c"
// • "http://ed.az3bzcn6p.dai/_#@cbd?:b"
// • "http://8.jef?a#gne,"
// • "https://qc.ieele4.fcg?P%F1%81%9C%A5N+0DN%F3%97%8C%85fX"
// • …

fc.webUrl({ size: '-1' });
// Note: Generate smaller urls compared to default. As default size is 'small' (if unchanged), it is equivalent to 'xsmall'
// Examples of generated values: "http://d.zy", "https://h.lp/%F3%A0%B4%9E", "http://6e.9j8.xft/g", "https://b.uq.ll", "https://g26.eow"…
```

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/webUrl.html).  
Available since 1.14.0.

### emailAddress

Email adresses.

Following RFC 1123 and RFC 5322.

**Signatures:**

- `fc.emailAddress()`
- `fc.emailAddress({size?})`

**with:**

- `size?` — default: `undefined` [more](#size-explained) — _how large should the generated values be?_

**Usages:**

```js
fc.emailAddress();
// Examples of generated values:
// • "e0f7||'5tqsh.1k_opz+.*%^'k&w.cdd@5bdc55fta.bs"
// • "bf|!drdd.55^.}dc|@v.alx"
// • "|bi9r}.|9lm^.iw8i39$~doz.|dlr.nl}~gfu+.x0pr-{%*mh&*.efx.4`@v.au"
// • "/2.{9=mp&2?e#w-.%-'=%itden.?8#_c1g_3c.=#0e~/_j^n&*.9@8y3l33b6.y7o558ir45.ix"
// • "z*3y`3.teb.4~6|&&xep.{dfz=pp/mmx.-n^%smik'z.%.4+c._.g-csml66'@gc.vd"
// • …

fc.emailAddress({ size: '-1' });
// Note: Generate smaller email addresses compared to default. As default size is 'small' (if unchanged), it is equivalent to 'xsmall'
// Examples of generated values: "hn@s1v.i9.aw", "%@xa.fe.fd", "{@4hq.d.dn", "kg.kg@5y.zr", "e._t@m5.pw"…
```

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/emailAddress.html).  
Available since 1.14.0.

### mixedCase

Switch the case of characters generated by an underlying arbitrary.

**Signatures:**

- `fc.mixedCase(stringArb)`
- `fc.mixedCase(stringArb, { toggleCase?, untoggleAll? })`

**with:**

- `stringArb` — _arbitrary producing random strings_
- `toggleCase?` — default: _try `toUpperCase` on the received code-point, if no effect try `toLowerCase`_ — _custom toggle case function that will be called on some of the code-points to toggle the character_
- `untoggleAll?` — default: `undefined` — _transform a string containing possibly toggled items to its untoggled version, when provided it makes it possible to shrink user-definable values, otherwise user-definable values will not be shrinkable BUT values generated by the framework will be shrinkable_

**Usages:**

```js
fc.mixedCase(fc.hexaString());
// Examples of generated values: "", "7E", "Dfc", "0De05933ef", "c"…

fc.mixedCase(fc.constant('hello world'));
// Examples of generated values: "HELlo WoRlD", "HeLLo WOrLD", "heLlo WoRLd", "hEllo wORLd", "hELLO woRLd"…

fc.mixedCase(fc.constant('hello world'), {
  toggleCase: (rawChar) => `UP(${rawChar})`,
  // untoggleAll is optional, we use it in this example to show how to use all the options together
  untoggleAll: (toggledString) => toggleString.replace(/UP\((.)\)/g, '$1'),
});
// Examples of generated values:
// • "UP(h)eUP(l)UP(l)o woUP(r)lUP(d)"
// • "UP(h)elUP(l)UP(o) world"
// • "hUP(e)UP(l)loUP( )UP(w)UP(o)rUP(l)d"
// • "helUP(l)UP(o)UP( )wUP(o)rUP(l)UP(d)"
// • "UP(h)UP(e)lloUP( )wUP(o)rUP(l)UP(d)"
// • …

fc.mixedCase(fc.constant('🐱🐢🐱🐢🐱🐢'), {
  toggleCase: (rawChar) => (rawChar === '🐱' ? '🐯' : '🐇'),
});
// Examples of generated values: "🐯🐢🐯🐢🐯🐢", "🐯🐇🐯🐇🐯🐢", "🐯🐢🐯🐇🐯🐢", "🐱🐇🐯🐇🐯🐢", "🐱🐇🐯🐇🐯🐇"…
```

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/mixedCase.html).  
Available since 1.17.0.
