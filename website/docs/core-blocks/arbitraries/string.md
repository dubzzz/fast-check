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
// Examples of generated values: "5", "f", "7", "d", "9"…
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
// Examples of generated values: "A", "H", "i", "l", "7"…
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
// Examples of generated values: "{", "x", "N", "8", "m"…
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
// Examples of generated values: "4", "l", "S", ";", "\u0019"…
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
// Examples of generated values: "⬑", "￺", "叾", "꟣", "$"…
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
// Examples of generated values: "", "毒", "丬", "縻", "贑"…
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
// Examples of generated values: "􅍫", "#", "󳥰", "񸻩", "񘙠"…
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
// Examples of generated values: "", "J7B8AB/V89==", "3H9Pr5M=", "bv6z", "V/GSu73r"…

fc.base64String({ maxLength: 8 });
// Note: Any base64 string containing up to 8 (included) characters
// Examples of generated values: "f3A+nr==", "37/7", "", "wC9q", "BLop9YK="…

fc.base64String({ minLength: 8 });
// Note: Any base64 string containing at least 8 (included) characters
// Examples of generated values: "f3A+nrd9UefIFrD27/==", "7/7+S88//DE/6M9QPAFg", "9refalueODsnam==", "toString", "callerkeyC8="…

fc.base64String({ minLength: 4, maxLength: 12 });
// Note: Any base64 string containing between 4 (included) and 12 (included) characters
// Examples of generated values: "YQ7D/IU8fE+2", "tjhMHtq9", "property", "9lm8Vx7bBF==", "roto"…
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
// Examples of generated values: "f312", "ab286", "6e1a5", "5e3", "9"…

fc.stringOf(fc.char(), { maxLength: 3 });
// Note: Any string containing up to 3 (included) characters extracted from `fc.char()`
// Examples of generated values: "", "W|", "J&", "x#", "\""…

fc.stringOf(fc.char(), { minLength: 4, maxLength: 6 });
// Note: Any string containing between 4 (included) and 6 (included) characters extracted from `fc.char()`
// Examples of generated values: "j1,p{h", "[~%?", "&alf", "call!", "\"&S \"!"…

fc.stringOf(fc.constantFrom('a', 'b'), { maxLength: 5 });
// Note: Any string containing between 0 (included) and 5 (included) characters extracted from `fc.constantFrom('a', 'b')`
// Examples of generated values: "ba", "bb", "aba", "", "abb"…

fc.stringOf(fc.constantFrom('Hello', 'World'), { minLength: 1, maxLength: 3 });
// Note: It might produce strings like "WorldWorldWorld" or "WorldHelloWorld"…
// Examples of generated values: "Hello", "World", "HelloWorld", "WorldWorldHello", "HelloWorldHello"…
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
// • "[\"oU6LT>'\",{\"QZ#YUZNw\":null,\"#\":null,\")>*\":{\"q&B1cUDn=\":\"CZTPpisxH\",\"u`)})\":\"_a-\",\"\":null},\"dY~Dn>k\":true,\"=nC#&uS5l%\":\"0\\\"j-o,JV\",\"TX[OKj\":-1.7084671585468263e+151,\"\\\"\":true,\"@(:<LUW\":\"s-JYYB\"},[]]"
// • "\"al[->g\""
// • "null"
// • "-1e-322"
// • "[null,-1.5485504457576672e+192,null,{},-1.417727947024272e-287,null,null,null]"
// • …

fc.json({ maxDepth: 0 });
// Examples of generated values: "null", "\"T\"", "-1.6050118268310372e-215", "true", "\"Ep\""…

fc.json({ maxDepth: 1 });
// Examples of generated values: "{\"V~<\\\"#}\":\"apply\"}", "{\"DZ&2@~yE\":4.016561322014934e-232}", "null", "true", "{}"…

