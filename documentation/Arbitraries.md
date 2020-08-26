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
// Examples of generated values: false, true…
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
// Examples of generated values: -15, -994490854, -1536816376, 7, -30…

fc.integer(1000)
// Examples of generated values: -5, -994490854, -1536816376, -3, -31…

fc.integer(-99, 99)
// Examples of generated values: -2, 28, 52, 3, 4…
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
// Examples of generated values: 16, 1152992794, 610667272, 7, 1…

fc.nat(1000)
// Examples of generated values: 0, 954, 215, 8, 7…
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
// Examples of generated values: 15, 7113953471524865, 1700981751375361, -28, 8…
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
// Examples of generated values: 38, 7113953471524864, 1700981751375360, 42, 41…
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
// Examples of generated values: 8.344650268554688e-7, 0.7237259149551392, 0.3986058235168457, 0.0000010728836059570312, 2.980232238769531e-7…

fc.float(100)
// Examples of generated values: 0.00008344650268554688, 72.37259149551392, 39.86058235168457, 0.00010728836059570312, 0.000029802322387695312…

fc.float(-100, 100)
// Examples of generated values: -99.99983310699463, 44.74518299102783, -20.27883529663086, -99.99978542327881, -99.99994039535522…
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
// Examples of generated values: 5.960464688481437e-8, 0.18093147873878634, 0.09965145587921309, 3.278255482630499e-7, 3.4272670956791984e-7…

fc.double(100)
// Examples of generated values: 0.000005960464688481437, 18.093147873878635, 9.96514558792131, 0.00003278255482630499, 0.000034272670956791984…

fc.double(-100, 100)
// Examples of generated values: -99.99998807907062, -63.81370425224273, -80.06970882415737, -99.99993443489035, -99.99993145465808…
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
// Examples of generated values: 1n, 0n, -2n, -1n…

fc.bigIntN(128)
// Examples of generated values: 2n, -78791682970687883872715694694804700727n, -121759137538751247807835793478555995587n, -35n, -22n…
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
// Examples of generated values: 63n, -26811420374949873220459578427973905722491267353767128852212759259818188893304n, -41432487515938364327065946798100351211572912006011611184534856508514021872561n, -39n, -45n…

fc.bigInt(0n, 12345678901234567890n)
// Examples of generated values: 11n, 4952066344324329434n, 2622795964881003898n, 9n, 14n…

fc.bigInt(-3000n, 100n)
// Examples of generated values: 2n, -2319n, -153n, -2n, 1n…
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
// Examples of generated values: 0n, 2n, 1n…

fc.bigUintN(128)
// Examples of generated values: 30n, 91349500489781347858971609021079405001n, 48382045921717983923851510237328110141n, 18n, 37n…
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
// Examples of generated values: 41n, 31084624243708224491325914076370048204143724979053153167516032744138375926664n, 16463557102719733384719545706243602715062080326808670835193935495442542947407n, 4n, 17n…

fc.bigUint(12345678901234567890n)
// Examples of generated values: 11n, 4952066344324329434n, 2622795964881003898n, 9n, 14n…
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
// Examples of generated values: "2", "a", "8", "1", "e"…
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
// Examples of generated values: "C", "a", "I", "A", "F"…
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
// Examples of generated values: "$", "8", "T", "\"", " "…
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
// Examples of generated values: "$", ":", "(", "\"", " "…
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
// Examples of generated values: ".", "옚", "鬈", "\"", "%"…
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
// Examples of generated values: ".", "䘚", "ଈ", "\"", "%"…
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
// Examples of generated values: "+", "󚸚", "𣬈", ")", "."…
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
// Examples of generated values: "", "a7984c84", "a6db51", "1b", "213bcfddc6"…

fc.hexaString(3)
// Examples of generated values: "", "a7", "b2", "ac", "7"…

fc.hexaString(4, 6)
// Examples of generated values: "2104", "a7984", "a6db5", "1b82", "b2b30"…
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
// Examples of generated values: "yBAk", "3JoU8IUF", "6W9r", "", "7A7DCABDBEBD8DcF"…

fc.base64String(8)
// Examples of generated values: "", "a3Jo", "Bb==", "hjbc", "as9ETt=="…

fc.base64String(4, 12)
// Examples of generated values: "yBAk", "a3JoU8IU", "W9rF", "BboAbI==", "A7DC"…
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
// Examples of generated values: "", "W|%=2Spc", "X1DZwS", "$d", "lbV7X&=<dH"…

fc.string(3)
// Examples of generated values: "", "W|", "F\"", "x#", "6"…

