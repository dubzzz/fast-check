# [:house:](../README.md) Arbitraries

Arbitraries are responsible for the random - *but deterministic* - generation and shrink of datatypes. [They can be combined together](./AdvancedArbitraries.md) to build more complex datatypes.

This documentation lists all the built-in arbitraries provided by fast-check.

You can refer to the [API Reference](https://dubzzz.github.io/fast-check/) for more details.

## Table of contents

- [Boolean](#boolean)
- [Numeric](#numeric)
  - [Integer](#integer)
  - [Floating point](#floating-point)
  - [BigInt](#bigint)
- [String](#string)
  - [Single character](#single-character)
  - [Multiple characters](#multiple-characters)
  - [More specific strings](#more-specific-strings)
- [Date](#date-date)
- [Falsy](#falsy-any)
- [Combinators](#combinators-t)
- [Objects](#objects-any)
- [Recursive structures](#recursive-structures)
- [Functions](#functions)
- [Extended tools](#extended-tools)
- [Model based testing](#model-based-testing)
  - [Commands](#commands)
  - [Arbitrary](#arbitrary)
  - [Model runner](#model-runner)
  - [Simplified structure](#simplified-structure)
- [Race conditions detection](#race-conditions-detection)
  - [Scheduling methods](#scheduling-methods)
  - [Wrapping calls automatically using act](#wrapping-calls-automatically-using-act)
  - [Model based testing and race conditions](#model-based-testing-and-race-conditions)

## Boolean

<details>
<summary><b>boolean</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#boolean">api</a>]</summary><br/>

*&#8195;Description*

> Boolean values, either `true` or `false`

*&#8195;Signatures*

- `fc.boolean()` — _either `true` or `false`_

*&#8195;Usages*

```js
fc.boolean()
// Examples of generated values: true, false…
```
</details>

## Numeric

### Integer

<details>
<summary><b>integer</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#integer">api</a>]</summary><br/>

*&#8195;Description*

> Signed integer values

*&#8195;Signatures*

- `fc.integer()` — _all possible 32-bit integers ie. from `-2147483648` (included) to `2147483647` (included)_
- `fc.integer(maxValue)` — _all possible 32-bit integers ie. from `-2147483648` (included) to `maxValue` (included)_
- `fc.integer(minValue, maxValue)` — _all possible 32-bit integers ie. from `minValue` (included) to `maxValue` (included)_

*&#8195;Usages*

```js
fc.integer()
// Examples of generated values: 1502944448, 888414599, 1123740386, -440217435, -2…

fc.integer(1000)
// Examples of generated values: -1057705109, -9, -1089721660, -1878447823, -741474720…

fc.integer(-99, 99)
// Examples of generated values: 2, -1, 91, -2, 3…
```
</details>

<details>
<summary><b>nat</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#nat">api</a>]</summary><br/>

*&#8195;Description*

> Positive integer values (including zero)

*&#8195;Signatures*

- `fc.nat()` — _all possible 32-bit positive integers ie. from `0` (included) to `2147483647` (included)_
- `fc.nat(maxValue)` — _all possible 32-bit positive integers ie. from `0` (included) to `maxValue` (included)_

*&#8195;Usages*

```js
fc.nat()
// Examples of generated values: 16, 1747563639, 0, 2075457316, 2146229148…

fc.nat(1000)
// Examples of generated values: 299, 1, 225, 750, 4…
```
</details>

<details>
<summary><b>maxSafeInteger</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#maxsafeinteger">api</a>]</summary><br/>

*&#8195;Description*

> All the range of signed integer values

*&#8195;Signatures*

- `fc.maxSafeInteger()` — _all possible integers ie. from `Number.MIN_SAFE_INTEGER` (included) to `Number.MAX_SAFE_INTEGER` (included)_

*&#8195;Usages*

```js
fc.maxSafeInteger()
// Examples of generated values: 36, 7332126275469313, 48, -8631085038818303, 417563055003649…
```
</details>

<details>
<summary><b>maxSafeNat</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#maxsafenat">api</a>]</summary><br/>

*&#8195;Description*

> All the range of positive integer values (including zero)

*&#8195;Signatures*

- `fc.maxSafeNat()` — _all possible positive integers ie. from `0` (included) to `Number.MAX_SAFE_INTEGER` (included)_

*&#8195;Usages*

```js
fc.maxSafeNat()
// Examples of generated values: 44, 5865870157242368, 16, 5036966494443520, 53…
```
</details>

### Floating point

<details>
<summary><b>float</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#float">api</a>]</summary><br/>

*&#8195;Description*

> Floating point values with 32-bit precision

*&#8195;Signatures*

- `fc.float()` — _uniformly distributed floating point value between `0.0` (included) and `1.0` (excluded)_
- `fc.float(maxValue)` — _uniformly distributed floating point value between `0.0` (included) and `maxValue` (excluded)_
- `fc.float(minValue, maxValue)` — _uniformly distributed floating point value between `minValue` (included) and `maxValue` (excluded)_

*&#8195;Usages*

```js
fc.float()
// Examples of generated values: 0.731347382068634, 1.1920928955078125e-7, 0.6597227454185486, 0.5946863293647766, 0.6302104592323303…

fc.float(100)
// Examples of generated values: 0.00007748603820800781, 0.00007152557373046875, 0.00013113021850585938, 52.37404108047485, 0.000035762786865234375…

fc.float(-100, 100)
// Examples of generated values: -99.99992847442627, 55.83081245422363, -99.99979734420776, -20.923829078674316, -99.99991655349731…
```
</details>

<details>
<summary><b>double</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#double">api</a>]</summary><br/>

*&#8195;Description*

> Floating point values with 64-bit precision

*&#8195;Signatures*

- `fc.double()` — _uniformly distributed floating point value between `0.0` (included) and `1.0` (excluded)_
- `fc.double(maxValue)` — _uniformly distributed floating point value between `0.0` (included) and `maxValue` (excluded)_
- `fc.double(minValue, maxValue)` — _uniformly distributed floating point value between `minValue` (included) and `maxValue` (excluded)_

*&#8195;Usages*

```js
fc.double()
// Examples of generated values: 0.4530413804731288, 0.8226463198661805, 0.3829372459587349, 0.7186836451292051, 0.8065718412399292…

fc.double(100)
// Examples of generated values: 0.000019014520535876045, 98.91013210040657, 0.00003648309874204614, 20.497548580169944, 0.00001937150981845548…

fc.double(-100, 100)
// Examples of generated values: -99.999970715887, -99.99996384938794, -99.99996463982544, -69.75060565839972, -99.99994324436676…
```
</details>

### BigInt
_if supported by your JavaScript interpreter_

<details>
<summary><b>bigIntN</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#bigintn">api</a>]</summary><br/>

*&#8195;Description*

> N-bit signed `bigint` values

*&#8195;Signatures*

- `fc.bigIntN(n)` — _all possible `bigint` between <code>-2<sup>n-1</sup></code> (included) and <code>2<sup>n-1</sup>-1</code> (included)_

*&#8195;Usages*

```js
fc.bigIntN(2)
// Examples of generated values: -1n, 1n, 0n, -2n…

fc.bigIntN(128)
// Examples of generated values: 118965438702305362498464591014723682065n, -55529428019749399595111693273573678376n, -45882741802961890031345972148576150745n, 88162568694395329699188080847279292274n, -18663446021429702481819240863645317485n…
```
</details>

<details>
<summary><b>bigInt</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#bigint">api</a>]</summary><br/>

*&#8195;Description*

> Signed `bigint` values

*&#8195;Signatures*

- `fc.bigInt()` — _uniformly distributed `bigint` values_
- `fc.bigInt(minValue, maxValue)` — _all possible `bigint` between `minValue` (included) and `maxValue` (excluded)_

*&#8195;Usages*

```js
fc.bigInt()
// Examples of generated values: -55267127471484960134228883170671517601140668833043648279881539595328866477336n, -320877373404846693351482506498287829328651053618510591877443861350691412062n, 22403846480109971796256164379798253424379083455297331933513006716677124261164n, 46531564263119251593570768169779548000260571947054149902092502970846442652567n, -27488731055093319143645334041335559432506843454739800192508819981052054802083n…

fc.bigInt(0n, 12345678901234567890n)
// Examples of generated values: 6465640285538993635n, 8922695748501260749n, 16n, 19n, 10723446437785154890n…

fc.bigInt(-3000n, 100n)
// Examples of generated values: 1n, -2031n, -351n, -1605n, -2n…
```
</details>

<details>
<summary><b>bigIntN</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#bigintn">api</a>]</summary><br/>

*&#8195;Description*

> N-bit positive `bigint` values (including zero)

*&#8195;Signatures*

- `fc.bigUintN(n)` — _all possible positive `bigint` between <code>0</code> (included) and <code>2<sup>n</sup>-1</code> (included)_

*&#8195;Usages*

```js
fc.bigUintN(2)
// Examples of generated values: 1n, 0n, 2n, 3n…

fc.bigUintN(128)
// Examples of generated values: 86341151263089925165504430453367665188n, 28n, 328981524291263435470719008913591905663n, 279866238908824165638381771934770854596n, 111395503858026070299201611333616927272n…
```
</details>

<details>
<summary><b>bigUint</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#biguint">api</a>]</summary><br/>

*&#8195;Description*

> Positive `bigint` values (including zero)

*&#8195;Signatures*

- `fc.bigUint()` — _uniformly distributed positive `bigint` values_
- `fc.bigUint(maxValue)` — _all possible positive `bigint` between `0` (included) and `maxValue` (excluded)_

*&#8195;Usages*

```js
fc.bigUint()
// Examples of generated values: 98415346800826680180868623901081769911550846942931679526483139707297824018492n, 81847654831253862250960947754551199482417759415227376695916153744999991292122n, 88192025501918677973672101265075531420107830828023254720275072280209923428999n, 46027806054858042993090394331470161808813263449611553513658034830595160464971n, 18n…

fc.bigUint(12345678901234567890n)
// Examples of generated values: 5776499037807709071n, 4876199541303708566n, 19n, 18n, 5n…
```
</details>

## String

### Single character

<details>
<summary><b>hexa</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#hexa">api</a>]</summary><br/>

*&#8195;Description*

> One lowercase hexadecimal character

*&#8195;Signatures*

- `fc.hexa()` — _one character in `0123456789abcdef` (lower case)_

*&#8195;Usages*

```js
fc.hexa()
// Examples of generated values: "1", "3", "2", "d", "e"…
```
</details>

<details>
<summary><b>base64</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#base64">api</a>]</summary><br/>

*&#8195;Description*

> One base64 character

*&#8195;Signatures*

- `fc.base64()` — _one character in `A-Z`, `a-z`, `0-9`, `+` or `/`_

*&#8195;Usages*

```js
fc.base64()
// Examples of generated values: "U", "M", "z", "b", "4"…
```
</details>

<details>
<summary><b>char</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#char">api</a>]</summary><br/>

*&#8195;Description*

> One printable character

*&#8195;Signatures*

- `fc.char()` — _one character between `0x20` (included) and `0x7e` (included), corresponding to printable characters (see https://www.ascii-code.com/)_

*&#8195;Usages*

```js
fc.char()
// Examples of generated values: "&", "#", "A", "J", "%"…
```
</details>

<details>
<summary><b>ascii</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#ascii">api</a>]</summary><br/>

*&#8195;Description*

> One ascii character

*&#8195;Signatures*

- `fc.ascii()` — _one character between `0x00` (included) and `0x7f` (included)_

*&#8195;Usages*

```js
fc.ascii()
// Examples of generated values: "5", "#", "7", "}", "\u001a"…
```
</details>

<details>
<summary><b>unicode</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#unicode">api</a>]</summary><br/>

*&#8195;Description*

> One unicode character from BMP-plan

*&#8195;Signatures*

- `fc.unicode()` — _one character between `0x0000` (included) and `0xffff` (included) but excluding surrogate pairs (between `0xd800` and `0xdfff`). Generate any character of UCS-2 which is a subset of UTF-16 (restricted to BMP plan)_

*&#8195;Usages*

```js
fc.unicode()
// Examples of generated values: "", "熇", "ዢ", "⢥", ")"…
```
</details>

<details>
<summary><b>char16bits</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#char16bits">api</a>]</summary><br/>

*&#8195;Description*

> One unicode character from BMP-plan (including part of surrogate pair)

*&#8195;Signatures*

- `fc.char16bits()` — _one character between `0x0000` (included) and `0xffff` (included). Generate any 16 bits character. Be aware the values within `0xd800` and `0xdfff` which constitutes the surrogate pair characters are also generated meaning that some generated characters might appear invalid regarding UCS-2 and UTF-16 encoding_

*&#8195;Usages*

```js
fc.char16bits()
// Examples of generated values: ",", "훺", "*", "", "-"…
```
</details>

<details>
<summary><b>fullUnicode</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#fullunicode">api</a>]</summary><br/>

*&#8195;Description*

> One unicode character

*&#8195;Signatures*

- `fc.fullUnicode()` — _one character between `0x0000` (included) and `0x10ffff` (included) but excluding surrogate pairs (between `0xd800` and `0xdfff`). Its length can be greater than one as it potentially contains multiple UTF-16 characters for a single glyph_

*&#8195;Usages*

```js
fc.fullUnicode()
// Examples of generated values: "񗣺", "󡏒", "񖘬", "󁸻", "񄴑"…
```
</details>

### Multiple characters

<details>
<summary><b>hexaString</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#hexastring">api</a>]</summary><br/>

*&#8195;Description*

> Hexadecimal string containing characters produced by `fc.hexa()`

*&#8195;Signatures*

- `fc.hexaString()` — _string based on characters generated by `fc.hexa()`_
- `fc.hexaString(maxLength)` — _string based on characters generated by `fc.hexa()` having a length between `0` (included) and `maxLength` (included)_
- `fc.hexaString(minLength, maxLength)` — _string based on characters generated by `fc.hexa()` having a length between `minLength` (included) and `maxLength` (included)_

*&#8195;Usages*

```js
fc.hexaString()
// Examples of generated values: "0e0", "bf2", "3", "a9cb", "302122"…

fc.hexaString(3)
// Examples of generated values: "b04", "", "1", "22e", "0"…

fc.hexaString(4, 6)
// Examples of generated values: "61c9", "ae60ac", "1301c", "1195", "e0200"…
```
</details>

<details>
<summary><b>base64String</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#base64string">api</a>]</summary><br/>

*&#8195;Description*

> Base64 string containing characters produced by `fc.base64()`
>
> Provide valid base64 strings: length always multiple of 4 padded with '=' characters

*&#8195;Signatures*

- `fc.base64String()` — _string based on characters generated by `fc.base64()`_
- `fc.base64String(maxLength)` — _string based on characters generated by `fc.base64()` having a length between `0` (included) and `maxLength` (included)_
- `fc.base64String(minLength, maxLength)` — _string based on characters generated by `fc.base64()` having a length between `minLength` (included) and `maxLength` (included)_

_When using `minLength` and `maxLength` make sure that they are compatible together. For instance: asking for `minLength=2` and `maxLength=3` is impossible for base64 strings as produced by the framework_

*&#8195;Usages*

```js
fc.base64String()
// Examples of generated values: "rgkUfyt0yzjfC+og", "BdEh", "RD/EvefgXKA=", "xBEjzZ+=", "FoRDCZeC"…

fc.base64String(8)
// Examples of generated values: "", "HNgun7I=", "Zjy=", "2YaX", "FTD="…

fc.base64String(4, 12)
// Examples of generated values: "vDxCCAk2/IS0", "6ryIGlQJJX8=", "ehK1YMsk", "+TC9UScX", "AxZf"…
```
</details>

<details>
<summary><b>string</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#string">api</a>]</summary><br/>

*&#8195;Description*

> String containing characters produced by `fc.char()`

*&#8195;Signatures*

- `fc.string()` — _string based on characters generated by `fc.char()`_
- `fc.sString(maxLength)` — _string based on characters generated by `fc.char()` having a length between `0` (included) and `maxLength` (included)_
- `fc.string(minLength, maxLength)` — _string based on characters generated by `fc.char()` having a length between `minLength` (included) and `maxLength` (included)_

*&#8195;Usages*

```js
fc.string()
// Examples of generated values: ".A%", "aM{]xTH&)", "^NLpz5/y", "", "eqr"…

fc.string(3)
// Examples of generated values: "0", "!B", "OY", "TI'", ""…

fc.string(4, 6)
// Examples of generated values: "Y&.E{", "f&X6A", " \"d<ap", "bD7;", "UT'@"…
```
</details>

<details>
<summary><b>asciiString</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#asciistring">api</a>]</summary><br/>

*&#8195;Description*

> ASCII string containing characters produced by `fc.ascii()`

*&#8195;Signatures*

- `fc.asciiString()` — _string based on characters generated by `fc.ascii()`_
- `fc.asciiString(maxLength)` — _string based on characters generated by `fc.ascii()` having a length between `0` (included) and `maxLength` (included)_
- `fc.asciiString(minLength, maxLength)` — _string based on characters generated by `fc.ascii()` having a length between `minLength` (included) and `maxLength` (included)_

*&#8195;Usages*

```js
fc.asciiString()
// Examples of generated values: "2u1\u001aWQ", "", "*y", "\bT\u0013.\u0017|h&>", "si3\u0016`kA\u0017\u0004"…

fc.asciiString(3)
// Examples of generated values: "", "w7", "7", "f", "_u"…

fc.asciiString(4, 6)
// Examples of generated values: "%A&= ", "#\u0013!&", "%!n!W", "\u0014~\u001e,\u001f", "3\"|#D%"…
```
</details>

<details>
<summary><b>unicodeString</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#unicodestring">api</a>]</summary><br/>

*&#8195;Description*

> Unicode string containing characters produced by `fc.unicode()`

*&#8195;Signatures*

- `fc.unicodeString()` — _string based on characters generated by `fc.unicode()`_
- `fc.unicodeString(maxLength)` — _string based on characters generated by `fc.unicode()` having a length between `0` (included) and `maxLength` (included)_
- `fc.unicodeString(minLength, maxLength)` — _string based on characters generated by `fc.unicode()` having a length between `minLength` (included) and `maxLength` (included)_

*&#8195;Usages*

```js
fc.unicodeString()
// Examples of generated values: "", "ॗﰗ騈!+().俅", "㚗", "娇\u001eᨫ㽹矌", "┛䅯퉳"…

fc.unicodeString(3)
// Examples of generated values: "", "ꟑ", "쾮", "$", "⯄밈"…

fc.unicodeString(4, 6)
// Examples of generated values: "⥯ⳃケ썂은", "ൺ趫ᤲ䗆", "ꅶ൞ݡ纊㽵桘", "夵ᢾ剓╂ಽ㕔", "ݹ\"༱䴙џ"…
```
</details>

<details>
<summary><b>string16bits</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#string16bits">api</a>]</summary><br/>

*&#8195;Description*

> String containing characters produced by `fc.char16bits()`
>
> Be aware that the generated string might appear invalid regarding the unicode standard as it might contain incomplete pairs of surrogate

*&#8195;Signatures*

- `fc.string16bits()` — _string based on characters generated by `fc.char16bits()`_
- `fc.string16bits(maxLength)` — _string based on characters generated by `fc.char16bits()` having a length between `0` (included) and `maxLength` (included)_
- `fc.string16bits(minLength, maxLength)` — _string based on characters generated by `fc.char16bits()` having a length between `minLength` (included) and `maxLength` (included)_

*&#8195;Usages*

```js
fc.string16bits()
// Examples of generated values: "埫쒠爤", "-ꎝ", "૑ᚃ⵿⫄㖯孞℠", "⤱黁醙", "⦕끅Ȩ鋑\uda43"…

fc.string16bits(3)
// Examples of generated values: "", "Ǉ闍⏠", "", "⩿\udea5", "驙"…

fc.string16bits(4, 6)
// Examples of generated values: "媖봼Ђ刋⥞䪽", "誥갌/'(", "᥽ᚂ뀵鄓\udff5鐉", "찫灭溛椋ڀ", "㜴))%/"…
```
</details>

<details>
<summary><b>fullUnicodeString</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#fullunicodestring">api</a>]</summary><br/>

*&#8195;Description*

> Unicode string containing characters produced by `fc.fullUnicode()`

*&#8195;Signatures*

- `fc.fullUnicodeString()` — _string based on characters generated by `fc.fullUnicode()`_
- `fc.fullUnicodeString(maxLength)` — _string based on characters generated by `fc.fullUnicode()` having a length between `0` (included) and `maxLength` (included)_
- `fc.fullUnicodeString(minLength, maxLength)` — _string based on characters generated by `fc.fullUnicode()` having a length between `minLength` (included) and `maxLength` (included)_

_Be aware that the length is considered in terms of the number of glyphs in the string and not the number of UTF-16 characters. As a consequence `generatedString.length` might be greater than the asked maximal length but `[...generatedString].length` will not and always be in the required range_

*&#8195;Usages*

```js
fc.fullUnicodeString()
// Examples of generated values: "𾪖򘔼򭐂񿈋𰥞", "񫪥񫹚򻰌4", "󘅽󘺂򦀵򈄓񧟵", "󥐫򱡭􌺛愋Ꚁ𻧗ᨘ񀄮􍹣", "򈼴$3򴿦0#񵰀($'"…

fc.fullUnicodeString(3)
// Examples of generated values: "", "򛊋", "򤠕", "򙄭", "𠻚"…

fc.fullUnicodeString(4, 6)
// Examples of generated values: "􅄃񥋨񇕛󈯸򛂰󤟤", "򁵫􃵥󭺥𶃸𨙩򦕃", "񧒎򼎿򉽹𽆿𤍯򞅘", "򥙑󳥜򶕃􉏿", "𮜣񘡘򯚣򈏣󻦻󡹛"…
```
</details>

<details>
<summary><b>stringOf</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#stringof">api</a>]</summary><br/>

*&#8195;Description*

> String containing characters produced by the passed character generator

*&#8195;Signatures*

- `fc.stringOf(charArb)` — _string based on characters generated by `charArb`_
- `fc.stringOf(charArb, maxLength)` — _string based on characters generated by `charArb` containing between `0` (included) and `maxLength` (included) elements generated by `charArb`_
- `fc.stringOf(charArb, minLength, maxLength)` — _string based on characters generated by `charArb` containing between `minLength` (included) and `maxLength` (included) elements generated by `charArb`_

*&#8195;Usages*

```js
fc.stringOf(fc.hexa())
// Examples of generated values: "6c2be", "5ac3", "d2535", "bdbb078e3", "4116130013"…

fc.stringOf(fc.char(), 3)
// Examples of generated values: "", "~*2", "{Z", "[\"", "jlZ"…

fc.stringOf(fc.char(), 4, 6)
// Examples of generated values: "Pv-^", " X#\"U&", "?DM}7", "iEjK.b", "#\"&& "…

fc.stringOf(fc.constantFrom('a', 'b'), 0, 5)
// Examples of generated values: "", "babab", "abbab", "ab", "bbabb"…

fc.stringOf(fc.constantFrom('Hello', 'World'), 1, 3)
// Examples of generated values: "WorldHello", "HelloHello", "WorldWorld", "World", "HelloWorld"…
```
</details>

### More specific strings

<details>
<summary><b>json</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#json">api</a>]</summary><br/>

*&#8195;Description*

> JSON compatible string representations of instances
>
> The generated values can be parsed by `JSON.parse`

*&#8195;Signatures*

- `fc.json()` — _json strings having keys generated using `fc.string()`_
- `fc.json(maxDepth)` — _json strings having keys generated using `fc.string()`, the generated json representation has a maximal depth of `maxDepth`_

_All the string values (from keys to values) are generated using `fc.string()`_

*&#8195;Usages*

```js
fc.json()
// Examples of generated values: "{\"gDS6ixj)R+\":{\"&>4q\":0.6855670565390797,\".4$\":0.32668776759973894,\"[,Dk$XNln-\":0.6499382656006383},\"W<m$%th\":{\"Dcedl|\":true},\"Qk\":-1159147041}", "true", "{\"0J4\":{\"6nY3)\\\"\":\";8Y8nAf'@\",\"D';_'3Lc\":true}}", "[null,null]", "{}"…

fc.json(0)
// Examples of generated values: "-618939220", "null", "-21", "\"'M\"", "-1336128433"…

fc.json(1)
// Examples of generated values: "[null,null]", "null", "[false]", "[]", "\"'M\""…
```
</details>

<details>
<summary><b>unicodeJson</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#unicodejson">api</a>]</summary><br/>

*&#8195;Description*

> JSON compatible string representations of instances
>
> The generated values can be parsed by `JSON.parse`

*&#8195;Signatures*

- `fc.unicodeJson()` — _json strings having keys generated using `fc.unicodeString()`_
- `fc.unicodeJson(maxDepth)` — _json strings having keys generated using `fc.unicodeString()`, the generated json representation has a maximal depth of `maxDepth`_

_All the string values (from keys to values) are generated using `fc.unicodeString()`_

*&#8195;Usages*

```js
fc.unicodeJson()
// Examples of generated values: "[0.09723462893806001]", "{\"荌鏊턳ᦖ\":false,\"냚鶖뜥\":false}", "{\"\":true,\"䷷ꔼꊐ㍂Ꮋ⧭얘\":false,\"镐菋⹥埒䘺懘ྎᶃ硾넍\":false,\"䶩လ뎙丯㷲ퟬ\":true,\"勯吓ᯇป蹥ꕪ渘Ǭ傟\":false}", "{\"\":[],\"ᐞ淙\":[]}", "{\"迵끀꧋좡ꏶ塣퐼띞\":{\"䧎﹥ï\":null},\"ቈ保婠꠨旞荫㹢ފ\":{\"콆쳑Ｈ᜞紽ѳ㑓\":false},\"\":{\"ꉶ瀞뿱끮筡팹᧊\":0.9470328025826398},\"끨\":1001562014}"…

fc.unicodeJson(0)
// Examples of generated values: "3.126712444512236e-8", "null", "\"㚗᭏µƖ簛或㝠ꗳ欛\"", "\"썤\"", "true"…

fc.unicodeJson(1)
// Examples of generated values: "[true]", "{\"ٻ騈ᄸ\":-19}", "\"㚗᭏µƖ簛或㝠ꗳ欛\"", "\"썤\"", "{\"ᨫ㽹\":\"⢓Ｊ紛锆\",\"跺袁嚆⶯잨ꋿǵ蔵\":\"\",\"샘嬩\":\"烻ࡎ⑸嬗䠻\",\"\":\"값֏젴恝츏\",\"遊緃៚\":\"縧뜻箝雁債㠠\"}"…
```
</details>

<details>
<summary><b>lorem</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#lorem">api</a>]</summary><br/>

*&#8195;Description*

> Lorem ipsum values

*&#8195;Signatures*

- `fc.lorem()` — _lorem ipsum sentence containing a few words_
- `fc.lorem(maxWordsCount)` — _lorem ipsum sentence containing at most `maxWordsCount` words_
- `fc.lorem(maxCount, sentenceMode)` — _if `sentenceMode` is `true`: lorem ipsum sentence containing at most `maxCount` sentences, otherwise: same as above_

*&#8195;Usages*

```js
fc.lorem()
// Examples of generated values: "arcu fusce", "dolor mi dignissim", "felis lacus", "ligula nec curae sed enim", "tincidunt vivamus massa"…

fc.lorem(3)
// Examples of generated values: "a sollicitudin", "consequat ligula", "faucibus sapien", "elit vestibulum ut", "enim"…

fc.lorem(3, true)
// Examples of generated values: "Sed, vel placerat et nibh.", "Nisl quis congue pellentesque sapien non.", "Curae, ligula eros erat et ut euismod sit suscipit consequat. Molestie, ac cras vel posuere et.", "Risus vitae, integer quis nulla pellentesque quis sed. Pellentesque sed ante mi, iaculis, aliquam ultrices adipiscing nulla aliquam. Cursus ac molestie, erat augue ullamcorper.", "Aliquam augue at nulla. Non faucibus, cursus molestie, posuere justo. Sapien."…
```
</details>

<details>
<summary><b>ipV4</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#ipv4">api</a>]</summary><br/>

*&#8195;Description*

> IP v4 addresses

*&#8195;Signatures*

- `fc.ipV4()` — _ip v4 addresses_

*&#8195;Usages*

```js
fc.ipV4()
// Examples of generated values: "1.139.105.40", "7.44.183.1", "1.1.233.2", "98.4.248.163", "221.4.1.128"…
```
</details>

<details>
<summary><b>ipV4Extended</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#ipv4extended">api</a>]</summary><br/>

*&#8195;Description*

> IP v4 addresses including all the formats supported by WhatWG standard (for instance: 0x6f.9)

*&#8195;Signatures*

- `fc.ipV4Extended()` — _any valid ip v4 address_

*&#8195;Usages*

```js
fc.ipV4Extended()
// Examples of generated values: "160.07.64820", "4.075321635", "0x92df1683", "0x85b09ec1", "0x45.0103.03236"…
```
</details>

<details>
<summary><b>ipV6</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#ipv6">api</a>]</summary><br/>

*&#8195;Description*

> IP v6 addresses

*&#8195;Signatures*

- `fc.ipV6()` — _ip v6 addresses_

*&#8195;Usages*

```js
fc.ipV6()
// Examples of generated values: "5998:7144:3dc:ff:b:5ae5:3::", "::13a:2:0ad0:26.160.6.6", "59::9:150.144.165.3", "d::fa8f", "::0:afb:072:2e:6.4.7.3"…
```
</details>

<details>
<summary><b>uuid</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#uuid">api</a>]</summary><br/>

*&#8195;Description*

> UUID values including versions 1 to 5

*&#8195;Signatures*

- `fc.uuid()` — uuid strings having only digits in 0-9a-f (only versions in v1 to v5)_

*&#8195;Usages*

```js
fc.uuid()
// Examples of generated values: "00000011-4f8b-453e-9cff-3169385e0b28", "0000000f-71a5-4c31-9641-b23cddac94de", "00000009-0010-1000-9066-e2e900000012", "8d6aee62-001d-1000-9e74-70f85c4a78a3", "c2156fdd-0005-1000-8000-000f885e6180"…
```
</details>

<details>
<summary><b>uuidV</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#uuidv">api</a>]</summary><br/>

*&#8195;Description*

> UUID values for a specific UUID version (only 1 to 5) only digits in 0-9a-f

*&#8195;Signatures*

- `fc.uuidV(version)` — uuid strings for a specific uuid version only digits in 0-9a-f_

*&#8195;Usages*

```js
fc.uuidV(3)
// Examples of generated values: "05cfea14-bcac-3b1b-8d87-f0d200000012", "7f4a63cc-0015-3000-8000-001a00000016", "b18820b3-04b5-347a-a800-88270000001d", "e6dfee9b-0008-3000-acfc-19f200000010", "4339edf8-0002-3000-8000-001b00000008"…

fc.uuidV(5)
// Examples of generated values: "d9951cc0-0008-5000-bf71-d40b793c6139", "b4f42187-7bd2-5385-8000-0006a6b393bf", "c2faeae2-2bd2-51a4-81e8-3f5800000018", "65c2d0a5-0016-5000-8000-001828816d24", "00000019-000c-5000-8000-000a0000000e"…
```
</details>

<details>
<summary><b>domain</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#domain">api</a>]</summary><br/>

*&#8195;Description*

> Domain name values with extension
>
> Following RFC 1034, RFC 1123 and WHATWG URL Standard

*&#8195;Signatures*

- `fc.domain()` — _domain name with extension_

*&#8195;Usages*

```js
fc.domain()
// Examples of generated values: "j6ib52zarmf.gkuvhqma.cibz", "00.6.4xla.x.bdl2y5gq52n1.bsgbwec", "35b10n-w.7xe2.tuwxcou2vgh.9o0ba-3.8s-s2r9dzo.dkci", "0.h6a4sfyde.ju", "c.mrjkuy.2blh-hr4bk6.fb8x8d26e.610--87.dvbcaea"…
```
</details>

<details>
<summary><b>webAuthority</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#webauthority">api</a>]</summary><br/>

*&#8195;Description*

> Web authority values
>
> Following RFC 3986

*&#8195;Signatures*

- `fc.webAuthority()` — _web authority_
- `fc.webAuthority(constraints)` — _web authority with respect to [constraints](https://dubzzz.github.io/fast-check/interfaces/webauthorityconstraints.html)_
  - `withIPv4?` — _enable ip v4
  - `withIPv4Extended?` — _enable ip v4 extended_
  - `withIPv6?` — _enable ip v6_
  - `withPort?` — _enable port_


*&#8195;Usages*

```js
fc.webAuthority()
// Examples of generated values: "qj5h7-5.d6je1ud1x.g2c82ru5.qlz95.u.piitavbikc", "5w6.mndtkwo", "qtbebs9.csil1.lrzgr91b2xyc.aewt", "vyd-xdhj.sndnyy", "fbcaacieagc1.adteb"…

fc.webAuthority({
  withIPv4: true,
})
// Examples of generated values: "227.3.0.132", "5.4.1.143", "nlefeaoklaqf.rndn.ugst", "168w.f7f305rk1gf.rbgpdpka.bceedtva", "2.4.203.2"…

fc.webAuthority({
  withIPv4Extended: true,
})
// Examples of generated values: "f.msle.rb.ib.qef.rjvoe", "0x11", "0xefebe5f3", "f44.avqz0ws13jl.jqe", "0345.013"…

fc.webAuthority({
  withIPv4: true,
  withIPv4Extended: true,
  withIPv6: true,
  withPort: true,
})
// Examples of generated values: "0352.0x89bbdd:10", "154.0372.0xbd3d", "[4522:29:b:fc75:83e:964c:108::]:12037", "4.1.7.113:2", "022:43923"…
```
</details>

<details>
<summary><b>webFragments</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#webfragments">api</a>]</summary><br/>

*&#8195;Description*

> Fragments to build an URI
>
> Fragment is the optional part right after the # in an URI

*&#8195;Signatures*

- `fc.webFragments()` — _fragments part of an url_

*&#8195;Usages*

```js
fc.webFragments()
// Examples of generated values: "hip", "we", "K/z=)RtC", "E7y", "%F0%B5%81%85:w,+"…
```
</details>

<details>
<summary><b>webQueryParameters</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#webqueryparameters">api</a>]</summary><br/>

*&#8195;Description*

> Query parameters to build an URI
>
> Query parameters part is the optional part right after the ? in an URI

*&#8195;Signatures*

- `fc.webQueryParameters()` — query parameters part of an url_

*&#8195;Usages*

```js
fc.webQueryParameters()
// Examples of generated values: "52mi", "L3ns-", "X%F3%AB%BA%8AksM", "bSO", "@"…
```
</details>

<details>
<summary><b>webSegment</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#websegment">api</a>]</summary><br/>

*&#8195;Description*

> Web URL path segment

*&#8195;Signatures*

- `fc.webSegment()` — _web url path segment_

*&#8195;Usages*

```js
fc.webSegment()
// Examples of generated values: "bde", "097", "6", "BgyH", "vn0qof"…
```
</details>

<details>
<summary><b>webUrl</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#weburl">api</a>]</summary><br/>

*&#8195;Description*

> Web URL values
>
> Following the specs specified by RFC 3986 and WHATWG URL Standard

*&#8195;Signatures*

- `fc.webUrl()` — _web url_
- `fc.webUrl(constraints)` — _web url with respect to constraints_
  - `authoritySettings?` — _[constraints](https://dubzzz.github.io/fast-check/interfaces/webauthorityconstraints.html) on the web authority_
  - `validSchemes?` — _list all the valid schemes_
  - `withFragments?` — _enable fragments_
  - `withQueryParameters?` — _enable query parameters_

*&#8195;Usages*

```js
fc.webUrl()
// Examples of generated values: "https://lo.6armf.gkuvhqma.gscq9ta1kv.bvyajotc/C*./c&P-Q/zS/M;39$M/@'%F4%8C%96%B9/g%F0%BC%AF%9A/:a/f/b/zi", "https://c.cmcydtgdb.zrcdbsgbwe/x:ta/l5/5%F1%91%B4%8D9:69/AP93z/FphDuS", "https://710n-lu1.s.zlx/W5-%F1%A6%97%93$J&Tq/Kf/", "https://a.cd67h8o-fyeb.ouwkdxcj/Y", "https://6uzbj4.apov/fI"…

fc.webUrl({
  validSchemes: ['ftp', 'ftps'],
})
// Examples of generated values: "ftps://lamsf.hn//5Hi_/3e%F2%B0%9E%A7ot/C9by:U)xN1/z/CHeC(/7p;l3A*91", "ftps://5ana.lwregue/BKax$K//Cl!G", "ftp://f.behru/c/xj3!B/g~@!/YT/cfaf8)MbS/5,XZ:/y!yCu%F3%B0%89%9E=2fi/dP", "ftp://affdcn.ny/u;", "ftps://4.c.afml28i37v2d.eae.fy/%F2%89%A9%BBaPV"…

fc.webUrl({
  withFragments: true,
  withQueryParameters: true,
})
// Examples of generated values: "https://6teotdbx.6lcdvqgg.d.edanbedda/.%F0%95%9B%89/41AT%F2%80%91%ABOkWP/F/%F0%9D%BF%9CD/Ce/@kzV*Ia,m/*AV/,#fgd", "http://ntgafkj31t.8x7x09flrvhg.yd/??$$x#V", "http://efd2.mz3bzcn6p.daixrpqcar/A:P/7YBMHk!//@%F1%BF%A9%A1/A5w&ZuAW/:*qGARQfS'/?lio#bWge", "http://8.jm2rvkobzaj.oip8f7-csuv.101ehoo.p.kezdnesoa/PLo:v3F/o1/Y4/s/w4Fl/zO%F0%A8%98%88G:E//.,Ogqf-#", "https://qc.ieele4.fcgpswt/JR652%F3%97%8C%85XKm/?%E4%9E%B7.6'#c+%F0%A9%B2%86Ncecda"…
```
</details>

<details>
<summary><b>emailAddress</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#emailaddress">api</a>]</summary><br/>

*&#8195;Description*

> Email adresses
>
> Following RFC 1123 and RFC 5322

*&#8195;Signatures*

- `fc.emailAddress()` — _email address_

*&#8195;Usages*

```js
fc.emailAddress()
// Examples of generated values: "e0f7||'5tq.h61k.opz+r*%^'k.w.cdddsv{'*@ynw1ie.a3umtugkf3m.xdpc", "8bf|!d@isws.dy83e6ipnqg.gui5s89wncuc.hbilc193lx8.stpjif", "|bi9r}1|.l.^biw8i39.~doz=|dlr@6rzgr91b2xyu.o.4fxspqtml.i5s1.re", "/22{9=.p&2.e#w-b%-'.%itdenn@fd-v5if.cw-3ib.83ea.ba", "z*3y`3kt.b}4~6|&&xe.g.dfz=pp/@8bescqosn.hb.ddbve"…
```
</details>

<details>
<summary><b>mixedCase</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#mixedcase">api</a>]</summary><br/>

*&#8195;Description*

> Switch the case of characters generated by an underlying arbitrary

*&#8195;Signatures*

- `fc.mixedCase(stringArb)` — _randomly switch the case of characters generated by `stringArb`_
- `fc.mixedCase(stringArb, constraints)` — _randomly switch the case of characters generated by `stringArb` with respect to [`constraints`](https://dubzzz.github.io/fast-check/interfaces/mixedcaseconstraints.html)_
  - `toggleCase?` — _custom to upper case function_

*&#8195;Usages*

```js
fc.mixedCase(fc.hexaString())
// Examples of generated values: "c7BC", "D7e0", "e7", "", "5bE4CC29"…

fc.mixedCase(fc.constant('hello world'))
// Examples of generated values: "HeLlO woRLD", "HElLO wORlD", "hELlO woRld", "hELLo worLd", "hELlo WORLd"…

fc.mixedCase(
  fc.constant('hello world'),
  {
    toggleCase: (rawChar) => `UP(${rawChar})`,
  }
)
// Examples of generated values: "UP(h)ellUP(o)UP( )UP(w)oUP(r)ld", "hUP(e)lloUP( )UP(w)orld", "helUP(l)UP(o)UP( )UP(w)orlUP(d)", "UP(h)UP(e)UP(l)lUP(o)UP( )wUP(o)rld", "heUP(l)UP(l)o wUP(o)rUP(l)d"…

fc.mixedCase(
  fc.constant('🐱🐢🐱🐢🐱🐢'),
  {
    toggleCase: (rawChar) => rawChar === '🐱' ? '🐯' : '🐇',
  }
)
// Examples of generated values: "🐱🐇🐱🐇🐱🐇", "🐱🐇🐯🐇🐯🐇", "🐱🐇🐯🐇🐱🐇", "🐱🐇🐯🐇🐯🐢", "🐯🐇🐯🐇🐯🐢"…
```
</details>

## Date

<details>
<summary><b>date</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#date">api</a>]</summary><br/>

*&#8195;Description*

> Date values

*&#8195;Signatures*

- `fc.date()` — _any date between `new Date(-8640000000000000)` (included) to `new Date(8640000000000000)` (included)_
- `fc.date({ min?, max? })` — _any date between `min` (included) to `max` (included)_

*&#8195;Usages*

```js
fc.date()
// Examples of generated values: new Date("1970-01-01T00:00:00.045Z"), new Date("1969-12-31T23:59:59.993Z"), new Date("1970-01-01T00:00:00.049Z"), new Date("+117925-10-22T07:46:48.448Z"), new Date("-091601-12-20T20:39:50.528Z")…

fc.date({ min: new Date("2000-01-01T00:00:00.000Z") })
// Examples of generated values: new Date("2000-01-01T00:00:00.008Z"), new Date("2000-01-01T00:00:00.012Z"), new Date("+251903-01-29T20:31:55.392Z"), new Date("2000-01-01T00:00:00.034Z"), new Date("+258960-08-17T11:48:52.864Z")…

fc.date({ max: new Date("2000-01-01T00:00:00.000Z") })
// Examples of generated values: new Date("1969-12-31T23:59:59.965Z"), new Date("1969-12-31T23:59:59.987Z"), new Date("-061397-05-15T20:31:55.392Z"), new Date("1969-12-31T23:59:59.962Z"), new Date("-135518-12-15T11:48:52.864Z")…

fc.date({ min: new Date("2000-01-01T00:00:00.000Z"), max: new Date("2000-12-31T23:59:59.999Z") })
// Examples of generated values: new Date("2000-01-12T09:27:02.400Z"), new Date("2000-01-01T00:00:00.001Z"), new Date("2000-08-24T06:59:48.352Z"), new Date("2000-01-01T00:00:00.019Z"), new Date("2000-05-27T01:31:48.096Z")…
```
</details>

## Falsy

<details>
<summary><b>falsy</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#falsy">api</a>]</summary><br/>

*&#8195;Description*

> Falsy values

*&#8195;Signatures*

- `fc.falsy()` — _one of `false`, `null`, `undefined`, `0`, `''`, or `Number.NaN`_
- `fc.date({ withBigInt? })` — _one of `false`, `null`, `undefined`, `0`, `''`, or `Number.NaN` and `0n` if `withBitInt` has been set to `true`_

*&#8195;Usages*

```js
fc.falsy()
// Examples of generated values: null, false, 0, Number.NaN, ""…

fc.falsy({ withBigInt: true })
// Examples of generated values: 0, false, Number.NaN, undefined, ""…
```
</details>

## Combinators (:T)

- `fc.constant<T>(value: T): Arbitrary<T>` constant arbitrary only able to produce `value: T`
- `fc.constantFrom<T>(...values: T[]): Arbitrary<T>` randomly chooses among the values provided. It considers the first value as the default value so that in case of failure it will shrink to it. It expects a minimum of one value and throws whether it receives no value as parameters. It can easily be used on arrays with `fc.constantFrom(...myArray)` (or `fc.constantFrom.apply(null, myArray)` for older versions of TypeScript/JavaScript)
- `fc.clonedConstant<T>(value: T): Arbitrary<T>` constant arbitrary only able to produce `value: T`. If it exists, it called its `[fc.cloneMethod]` at each call to generate
- `fc.mapToConstant<T>(...entries: { num: number; build: (idInGroup: number) => T }[]): Arbitrary<T>` generates non-contiguous ranges of values by mapping integer values to constant
- `fc.oneof<T>(...arbs: Arbitrary<T>[]): Arbitrary<T>` randomly chooses an arbitrary at each new generation. Should be provided with at least one arbitrary. All arbitraries are equally probable and shrink is still working for the selected arbitrary. `fc.oneof` is able to shrink inside the failing arbitrary but not accross arbitraries (contrary to `fc.constantFrom` when dealing with constant arbitraries)
- `fc.frequency<T>(...warbs: WeightedArbitrary<T>[]): Arbitrary<T>` randomly chooses an arbitrary at each new generation. Should be provided with at least one arbitrary. Probability to select a specific arbitrary is based on its weight, the higher it is the more it will be probable. It preserves the shrinking capabilities of the underlying arbitrary
- `fc.option<T>(arb: Arbitrary<T>): Arbitrary<T | null>` or `fc.option<T>(arb: Arbitrary<T>, freq: number): Arbitrary<T | null>` arbitrary able to nullify its generated value. When provided a custom `freq` value it changes the frequency of `null` values so that they occur one time over `freq` tries (eg.: `freq=5` means that 20% of generated values will be `null` and 80% would be produced through `arb`). By default: `freq=5`
- `fc.subarray<T>(originalArray: T[]): Arbitrary<T[]>`, or `fc.subarray<T>(originalArray: T[], minLength: number, maxLength: number): Arbitrary<T[]>` subarray of `originalArray`. Values inside the subarray are ordered the same way they are in `originalArray`. By setting the parameters `minLength` and/or `maxLength`, the user can change the minimal (resp. maximal) size allowed for the generated subarray. By default: `minLength=0` and `maxLength=originalArray.length`
- `fc.shuffledSubarray<T>(originalArray: T[]): Arbitrary<T[]>`, or `fc.shuffledSubarray<T>(originalArray: T[], minLength: number, maxLength: number): Arbitrary<T[]>` subarray of `originalArray`. Values within the subarray are ordered randomly. By setting the parameters `minLength` and `maxLength`, the user can change the minimal and maximal size allowed for the generated subarray. By default: `minLength=0` and `maxLength=originalArray.length`
- `fc.array<T>(arb: Arbitrary<T>): Arbitrary<T[]>`, `fc.array<T>(arb: Arbitrary<T>, maxLength: number): Arbitrary<T[]>` or `fc.array<T>(arb: Arbitrary<T>, minLength: number, maxLength: number): Arbitrary<T[]>` array of random length containing values generated by `arb`. By setting the parameters `minLength` and `maxLength`, the user can change the minimal and maximal size allowed for the generated array. By default: `minLength=0` and `maxLength=10`
- `fc.set<T>(arb: Arbitrary<T>): Arbitrary<T[]>`, `fc.set<T>(arb: Arbitrary<T>, maxLength: number): Arbitrary<T[]>` or `fc.set<T>(arb: Arbitrary<T>, minLength: number, maxLength: number): Arbitrary<T[]>` set of random length containing unique values generated by `arb`. All the values in the set are unique given the default `comparator = (a: T, b: T) => a === b` which can be overriden by giving another comparator function as the last argument on previous signatures
- `fc.tuple<T1,T2,...>(arb1: Arbitrary<T1>, arb2: Arbitrary<T2>, ...): Arbitrary<[T1,T2,...]>` tuple generated by aggregating the values of `arbX` like `generate: () => [arb1.generate(), arb2.generate(), ...]`. This arbitrary perfectly handle shrinks and is able to shink on all the generators
- `fc.dictionary<T>(keyArb: Arbitrary<string>, valueArb: Arbitrary<T>): Arbitrary<{[Key:string]:T}>` dictionary containing keys generated using `keyArb` and values generated by `valueArb`
- `fc.record<T>(recordModel: {[Key:string]: Arbitrary<T>}): Arbitrary<{[Key:string]: T}>` or `fc.record<T>(recordModel: {[Key:string]: Arbitrary<T>}, constraints: RecordConstraints): Arbitrary<{[Key:string]: T}>` record using the incoming arbitraries to generate its values. It comes very useful when dealing with settings. It takes an optional parameter of type `RecordConstraints` to configure some of its properties. The setting `withDeletedKeys=true` instructs the record generator that it can omit some keys
- `fc.infiniteStream<T>(arb: Arbitrary<T>): Arbitrary<Stream<T>>` infinite `Stream` of values generated by `arb`. The `Stream` structure provided by fast-check implements `IterableIterator<T>` and comes with useful helpers to manipulate it
- `fc.dedup<T>(arb: Arbitrary<T>, numValues: number)` tuple containing `numValues` instances of the same value produced by `arb` - values are independent from each others

## Objects (:any)

The framework is able to generate totally random objects in order to adapt to programs that do not requires any specific data structure. All those custom types can be parametrized using `ObjectConstraints.Settings`.

```typescript
export module ObjectConstraints {
    export interface Settings {
        maxDepth?: number;          // maximal depth allowed for this object
        maxKeys?: number;           // maximal number of keys (and values)
        key?: Arbitrary<string>;    // arbitrary for key
        values?: Arbitrary<any>[];  // arbitrary responsible for base value
        withBoxedValues?: boolean;  // adapt all entries within `values` to generate boxed version of the value too
        withMap?: boolean;          // also generate Map
        withSet?: boolean;          // also generate Set
        withObjectString?: boolean; // also generate string representations of object instances
        withNullPrototype?: boolean;// also generate string representations of object instances
        withBigInt?: boolean;       // also generate BigInt
    };
};
```

Default for `key` is: `fc.string()`.

Default for `values` are: `fc.boolean()`, `fc.integer()`, `fc.double()`, `fc.string()` and constants among `null`, `undefined`, `Number.NaN`, `+0`, `-0`, `Number.EPSILON`, `Number.MIN_VALUE`, `Number.MAX_VALUE` , `Number.MIN_SAFE_INTEGER`, `Number.MAX_SAFE_INTEGER`, `Number.POSITIVE_INFINITY` or `Number.NEGATIVE_INFINITY`.

- `fc.anything()` or `fc.anything(settings: ObjectConstraints.Settings)` generate a possible values coming from Settings and all objects or arrays derived from those same settings
- `fc.object()` or `fc.object(settings: ObjectConstraints.Settings)` generate an object
- `fc.jsonObject()` or `fc.jsonObject(maxDepth: number)` generate an object that is eligible to be stringified and parsed back to itself (object compatible with json stringify)
- `fc.unicodeJsonObject()` or `fc.unicodeJsonObject(maxDepth: number)` generate an object with potentially unicode characters that is eligible to be stringified and parsed back to itself (object compatible with json stringify)

## Recursive structures

- `fc.letrec(builder: (tie) => { [arbitraryName: string]: Arbitrary<T> })` produce arbitraries as specified by builder function. The `tie` function given to builder should be used as a placeholder to handle the recursion. It takes as input the name of the arbitrary to use in the recursion

```typescript
const { tree } = fc.letrec(tie => ({
  // tree is 1 / 3 of node, 2 / 3 of leaf
  // Warning: as there is no control over the depth of the data-structures generated
  //   by letrec, high probability of node can lead to very deep trees
  //   thus we limit the probability of a node to p = 1 / 3 in this example
  // with p = 0.50 the probability to have a tree of depth above 10 is 13.9 %
  // with p = 0.33 the probability to have a tree of depth above 10 is  0.6 %
  tree: fc.oneof(tie('node'), tie('leaf'), tie('leaf')),
  node: fc.tuple(tie('tree'), tie('tree')),
  leaf: fc.nat()
}));
tree() // Is a tree arbitrary (as fc.nat() is an integer arbitrary)
```

- `fc.memo<T>(builder: (n: number) => Arbitrary<T>): ((n?: number) => Arbitrary<T>)` produce arbitraries as specified by builder function. Contrary to `fc.letrec`, `fc.memo` can control the maximal depth of your recursive structure by relying on the `n` parameter given as input of the `builder` function

```typescript
const tree: fc.Memo<Tree> = fc.memo(n => fc.oneof(node(n), leaf()));
const node: fc.Memo<Tree> = fc.memo(n => {
  if (n <= 1) return fc.record({ left: leaf(), right: leaf() });
  return fc.record({ left: tree(), right: tree() }); // tree() is equivalent to tree(n-1)
});
const leaf = fc.nat;
tree() // Is a tree arbitrary (as fc.nat() is an integer arbitrary)
       // with maximal depth of 10 (equivalent to tree(10))
```

## Functions

- `compareBooleanFunc()` generate a comparison function taking two parameters `a` and `b` and producing a boolean value. `true` means that `a < b`, `false` that `a = b` or `a > b`
- `compareFunc()` generate a comparison function taking two parameters `a` and `b` and producing an integer value. Output is zero when `a` and `b` are considered to be equivalent. Output is strictly inferior to zero means that `a` should be considered strictly inferior to `b` (similar for strictly superior to zero)
- `func(arb: Arbitrary<TOut>)` generate a function of type `(...args: TArgs) => TOut` outputing values generated using `arb`

## Extended tools

- `context()` generate a `Context` instance for each predicate run. `Context` can be used to log stuff within the run itself. In case of failure, the logs will be attached in the counterexample and visible in the stack trace

## Model based testing

Model based testing approach extends the power of property based testing to state machines - *eg.: UI, data-structures*.

See section [Model based testing or UI test](./Tips.md#model-based-testing-or-ui-test) in Tips for an in depth explanation.

### Commands

The approach relies on commands. Commands can be seen as operations a user can run on the system. Those commands have:
- pre-condition - *implemented by `check`* - confirming whether or not the command can be executed given the current context
- execution - *implemented by `run`* - responsible to update a simplified context while updating and checking the real system

Commands can either be synchronous - `fc.Command<Model, Real>` - or asynchronous - `fc.AsyncCommand<Model, Real>` or  `fc.AsyncCommand<Model, Real, true>`.

```typescript
// Real : system under test
// Model: simplified state for the system
export interface Command<Model extends object, Real> {
  // Check if the model is in the right state to apply the command
  // WARNING: does not change the model
  check(m: Readonly<Model>): boolean;

  // Execute on r and perform the checks - Throw in case of invalid state
  // Update the model - m - accordingly
  run(m: Model, r: Real): void;

  // Name of the command
  toString(): string;
}

export interface AsyncCommand<Model extends object, Real> {
  check(m: Readonly<Model>): boolean;
  run(m: Model, r: Real): Promise<void>;
  toString(): string;
}

export interface AsyncCommand<Model extends object, Real, true> {
  check(m: Readonly<Model>): Promise<boolean>;
  run(m: Model, r: Real): Promise<void>;
  toString(): string;
}
```

### Arbitrary

While `fc.array` or any other array arbitrary could be used to generate such data, it is highly recommended to rely on `fc.commands` to generate arrays of commands. Its shrinker would be more adapted for such cases.

Possible signatures:
- `fc.commands<Model, Real>(commandArbs: Arbitrary<Command<Model, Real>>[], maxCommands?: number)` arrays of `Command` that can be ingested by `fc.modelRun`
- `fc.commands<Model, Real>(commandArbs: Arbitrary<Command<Model, Real>>[], settings: CommandsSettings)` arrays of `Command` that can be ingested by `fc.modelRun`
- `fc.commands<Model, Real>(commandArbs: Arbitrary<AsyncCommand<Model, Real>>[], maxCommands?: number)` arrays of `AsyncCommand` that can be ingested by `fc.asyncModelRun`
- `fc.commands<Model, Real>(commandArbs: Arbitrary<AsyncCommand<Model, Real>>[], settings: CommandsSettings)` arrays of `AsyncCommand` that can be ingested by `fc.asyncModelRun`

Possible settings:
```typescript
interface CommandsSettings {
  maxCommands?: number;       // optional, maximal number of commands to generate per run: 10 by default
  disableReplayLog?: boolean; // optional, do not show replayPath in the output: false by default
  replayPath?: string;        // optional, hint for replay purposes only: '' by default
                              // should be used in conjonction with {seed, path} of fc.assert
}
```

### Model runner

In order to execute the commands properly a call to either `fc.modelRun`, `fc.asyncModelRun` or `fc.scheduledModelRun` as to be done within classical runners - *ie. `fc.assert` or `fc.check`*.

### Simplified structure

```typescript
type Model = { /* stuff */ };
type Real  = { /* stuff */ };

class CommandA extends Command { /* stuff */ };
class CommandB extends Command { /* stuff */ };
// other commands

const CommandsArbitrary = fc.commands([
  fc.constant(new CommandA()),        // no custom parameters
  fc.nat().map(s => new CommandB(s)), // with custom parameter
  // other commands
]);

fc.assert(
  fc.property(
    CommandsArbitrary,
    cmds => {
      const s = () => ({ // initial state builder
          model: /* new model */,
          real:  /* new system instance */
      });
      fc.modelRun(s, cmds);
    }
  )
);
```

## Race conditions detection

In order to ease the detection of race conditions in your code, `fast-check` comes with a built-in asynchronous scheduler.
The aim of the scheduler - `fc.scheduler()` - is to reorder the order in which your async calls will resolve.

By doing this it can highlight potential race conditions in your code. Please refer to [code snippets](https://codesandbox.io/s/github/dubzzz/fast-check/tree/master/example?hidenavigation=1&module=%2F005-race%2Fautocomplete%2Fmain.spec.tsx&previewwindow=tests) for more details.

`fc.scheduler<TMetadata=unknown>()` is just an `Arbitrary` providing a `Scheduler` instance. The generated scheduler has the following interface:
- `schedule: <T>(task: Promise<T>, label?: string, metadata?: TMetadata) => Promise<T>` - Wrap an existing promise using the scheduler. The newly created promise will resolve when the scheduler decides to resolve it (see `waitOne` and `waitAll` methods).
- `scheduleFunction: <TArgs extends any[], T>(asyncFunction: (...args: TArgs) => Promise<T>) => (...args: TArgs) => Promise<T>` - Wrap all the promise produced by an API using the scheduler. `scheduleFunction(callApi)`
- `scheduleSequence(sequenceBuilders: SchedulerSequenceItem<TMetadata>[]): { done: boolean; faulty: boolean, task: Promise<{ done: boolean; faulty: boolean }> }` - Schedule a sequence of operations. Each operation requires the previous one to be resolved before being started. Each of the operations will be executed until its end before starting any other scheduled operation.
- `count(): number` - Number of pending tasks waiting to be scheduled by the scheduler.
- `waitOne: () => Promise<void>` - Wait one scheduled task to be executed. Throws if there is no more pending tasks.
- `waitAll: () => Promise<void>` - Wait all scheduled tasks, including the ones that might be created by one of the resolved task. Do not use if `waitAll` call has to be wrapped into an helper function such as `act` that can relaunch new tasks afterwards. In this specific case use a `while` loop running while `count() !== 0` and calling `waitOne` - *see CodeSandbox example on userProfile*.
- `report: () => SchedulerReportItem<TMetaData>[]` - Produce an array containing all the scheduled tasks so far with their execution status. If the task has been executed, it includes a string representation of the associated output or error produced by the task if any. Tasks will be returned in the order they get executed by the scheduler.

With:
```ts
type SchedulerSequenceItem<TMetadata> =
    { builder: () => Promise<any>; label: string; metadata?: TMetadata } |
    (() => Promise<any>)
;
```

You can also define an hardcoded scheduler by using `fc.schedulerFor(ordering: number[])` - _should be passed through `fc.constant` if you want to use it as an arbitrary_. For instance: `fc.schedulerFor([1,3,2])` means that the first scheduled promise will resolve first, the third one second and at the end we will resolve the second one that have been scheduled.

### Scheduling methods

#### `schedule`

Create a scheduled `Promise` based on an existing one - _aka. wrapped `Promise`_.
The life-cycle of the wrapped `Promise` will not be altered at all.
On its side the scheduled `Promise` will only resolve when the scheduler decides it to be resolved.

Once scheduled by the scheduler, the scheduler will wait the wrapped `Promise` to resolve - _if it was not already the case_ - before sheduling anything else.

**Signature:**

```ts
schedule: <T>(task: Promise<T>) => Promise<T>
schedule: <T>(task: Promise<T, label: string>) => Promise<T>
```

**Usages:**

Any algorithm taking raw `Promise` as input might be tested using this scheduler.

For instance, `Promise.all` and `Promise.race` are examples of such algorithms.

**More:**

```ts
// Let suppose:
// - s        : Scheduler
// - shortTask: Promise   - Very quick operation
// - longTask : Promise   - Relatively long operation

shortTask.then(() => {
  // not impacted by the scheduler
  // as it is directly using the original promise
})

const scheduledShortTask = s.schedule(shortTask)
const scheduledLongTask = s.schedule(longTask)

// Even if in practice, shortTask is quicker than longTask
// If the scheduler selected longTask to end first,
// it will wait longTask to end, then once ended it will resolve scheduledLongTask,
// while scheduledShortTask will still be pending until scheduled.
await s.waitOne()
```

#### `scheduleFunction`

Create a producer of scheduled `Promise`.

Lots of our asynchronous codes make use of functions able to generate `Promise` based on inputs.
Fetching from a REST API using `fetch("http://domain/")` or accessing data from a database `db.query("SELECT * FROM table")` are examples of such producers.

`scheduleFunction` makes it possible to re-order when those outputed `Promise` resolve by providing a function that under the hood **directly** calls the producer but schedules its resolution so that it has to be scheduled by the scheduler.

**Signature:**

```ts
scheduleFunction: <TArgs extends any[], T>(asyncFunction: (...args: TArgs) => Promise<T>) => (...args: TArgs) => Promise<T>
```

**Usages:**

Any algorithm making calls to asynchronous APIs can highly benefit from this wrapper to re-order calls.

WARNING: `scheduleFunction` is only postponing the resolution of the function. The call to the function itself is started immediately when the caller calls something on the scheduled function.

**More:**

```ts
// Let suppose:
// - s             : Scheduler
// - getUserDetails: (uid: string) => Promise - API call to get details for a User


const getUserDetailsScheduled = s.scheduleFunction(getUserDetails)

getUserDetailsScheduled('user-001')
// What happened under the hood?
// - A call to getUserDetails('user-001') has been triggered
// - The promise returned by the call to getUserDetails('user-001') has been registered to the scheduler
  .then((dataUser001) => {
    // This block will only be executed when the scheduler
    // will schedule this Promise
  })

// Unlock one of the scheduled Promise registered on s
// Not necessarily the first one that resolves
await s.waitOne()
```

#### `scheduleSequence`

A scheduled sequence can be seen as a sequence a asynchronous calls we want to run in a precise order.

One important fact about scheduled sequence is that whenever one task of the sequence gets scheduled, **no other scheduled task in the scheduler can be unqueued** while this task has not ended. It means that tasks defined within a scheduled sequence must not require other scheduled task to end to fulfill themselves - _it does not mean that they should not force the scheduling of other scheduled tasks_.

**Signature:**

```ts
type SchedulerSequenceItem =
    { builder: () => Promise<any>; label: string } |
    (() => Promise<any>)
;

scheduleSequence(sequenceBuilders: SchedulerSequenceItem[]): { done: boolean; faulty: boolean, task: Promise<{ done: boolean; faulty: boolean }> }
```

**Usages:**

You want to check the status of a database, a webpage after many known operations.

Most of the time, model based testing might be a better fit for that purpose.

**More:**

```jsx
// Let suppose:
// - s: Scheduler

const initialUserId = '001';
const otherUserId1 = '002';
const otherUserId2 = '003';

// render profile for user {initialUserId}
// Note: api calls to get back details for one user are also scheduled
const { rerender } = render(
  <UserProfilePage userId={initialUserId} />
)

s.scheduleSequence([
  async () => rerender(<UserProfilePage userId={otherUserId1} />),
  async () => rerender(<UserProfilePage userId={otherUserId2} />),
])

await s.waitAll()
// expect to see profile for user otherUserId2
```

#### Missing helpers

**Scheduling a function call**

In some tests, we want to try cases where we launch multiple concurrent queries towards our service in order to see how it behaves in the context of concurrent operations.

```ts
const scheduleCall = <T>(s: Scheduler, f: () => Promise<T>) => {
  s.schedule(Promise.resolve("Start the call"))
    .then(() => f());
}

// Calling doStuff will be part of the task scheduled in s
scheduleCall(s, () => doStuff())
```

**Scheduling a call to a mocked server**

Contrary the behaviour of `scheduleFunction`, real calls to servers are not immediate and you might want to also schedule when the call _reaches_ your mocked-server.

Let's imagine you are building a TODO-list app. Your users can add a TODO only if no other TODO has the same label. If you use the built-in `scheduleFunction` to test it, the mocked-server will always receive the calls in the same order as the one they were done.

```ts
const scheduleMockedServerFunction = <TArgs extends unknown[], TOut>(s: Scheduler, f: (...args: TArgs) => Promise<TOut>) => {
  return (...args: TArgs) => {
    return s.schedule(Promise.resolve("Server received the call"))
      .then(() => f(...args));
  }
}

const newAddTodo = scheduleMockedServerFunction(s, (label) => mockedApi.addTodo(label))
// With newAddTodo = s.scheduleFunction((label) => mockedApi.addTodo(label))
// The mockedApi would have received todo-1 first, followed by todo-2
// When each of those calls resolve would have been the responsability of s
// In the contrary, with scheduleMockedServerFunction, the mockedApi might receive todo-2 first.
newAddTodo('todo-1') // .then
newAddTodo('todo-2') // .then

// or...

const scheduleMockedServerFunction = <TArgs extends unknown[], TOut>(s: Scheduler, f: (...args: TArgs) => Promise<TOut>) => {
  const scheduledF = s.scheduleFunction(f);
  return (...args: TArgs) => {
    return s.schedule(Promise.resolve("Server received the call"))
      .then(() => scheduledF(...args));
  }
}
```

**Scheduling timers like setTimeout or setInterval**

Sometimes our asynchronous code rely on the use of native timers offered by the JavaScript engine like: `setTimeout` or `setInterval`.
Contrary to other asynchronous operations, timers are ordered. A timer waiting 10ms will be executed before a timer waiting 100ms.
As a consequence, they need a very special treatment.

The following snippet is relying on Jest.
Nonetheless it can be adapted for other test runners if needed.

```js
// You should call: `jest.useFakeTimers()` at the beginning of your test

// The method will automatically schedule tasks to enqueue pending timers if needed.
// Instead of calling: `await s.waitAll()`
// You can call: `await waitAllWithTimers(s)`
const waitAllWithTimers = async (s) => {
  let alreadyScheduledTaskToUnqueueTimers = false;
  const countWithTimers = () => {
    // Append a scheduled task to unqueue pending timers (if task missing and pending timers)
    if (!alreadyScheduledTaskToUnqueueTimers && jest.getTimerCount() !== 0) {
      alreadyScheduledTaskToUnqueueTimers = true;
      s.schedule(Promise.resolve('advance timers if any')).then(() => {
        alreadyScheduledTaskToUnqueueTimers = false;
        jest.advanceTimersToNextTimer();
      });
    }
    return s.count();
  };
  while (countWithTimers() !== 0) {
    await s.waitOne();
  }
};
```

Alternatively you can wrap the scheduler produced by fast-check to add timer capabilities to it:

```js
// You should call: `jest.useFakeTimers()` at the beginning of your test
// You should replace: `fc.scheduler()` by `fc.scheduler().map(withTimers)`

const withTimers = (s) => {
  let alreadyScheduledTaskToUnqueueTimers = false;
  const appendScheduledTaskToUnqueueTimersIfNeeded = () => {
    // Append a scheduled task to unqueue pending timers (if task missing and pending timers)
    if (!alreadyScheduledTaskToUnqueueTimers && jest.getTimerCount() !== 0) {
      alreadyScheduledTaskToUnqueueTimers = true;
      s.schedule(Promise.resolve('advance timers if any')).then(() => {
        alreadyScheduledTaskToUnqueueTimers = false;
        jest.advanceTimersToNextTimer();
      });
    }
  };

  return {
    schedule(...args) {
      return s.schedule(...args);
    },
    scheduleFunction(...args) {
      return s.scheduleFunction(...args);
    },
    scheduleSequence(...args) {
      return s.scheduleSequence(...args);
    },
    count() {
      return s.count();
    },
    toString() {
      return s.toString();
    },
    async waitOne() {
      appendScheduledTaskToUnqueueTimersIfNeeded();
      await s.waitOne();
    },
    async waitAll() {
      appendScheduledTaskToUnqueueTimersIfNeeded();
      while (s.count()) {
        await s.waitOne();
        appendScheduledTaskToUnqueueTimersIfNeeded();
      }
    },
  };
};
```

### Wrapping calls automatically using `act`

`fc.scheduler({ act })` can be given an `act` function that will be called in order to wrap all the scheduled tasks. A code like the following one:

```js
fc.assert(
  fc.asyncProperty(fc.scheduler(), async s => () {
    // Pushing tasks into the scheduler ...
    // ....................................
    while (s.count() !== 0) {
      await act(async () => {
        // This construct is mostly needed when you want to test stuff in React
        // In the context of act from React, using waitAll would not have worked
        // as some scheduled tasks are triggered after waitOne resolved
        // and because of act (effects...)
        await s.waitOne();
      });
    }
  }))
```

Is equivalent to:

```js
fc.assert(
  fc.asyncProperty(fc.scheduler({ act }), async s => () {
    // Pushing tasks into the scheduler ...
    // ....................................
    await s.waitAll();
  }))
```

A simplified implementation for `waitOne` would be:

```js
async waitOne() {
  await act(async () => {
    await getTaskToBeResolved();
  })
}
async waitAll() {
  while (count() !== 0) {
    await waitOne();
  }
}
```

### Model based testing and race conditions

Model based testing capabilities can be used to help race conditions detection by using the runner `fc.scheduledModelRun`.

By using `fc.scheduledModelRun` even the execution of the model is scheduled using the scheduler.

One important fact to know when mixing model based testing with schedulers is that neither `check` nor `run` should rely on the completion of other scheduled tasks to fulfill themselves but they can - _and most of the time have to_ - trigger new scheduled tasks. No other scheduled task will be resolved during the execution of `check` or `run`.