fc.json({ depthSize: 'medium' });
// Examples of generated values:
// • "2.6e-322"
// • "[\"v!56\",true,{\"n.Z-KP\":\"WeB\",\"%sT\":true,\"+vJj71IB1\":\"p\\\"9|V\\\".\",\"B~U)!j6>:0\":\"?]2R)hy\",\"<C\":5.763682596504741e-124,\"g\":5.506486779037679e+86,\"^\":false,\"0beh\":null},null,true,false,null]"
// • "-1e-322"
// • "{\"valueOf\":{\"hCu2[\":{\"}t\":{\"rC,RK\":false,\"|sD.+@+\":\"K?e5tLzu\"},\"*4 80r\":{\"=c8x 3^\":\"\",\"bv2;Pdc\":266593828340.0835,\"&F{b*Ow:tH\":3.854574422896131e-236,\"\":-3.136445144286352e-152,\"7 a[$t.f[\":null,\"S\":true,\"VdF\":\"zr}U[\"},\"suNX+*`0y\":null,\"GO*sBjC8G1\":{\"Bx5_>&C'l\":\"<\",\"8qI\":1.5292990047864634e-116,\"hKPYD5\":-1.7059350714655333e+80,\";-{\":false,\"-0/PeWhX)3\":\"-}|\",\"\":null,\"!\":\"H0(|XlzFMY\",\"peo`:V\":\"%#BLcJMT\",\"T+FOe$\":true,\"Z7\":null},\"zCA'ft\\\\l^J\":[null]}},\";oU_&9\":{\"b\":{\"\":null,\"%C\":\"+Lf\",\"%6>\":1.797693134862311e+308,\"}vi!#D[G\\\\\":null,\"g.q&2evf\":\"C^tirM8d?,\",\"4t4aCG\":true,\"$n\\\"\":\"(IbE\"},\"|Bt[MInNOk\":null,\"#&$gzzy\":null,\"bd7cNTL\":[null,\"D\",null,1.627654078166552e+223,null,null,\"g\",\"gr\",-1.137436331927833e+42,-3.0030877534684717e+142],\" j]\":{\"hlI1\":null,\"e1$j@B\":null,\"-!\":\"7<!94\",\"fM@\":-4.396133099620614e-146,\"RwN]?%U@b7\":null,\"KB\":true,\"k=z<\":1.8766725492972305e-96,\"\":null,\"~b1>42%\":null,\"G\":null},\":v FiA\":\"k\",\"VlI okG\":-1.4e-322,\"f\":null,\"%w*B}\":true,\"\":\"apply\"},\"l\":[7.6086682491958856e-146,{\"5\":\"\",\"Y)s.a\":null,\"0y]0ca@qm2\":\"inPS~K2q{\",\"S*Z*f&=\":null,\"-=u\":false,\"v.P\":-7.067638177674602e+76},\"$~1<?Pv_\",null,[2.219624217009348e-22,-9.770861754123764e+110,true,null,\"/.1Q%v\",null,null],true,1.2718114310572915e+272,true,true]}"
// • "{\"L|hZ\":{\"~(\":\"4jKldvae;X\",\"NU(b\":null,\"\":4.163017031290256e+162,\"K\\\"F\":null,\"o<|c\":true,\"< bZ] \":false,\"wS,Riq}CV4\":-5.298684866824531e+64},\"3md/a<_r{\\\"\":{},\"-Rcc`3_\":[true,\"xuY=Hd6 \",{\"5e(_%d9^0d\":null,\"^q#$iu\":null},1.973826918030355e-291,{\"k\":-2.1122181366513202e+135,\"fYxj@\":-1.351657689147719e-183,\"2<+2nm%\":6.329905233731848e-285,\"4y.!XKqc\":null,\"CSaX}b\":\"`J_fU\",\"nc\":null,\"OXR>\":\"^xW!\"}],\"\":{\"d1}%eQ=\":{\":\":false,\"bO9,.DM\":false}},\"4iK-j!9hx\":{\"xK^[~mT\":null,\"l2$7G5(\":{\"4%' 15&pK\":true,\"[$@Y`\":\"5EHH_d.@|\",\"\":\"\\\\\",\"E~[./|O3\":-9.129273010709225e+288},\"K\\\\;/4elg|$\":null,\"jr\":-1.0758585287978389e-274,\"~@S\":\"\",\",*I)0\":\"]7\",\"-!:NF\":true,\"(Dp\":\")3Fd\",\"(:^0XUcye2\":null}}"
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
// • "{\"ᥔßR\":{\"毟蜂唾缨Ⳡ眬\":{\"ᨢꉠ膃쩹㳩본⚁ꆾ䡫\":[\"毻쏳䉘빎酃糆ᚣ꥘ﻀ設\",1.4078094841036001e-67,\"┞\"],\"䧃䔝鉜饎ᠳ磙㾜\":\"㞫抮ꨛ퟼\",\"\":\"隻錒䕹嘗揣䱰̓ꖸ쳊\"},\"゙᯿錣龀槅꼌磱\":\"໮漠뻫ꅜ諩碶뒁铎\",\"㻁㞯鄄ᘕƛᙆ符緇矒鞹\":null,\"섿㺵ធ䕀\":true,\"㰘⮒泑ꚛ咸\":false,\"쵩傞漆뵠텐婢\":\"姍儵ඣ⽫⺞縺뗮㚃\",\"嫏ꨮ䣫\":-6.638526972924301e+52,\"ꔏ⽙䥽ѫ뢿䜻\":1.7943982562867058e+199}}"
// • "[]"
// • "[true,null,null,true,\"￿\",\"騨뷙ឣ푻꾴吉䚯\",false,null]"
// • "{\"᫄\":{\"坾ᦨ\":-1.9788421366816808e-82,\"駮㔽艕슑\":\"쓨♹訫뵥筭⪅䮹\",\"乓⃷觖\":null,\"㲾ペ钓睊虐\":80283984173685.53,\"泓ꑙᘤ⊫\":true,\"뤂䮽І眊ੋ竰\":\"\",\"鰲偅맟ద싏㠒嶬\":null},\"塜粼拺຿\":[null,true,null,{\"㧴䏄༳톏\":\"ꪰ篅酣ퟥ\",\"罟噝梹\":9.214173245947507e-111,\"녇몭㰡懬\":\"⻫캲뾦鱜퉵\",\"뀪妬鮯씅莝䮍䰃絡癿\":7.808042412941465e-176,\"䨺⺤ￗ莰⼵\":null,\"킀ᆍ闓⚘∥䓯옼\":null,\"\":null,\"ᮨ䌙杖ো䛞ᯈ\":false,\"鮁璟啵魬\":false,\"롘柺퇌⌓ꢏ⊓⟊渞望\":null}],\"혣㐀ࡰ䝯澨ဆ\":[[[\"⾒ꁿ\",\"㒱䖹Ѷ衔돵㤲畈\"],\"袼岌᧝퐿㾂\",null],\"䎿캮ᎍ쯍덪඘逹⃖釖\",true,null]}"
// • "true"
// • …