fc.string(4, 6)
// Examples of generated values: "(!$m", "W|%=2", "X1DZw", "$d0$", "F\" & "…
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
// Examples of generated values: "", "zWiHt\u001d(t", "\u001bv]Ke\u0012", "$;", "b\u0002C{|_=\u001e\r\u0017"…

fc.asciiString(3)
// Examples of generated values: "", "zW", "\u001c\"", ":\r", "7"…

fc.asciiString(4, 6)
// Examples of generated values: "\u0013!$\u0005", "zWiHt", "\u001bv]Ke", "$;H$", "\u001c\"\u001c& "…
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
// Examples of generated values: "", "蟚ҷ釉봨ﵔ衼䮈齔", "蕺བ쨽悫蕅ᓱ", ")ﮛ", "驂秡連ꤿᢝ杽ͬ乶"…

fc.unicodeString(3)
// Examples of generated values: "", "蟚ҷ", "壻*", "葬", "긗"…

fc.unicodeString(4, 6)
// Examples of generated values: "擲-,㥤", "蟚ҷ釉봨ﵔ", "蕺བ쨽悫蕅", ")ﮛ褨*", "壻*짻',"…
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
// Examples of generated values: "", "濚㒷쇉괨啔ၼ鎈읔", "敺肫볱", ")㎛", "凡C㷛譜ᄿ꽽ꍬ鹶"…

fc.string16bits(3)
// Examples of generated values: "", "濚㒷", "僻*", "ꖚꑬ", "옗"…

fc.string16bits(4, 6)
// Examples of generated values: "鳲-,셤", "濚㒷쇉괨啔", "敺肫", ")㎛脨*", "僻*釻',"…
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
// Examples of generated values: "", "񩟚􀲷󞧉󎔨􎵔򲁼򀎈𸝔", "󯵺񵽖򙨽񨢫񙵅򃓱", "$􃮛", "񅉂򭧡񓀣򠗛󒍜򀤿𛢝񄽽򔍬𮙶"…

fc.fullUnicodeString(3)
// Examples of generated values: "", "񩟚􀲷", "𑃻)", "񺖚󼑬", "昗"…

fc.fullUnicodeString(4, 6)
// Examples of generated values: "󳳲!2𡅤", "񩟚􀲷󞧉󎔨􎵔", "󯵺񵽖򙨽񨢫񙵅", "$􃮛񕤨2", "𑃻)󒇻&."…
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
// Examples of generated values: "", "a7984c84", "a6db51", "1b", "213bcfddc6"…

fc.stringOf(fc.char(), 3)
// Examples of generated values: "", "W|", "F\"", "x#", "6"…

fc.stringOf(fc.char(), 4, 6)
// Examples of generated values: "(!$m", "W|%=2", "X1DZw", "$d0$", "F\" & "…

fc.stringOf(fc.constantFrom('a', 'b'), 0, 5)
// Examples of generated values: "ba", "abba", "aabb", "a", "bbaa"…

fc.stringOf(fc.constantFrom('Hello', 'World'), 1, 3)
// Examples of generated values: "World", "HelloWorld", "HelloHello", "Hello", "WorldWorld"…
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
// Examples of generated values: "[]", "{\"2Spc0sZ\":false}", "[2103360753,-124859527,-10,-14,14]", "\"d\"", "[{\"gdb4ug\":0.660563301012142,\"j1]>zw\":0.21349769765518423},{},{\"w{\\\";MT\":-1727170679,\"\\\"dJ?X\":0.5942538986285973,\"\":false},[1780287332,\"!!:\\\"!\",\"S$%\",\"\",3.200502819433737e-7],[]]"…

fc.json(0)
// Examples of generated values: "false", "null", "1.3291357470190945e-7", "\"d\"", "2.6045108714178866e-7"…

fc.json(1)
// Examples of generated values: "[]", "{\"2Spc0sZ\":false}", "[2103360753,-124859527,-10,-14,14]", "\"d\"", "[null,false,9,true,7.450580741252821e-8]"…
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
// Examples of generated values: "[]", "{\"ﵔ衼䮈齔댅韛㹦\":false}", "[2103360753,-124859527,-10,-14,14]", "\"ﮛ\"", "[{\"Ⰺ쫜幞ꩀ๠햅\":0.660563301012142,\"羽⢠׮튋臸\":0.21349769765518423},{},{\"聏늅↨ꬌ易ᆷ\":-1727170679,\"翣흨ᒅ䝦⩷\":0.5942538986285973,\"\":false},[1780287332,\"(!㿙!/\",\"흇(-\",\"\",3.200502819433737e-7],[]]"…

fc.unicodeJson(0)
// Examples of generated values: "false", "null", "1.3291357470190945e-7", "\"ﮛ\"", "2.6045108714178866e-7"…

