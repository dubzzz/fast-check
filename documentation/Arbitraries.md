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
- [Date](#date)
- [Falsy](#falsy)
- [Combinators](#combinators)
  - [Simple](#simple)
  - [Array](#array)
  - [Object](#object)
  - [Function](#function)
  - [More](#more)
- [Others](#others)
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

- `fc.boolean()`

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
>
> Generate any possible integer in the specified range.
> Both the lower bound and upper bound of the range are included in the set of possible values.

*&#8195;Signatures*

- `fc.integer()`
- `fc.integer(maxValue)`
- `fc.integer(minValue, maxValue)`

*&#8195;with:*

- `minValue?` — default: `-2147483648` — _lower bound of the range (included)_
- `maxValue?` — default: `2147483647` — _upper bound of the range (included)_

*&#8195;Usages*

```js
fc.integer()
// Note: All possible integers between `-2147483648` (included) and `2147483647` (included)
// Examples of generated values: 1502944448, 888414599, 1123740386, -440217435, -2…

fc.integer(1000)
// Note: All possible integers between `-2147483648` (included) and `1000` (included)
// Examples of generated values: -1057705109, -9, -1089721660, -1878447823, -741474720…

fc.integer(-99, 99)
// Note: All possible integers between `-99` (included) and `99` (included)
// Examples of generated values: 2, -1, 91, -2, 3…
```
</details>

<details>
<summary><b>nat</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#nat">api</a>]</summary><br/>

*&#8195;Description*

> Positive integer values (including zero)
>
> Generate any possible positive integer between zero and the upper bound.
> Both zero and the upper bound are included in the set of possible values.

*&#8195;Signatures*

- `fc.nat()`
- `fc.nat(maxValue)`

*&#8195;with:*

- `maxValue?` — default: `2147483647` — _upper bound of the range (included)_

*&#8195;Usages*

```js
fc.nat()
// Note: All possible integers between `0` (included) and `2147483647` (included)
// Examples of generated values: 16, 1747563639, 0, 2075457316, 2146229148…

fc.nat(1000)
// Note: All possible integers between `0` (included) and `1000` (included)
// Examples of generated values: 299, 1, 225, 750, 4…
```
</details>

<details>
<summary><b>maxSafeInteger</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#maxsafeinteger">api</a>]</summary><br/>

*&#8195;Description*

> All the range of signed integer values
>
> Generate any possible integer ie. from `Number.MIN_SAFE_INTEGER` (included) to `Number.MAX_SAFE_INTEGER` (included).

*&#8195;Signatures*

- `fc.maxSafeInteger()`

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
>
> Generate any possible positive integer ie. from `0` (included) to `Number.MAX_SAFE_INTEGER` (included).

*&#8195;Signatures*

- `fc.maxSafeNat()`

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
>
> Generate any floating point value taken into the specified range.
> The lower bound is included into the range of possible values while the upper one is not.

*&#8195;Signatures*

- `fc.float()`
- `fc.float(maxValue)`
- `fc.float(minValue, maxValue)`

*&#8195;with:*

- `minValue?` — default: `0.0` — _lower bound of the range (included)_
- `maxValue?` — default: `1.0` — _upper bound of the range (excluded)_

*&#8195;Usages*

```js
fc.float()
// Note: All possible 32-bit floating point values between `0.0` (included) and `1.0` (excluded)
// Examples of generated values: 0.731347382068634, 1.1920928955078125e-7, 0.6597227454185486, 0.5946863293647766, 0.6302104592323303…

fc.float(100)
// Note: All possible 32-bit floating point values between `0.0` (included) and `100.0` (excluded)
// Examples of generated values: 0.00007748603820800781, 0.00007152557373046875, 0.00013113021850585938, 52.37404108047485, 0.000035762786865234375…

fc.float(-100, 100)
// Note: All possible 32-bit floating point values between `-100.0` (included) and `100.0` (excluded)
// Examples of generated values: -99.99992847442627, 55.83081245422363, -99.99979734420776, -20.923829078674316, -99.99991655349731…
```
</details>

<details>
<summary><b>double</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#double">api</a>]</summary><br/>

*&#8195;Description*

> Floating point values
>
> Generate any floating point value taken into the specified range.
> The lower bound is included into the range of possible values while the upper one is not.

*&#8195;Signatures*

- `fc.double()`
- `fc.double(maxValue)`
- `fc.double(minValue, maxValue)`

*&#8195;with:*

- `minValue?` — default: `0.0` — _lower bound of the range (included)_
- `maxValue?` — default: `1.0` — _upper bound of the range (excluded)_

*&#8195;Usages*

```js
fc.double()
// Note: All possible floating point values between `0.0` (included) and `1.0` (excluded)
// Examples of generated values: 0.4530413804731288, 0.8226463198661805, 0.3829372459587349, 0.7186836451292051, 0.8065718412399292…

fc.double(100)
// Note: All possible floating point values between `0.0` (included) and `100.0` (excluded)
// Examples of generated values: 0.000019014520535876045, 98.91013210040657, 0.00003648309874204614, 20.497548580169944, 0.00001937150981845548…

fc.double(-100, 100)
// Note: All possible floating point values between `-100.0` (included) and `100.0` (excluded)
// Examples of generated values: -99.999970715887, -99.99996384938794, -99.99996463982544, -69.75060565839972, -99.99994324436676…
```
</details>

### BigInt
_if supported by your JavaScript interpreter_

<details>
<summary><b>bigIntN</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#bigintn">api</a>]</summary><br/>

*&#8195;Description*

> N-bit signed `bigint` values
>
> Generate any possible `bigint` between <code>-2<sup>n-1</sup></code> (included) and <code>2<sup>n-1</sup>-1</code> (included).

*&#8195;Signatures*

- `fc.bigIntN(n)`

*&#8195;with:*

- `n` — _maximal number of bits of the generated `bigint`_

*&#8195;Usages*

```js
fc.bigIntN(2)
// Note: All possible bigint values between `-2n` (included) and `1n` (included)
// Examples of generated values: -1n, 1n, 0n, -2n…

fc.bigIntN(128)
// Note: All possible bigint values between `-(2n**127n)` (included) and `(2n**127n)-1n` (included)
// Examples of generated values: 118965438702305362498464591014723682065n, -55529428019749399595111693273573678376n, -45882741802961890031345972148576150745n, 88162568694395329699188080847279292274n, -18663446021429702481819240863645317485n…
```
</details>

<details>
<summary><b>bigInt</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#bigint">api</a>]</summary><br/>

*&#8195;Description*

> Signed `bigint` values
>
> Generate any bigint value taken into the specified range.
> Both lower bound and upper bound are included into the range of possible values.

*&#8195;Signatures*

- `fc.bigInt()`
- `fc.bigInt(minValue, maxValue)`

*&#8195;with:*

- `minValue?` — _lower bound of the range (included)_
- `maxValue?` — _upper bound of the range (included)_

*&#8195;Usages*

```js
fc.bigInt()
// Examples of generated values: -55267127471484960134228883170671517601140668833043648279881539595328866477336n, -320877373404846693351482506498287829328651053618510591877443861350691412062n, 22403846480109971796256164379798253424379083455297331933513006716677124261164n, 46531564263119251593570768169779548000260571947054149902092502970846442652567n, -27488731055093319143645334041335559432506843454739800192508819981052054802083n…

fc.bigInt(0n, 12345678901234567890n)
// Note: All possible bigint values between `0n` (included) and `12345678901234567890n` (included)
// Examples of generated values: 6465640285538993635n, 8922695748501260749n, 16n, 19n, 10723446437785154890n…

fc.bigInt(-3000n, 100n)
// Note: All possible bigint values between `-3000n` (included) and `100n` (included)
// Examples of generated values: 1n, -2031n, -351n, -1605n, -2n…
```
</details>

<details>
<summary><b>bigIntN</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#bigintn">api</a>]</summary><br/>

*&#8195;Description*

> N-bit positive `bigint` values (including zero)
>
> Generate any possible positive `bigint` between <code>0</code> (included) and <code>2<sup>n</sup>-1</code> (included).

*&#8195;Signatures*

- `fc.bigUintN(n)`

*&#8195;with:*

- `n` — _maximal number of bits of the generated `bigint`_

*&#8195;Usages*

```js
fc.bigUintN(2)
// Note: All possible bigint values between `0n` (included) and `3n` (included)
// Examples of generated values: 1n, 0n, 2n, 3n…

fc.bigUintN(128)
// Note: All possible bigint values between `0n` (included) and `(2n**128n)-1n` (included)
// Examples of generated values: 86341151263089925165504430453367665188n, 28n, 328981524291263435470719008913591905663n, 279866238908824165638381771934770854596n, 111395503858026070299201611333616927272n…
```
</details>

<details>
<summary><b>bigUint</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#biguint">api</a>]</summary><br/>

*&#8195;Description*

> Positive `bigint` values (including zero)
>
> Generate any positive bigint value taken up to upper bound included.

*&#8195;Signatures*

- `fc.bigUint()`
- `fc.bigUint(maxValue)`

*&#8195;with:*

- `maxValue?` — _upper bound of the range (included)_

*&#8195;Usages*

```js
fc.bigUint()
// Examples of generated values: 98415346800826680180868623901081769911550846942931679526483139707297824018492n, 81847654831253862250960947754551199482417759415227376695916153744999991292122n, 88192025501918677973672101265075531420107830828023254720275072280209923428999n, 46027806054858042993090394331470161808813263449611553513658034830595160464971n, 18n…

fc.bigUint(12345678901234567890n)
// Note: All possible bigint values between `0n` (included) and `12345678901234567890n` (included)
// Examples of generated values: 5776499037807709071n, 4876199541303708566n, 19n, 18n, 5n…
```
</details>

## String

### Single character

<details>
<summary><b>hexa</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#hexa">api</a>]</summary><br/>

*&#8195;Description*

> One lowercase hexadecimal character — ie.: _one character in `0123456789abcdef`_

*&#8195;Signatures*

- `fc.hexa()`

*&#8195;Usages*

```js
fc.hexa()
// Examples of generated values: "1", "3", "2", "d", "e"…
```
</details>

<details>
<summary><b>base64</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#base64">api</a>]</summary><br/>

*&#8195;Description*

> One base64 character — _ie.: one character in `A-Z`, `a-z`, `0-9`, `+` or `/`_

*&#8195;Signatures*

- `fc.base64()`

*&#8195;Usages*

```js
fc.base64()
// Examples of generated values: "U", "M", "z", "b", "4"…
```
</details>

<details>
<summary><b>char</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#char">api</a>]</summary><br/>

*&#8195;Description*

> One printable character — _ie.: one character between `0x20` (included) and `0x7e` (included), corresponding to printable characters (see https://www.ascii-code.com/)_

*&#8195;Signatures*

- `fc.char()`

*&#8195;Usages*

```js
fc.char()
// Examples of generated values: "&", "#", "A", "J", "%"…
```
</details>

<details>
<summary><b>ascii</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#ascii">api</a>]</summary><br/>

*&#8195;Description*

> One ascii character — _ie.: one character between `0x00` (included) and `0x7f` (included)_

*&#8195;Signatures*

- `fc.ascii()`

*&#8195;Usages*

```js
fc.ascii()
// Examples of generated values: "5", "#", "7", "}", "\u001a"…
```
</details>

<details>
<summary><b>unicode</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#unicode">api</a>]</summary><br/>

*&#8195;Description*

> One unicode character from BMP-plan — _ie.: one character between `0x0000` (included) and `0xffff` (included) but excluding surrogate pairs (between `0xd800` and `0xdfff`)_
>
> Generate any character of UCS-2 which is a subset of UTF-16 (restricted to BMP plan).

*&#8195;Signatures*

- `fc.unicode()`

*&#8195;Usages*

```js
fc.unicode()
// Examples of generated values: "", "熇", "ዢ", "⢥", ")"…
```
</details>

<details>
<summary><b>char16bits</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#char16bits">api</a>]</summary><br/>

*&#8195;Description*

> One unicode character from BMP-plan (including part of surrogate pair) — _ie.: one character between `0x0000` (included) and `0xffff` (included)_
>
> Generate any 16 bits character. Be aware the values within `0xd800` and `0xdfff` which constitutes the surrogate pair characters are also generated meaning that some generated characters might appear invalid regarding UCS-2 and UTF-16 encoding._


*&#8195;Signatures*

- `fc.char16bits()`
*&#8195;Usages*

```js
fc.char16bits()
// Examples of generated values: ",", "훺", "*", "", "-"…
```
</details>

<details>
<summary><b>fullUnicode</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#fullunicode">api</a>]</summary><br/>

*&#8195;Description*

> One unicode character — _ie.: one character between `0x0000` (included) and `0x10ffff` (included) but excluding surrogate pairs (between `0xd800` and `0xdfff`)_
>
> Its length can be greater than one as it potentially contains multiple UTF-16 characters for a single glyph (eg.: `"\u{1f434}".length === 2`).

*&#8195;Signatures*

- `fc.fullUnicode()`

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

- `fc.hexaString()`
- `fc.hexaString(maxLength)`
- `fc.hexaString(minLength, maxLength)`

*&#8195;with:*

- `minLength?` — _minimal number of characters (included)_
- `maxLength?` — _maximal number of characters (included)_

*&#8195;Usages*

```js
fc.hexaString()
// Examples of generated values: "0e0", "bf2", "3", "a9cb", "302122"…

fc.hexaString(3)
// Note: Any hexadecimal string containing up to 3 (included) characters
// Examples of generated values: "b04", "", "1", "22e", "0"…

fc.hexaString(4, 6)
// Note: Any hexadecimal string containing between 4 (included) and 6 (included) characters
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

- `fc.base64String()`
- `fc.base64String(maxLength)`
- `fc.base64String(minLength, maxLength)`

*&#8195;with:*

- `minLength?` — _minimal number of characters (included)_
- `maxLength?` — _maximal number of characters (included)_

_When using `minLength` and `maxLength` make sure that they are compatible together. For instance: asking for `minLength=2` and `maxLength=3` is impossible for base64 strings as produced by the framework_

*&#8195;Usages*

```js
fc.base64String()
// Examples of generated values: "rgkUfyt0yzjfC+og", "BdEh", "RD/EvefgXKA=", "xBEjzZ+=", "FoRDCZeC"…

fc.base64String(8)
// Note: Any base64 string containing up to 8 (included) characters
// Examples of generated values: "", "HNgun7I=", "Zjy=", "2YaX", "FTD="…

fc.base64String(4, 12)
// Note: Any base64 string containing between 4 (included) and 12 (included) characters
// Examples of generated values: "vDxCCAk2/IS0", "6ryIGlQJJX8=", "ehK1YMsk", "+TC9UScX", "AxZf"…
```
</details>

<details>
<summary><b>string</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#string">api</a>]</summary><br/>

*&#8195;Description*

> String containing characters produced by `fc.char()`

*&#8195;Signatures*

- `fc.string()`
- `fc.sString(maxLength)`
- `fc.string(minLength, maxLength)`

*&#8195;with:*

- `minLength?` — _minimal number of characters (included)_
- `maxLength?` — _maximal number of characters (included)_

*&#8195;Usages*

```js
fc.string()
// Examples of generated values: ".A%", "aM{]xTH&)", "^NLpz5/y", "", "eqr"…

fc.string(3)
// Note: Any string containing up to 3 (included) characters
// Examples of generated values: "0", "!B", "OY", "TI'", ""…

fc.string(4, 6)
// Note: Any string containing between 4 (included) and 6 (included) characters
// Examples of generated values: "Y&.E{", "f&X6A", " \"d<ap", "bD7;", "UT'@"…
```
</details>

<details>
<summary><b>asciiString</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#asciistring">api</a>]</summary><br/>

*&#8195;Description*

> ASCII string containing characters produced by `fc.ascii()`

*&#8195;Signatures*

- `fc.asciiString()`
- `fc.asciiString(maxLength)`
- `fc.asciiString(minLength, maxLength)`

*&#8195;with:*

- `minLength?` — _minimal number of characters (included)_
- `maxLength?` — _maximal number of characters (included)_

*&#8195;Usages*

```js
fc.asciiString()
// Examples of generated values: "2u1\u001aWQ", "", "*y", "\bT\u0013.\u0017|h&>", "si3\u0016`kA\u0017\u0004"…

fc.asciiString(3)
// Note: Any ascii string containing up to 3 (included) characters
// Examples of generated values: "", "w7", "7", "f", "_u"…

fc.asciiString(4, 6)
// Note: Any ascii string containing between 4 (included) and 6 (included) characters
// Examples of generated values: "%A&= ", "#\u0013!&", "%!n!W", "\u0014~\u001e,\u001f", "3\"|#D%"…
```
</details>

<details>
<summary><b>unicodeString</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#unicodestring">api</a>]</summary><br/>

*&#8195;Description*

> Unicode string containing characters produced by `fc.unicode()`

*&#8195;Signatures*

- `fc.unicodeString()`
- `fc.unicodeString(maxLength)`
- `fc.unicodeString(minLength, maxLength)`

*&#8195;with:*

- `minLength?` — _minimal number of characters (included)_
- `maxLength?` — _maximal number of characters (included)_

*&#8195;Usages*

```js
fc.unicodeString()
// Examples of generated values: "", "ॗﰗ騈!+().俅", "㚗", "娇\u001eᨫ㽹矌", "┛䅯퉳"…

fc.unicodeString(3)
// Note: Any unicode (from BMP-plan) string containing up to 3 (included) characters
// Examples of generated values: "", "ꟑ", "쾮", "$", "⯄밈"…

fc.unicodeString(4, 6)
// Note: Any unicode (from BMP-plan) string containing between 4 (included) and 6 (included) characters
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

- `fc.string16bits()`
- `fc.string16bits(maxLength)`
- `fc.string16bits(minLength, maxLength)`

*&#8195;with:*

- `minLength?` — _minimal number of characters (included)_
- `maxLength?` — _maximal number of characters (included)_

*&#8195;Usages*

```js
fc.string16bits()
// Examples of generated values: "埫쒠爤", "-ꎝ", "૑ᚃ⵿⫄㖯孞℠", "⤱黁醙", "⦕끅Ȩ鋑\uda43"…

fc.string16bits(3)
// Note: Any string (not really legal ones sometimes) containing up to 3 (included) characters
// Examples of generated values: "", "Ǉ闍⏠", "", "⩿\udea5", "驙"…

fc.string16bits(4, 6)
// Note: Any string (not really legal ones sometimes) containing between 4 (included) and 6 (included) characters
// Examples of generated values: "媖봼Ђ刋⥞䪽", "誥갌/'(", "᥽ᚂ뀵鄓\udff5鐉", "찫灭溛椋ڀ", "㜴))%/"…
```
</details>

<details>
<summary><b>fullUnicodeString</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#fullunicodestring">api</a>]</summary><br/>

*&#8195;Description*

> Unicode string containing characters produced by `fc.fullUnicode()`

*&#8195;Signatures*

- `fc.fullUnicodeString()`
- `fc.fullUnicodeString(maxLength)`
- `fc.fullUnicodeString(minLength, maxLength)`

*&#8195;with:*

- `minLength?` — _minimal number of code-points (included)_
- `maxLength?` — _maximal number of code-points (included)_

_Be aware that the length is considered in terms of the number of glyphs in the string and not the number of UTF-16 characters. As a consequence `generatedString.length` might be greater than the asked maximal length but `[...generatedString].length` will not and always be in the required range_

*&#8195;Usages*

```js
fc.fullUnicodeString()
// Examples of generated values: "𾪖򘔼򭐂񿈋𰥞", "񫪥񫹚򻰌4", "󘅽󘺂򦀵򈄓񧟵", "󥐫򱡭􌺛愋Ꚁ𻧗ᨘ񀄮􍹣", "򈼴$3򴿦0#񵰀($'"…

fc.fullUnicodeString(3)
// Note: Any unicode string containing up to 3 (included) code-points
// Examples of generated values: "", "򛊋", "򤠕", "򙄭", "𠻚"…

fc.fullUnicodeString(4, 6)
// Note: Any unicode string containing between 4 (included) and 6 (included) code-points
// Examples of generated values: "􅄃񥋨񇕛󈯸򛂰󤟤", "򁵫􃵥󭺥𶃸𨙩򦕃", "񧒎򼎿򉽹𽆿𤍯򞅘", "򥙑󳥜򶕃􉏿", "𮜣񘡘򯚣򈏣󻦻󡹛"…
```
</details>

<details>
<summary><b>stringOf</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#stringof">api</a>]</summary><br/>

*&#8195;Description*

> String containing characters produced by the passed character generator

*&#8195;Signatures*

- `fc.stringOf(charArb)`
- `fc.stringOf(charArb, maxLength)`
- `fc.stringOf(charArb, minLength, maxLength)`

*&#8195;with:*

- `charArb` — _arbitrary able to generate random strings (possibly multiple characters)_
- `minLength?` — _minimal number of elements generated by `charArb` (included)_
- `maxLength?` — _maximal number of elements generated by `charArb` (included)_

*&#8195;Usages*

```js
fc.stringOf(fc.hexa())
// Examples of generated values: "6c2be", "5ac3", "d2535", "bdbb078e3", "4116130013"…

fc.stringOf(fc.char(), 3)
// Note: Any string containing up to 3 (included) characters extracted from `fc.char()`
// Examples of generated values: "", "~*2", "{Z", "[\"", "jlZ"…

fc.stringOf(fc.char(), 4, 6)
// Note: Any string containing between 4 (included) and 6 (included) characters extracted from `fc.char()`
// Examples of generated values: "Pv-^", " X#\"U&", "?DM}7", "iEjK.b", "#\"&& "…

fc.stringOf(fc.constantFrom('a', 'b'), 0, 5)
// Note: Any string containing between 0 (included) and 5 (included) characters extracted from `fc.constantFrom('a', 'b')`
// Examples of generated values: "", "babab", "abbab", "ab", "bbabb"…

fc.stringOf(fc.constantFrom('Hello', 'World'), 1, 3)
// Note: It might produce strings like "WorldWorldWorld" or "WorldHelloWorld"…
// Examples of generated values: "WorldHello", "HelloHello", "WorldWorld", "World", "HelloWorld"…
```
</details>

### More specific strings

<details>
<summary><b>json</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#json">api</a>]</summary><br/>

*&#8195;Description*

> JSON compatible string representations of instances. Can produce string representations of basic primitives but also of deep objects.
>
> The generated values can be parsed by `JSON.parse`.
> All the string values (from keys to values) are generated using `fc.string()`.

*&#8195;Signatures*

- `fc.json()`
- `fc.json(maxDepth)`

*&#8195;with:*

- `maxDepth?` — _maximal depth of generated objects_

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

> JSON compatible string representations of instances. Can produce string representations of basic primitives but also of deep objects.
>
> The generated values can be parsed by `JSON.parse`.
> All the string values (from keys to values) are generated using `fc.unicodeString()`.

*&#8195;Signatures*

- `fc.unicodeJson()`
- `fc.unicodeJson(maxDepth)`

*&#8195;with:*

- `maxDepth?` — _maximal depth of generated objects_

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

*&#8195;with:*

- `maxWordsCount?` — _maximal number of words to produce_
- `maxCount?` — if `sentenceMode` is `true`: lorem ipsum sentence containing at most `maxCount` sentences, otherwise: containing at most `maxCount` words_
- `sentenceMode?` — default: `false` — _enable sentence mode_

_Except if you specified `sentenceMode=true`, `fc.lorem` defaults to words mode_

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

- `fc.ipV4()`

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

- `fc.ipV4Extended()`

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

- `fc.ipV6()`

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

- `fc.uuid()`

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

- `fc.uuidV(version)`

*&#8195;with:*

- `version` — _version of the uuid to produce: 1, 2, 3, 4 or 5_

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

- `fc.domain()`

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

- `fc.webAuthority()`
- `fc.webAuthority({withIPv4?, withIPv4Extended?, withIPv6?, withPort?})`

*&#8195;with:*

- `withIPv4?` — default: `false` — _enable ip v4
- `withIPv4Extended?` — default: `false` — _enable ip v4 extended_
- `withIPv6?` — default: `false` — _enable ip v6_
- `withPort?` — default: `false` — _enable port_


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

- `fc.webFragments()`

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

- `fc.webQueryParameters()`

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

- `fc.webSegment()`

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

- `fc.webUrl()`
- `fc.webUrl({authoritySettings?, validSchemes?, withFragments?, withQueryParameters?})`

*&#8195;with:*

- `authoritySettings?` — default: `{}` — _[constraints](https://dubzzz.github.io/fast-check/interfaces/webauthorityconstraints.html) on the web authority_
- `validSchemes?` — default: `['http', 'https']` — _list all the valid schemes_
- `withFragments?` — default: `false` — _enable fragments_
- `withQueryParameters?` — default: `false` — _enable query parameters_

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

- `fc.emailAddress()`

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

- `fc.mixedCase(stringArb)`
- `fc.mixedCase(stringArb, {toggleCase?})`

*&#8195;with:*

- `stringArb` — _arbitrary producing random strings_
- `toggleCase?` — default: _try `toUpperCase` on the received code-point, if no effect try `toLowerCase`_ — _custom toggle case function that will be called on some of the code-points to toggle the character_

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
>
> Generate any possible dates in the specified range. Both the lower bound and upper bound of the range are included in the set of possible values.

*&#8195;Signatures*

- `fc.date()`
- `fc.date({ min?, max? })`

*&#8195;with:*

- `min?` — default: `new Date(-8640000000000000)` — _lower bound of the range (included)_
- `max?` — default: `new Date(8640000000000000)` — _upper bound of the range (included)_

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
>
> Generate falsy values ie. one of: `false`, `null`, `undefined`, `0`, `''`, `Number.NaN` or `0n`.

*&#8195;Signatures*

- `fc.falsy()`
- `fc.date({ withBigInt? })`

*&#8195;with:*

- `withBigInt?` — default: `false` — _enable `0n`_

*&#8195;Usages*

```js
fc.falsy()
// Examples of generated values: null, false, 0, Number.NaN, ""…

fc.falsy({ withBigInt: true })
// Examples of generated values: 0, false, Number.NaN, undefined, ""…
```
</details>

## Combinators

### Simple

<details>
<summary><b>constant</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#constant">api</a>]</summary><br/>

*&#8195;Description*

> Always produce the same value
>
> ⚠️ The value will not be cloned by the arbitrary

*&#8195;Signatures*

- `fc.constant(value)`

*&#8195;with:*

- `value` — _value that will be produced by the arbitrary_

*&#8195;Usages*

```js
fc.constant(1)
// Examples of generated values: 1…

fc.constant({})
// Examples of generated values: {}…
```
</details>

<details>
<summary><b>constantFrom</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#constantfrom">api</a>]</summary><br/>

*&#8195;Description*

> One of the values specified as argument
>
> Randomly chooses among the provided values. It considers the first value as the default value so that in case of failure it will shrink to it. It expects a minimum of one value and throws whether it receives no value as parameters. It can easily be used on arrays with `fc.constantFrom(...myArray)`.
>
> ⚠️ The values will not be cloned by the arbitrary

*&#8195;Signatures*

- `fc.constantFrom(...values)`

*&#8195;with:*

- `...values` — _all the values that could possibly be generated by the arbitrary_

*&#8195;Usages*

```js
fc.constantFrom(1, 2, 3)
// Examples of generated values: 1, 3, 2…

fc.constantFrom(1, 'string', {})
// Examples of generated values: "string", {}, 1…
```
</details>

<details>
<summary><b>clonedConstant</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#clonedconstant">api</a>]</summary><br/>

*&#8195;Description*

> Always produce the same value (as `fc.constant`)
>
> If it exists, the method `[fc.cloneMethod]` will be cloned to clone the instance so that it will be unique for each run

*&#8195;Signatures*

- `fc.clonedConstant(value)`

*&#8195;with:*

- `value` — _value that will be produced by the arbitrary_

*&#8195;Usages*

```js
fc.clonedConstant(1)
// Examples of generated values: 1…

fc.clonedConstant(
  ((objectInstance) => {
    // Rq: We do not handle deep objects in this snippet
    // But we will get another instance of objectInstance for each run
    // ie. objectInstanceRunA !== objectInstanceRunB while having isEqual(objectInstanceRunA, objectInstanceRunB)
    const withCloneMethod = () => ({
      ...objectInstance,
      [fc.cloneMethod]: withCloneMethod,
    });
    return withCloneMethod();
  })({ keyA: 1, keyB: 2 })
)
// Examples of generated values: {"keyA":1,"keyB":2}…
```
</details>

<details>
<summary><b>option</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#option">api</a>]</summary><br/>

*&#8195;Description*

> Randomly chooses between producing a value using the underlying arbitrary or returning nil

*&#8195;Signatures*

- `fc.option(arb)`
- `fc.option(arb, freq)`
- `fc.option(arb, {freq?, nil?})`

*&#8195;with:*

- `arb` — _arbitrary that will be called to generate normal values_
- `freq?` — default: `5` — _probability to build the nil value is of 1 / freq_
- `nil?` — default: `null` — _nil value_

*&#8195;Usages*

```js
fc.option(fc.nat())
// Examples of generated values: null, 773390791, 25, 18, 2039519833…

fc.option(fc.nat(), 2)
// Examples of generated values: 5, 1857850746, 178760054, 1682452789, 461887690…

fc.option(fc.nat(), { freq: 2, nil: Number.NaN })
// Examples of generated values: 5, Number.NaN, 259062763, 21, 11…

fc.option(fc.string(), { nil: undefined })
// Examples of generated values: "^_|\"T.5rB", "%!", "OqA3D!", undefined, "\""…
```
</details>

<details>
<summary><b>oneof</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#oneof">api</a>]</summary><br/>

*&#8195;Description*

> Generate one value based on one of the passed arbitraries
>
> Randomly chooses an arbitrary at each new generation. Should be provided with at least one arbitrary. All arbitraries are equally probable and shrink is still working for the selected arbitrary. `fc.oneof` is able to shrink inside the failing arbitrary but not accross arbitraries (contrary to `fc.constantFrom` when dealing with constant arbitraries).

*&#8195;Signatures*

- `fc.oneof(...arbitraries)`

*&#8195;with:*

- `...arbitraries` — _arbitraries that could be used to generate a value_

*&#8195;Usages*

```js
fc.oneof(fc.char(), fc.boolean())
// Examples of generated values: "&", false, true, "@", "2"…

fc.oneof(fc.char(), fc.boolean(), fc.nat())
// Examples of generated values: true, 234471686, 485911805, false, "\\"…
```
</details>

<details>
<summary><b>frequency</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#frequency">api</a>]</summary><br/>

*&#8195;Description*

> Generate one value based on one of the passed arbitraries
>
> Randomly chooses an arbitrary at each new generation. Should be provided with at least one arbitrary. Probability to select a specific arbitrary is based on its weight, the higher it is the more it will be probable. It preserves the shrinking capabilities of the underlying arbitrary.

*&#8195;Signatures*

- `fc.frequency(...{ arbitrary, weight })`

*&#8195;with:*

- `...{ arbitrary, weight }` — _arbitraries that could be used to generate a value along their weight (the higher the weight, the higher the prbability to select this arbitrary will be)_

*&#8195;Usages*

```js
fc.frequency(
  { arbitrary: fc.char(), weight: 2 },
  { arbitrary: fc.boolean(), weight: 1 }
)
// Examples of generated values: true, "&", "8", false, "["…
```
</details>

<details>
<summary><b>mapToConstant</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#maptoconstant">api</a>]</summary><br/>

*&#8195;Description*

> Map indexes to values
>
> Generates non-contiguous ranges of values by mapping integer values to constant.

*&#8195;Signatures*

- `fc.mapToConstant(...{ num, build })`

*&#8195;with:*

- `...{ num, build }` — _describe how to map integer values to their final values. For each entry, the entry defines `num` corresponding to the number of integer values it covers and `build`, a method that will produce a value given an integer in the range `0` (included) to `num - 1` (included)_

*&#8195;Usages*

```js
fc.mapToConstant(
  { num: 26, build: v => String.fromCharCode(v + 0x61) },
  { num: 10, build: v => String.fromCharCode(v + 0x30) },
)
// Examples of generated values: "f", "c", "a", "b", "7"…
```
</details>

<details>
<summary><b>dedup</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#dedup">api</a>]</summary><br/>

*&#8195;Description*

> Multiple identical values but not equal in terms of `===`
>
> Generate tuple containing multiple instances of the same value - values are independent from each others.

*&#8195;Signatures*

- `fc.dedup(arb, numValues)`

*&#8195;with:*

- `arb` — _arbitrary instance responsible to generate values_
- `numValues` — _number of clones (including itself)_

*&#8195;Usages*

```js
fc.dedup(fc.nat(), 2)
// Examples of generated values: [1458194344,1458194344], [1974332592,1974332592], [605246308,605246308], [187149619,187149619], [1325928130,1325928130]…

fc.dedup(fc.nat(), 3)
// Examples of generated values: [1075303821,1075303821,1075303821], [1289535362,1289535362,1289535362], [479824585,479824585,479824585], [61543881,61543881,61543881], [1082205096,1082205096,1082205096]…
```
</details>

### Array

<details>
<summary><b>tuple</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#tuple">api</a>]</summary><br/>

*&#8195;Description*

> Generate _tuples_ - or more precisely arrays - by aggregating the values generated by its underlying arbitraries.

*&#8195;Signatures*

- `fc.tuple(...arbitraries)`

*&#8195;with:*

- `...arbitraries` — _arbitraries that should be used to generate the values of our tuple_

*&#8195;Usages*

```js
fc.tuple(fc.nat())
// Examples of generated values: [10], [13], [26], [242661188], [263784372]…

fc.tuple(fc.nat(), fc.string())
// Examples of generated values: [25," $$\"% !q"], [3,"@h@\"/S"], [468194571,"*_J"], [29,"&MT"], [17," &"]…
```
</details>

<details>
<summary><b>genericTuple</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#generictuple">api</a>]</summary><br/>

*&#8195;Description*

> Generate _tuples_ - or more precisely arrays - by aggregating the values generated by its underlying arbitraries.
>
> Note: This arbitrary is mostly there for typings related needs. Most of the time, `fc.tuple` will do the job.

*&#8195;Signatures*

- `fc.genericTuple(arbitraries)`

*&#8195;with:*

- `arbitraries` — _arbitraries that should be used to generate the values of our tuple_

*&#8195;Usages*

```js
fc.genericTuple([fc.nat()])
// Examples of generated values: [1322560433], [472890492], [1878169203], [1642558158], [343133589]…

fc.genericTuple([fc.nat(), fc.string()])
// Examples of generated values: [498298066,"xx]ZF."], [1035210183,"&S9"], [9,"#"], [12,"!&B5YF  u."], [4,"$!1:\"<!#"]…
```
</details>

<details>
<summary><b>array</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#array">api</a>]</summary><br/>

*&#8195;Description*

> Array of random length containing values generated by `arb`

*&#8195;Signatures*

- `fc.array(arb)`
- `fc.array(arb, maxLength)`
- `fc.array(arb, minLength, maxLength)`

*&#8195;with:*

- `arb` — _arbitrary instance responsible to generate values_
- `minLength?` — default: `0` — _minimal length (included)_
- `maxLength?` — default: `10` — _maximal length (included)_

*&#8195;Usages*

```js
fc.array(fc.nat())
// Examples of generated values: [], [1044253015,881466391,1911917064,2,1706675196,26,29,23,30,854122437], [1644861079], [624842423,32338439,1321248893,980127887,850807339,1583851385,1093421004], [505677510,559592731,1931700591,729662778,1771367027]…

fc.array(fc.nat(), 3)
// Examples of generated values: [1584945814,2091302204,656737282], [539789989,1511646810,1532079116], [179837309,1996953218,1506324533], [18730027,1481994349,783904411], [1043674932,26,30]…

fc.array(fc.nat(), 5, 7)
// Examples of generated values: [105849857,2104277073,28,10,7,1574519785], [17,73613851,16,16,28,26], [199059205,1071842921,1458458266,23,1614164730,22], [1363793259,1700974328,2073190901,1016859405,77531415,187425710,648537886], [1931838903,661680466,1043274553,227120261,334867404,1637939285,970242422]…
```
</details>

<details>
<summary><b>set</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#set">api</a>]</summary><br/>

*&#8195;Description*

> Array of random length containing unique values generated by `arb`
>
> All the values in the set are unique given the provided `compare` function.

*&#8195;Signatures*

- `fc.set(arb)`
- `fc.set(arb, maxLength)`
- `fc.set(arb, minLength, maxLength)`
- `fc.set(arb, compare)`
- `fc.set(arb, maxLength, compare)`
- `fc.set(arb, minLength, maxLength, compare)`

*&#8195;with:*

- `arb` — _arbitrary instance responsible to generate values_
- `minLength?` — default: `0` — _minimal length (included)_
- `maxLength?` — default: `10` — _maximal length (included)_
- `compare` — default: `(a, b) => a === b` — _custom compare function used to distinguish duplicates in order to remove them from the resulting array_

*&#8195;Usages*

```js
fc.set(fc.nat())
// Examples of generated values: [581737874,363728213,1849261841,2086900089,1407876151,483945393], [], [1188401930,1080708697], [1932414823,242967476,1070530418,327779854,20278390,848810076,503994952,509283078,418212126], [995846483,1424836937,374064787,802080757,161175616,165366219,68362401,310244342,1942755427]…

fc.set(fc.nat(), 3)
// Examples of generated values: [], [1966917665,1611683793], [902979502], [5], [683713476,1887226888]…

fc.set(fc.nat(), 5, 7)
// Examples of generated values: [2071243119,1019120835,178921649,1991158594,254132674,244350784,2084809828], [1857850746,1136469419,134027570,981584072,691463622,713863397], [178760054,1502635358,1135167329,323374730,1826246517,831719512,132041292], [1682452789,1108123838,1088395859,305257794,388930749,1160955220,998765778], [1187479417,11,577552177,1191118105,2094470239,29]…

fc.set(fc.hexaString(), (s1, s2) => s1.length === s2.length)
// Note: Resulting arrays will never contain two strings with the same number of characters
// Examples of generated values: ["f8b0a22","620a459a5c","","5"], ["e8820df36f","a50ec","a8","d2dd",""], ["33","","9a8af99a","8055950"], ["2b",""], ["32","1e3e37c","31f59","b2621fd8"]…

fc.set(fc.hexaString(), 5, 10, (s1, s2) => s1.length === s2.length)
// Note: Resulting arrays will never contain two strings with the same number of characters and it will contain between 5 and 10 strings
// Examples of generated values: ["bb4f65e","c11","07692946","4343","6f2735c0f9","2b"], ["92","f783bab","3a736","a3121633","996b36b49c"], ["061978","44c0","25591f566f","a","e8d","612ac","b04208a4b"], ["ac02a4e","49a","642a406069","9328","2e3ded","ade301ed"], ["dd90a","f64f2f0358","7b5ae028","f5","9","226b40"]…
```
</details>

<details>
<summary><b>subarray</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#subarray">api</a>]</summary><br/>

*&#8195;Description*

> Generate values corresponding to any possible sub-array of an original array
>
> Values of the resulting subarray are ordered the same way they were in the original array.

*&#8195;Signatures*

- `fc.subarray(originalArray)`
- `fc.subarray(originalArray, minLength, maxLength)`

*&#8195;with:*

- `originalArray` — _the array from which we want to extract sub-arrays_
- `minLength?` — default: `0` — _minimal length (included)_
- `maxLength?` — default: `maxLength=originalArray.length` — _maximal length (included)_

*&#8195;Usages*

```js
fc.subarray([1, 42, 48, 69, 75, 92])
// Examples of generated values: [48,69,75,92], [75,92], [], [48,75], [1,42,48,75,92]…

fc.subarray([1, 42, 48, 69, 75, 92], 5, 6)
// Examples of generated values: [1,48,69,75,92], [1,42,48,69,75], [1,42,48,69,92], [42,48,69,75,92], [1,42,48,69,75,92]…

fc.subarray([1, 42, 48, 69, 75, 92], 2, 3)
// Examples of generated values: [48,92], [42,69], [48,69], [1,48], [48,75]…
```
</details>

<details>
<summary><b>shuffledSubarray</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#shuffledsubarray">api</a>]</summary><br/>

*&#8195;Description*

> Generate values corresponding to any possible sub-array of an original array
>
> Values of the resulting subarray are ordered randomly.

*&#8195;Signatures*

- `fc.shuffledSubarray(originalArray)`
- `fc.shuffledSubarray(originalArray, minLength, maxLength)`

*&#8195;with:*

- `originalArray` — _the array from which we want to extract sub-arrays_
- `minLength?` — default: `0` — _minimal length (included)_
- `maxLength?` — default: `maxLength=originalArray.length` — _maximal length (included)_

*&#8195;Usages*

```js
fc.shuffledSubarray([1, 42, 48, 69, 75, 92])
// Examples of generated values: [75], [75,48], [92], [75,92], [1,75]…

fc.shuffledSubarray([1, 42, 48, 69, 75, 92], 5, 6)
// Examples of generated values: [69,48,1,92,75,42], [75,69,1,48,92], [48,1,92,42,69], [69,92,48,42,1], [69,42,1,92,75]…

fc.shuffledSubarray([1, 42, 48, 69, 75, 92], 2, 3)
// Examples of generated values: [69,48,1], [75,69], [48,1], [69,92], [69,42]…
```
</details>

<details>
<summary><b>infiniteStream</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#infinitestream">api</a>]</summary><br/>

*&#8195;Description*

> Generate infinite `Stream` of values generated by `arb`.
>
> The `Stream` structure provided by fast-check implements `IterableIterator<T>` and comes with useful helpers to manipulate it.

*&#8195;Signatures*

- `fc.infiniteStream(arb)`

*&#8195;with:*

- `arb` — _arbitrary instance responsible to generate values_

*&#8195;Usages*

```js
fc.infiniteStream(fc.nat(9))
// Examples of generated values: Stream(5,2,2,1,3,9,9,8,9,9...), Stream(1,0,8,1,6,8,6,7,7,7...), Stream(0,4,6,5,2,3,5,3,2,1...), Stream(2,5,0,0,1,9,9,0,7,3...), Stream(1,1,1,1,2,8,8,8,4,2...)…
```
</details>

### Object

### Function

### More


- `fc.dictionary<T>(keyArb: Arbitrary<string>, valueArb: Arbitrary<T>): Arbitrary<{[Key:string]:T}>` dictionary containing keys generated using `keyArb` and values generated by `valueArb`
- `fc.record<T>(recordModel: {[Key:string]: Arbitrary<T>}): Arbitrary<{[Key:string]: T}>` or `fc.record<T>(recordModel: {[Key:string]: Arbitrary<T>}, constraints: RecordConstraints): Arbitrary<{[Key:string]: T}>` record using the incoming arbitraries to generate its values. It comes very useful when dealing with settings. It takes an optional parameter of type `RecordConstraints` to configure some of its properties. The setting `withDeletedKeys=true` instructs the record generator that it can omit some keys

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