fc.unicodeJson({ maxDepth: 0 });
// Examples of generated values: "\"僘阘縝傚裷䀘\"", "null", "\"绠圞ⱺ\"", "true", "-2.3e-322"…

fc.unicodeJson({ maxDepth: 1 });
// Examples of generated values:
// • "[false,2.7321203973068163e+275,false,false,null,-9.218990816230408e-66]"
// • "{}"
// • "[\"ᅙ秱뵴ꇺ꿵玽鄧돟\",\"䕝\",null,\"䆩−ඍ㹏쭝း堥䗾兒\",\"샔ế\",false,true,\"缣켐駘\",\"Ӧ࠼䍝⇵鮤뉀㸓\"]"
// • "[false,\"❚姒쭧䠢\",1.4486395822832596e+27]"
// • "-1.8e-322"
// • …

fc.unicodeJson({ depthSize: 'medium' });
// Examples of generated values:
// • "\"荽醮郺旽粈㈾\""
// • "[null,{\"諄\":8.590711529263102e-8,\"薠롺□嬞⥨萳\":null,\"Ϊ᪤퟿䧂콂讵⨷噟쒖\":\"》㶄㞃ﾼॏ鼟所蛂\",\"ஒ䍛\":5.019276820129658e+122,\"佰㠋\":\"じ\",\"풧㌱옣\":null,\"돝쯧浹Ṋ኷\":true,\"紅ꪋ\":null,\"น騢∣⚓䅤앃\":2.7762012163115278e-173},true,true,\"ヲ볉ꇑ센鬥\",false,null,[true,null]]"
// • "false"
// • "{\"﷏꼲吽꡺㊐뿗茻\":null}"
// • "{\"腌ꊖ璄諰晜ᩝ鬬ᅗ\":true,\"\":{\"꽂ꥑ讧霵ꎽ歪䠯\":{\"눴Ó\":false}},\"嗒줹朗큶꡷獺\":[null,-4.581442170446369e-31,false,[-3.259931843441816e+90,[\"〚Ꮳ㟺㙰㒈♖暶ጼ\",null,true,\"䷷ﾵ쪲㝵谔挴\",\"殒ꬖ캩℻墊풺ⳁ䎕쳳\"],\"뺔櫆౅\",-5.824037460896646e-126,-1.2440275335144407e-110,2.2853367367043913e+207,false]],\"뺶閩頫䫉奈錏ꞛ\":\"ꦈ돬喵ᡝ떶ꨵ\",\"㾽ⲳ\":{\"극ꄆ橝촍毟\":\"呖턃䣯ꃪ淑湐愨鮫國\"}}"
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
// • "magna ullamcorper iaculis purus nec"
// • "lorem"
// • "eu semper lectus mauris sed in nulla non scelerisque massa enim cras"
// • "mauris arcu cras molestie"
// • "euismod"
// • …