fc.unicodeJson(1)
// Examples of generated values: "[]", "{\"ﵔ衼䮈齔댅韛㹦\":false}", "[2103360753,-124859527,-10,-14,14]", "\"ﮛ\"", "[null,false,9,true,7.450580741252821e-8]"…
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
// Examples of generated values: "tristique ullamcorper morbi", "quam gravida nulla non blandit", "nulla egestas consectetuer", "fusce libero", "consequat erat ligula"…

fc.lorem(3)
// Examples of generated values: "tristique", "quam gravida", "nulla egestas", "fusce", "consequat erat"…

fc.lorem(3, true)
// Examples of generated values: "Morbi metus molestie, porttitor, lacus porttitor, consequat augue consectetuer.", "Gravida. Non blandit proin congue lobortis in.", "Egestas consectetuer non consequat ultrices adipiscing mauris. Sapien varius posuere.", "Aenean suscipit vel ante nunc suscipit.", "Ligula molestie, nisl integer. Lobortis a, in at velit enim curae."…
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
// Examples of generated values: "6.1.6.242", "26.7.40.4", "8.6.171.241", "2.4.101.41", "5.5.246.1"…
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
// Examples of generated values: "0x1.13", "027", "06.69.0xcb79", "4.060231633", "0x5.0x2.40.4"…
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
// Examples of generated values: "04::b1", "4:b::1:2.48.136.81", "::1f:61:9ba:0", "b9:b:c:b:309:607:9:0", "::b6:1b8:ace0:5:7:0:5"…
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
// Examples of generated values: "0000000e-001d-1000-8000-001800ed23f2", "44b9461a-001d-1000-b35a-ad280000001c", "24660b08-0014-1000-975b-80abfd5ebcf1", "00000012-0009-1000-8abd-b965eaae5c29", "00000005-000d-1000-8bd4-1ff600000001"…
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
// Examples of generated values: "0000000e-0011-3000-8000-001800ed23f2", "44b9461a-0003-3000-b35a-ad280000001c", "24660b08-000e-3000-975b-80abfd5ebcf1", "00000012-0014-3000-8abd-b965eaae5c29", "00000005-000d-3000-8bd4-1ff600000001"…

fc.uuidV(5)
// Examples of generated values: "0000000e-0011-5000-8000-001800ed23f2", "44b9461a-0003-5000-b35a-ad280000001c", "24660b08-000e-5000-975b-80abfd5ebcf1", "00000012-0014-5000-8abd-b965eaae5c29", "00000005-000d-5000-8bd4-1ff600000001"…
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
// Examples of generated values: "s.8.y40gd.uw", "81u3tvl23k4.6e.wema40ylrts.r3d695.u-eblf.djdcacez", "4.vt83duan.8r68rjx8w.csbbincko", "bok71i1a.agjzp4d.zdstdcbuk", "xdcabdbebdld.mh4ce.fidbfbn5lfwb.bibl"…
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

*&#8195;Usages*

```js
fc.webAuthority()
// Examples of generated values: "abz0c.by.bd", "ad.e.fbd.ymj", "l3dualxl.bzdc", "fk71i1if.aecedeoac", "bb1m5zg6.s.mbvwfe.vadajfr"…
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
// Examples of generated values: "", "PB'X5%F2%8C%AD%96:2", "QDPndn", "P%F1%95%A4%A8", "ve*A!%F1%82%A9%BC3w/B"…
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
// Examples of generated values: "", "PB'X5%F2%8C%AD%96:2", "QDPndn", "P%F1%95%A4%A8", "ve*A!%F1%82%A9%BC3w/B"…
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
// Examples of generated values: "", "9By0U%F2%8C%AD%96k,", "U4::0T", "0%F1%95%A4%A8", "bua$W%F1%82%A9%BC)L8w"…
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

*&#8195;Usages*

```js
fc.webUrl()
// Examples of generated values: "http://bn4cd9ade7al.wedd.d.fwe1dl.xxkeuxz/tM%F0%90%A4%BFm+BTf/@*jHv%F3%9C%B6%82BvSs/0I+G%F2%91%A2%90S+Vc/2X_y&", "https://c.ged/n,Hlvw/c'g/0-", "https://ndy.hzcnmubzz/bcj/gb/F4MdU/f/%F1%8B%BA%B7i%F0%9D%A9%AEG)7QJ/Tr/&/=l;", "http://1iif.dq.rwbyrzouz/dd", "http://azgoa.bwfdxw3n.cavph4caa.h.vx/dcQ)O/%F2%BC%9F%B3al5s+3'!/s=%F4%83%BD%87)%F2%BF%A0%8DpzY%F3%A6%B8%9C/%F1%93%9D%8EU/.bS;%31cfof/DSL2cbK/a%F1%A8%BF%99'hngd.d"…
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
// Examples of generated values: "8i_p#6u^o.|6vsvv`~8.cb@wsi4uukteg.v.hjaiwwb", "?.370fmb.+k8k.-d%a.amo@2.j.s534.ud4d.wl1dmsfraxq.acezc", "6g^rb`b.4n*.5@pjl.9fmb9iepew.cpx2euuwr.2c6ct6.afhriqh", "gcbpat.q9-ts*nt@50caeehfdi.ve", "ryhk.aa02|cm.bf@mph4canndxlj.jcajz9efnfs.79.4w9fq3qbtba.2ui0ju.jclbr"…
```
</details>

<details>
<summary><b>mixedCase</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#mixedcase">api</a>]</summary><br/>

*&#8195;Description*

> Switch the case of characters generated by an underlying arbitrary

*&#8195;Signatures*

- `fc.mixedCase(stringArb)` — _randomly switch the case of characters generated by `stringArb`_
- `fc.mixedCase(stringArb, {toggleCase?})` — _randomly switch the case of characters generated by `stringArb` based on passed [`constraints`](https://dubzzz.github.io/fast-check/interfaces/mixedcaseconstraints.html)_

*&#8195;Usages*

```js
fc.mixedCase(fc.hexaString())
// Examples of generated values: "e892Ed", "Aa7", "8A6db51F", "22", "565b6a1b"…