fc.lorem({ maxCount: 3 });
// Examples of generated values: "duis enim nonummy", "consequat pharetra iaculis", "sollicitudin mi curabitur", "faucibus", "cursus sit ac"…

fc.lorem({ maxCount: 3, mode: 'sentences' });
// Examples of generated values:
// • "Nec, dolor congue vitae pellentesque orci amet."
// • "Amet augue metus nibh rhoncus nulla morbi dui sed ac. Aliquam massa, et vestibulum integer suscipit magna pellentesque nonummy. Mi tellus, posuere vestibulum nibh."
// • "Ullamcorper orci ipsum diam ultrices convallis mollis, ullamcorper. Vitae faucibus bibendum ligula."
// • "Elementum semper iaculis ligula mauris ipsum mauris. Cursus massa nulla semper feugiat, sed scelerisque."
// • "Vitae. Dolor primis aenean convallis adipiscing mauris in odio ante. Massa, faucibus."
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
// Examples of generated values: "149.2.84.39", "255.251.100.5", "151.253.2.4", "93.3.251.97", "121.3.113.229"…
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
// Examples of generated values: "0x7.249.0xfe.0x79", "07.0x7b.1.0x6", "0xa5.0265.22.27", "0xd4.0xfd.15664", "0x1ed7207"…
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
// Examples of generated values:
// • "::470:6:192b:ffae:17:2:f"
// • "b1:9:16:0d:3:0157:2.0.3.0"
// • "::54.250.196.255"
// • "b12d:062:04:352:3f:2f:e5a6:4"
// • "::1f58:4b90:7.75.163.156"
// • …
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
// • "4ebb3995-0009-1000-8b20-2254b7902e27"
// • "ffffffef-50fb-40b5-aa9f-05640000001d"
// • "87a8e397-ffec-5fff-8000-001a00000004"
// • "17983d5d-001b-1000-98d3-6afba08e1e61"
// • "7da15579-001d-1000-a6b3-4d71cf6e5de5"
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
// • "d9951cc0-000f-3000-886d-743b90c0903c"
// • "b4f42187-7bd2-3385-8000-000794a930da"
// • "c2faeae2-2bd2-31a4-81e8-3f5800000007"
// • "65c2d0a5-0004-3000-8000-000e579a5fa4"
// • "00000002-0008-3000-8000-000b1bc90950"
// • …

fc.uuidV(5);
// Examples of generated values:
// • "40884311-1487-57f0-bfff-ffe30000000c"
// • "ffffffea-0019-5000-99e6-b63700000007"
// • "f92ab3fe-000f-5000-abf4-8b9a04f4449f"
// • "b77d67e3-001a-5000-8e94-de76050b8105"
// • "00000014-000e-5000-8caa-1615aee2e3cd"
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
// Examples of generated values: "6i1.ws", "p.s.snp", "r.sc", "gkamh0qv6l.krzi6l5r.nwr", "ewargum4.oe"…

fc.domain({ size: '-1' });
// Note: Generate smaller domain name compared to default. As default size is 'small' (if unchanged), it is equivalent to 'xsmall'
// Examples of generated values: "9.pi.ca", "hs3.gzh", "wa5.6.pr", "b.mle", "xwh.t3o.qfy"…

fc.domain({ size: '+1' });
// Note: Generate larger domain name compared to default. As default size is 'small' (if unchanged), it is equivalent to 'medium'
// Examples of generated values:
// • "9.p423dsmckvsr8zq9pz4g7m7d-er6s2isixposz852w-6ucuyt6dpd1xom5qw.m13i-0v7it7r-idhdv3r81ih0rkr21vcm03ckml1kinrycchs--xe.7r9699vi87mam0n2n1yiheo5m66b43olq60v4uq0nx2njzln8s9.kcan-6s50hi299hkxwogui-sr-qqag7qk77rp.7.oyydbar"
// • "hsqw8csm6fqkxx-m8bfki5x9ha3b1xwkcrb8434om2a6k.iggl02udkofh9ejc82r0n9d1j3iiebb03htjchbcm4.vrpz5ykhbgw9w70ngv5fibddr0.h4z59i4jgozqyweaiqmsnb1g-xyukd1p56b9rube6bygqql-bix8c1hhe9zl.jzh73innxd9by63zqpgapervfj2tfay9a1yzo1.yvyad"
// • "wa1rmog9vzegsnc0s08c9mw8xhtzi.lczv51ng2.qgrbojlaweyi0dssmu5ynrdo4m2rph-zrmmkmexuives2-33kbu8r5flthpuew1.0hvuvunrwxm46ep19q0g.91z9lzm0o3bk8khhqdfb32lloo.l0ul57f3i6ez24u47taregkn6c95mrx.drgcjivmedhkk"
// • "b.p3avihxjt2f0nz5gyxygckr4zni-1zbz.jnd6n4mvgwhur1.8xvmpgmb9e2lmo0kzqlr3tcqfntktx.9.4j.93gqwgsv-6xdg25i715sg7jul6xbwla.mcnlem"
// • "xwtcyt3pynja1mmoeot1l2x7ue82lbhjuddrogn5ubwjnua.macf28a2x600a9zg25z17rrqgohj89j0ik0cqg91jg4kvhd6-y6.i8syilcl23id4vjxrhyszp8o5ps5h.agm3iek7um94do2ijyt7b6diwqi1i2si-c5xwup.qtgn3lyouk4f7ft57780y7usr0kxox.g.vn"
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
// Examples of generated values: "23ks1pf.mgz", "7-ngin.sv", "peybeb.f9ia-gsmr.na", "9a1hmsddb-cm.iit", "xhlstwb.44ctb2efxk.fc"…

fc.webAuthority({
  withIPv4: true,
});
// Examples of generated values: "i.fb", "237.196.254.199", "7.166.63.117", "wz0zysek.zb", "252.149.163.184"…

fc.webAuthority({
  withIPv4Extended: true,
});
// Examples of generated values: "109.013506422", "119.0234.250.04", "df.el", "v.we", "64.020"…

fc.webAuthority({
  withIPv4: true,
  withIPv4Extended: true,
  withIPv6: true,
  withPort: true,
});
// Examples of generated values: "0rog.cod:63367", "02.0x57fdd:45172", "0247.0332.0315.0x7a", "2498828715:50719", "169.3.232.223"…
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
// Examples of generated values: "", "kg%F4%8F%BF%AEe=@b%F2%90%95%8Ad'", "a", "?x%F1%82%BD%B9-f.%F3%92%97%BA", "%F0%B7%94%9Bu_8r"…
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
// Examples of generated values: "/OZx@%E4%B6%958j~64", "", "/0cLw*!~%F2%9A%90%BE5I", "/1", "/"…

fc.webPath({ size: '+1' });
// Examples of generated values:
// • "/%F3%A0%A1%8BlESmD/cLeL/6C%F1%A7%A8%A6J4%F1%AC%A3%8D-2(/k%F1%B6%B2%8F%E0%BD%98*S6y%F1%8F%B5%B8/_M/0S2JqQ/%F2%9D%90%B1D@gRy"
// • "/Fxamq,9/%F1%84%A7%9Ex8L79RVmv"
// • "/P.=*%F1%98%B1%A6.!zS/w4Rw/X%F1%82%9A%87ETDLW/Y/+lr!w-kJL/wOq)Xw0KZ"
// • "/@H%F1%B2%B8%A8F+5uAO/=%F1%A4%96%835Ty+uv/OfoC.F%F3%8A%AD%96:J=/%F0%A6%92%B8~,0Wo8t%F2%8F%A5%87/k-G9=L;P4/;a"
// • "/Bubfb"
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
// Examples of generated values: "argumentsp", "zB)MCS9r*", "=gcJbW:1", "RmE9%F3%96%BC%95XJ4h", "1=eJ@5ic1"…
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
// Examples of generated values: "*lej@(", "", "+Y", "1FBtTF1GX", "V:%F2%BF%87%8B%F4%8A%AF%B6(AieS"…
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
// Examples of generated values: "https://1e.pl", "https://s.snp", "https://h.ot", "https://copze7.wrc", "http://ay84wia.bi"…