fc.mixedCase(fc.constant('hello world'))
// Examples of generated values: "hElLo WorLD", "HELlO wOrLd", "HeLlo woRLd", "hElLO WOrld", "helLo worLD"…

fc.mixedCase(
  fc.constant('hello world'),
  {
    toggleCase: (rawChar) => `UP(${rawChar})`,
  }
)
// Examples of generated values: "hUP(e)lUP(l)oUP( )woUP(r)UP(l)d", "UP(h)UP(e)UP(l)lUP(o) UP(w)oUP(r)lUP(d)", "UP(h)eUP(l)lo wUP(o)UP(r)lUP(d)", "hUP(e)lUP(l)UP(o)UP( )UP(w)orlUP(d)", "helUP(l)o woUP(r)UP(l)UP(d)"…
```
</details>

- `fc.json()` or `fc.json(maxDepth: number)` json strings having keys generated using `fc.string()`. String values are also produced by `fc.string()`
- `fc.unicodeJson()` or `fc.unicodeJson(maxDepth: number)` json strings having keys generated using `fc.unicodeString()`. String values are also produced by `fc.unicodeString()`
- `fc.lorem()`, `fc.lorem(maxWordsCount: number)` or `fc.lorem(maxWordsCount: number, sentencesMode: boolean)` lorem ipsum strings. Generator can be configured by giving it a maximum number of characters by using `maxWordsCount` or switching the mode to sentences by setting `sentencesMode` to `true` in which case `maxWordsCount` is used to cap the number of sentences allowed
- `fc.ipV4()` IP v4 strings
- `fc.ipV4Extended()` IP v4 strings including all the formats supported by WhatWG standard (for instance: 0x6f.9)
- `fc.ipV6()` IP v6 strings
- `fc.uuid()` UUID strings having only digits in 0-9a-f (only versions in v1 to v5)
- `fc.uuidV(versionNumber: 1|2|3|4|5)` UUID strings for a specific UUID version only digits in 0-9a-f
- `fc.domain()` Domain name with extension following RFC 1034, RFC 1123 and WHATWG URL Standard
- `fc.webAuthority()` Web authority following RFC 3986
- `fc.webFragments()` Fragments to build an URI. Fragment is the optional part right after the # in an URI
- `fc.webQueryParameters()` Query parameters to build an URI. Fragment is the optional part right after the ? in an URI
- `fc.webSegment()` Web URL path segment
- `fc.webUrl()` Web URL following the specs specified by RFC 3986 and WHATWG URL Standard
- `fc.emailAddress()` Email address following RFC 1123 and RFC 5322
- `fc.mixedCase(stringArb: Arbitrary<string>)` or `fc.mixedCase(stringArb: Arbitrary<string>, constraints: MixedCaseConstraints)` Randomly switch the case of characters generated by `stringArb`

## Date (:Date)

- `fc.date()` or `fc.date({min?: Date, max?: Date})` any date between new Date(-8640000000000000) or min (included) to new Date(8640000000000000) or max (included)

## Falsy (:any)

- `fc.falsy()` one of `false`, `null`, `undefined`, `0`, `''`, or `Number.NaN`
- `fc.falsy({ withBigInt: true })` one of `false`, `null`, `undefined`, `0`, `''`, `Number.NaN` or `0n`

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