fc.webUrl({
  validSchemes: ['ftp', 'ftps'],
});
// Examples of generated values:
// • "ftps://iq7rvu2my.tm/'1V&HqX52m"
// • "ftp://7eee69dc78fg.nec"
// • "ftp://hye.rbh9r2.hb"
// • "ftp://hmakevcba.uis"
// • "ftps://xb1.5787e.cew/"
// • …

fc.webUrl({
  withFragments: true,
  withQueryParameters: true,
});
// Examples of generated values:
// • "https://db.oaurut3lxuey.yc"
// • "http://91kpzb6.x4tmjg.pa/*yjz,%F1%A0%AA%B0?~v6+#engtho__!/"
// • "http://hqydzxt3ihu.db/_tAUbo?:/#%F3%B9%93%B6qfx"
// • "https://74gl.fp601objrmhm.rx/#tZK%2ae'(c"
// • "http://7.qxq?;Y:f@HiK#ref"
// • …

fc.webUrl({ size: '-1' });
// Note: Generate smaller urls compared to default. As default size is 'small' (if unchanged), it is equivalent to 'xsmall'
// Examples of generated values: "https://pi.ca", "https://j.3ch.hy/", "https://5c.f.lbi/", "https://px.hw", "https://dcf.qr"…
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
// • "4@fgqcru.ca"
// • "#!iy8*vt.~#p{nam.y|na.f.afac|.t%^$v*+2di1e.43g@jcc.hl"
// • "fo/2p~zq.kn'e&bfa|1`@9fqau6rah8.8i81fxjk.ox"
// • "==.vra&~to=z.vdc^.=kf/'a$'2sr^.6j6gsw6^&az'.#$}mba.x!|}a@4.wk"
// • "8ic6`_g00syk.}r~b3{0t/7?.!51q'.0yxj2.8wj`f?v-lr}.t6%?z*1$i2+b@cjybzi.pr"
// • …

fc.emailAddress({ size: '-1' });
// Note: Generate smaller email addresses compared to default. As default size is 'small' (if unchanged), it is equivalent to 'xsmall'
// Examples of generated values: "k.wh@l7.pc", "u@j.ag", "p.ag@1f.bj", "d@4.yd", "!@is8.gb"…
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
// Examples of generated values: "", "C63", "064", "1e412E00", "0E"…

fc.mixedCase(fc.constant('hello world'));
// Examples of generated values: "HEllO wOrLd", "hElLo WoRLD", "hELlo woRlD", "helLO WOrLd", "HEllo wOrld"…

fc.mixedCase(fc.constant('hello world'), {
  toggleCase: (rawChar) => `UP(${rawChar})`,
  // untoggleAll is optional, we use it in this example to show how to use all the options together
  untoggleAll: (toggledString) => toggleString.replace(/UP\((.)\)/g, '$1'),
});
// Examples of generated values:
// • "UP(h)elUP(l)o UP(w)UP(o)rUP(l)UP(d)"
// • "UP(h)eUP(l)UP(l)UP(o) UP(w)oUP(r)UP(l)UP(d)"
// • "UP(h)UP(e)lUP(l)UP(o)UP( )UP(w)UP(o)UP(r)ld"
// • "UP(h)elUP(l)oUP( )UP(w)orUP(l)UP(d)"
// • "helUP(l)o UP(w)orlUP(d)"
// • …

fc.mixedCase(fc.constant('🐱🐢🐱🐢🐱🐢'), {
  toggleCase: (rawChar) => (rawChar === '🐱' ? '🐯' : '🐇'),
});
// Examples of generated values: "🐯🐇🐱🐢🐯🐢", "🐱🐇🐱🐇🐯🐇", "🐱🐢🐯🐢🐱🐢", "🐱🐢🐱🐇🐯🐢", "🐱🐢🐯🐢🐱🐇"…
```

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/mixedCase.html).  
Available since 1.17.0.
