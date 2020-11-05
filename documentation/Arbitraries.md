# [:house:](../README.md) Arbitraries

Property based testing frameworks rely on two main building blocks:
- [Runners](./Runners.md) — _they are responsible to run, execute and check that properties stay true whatever the generated value_
- Arbitraries — _they are responsible for the random *but deterministic* generation of values, they may also offer shrinking capabilities_

This documentation lists all the built-in arbitraries provided by `fast-check`. Please note that you can still create your own ones by either [combining them together](#combinators) or by [building it from scratch](./AdvancedArbitraries.md#build-your-own). You can refer also to the [API Reference](https://dubzzz.github.io/fast-check/) for more details.

In a nutshell, when defining your tests and properties you will have to combine both the [Runners](./Runners.md) and Arbitraries as follow:

```js
fc.assert( // run the property several times (in other words execute the test)
  fc.property( // define the property: arbitrary and what should be observed (predicate)
    arb1, arb2, ..., // 1 to +infinity arbitraries
    (valueGeneratedByArb1, alueGeneratedByArb2, ...) => { // predicate receives generated values
      // In case of success: No return, 'return undefined' or 'return true'
      // In case of failure: Throw or 'return false'
    }
  )
)

// Example:
fc.assert(
  fc.property(
    fc.string(), fc.string(), fc.string(),
    (a, b, c) => isSubstring(b, a + b + c),
  )
)
```

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
- [Combinators](#combinators)
  - [Simple](#simple)
  - [Array](#array)
  - [Object](#object)
  - [Function](#function)
  - [Recursive structures](#recursive-structures)
  - [More](#more)
- [Others](#others)
- [Going further?](#going-further)

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
- `fc.integer({min?, max?})`
- `fc.integer(min, max)`
- _`fc.integer(max)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_

*&#8195;with:*

- `min?` — default: `-2147483648` — _lower bound of the range (included)_
- `max?` — default: `2147483647` — _upper bound of the range (included)_

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

fc.integer({min: -99, max: 99})
// Note: All possible integers between `-99` (included) and `99` (included)
// Examples of generated values: -4, 4, 8, 2, 1…

fc.integer({min: 65536})
// Note: All possible integers between `65536` (included) and `2147483647` (included)
// Examples of generated values: 65557, 65547, 65562, 1836480947, 1490866554…
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
- `fc.nat({max?})`
- `fc.nat(max)`

*&#8195;with:*

- `max?` — default: `2147483647` — _upper bound of the range (included)_

*&#8195;Usages*

```js
fc.nat()
// Note: All possible integers between `0` (included) and `2147483647` (included)
// Examples of generated values: 16, 1747563639, 0, 2075457316, 2146229148…

fc.nat(1000)
// Note: All possible integers between `0` (included) and `1000` (included)
// Examples of generated values: 299, 1, 225, 750, 4…

fc.nat({max: 1000})
// Note: All possible integers between `0` (included) and `1000` (included)
// Examples of generated values: 0, 833, 7, 496, 4…
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
// Examples of generated values: 36, 7332126275469769, 48, -8631085038818688, 417563055004249…
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
// Examples of generated values: 44, 5859827138257099, 16, 5028419509524314, 53…
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
- `fc.float({min?, max?})`
- `fc.float(min, max)`
- _`fc.float(max)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_

*&#8195;with:*

- `min?` — default: `0.0` — _lower bound of the range (included)_
- `max?` — default: `1.0` — _upper bound of the range (excluded)_

*&#8195;Usages*

```js
fc.float()
// Note: All possible 32-bit floating point values between `0.0` (included) and `1.0` (excluded)
// Examples of generated values: 0.731347382068634, 1.1920928955078125e-7, 0.6597227454185486, 0.5946863293647766, 0.6302104592323303…

fc.float({max: 100})
// Note: All possible 32-bit floating point values between `0.0` (included) and `100.0` (excluded)
// Examples of generated values: 0.00004172325134277344, 0.000011920928955078125, 0.0001251697540283203, 60.498785972595215, 0.000029802322387695312…

fc.float({min: -100, max: 100})
// Note: All possible 32-bit floating point values between `-100.0` (included) and `100.0` (excluded)
// Examples of generated values: -99.9997615814209, -99.99988079071045, 81.314218044281, -99.99974966049194, -99.99978542327881…
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
- `fc.double({min?, max?})`
- `fc.double(min, max)`
- _`fc.double(max)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_

*&#8195;with:*

- `min?` — default: `0.0` — _lower bound of the range (included)_
- `max?` — default: `1.0` — _upper bound of the range (excluded)_

*&#8195;Usages*

```js
fc.double()
// Note: All possible floating point values between `0.0` (included) and `1.0` (excluded)
// Examples of generated values: 0.4530413804731288, 0.8226463198661805, 0.3829372459587349, 0.7186836451292051, 0.8065718412399292…

fc.double({max: 100})
// Note: All possible floating point values between `0.0` (included) and `100.0` (excluded)
// Examples of generated values: 78.93341034650808, 0.000034884977251348204, 98.5225079632713, 10.198144676861675, 0.000008702743647948097…

fc.double({min: -100, max: 100})
// Note: All possible floating point values between `-100.0` (included) and `100.0` (excluded)
// Examples of generated values: -99.99994117592425, 37.9800438880923, 1.4435261487962805, -99.9999970197672, -99.99993741512299…
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
// Examples of generated values:
// • 118965438702305362498464591014723682065n
// • -55529428019749399595111693273573678376n
// • -45882741802961890031345972148576150745n
// • 88162568694395329699188080847279292274n
// • -18663446021429702481819240863645317485n
// • …
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
- `fc.bigInt({min?, max?})`
- `fc.bigInt(min, max)`

*&#8195;with:*

- `min?` — _lower bound of the range (included)_
- `max?` — _upper bound of the range (included)_

*&#8195;Usages*

```js
fc.bigInt()
// Examples of generated values:
// • -55267127471484960134228883170671517601140668833043648279881539595328866477336n
// • -320877373404846693351482506498287829328651053618510591877443861350691412062n
// • 22403846480109971796256164379798253424379083455297331933513006716677124261164n
// • 46531564263119251593570768169779548000260571947054149902092502970846442652567n
// • -27488731055093319143645334041335559432506843454739800192508819981052054802083n
// • …

fc.bigInt({min: 0n, max: 12345678901234567890n})
// Note: All possible bigint values between `0n` (included) and `12345678901234567890n` (included)
// Examples of generated values: 19n, 11376877730870697597n, 1349784798053983117n, 11n, 3n…

fc.bigInt({min: -3000n, max: 100n})
// Note: All possible bigint values between `-3000n` (included) and `100n` (included)
// Examples of generated values: -1169n, 0n, 2n, -4n, -2680n…

fc.bigInt({min: 1n << 64n})
// Note: Any possible bigint value greater or equal to `1n << 64n`
// Examples of generated values:
// • 32214219993684643449722944918025059692370181015953432795318507902966520589940n
// • 39382683564378805230116691834855902707168271164394481253375072148371261997983n
// • 57219012822578120981130257612614965800502300168860147954523587474583795051388n
// • 25423414325897465771981521346031075469986997563517783083160644823268642168363n
// • 18446744073709551676n
// • …
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
// Examples of generated values:
// • 86341151263089925165504430453367665188n
// • 28n
// • 328981524291263435470719008913591905663n
// • 279866238908824165638381771934770854596n
// • 111395503858026070299201611333616927272n
// • …
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
- `fc.bigUint({max?})`
- `fc.bigUint(max)`

*&#8195;with:*

- `max?` — _upper bound of the range (included)_

*&#8195;Usages*

```js
fc.bigUint()
// Examples of generated values:
// • 98415346800826680180868623901081769911550846942931679526483139707297824018492n
// • 81847654831253862250960947754551199482417759415227376695916153744999991292122n
// • 88192025501918677973672101265075531420107830828023254720275072280209923428999n
// • 46027806054858042993090394331470161808813263449611553513658034830595160464971n
// • 18n
// • …

fc.bigUint({max: 12345678901234567890n})
// Note: All possible bigint values between `0n` (included) and `12345678901234567890n` (included)
// Examples of generated values: 2140173898915155879n, 4446193883774321594n, 11n, 5n, 16n…
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
- `fc.hexaString({minLength?, maxLength?})`
- _`fc.hexaString(maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_
- _`fc.hexaString(minLength, maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_

*&#8195;with:*

- `minLength?` — default: `0` — _minimal number of characters (included)_
- `maxLength?` — default: `2 * minLength + 10` — _maximal number of characters (included)_

*&#8195;Usages*

```js
fc.hexaString()
// Examples of generated values: "0e0", "bf2", "3", "a9cb", "302122"…

fc.hexaString({maxLength: 3})
// Note: Any hexadecimal string containing up to 3 (included) characters
// Examples of generated values: "", "c", "3", "1", "c0"…

fc.hexaString({minLength: 3})
// Note: Any hexadecimal string containing at least 3 (included) characters
// Examples of generated values: "12f", "c63ba2", "331163", "1e412e", "32e47900"…

fc.hexaString({minLength: 4, maxLength: 6})
// Note: Any hexadecimal string containing between 4 (included) and 6 (included) characters
// Examples of generated values: "30310", "2f411", "db35", "0103", "09a7ba"…
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
- `fc.base64String({minLength?, maxLength?})`
- _`fc.base64String(maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_
- _`fc.base64String(minLength, maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_

*&#8195;with:*

- `minLength?` — default: `0` — _minimal number of characters (included)_
- `maxLength?` — default: `2 * minLength + 10` — _maximal number of characters (included if multiple of 4)_

_When using `minLength` and `maxLength` make sure that they are compatible together. For instance: asking for `minLength=2` and `maxLength=3` is impossible for base64 strings as produced by the framework_

*&#8195;Usages*

```js
fc.base64String()
// Examples of generated values: "rgk=", "Bd==", "D/Ev", "xB==", "VF=="…

fc.base64String({maxLength: 8})
// Note: Any base64 string containing up to 8 (included) characters
// Examples of generated values: "", "YycWxD==", "AE==", "udGB73==", "xBk="…

fc.base64String({minLength: 8})
// Note: Any base64 string containing at least 8 (included) characters
// Examples of generated values: "AFCCAEDc", "FwBPvpeEFN5C", "7WXEBForaL==", "YycWxDDCEKMsIDFFFC9FDFA=", "AEFx/rDpOlF="…

fc.base64String({minLength: 4, maxLength: 12})
// Note: Any base64 string containing between 4 (included) and 12 (included) characters
// Examples of generated values: "rUs8bJfAngr=", "uFAtWI==", "rB42AD==", "ETCP", "C379"…
```
</details>

<details>
<summary><b>string</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#string">api</a>]</summary><br/>

*&#8195;Description*

> String containing characters produced by `fc.char()`

*&#8195;Signatures*

- `fc.string()`
- `fc.string({minLength?, maxLength?})`
- _`fc.string(maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_
- _`fc.string(minLength, maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_

*&#8195;with:*

- `minLength?` — default: `0` — _minimal number of characters (included)_
- `maxLength?` — default: `2 * minLength + 10` — _maximal number of characters (included)_

*&#8195;Usages*

```js
fc.string()
// Examples of generated values: ".A%", "aM{]xTH&)", "^NLpz5/y", "", "eqr"…

fc.string({maxLength: 3})
// Note: Any string containing up to 3 (included) characters
// Examples of generated values: "", "~*2", "{Z", "[\"", "jlZ"…

fc.string({minLength: 3})
// Note: Any string containing at least 3 (included) characters
// Examples of generated values: "W=*$Fm V4Yf4<qC", "JeT[#", "~*2[s\\,qgwio", "nDL?K[,", "{Z:gG\")"…

fc.string({minLength: 4, maxLength: 6})
// Note: Any string containing between 4 (included) and 6 (included) characters
// Examples of generated values: "x<H+`", "&}\"\"", " \"\"x ", "#P%[&", "z YR"…
```
</details>

<details>
<summary><b>asciiString</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#asciistring">api</a>]</summary><br/>

*&#8195;Description*

> ASCII string containing characters produced by `fc.ascii()`

*&#8195;Signatures*

- `fc.asciiString()`
- `fc.asciiString({minLength?, maxLength?})`
- _`fc.asciiString(maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_
- _`fc.asciiString(minLength, maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_

*&#8195;with:*

- `minLength?` — default: `0` — _minimal number of characters (included)_
- `maxLength?` — default: `2 * minLength + 10` — _maximal number of characters (included)_

*&#8195;Usages*

```js
fc.asciiString()
// Examples of generated values: "2u1\u001aWQ", "", "*y", "\bT\u0013.\u0017|h&>", "si3\u0016`kA\u0017\u0004"…

fc.asciiString({maxLength: 3})
// Note: Any ascii string containing up to 3 (included) characters
// Examples of generated values: "\"", "vC", "", "'\u0010*", "%"…

fc.asciiString({minLength: 3})
// Note: Any ascii string containing at least 3 (included) characters
// Examples of generated values: "\"N $W%pE)&\u0001o", "vCkn&}{", "\"O\u0006", "'\u0010*6ua\u0017JEpG\u000bg<#\u0007", "%%&\u0018#K"…

fc.asciiString({minLength: 4, maxLength: 6})
// Note: Any ascii string containing between 4 (included) and 6 (included) characters
// Examples of generated values: "0(0E&", "!.Qj?-", "V\u0002\u0014z\fT", "%8Z&", "\u0007U\u0006t#"…
```
</details>

<details>
<summary><b>unicodeString</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#unicodestring">api</a>]</summary><br/>

*&#8195;Description*

> Unicode string containing characters produced by `fc.unicode()`

*&#8195;Signatures*

- `fc.unicodeString()`
- `fc.unicodeString({minLength?, maxLength?})`
- _`fc.unicodeString(maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_
- _`fc.unicodeString(minLength, maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_

*&#8195;with:*

- `minLength?` — default: `0` — _minimal number of characters (included)_
- `maxLength?` — default: `2 * minLength + 10` — _maximal number of characters (included)_

*&#8195;Usages*

```js
fc.unicodeString()
// Examples of generated values: "", "ॗﰗ騈!+().俅", "㚗", "娇\u001eᨫ㽹矌", "┛䅯퉳"…

fc.unicodeString({maxLength: 3})
// Note: Any unicode (from BMP-plan) string containing up to 3 (included) characters
// Examples of generated values: "(", "", "⇾燏", ".!", "ሖꧾㆳ"…

fc.unicodeString({minLength: 3})
// Note: Any unicode (from BMP-plan) string containing at least 3 (included) characters
// Examples of generated values: "(傚䀘$' .ḙ葢!'#봔", "杮಴⿆뎶蝐母쪀㩑ᶔ䰚搞慢䲉欐", "⇾燏ᅙ秱뵴ꇺ꿵玽鄧돟鐎䕝ᑿ", ".!\"䠢!", "+)꺇䪎-"…

fc.unicodeString({minLength: 4, maxLength: 6})
// Note: Any unicode (from BMP-plan) string containing between 4 (included) and 6 (included) characters
// Examples of generated values: "紫ᡔ楬莼媛", "ኮ࿅$蘭", "ū-호ٶ(#", ",䙓*ꅏ", "랂巻ᗽ"…
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
- `fc.string16bits({minLength?, maxLength?})`
- _`fc.string16bits(maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_
- _`fc.string16bits(minLength, maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_

*&#8195;with:*

- `minLength?` — default: `0` — _minimal number of characters (included)_
- `maxLength?` — default: `2 * minLength + 10` — _maximal number of characters (included)_

*&#8195;Usages*

```js
fc.string16bits()
// Examples of generated values: "埫쒠爤", "-ꎝ", "૑ᚃ⵿⫄㖯孞℠", "⤱黁醙", "⦕끅Ȩ鋑\uda43"…

fc.string16bits({maxLength: 3})
// Note: Any string (not really legal ones sometimes) containing up to 3 (included) characters
// Examples of generated values: "", "!", "ऻ㨖ẗ", "ﾮ뾝꜆", "㓱"…

fc.string16bits({minLength: 3})
// Note: Any string (not really legal ones sometimes) containing at least 3 (included) characters
// Examples of generated values: "徵\"!", "!環ﮁ婏", "ऻ㨖ẗ倄쾁伅周쀫", "䯘趲䴜", "\"$/꫿"…

fc.string16bits({minLength: 4, maxLength: 6})
// Note: Any string (not really legal ones sometimes) containing between 4 (included) and 6 (included) characters
// Examples of generated values: "孢\udbcd퉭⻵", "↩㄁\ude77䟾鏹撜", "軫쒍.⦯)", "旲\"廤⾛/", "䵬ଛ쩀蛩‮৶"…
```
</details>

<details>
<summary><b>fullUnicodeString</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#fullunicodestring">api</a>]</summary><br/>

*&#8195;Description*

> Unicode string containing characters produced by `fc.fullUnicode()`

*&#8195;Signatures*

- `fc.fullUnicodeString()`
- `fc.fullUnicodeString({minLength?, maxLength?})`
- _`fc.fullUnicodeString(maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_
- _`fc.fullUnicodeString(minLength, maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_

*&#8195;with:*

- `minLength?` — default: `0` — _minimal number of characters (included)_
- `maxLength?` — default: `2 * minLength + 10` — _maximal number of characters (included)_

_Be aware that the length is considered in terms of the number of glyphs in the string and not the number of UTF-16 characters. As a consequence `generatedString.length` might be greater than the asked maximal length but `[...generatedString].length` will not and always be in the required range_

*&#8195;Usages*

```js
fc.fullUnicodeString()
// Examples of generated values: "𾪖򘔼򭐂񿈋𰥞", "񫪥񫹚򻰌4", "󘅽󘺂򦀵򈄓񧟵", "󥐫򱡭􌺛愋Ꚁ𻧗ᨘ񀄮􍹣", "򈼴$3򴿦0#񵰀($'"…

fc.fullUnicodeString({maxLength: 3})
// Note: Any unicode string containing up to 3 (included) code-points
// Examples of generated values: "🷣", "𪇍򱲆", "", "󟙀", "򒎧"…

fc.fullUnicodeString({minLength: 3})
// Note: Any unicode string containing at least 3 (included) code-points
// Examples of generated values: "🷣󸯜򎪳񖶌󪊀򳘟𙂄󟠷󄏧𰷡", "𪇍򱲆𖰌󣉄𵨡𻥕𰆏򦇘󜁳򁿳򎗯􈤘񖇅󑃙񡳏", "򞭽𜔱򠹉", "󔌧򞡺.+񠜡", "𞄊􊪆󧁴𦳫󇗋𨖸񉵊򫧏𞩻󓖞򼦃𘅏񀔾"…

fc.fullUnicodeString({minLength: 4, maxLength: 6})
// Note: Any unicode string containing between 4 (included) and 6 (included) code-points
// Examples of generated values: "񅈡򅰻񱅜򾐬񲆗񃯹", "𕩴𦿗񙷦2󥮁", "!񭕞+,&!", "/𽍖,񟟺", "%,)󫨚"…
```
</details>

<details>
<summary><b>stringOf</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#stringof">api</a>]</summary><br/>

*&#8195;Description*

> String containing characters produced by the passed character generator

*&#8195;Signatures*

- `fc.stringOf(charArb)`
- `fc.stringOf(charArb, {minLength?, maxLength?})`
- _`fc.stringOf(charArb, maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_
- _`fc.stringOf(charArb, minLength, maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_

*&#8195;with:*

- `charArb` — _arbitrary able to generate random strings (possibly multiple characters)_
- `minLength?` — default: `0` — _minimal number of characters (included)_
- `maxLength?` — default: `2 * minLength + 10` — _maximal number of characters (included)_

*&#8195;Usages*

```js
fc.stringOf(fc.hexa())
// Examples of generated values: "6c2be", "5ac3", "d2535", "bdbb078e3", "4116130013"…

fc.stringOf(fc.char(), {maxLength: 3})
// Note: Any string containing up to 3 (included) characters extracted from `fc.char()`
// Examples of generated values: "$", "KU", ")H", "", "Z"…

fc.stringOf(fc.char(), {minLength: 4, maxLength: 6})
// Note: Any string containing between 4 (included) and 6 (included) characters extracted from `fc.char()`
// Examples of generated values: "*jlRI", "}<6Fm", "4P $ ", "Q#b&", "ZgIk"…

fc.stringOf(fc.constantFrom('a', 'b'), {maxLength: 5})
// Note: Any string containing between 0 (included) and 5 (included) characters extracted from `fc.constantFrom('a', 'b')`
// Examples of generated values: "bbb", "b", "", "ab", "baa"…

fc.stringOf(fc.constantFrom('Hello', 'World'), {minLength: 1, maxLength: 3})
// Note: It might produce strings like "WorldWorldWorld" or "WorldHelloWorld"…
// Examples of generated values: "WorldWorldHello", "World", "HelloHello", "Hello", "WorldHello"…
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
- `fc.json({maxDepth?})`
- _`fc.json(maxDepth)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_

*&#8195;with:*

- `maxDepth?` — _maximal depth of generated objects_

*&#8195;Usages*

```js
fc.json()
// Examples of generated values:
// • "{\"gDS6ixj)R+\":{\"&>4q\":0.6855670565390797,\".4$\":0.32668776759973894,\"[,Dk$XNln-\":0.6499382656006383},\"W<m$%th\":{\"Dcedl|\":true},\"Qk\":-1159147041}"
// • "true"
// • "{\"0J4\":{\"6nY3)\\\"\":\";8Y8nAf'@\",\"D';_'3Lc\":true}}"
// • "[null,null]"
// • "{}"
// • …

fc.json({maxDepth: 0})
// Examples of generated values: "0.18608385079037526", "false", "null", "0.25584162771702035", "true"…

fc.json({maxDepth: 1})
// Examples of generated values:
// • "{\"mTZw9f!~2\":null,\"W\":null,\"N'!U6\":null,\"x\":null,\"=l]l\":null}"
// • "{\"#\":3.494583413754526e-7,\"CyPnYYJ\\\\N\":0.9551698971333347,\"&%J\":null,\"HSz2u=t6J\":null}"
// • "{\" !t! #.V\":null,\"%#!kPE&?6\":6.253999207395111e-8}"
// • "{\"|\":false,\"*I\":0.8821854617928871,\"r(>uO\":\"I$2`I_6@\",\"N'q\":null}"
// • "[0.7470952319262365,0.7422909334763742,0.0069430153745627665]"
// • …
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
- `fc.unicodeJson({maxDepth?})`
- _`fc.unicodeJson(maxDepth)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_

*&#8195;with:*

- `maxDepth?` — _maximal depth of generated objects_

*&#8195;Usages*

```js
fc.unicodeJson()
// Examples of generated values:
// • "[0.09723462893806001]"
// • "{\"荌鏊턳ᦖ\":false,\"냚鶖뜥\":false}"
// • "{\"\":true,\"䷷ꔼꊐ㍂Ꮋ⧭얘\":false,\"镐菋⹥埒䘺懘ྎᶃ硾넍\":false,\"䶩လ뎙丯㷲ퟬ\":true,\"勯吓ᯇป蹥ꕪ渘Ǭ傟\":false}"
// • "{\"\":[],\"ᐞ淙\":[]}"
// • "{\"迵끀꧋좡ꏶ塣퐼띞\":{\"䧎﹥ï\":null},\"ቈ保婠꠨旞荫㹢ފ\":{\"콆쳑Ｈ᜞紽ѳ㑓\":false},\"\":{\"ꉶ瀞뿱끮筡팹᧊\":0.9470328025826398},\"끨\":1001562014,\"薀ɿ⫝̸挖\":{\"顅蓦⋨뢫\":0.8487552623602803,\"ঞ\":0.7280241452947824}}"
// • …

fc.unicodeJson({maxDepth: 0})
// Examples of generated values: "10", "1898171291", "null", "0.22572752833366638", "0.026702941895505816"…

fc.unicodeJson({maxDepth: 1})
// Examples of generated values: "10", "1898171291", "null", "[]", "0.026702941895505816"…
```
</details>

<details>
<summary><b>lorem</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#lorem">api</a>]</summary><br/>

*&#8195;Description*

> Lorem ipsum values

*&#8195;Signatures*

- `fc.lorem()`
- `fc.lorem({maxCount?, mode?})`
- _`fc.lorem(maxWordsCount)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_
- _`fc.lorem(maxCount, sentenceMode)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_

*&#8195;with:*

- `maxCount?` — default: `5` — if `sentenceMode` is `true`: lorem ipsum sentence containing at most `maxCount` sentences, otherwise: containing at most `maxCount` words_
- `mode?` — default: `"words"` — _enable sentence mode by setting its value to `"sentences"`_
- `maxWordsCount?` — _maximal number of words to produce_
- `sentenceMode?` — default: `false` — _enable sentence mode_

_Except if you specified `sentenceMode=true`, `fc.lorem` defaults to words mode_

*&#8195;Usages*

```js
fc.lorem()
// Examples of generated values: "arcu fusce", "dolor mi dignissim", "felis lacus", "ligula nec curae sed enim", "tincidunt vivamus massa"…

fc.lorem({maxCount: 3})
// Examples of generated values: "praesent libero sodales", "mi adipiscing", "ut duis vitae", "mi elementum gravida", "non"…

fc.lorem({maxCount: 3, mode: "sentences"})
// Examples of generated values:
// • "Sed faucibus, sit praesent. Justo id, nisl fusce tempor sit convallis. Non consectetur in scelerisque mauris morbi sollicitudin augue, nulla mauris leo."
// • "Tempus. Tristique."
// • "Diam faucibus lorem fermentum mauris lorem dignissim consequat semper nunc."
// • "Id, cubilia in mi enim in proin adipiscing ut, risus."
// • "Rhoncus in hendrerit faucibus sed sapien et."
// • …
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
// Examples of generated values:
// • "00000011-4f8b-453e-9cff-3169385e0b28"
// • "0000000f-71a5-4c31-9641-b23cddac94de"
// • "00000009-0010-1000-9066-e2e900000012"
// • "8d6aee62-001d-1000-9e74-70f85c4a78a3"
// • "c2156fdd-0005-1000-8000-000f885e6180"
// • …
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
// Examples of generated values:
// • "05cfea14-bcac-3b1b-8d87-f0d200000012"
// • "7f4a63cc-0015-3000-8000-001a00000016"
// • "b18820b3-04b5-347a-a800-88270000001d"
// • "e6dfee9b-0008-3000-acfc-19f200000010"
// • "4339edf8-0002-3000-8000-001b00000008"
// • …

fc.uuidV(5)
// Examples of generated values:
// • "d9951cc0-0008-5000-bf71-d40b793c6139"
// • "b4f42187-7bd2-5385-8000-0006a6b393bf"
// • "c2faeae2-2bd2-51a4-81e8-3f5800000018"
// • "65c2d0a5-0016-5000-8000-001828816d24"
// • "00000019-000c-5000-8000-000a0000000e"
// • …
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
// Examples of generated values:
// • "j6ib52zarm-s0pkuvhqm1mv0scq9ta1k7is18a6npwo09.8oylufs6xjggc-g5wx6pp7-n.depaeed"
// • "00cwuvaxlmcydtgdl2y5gq52nb-gochrfw7luhm3eak87xjmn34l4h-a.lynftw-jcilddpshg-fjbdvglnrklnjfv.1p9hkvkxac9odexa6220t2i2f5gtplj91iv3hcdf55tnysx2.syxfs0gon3vrv7r-n09qd-tvzkfj4vx-90is8a7857j77s04kkfuixb9fnuf.sm4qu34yox0j0l3g8rvkbi56h4.aebabjdnl"
// • "35b10n-lu6vxe25muuwxcou2vg-ooho0ba-7fr9s-s2r9dzi-oph9tnb6ucc70l.l.amrqhh-q3yiac3zh83ktm-qz72oob.0x1dq7qgla1xttwxa4skn5o4ms6l6neuxm2wsoo4vsa14dixmyb290pvm3wek.hfju.fjxjzd"
// • "0.h6a4sfyd67h8o-fyelfolcucqbzhhi.dand"
// • "c.mrjkuzbj8blh-hr4bkyh4tb8x8d26fv5p10--k.7.z4.vl1mr8sc1z4sxu01uabesv6n217ct7a-lqpc3kd65ktx7yc9pl4t.axunkpjjhm"
// • …
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
// Examples of generated values:
// • "qj5h7-5r4y6je1ud1a1fn2c82rugm5wlz9i191.0yuxnw1is1bgv5fk.lugkf3a-tqfd5qsghdv1e4f60126hb1hidj-d2nfa7.9z61dxxd7nf24.uz1h0fenwlozjjf0xfjhnoe4y6i1zxtszhay3h42bs1dl-ey6pgqayubhpzq.laacahebeu"
// • "5w6.mndtkwo"
// • "qtbebs8cnda2qdre9df0aefd.ycjd5s8ox5oh-sn6e.czccajd.vay"
// • "vyd-xdhck5bu94xerf71iq4q6v13j1osnd-v5izrmp3-rw1.izhob"
// • "fbcaacieagcwa2efzafaboffzpcexdcab7ebcacfemvnf3ld6fi4mm.bad"
// • …

fc.webAuthority({
  withIPv4: true,
})
// Examples of generated values:
// • "227.3.0.132"
// • "5.4.1.143"
// • "nlefeaoklaqquxvi7-epnuaz516se0f39.ebmnlc.kd"
// • "1n.qec35dv.fldbgpdpkz536c3gin7evv4i7d885ps3h9nsfimvyoqhq.zze"
// • "2.4.203.2"
// • …

fc.webAuthority({
  withIPv4Extended: true,
})
// Examples of generated values:
// • "f.msl8iocicbkbdxfmei-flkp0rev9aebwtpqb.fqfb.7ktri2uz9654k13o-o306k6m7o3ene73fawx3yynio6ksqwb98y1.bzd2cpl-xv0v7b5h2v4ra791jq5ewdh31uazxv9d7bfa.snnkngbh"
// • "0x11"
// • "0xefebe5f3"
// • "f4fjccf-1vqz0ws13jy8itf7h7rya9ef.fchranvkefce2eba1oec.qicpdee"
// • "0345.013"
// • …

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
// Examples of generated values:
// • "https://lb52zarm-s0pkuvg.qmv0scq9ta1k7b.ga6npwo0mhe1q.1fs6xjggc-g5wx6pp7-j7hz3te8r-br-54np53ybfy.bz"
// • "https://c.cmcydtgdl2y5gq52nb-gochrfw7luhm3eak87xjmn34l4ha.vzqzyjm//XAP93z)/phDuS=,8/"
// • "https://710n-lu6vxe25muuwxcou2vg-ooho0by.ar9s-s2r9dzi-oph9tnb6ucl.rzy/8cb_e/wag/L$PWN=KC="
// • "https://a.cd67h8o-fyelfolcuc.cjcmdv/R8/'ddz/%32$b/)N-z2/%F0%AD%AC%83(f%F0%A9%8E%90"
// • "https://6uzbj8blh-hr4bkyh4tb8x8d26fv5p10--8dtgi0kt.bteoc/bc/m////gc/a/E"
// • …

fc.webUrl({
  validSchemes: ['ftp', 'ftps'],
})
// Examples of generated values:
// • "ftps://lamsf.hn//5Hi_/3e%F2%B0%9E%A7ot/C9by:U)xN1/z/CHeC(/7p;l3A*91"
// • "ftps://5an-v0m02mtwarjrov9wqg9.ymiexrru/G.K://2%F3%AA%83%B2zxOxe/4Z&%F4%8F%96%B6Cm%F1%A4%A6%8E%F3%9B%99%A2q/g/:&H+rH2)',"
// • "ftp://f.behru/c/xj3!B/g~@!/YT/cfaf8)MbS/5,XZ:/y!yCu%F3%B0%89%9E=2fi/dP"
// • "ftp://affdcdt3e7cggjmbfaz.ebaf"
// • "ftps://4.c.afml28i37v21yod.af.ldnrdd//-+N,(/;e1hL7Ii/SI%F3%B9%8B%A34V;c&e"
// • …

fc.webUrl({
  withFragments: true,
  withQueryParameters: true,
})
// Examples of generated values:
// • "https://6teotdbg91olcdvqg4ag52gkm8sr4as1spvz-nhbmr4a26sf52bzkkk8u.6kwwftr726ju3bhgq1avtwyk6r5bdin2z48r5zq6.9pju0ee3g6x9nhyie7d3ltygys064g6exna7.cuna/qmdb6uC/JYCbNI_rs/hv/f7tV$%F1%B6%8A%BD1Sg/(bFrI/%F2%A8%A0%A2HQQ))./kc,6+%F2%90%B9%B1gL6/&_TSNfv?UypuihY#"
// • "http://ntgafkj317vprx7x09flrvhkp1ejaxfg0fdrfc95.3pedp8hpyt-gq27kxjcluf9.tzlycwp/@Iq*1%F2%95%95%9Ece1?_*.G!5DY#pb"
// • "http://ef.dvbac6fwifradf2fyaddodccfyeafcbwcydzswbcqbr9daaa4r.wgeddted/9ge/Re/5%28v/Mwrc)R?1#L9jE4X%F2%9C%94%A1"
// • "http://8.jmt.7obzakjfdip8f7-csuqjgp01eho0t8s6xuj3hqvekb7qf6q3i-d62.tjly5zq6lpbfnfddj7v50w04y07.8ir9322gginyti1omijbhrm0w2f.pb/!vIyqt$-/$g~xp=/jmY9m1fi/j//yr%F0%9C%BD%AA40Q;0,F/d/?q;F#k9W*cX&"
// • "https://q7q52eele4de4whhd65j1o.tsqntvwx33f0g2a8a6oxjrbxfrpir63nqqah1ajor4p7.xbq/,%F2%A9%BD%93~l%F2%BA%B0%80,!EQ/M/fGA%F1%8B%9A%8Aw,/52V:7_o~J)#+X.pt:%F1%AB%B0%B0w%F2%91%93%8A"
// • …
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
// Examples of generated values:
// • "e0f7||'5tq.h61k.opz+r*%^'k.w.cdddsv{'*@ynw1is1bgv5f3ume.aadqgd1f616bcc-2fdozcxdn2ca1aeaajcafbeycbtda34b1leds.dv"
// • "8bf|!d@iswstk-y83e6ipnqwir1uo.z9wncuzgxxbilc193lxke5z7x.bubfufqawv-2s54u8tg4wr5gczt4wje48tgy58e640jclk5.xg4mplvd77xkdv0.jnvczovpf"
// • "|bi9r}1|.l.^biw8i39.~doz=|dlr@6rzgr91b2xy0wzhozfxspqtmlcjd5s8ox5oh-sn6xlh9b7v25zd9y2i.m0bwcr4bzzziyys8zngvysdhljtl-vp71we0.z66v.wqyli81h78ina879qnk.rebn"
// • "/22{9=.p&2.e#w-b%-'.%itdenn@fd-v5izrmp3-rw-3iasqwymy3l33bl34s7o558ir4w8jbuv22u.dj7s6sfqtzckzvtq2d-1xgfww86.8ka8a0hvtny7atgslc03mlv4fvmeo09ze1mitxkb5hz47-hpwr6trc41v9vc.za"
// • "z*3y`3kt.b}4~6|&&xe.g.dfz=pp/@8bescqosaswebahce1kbdcaa7z7dey6auahgdha2bea5ak1.c7kctqqewt-1wogs6-nrmarr-my9afq5tbq41djjcax5382e-z4w9o59-1et28.qet"
// • …
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
// Examples of generated values:
// • "UP(h)ellUP(o)UP( )UP(w)oUP(r)ld"
// • "hUP(e)lloUP( )UP(w)orld"
// • "helUP(l)UP(o)UP( )UP(w)orlUP(d)"
// • "UP(h)UP(e)UP(l)lUP(o)UP( )wUP(o)rld"
// • "heUP(l)UP(l)o wUP(o)rUP(l)d"
// • …

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
// Examples of generated values:
// • new Date("1970-01-01T00:00:00.045Z")
// • new Date("1969-12-31T23:59:59.993Z")
// • new Date("1970-01-01T00:00:00.049Z")
// • new Date("+117887-07-07T17:12:49.936Z")
// • new Date("-091653-05-18T10:16:24.518Z")
// • …

fc.date({ min: new Date("2000-01-01T00:00:00.000Z") })
// Examples of generated values:
// • new Date("2000-01-01T00:00:00.008Z")
// • new Date("2000-01-01T00:00:00.012Z")
// • new Date("+251844-04-28T11:49:32.856Z")
// • new Date("2000-01-01T00:00:00.034Z")
// • new Date("+258781-01-23T17:20:22.591Z")
// • …

fc.date({ max: new Date("2000-01-01T00:00:00.000Z") })
// Examples of generated values:
// • new Date("1969-12-31T23:59:59.965Z")
// • new Date("1969-12-31T23:59:59.987Z")
// • new Date("-061471-10-15T20:55:54.168Z")
// • new Date("1969-12-31T23:59:59.962Z")
// • new Date("-135742-01-31T09:23:17.695Z")
// • …

fc.date({ min: new Date("2000-01-01T00:00:00.000Z"), max: new Date("2000-12-31T23:59:59.999Z") })
// Examples of generated values:
// • new Date("2000-06-25T11:59:12.750Z")
// • new Date("2000-01-01T00:00:00.001Z")
// • new Date("2000-09-24T05:26:49.182Z")
// • new Date("2000-01-01T00:00:00.019Z")
// • new Date("2000-07-08T09:22:33.042Z")
// • …
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

// Setup helpers:
function buildCloneable(objectInstance) {
  // Rq: We do not handle deep objects in this snippet
  // But we will get another instance of objectInstance for each run
  // ie. objectInstanceRunA !== objectInstanceRunB while having isEqual(objectInstanceRunA, objectInstanceRunB)
  const withCloneMethod = () => ({
    ...objectInstance,
    [fc.cloneMethod]: withCloneMethod,
  });
  return withCloneMethod();
}
// Use the arbitrary:
fc.clonedConstant(buildCloneable({ keyA: 1, keyB: 2 }))
// Examples of generated values: {"keyA":1,"keyB":2}…
```
</details>

<details>
<summary><b>option</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#option">api</a>]</summary><br/>

*&#8195;Description*

> Randomly chooses between producing a value using the underlying arbitrary or returning nil

*&#8195;Signatures*

- `fc.option(arb)`
- `fc.option(arb, {freq?, nil?})`
- _`fc.option(arb, freq)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_

*&#8195;with:*

- `arb` — _arbitrary that will be called to generate normal values_
- `freq?` — default: `5` — _probability to build the nil value is of 1 / freq_
- `nil?` — default: `null` — _nil value_

*&#8195;Usages*

```js
fc.option(fc.nat())
// Examples of generated values: null, 773390791, 25, 18, 2039519833…

fc.option(fc.nat(), { freq: 2 })
// Examples of generated values: 214938453, 4, 2130844098, 748471782, null…

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
<summary><b>clone</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#clone">api</a>]</summary><br/>

*&#8195;Description*

> Multiple identical values (they might not equal in terms of `===` or `==`)
>
> Generate tuple containing multiple instances of the same value - values are independent from each others.

*&#8195;Signatures*

- `fc.clone(arb, numValues)`

*&#8195;with:*

- `arb` — _arbitrary instance responsible to generate values_
- `numValues` — _number of clones (including itself)_

*&#8195;Usages*

```js
fc.clone(fc.nat(), 2)
// Examples of generated values: [1458194344,1458194344], [1974332592,1974332592], [605246308,605246308], [187149619,187149619], [1325928130,1325928130]…

fc.clone(fc.nat(), 3)
// Examples of generated values:
// • [1075303821,1075303821,1075303821]
// • [1289535362,1289535362,1289535362]
// • [479824585,479824585,479824585]
// • [61543881,61543881,61543881]
// • [1082205096,1082205096,1082205096]
// • …
```
</details>

<details>
<summary><b>dedup</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#dedup">api</a>]</summary><br/>

*&#8195;Description*

> Multiple identical values (they might not equal in terms of `===` or `==`)
>
> Generate tuple containing multiple instances of the same value - values are independent from each others.

*&#8195;Signatures*

- _`fc.dedup(arb, numValues)`_ — _deprecated, prefer `fc.clone` instead_

*&#8195;with:*

- `arb` — _arbitrary instance responsible to generate values_
- `numValues` — _number of clones (including itself)_

*&#8195;Usages*

```js
fc.dedup(fc.nat(), 2)
// Examples of generated values: [1458194344,1458194344], [1974332592,1974332592], [605246308,605246308], [187149619,187149619], [1325928130,1325928130]…

fc.dedup(fc.nat(), 3)
// Examples of generated values:
// • [1075303821,1075303821,1075303821]
// • [1289535362,1289535362,1289535362]
// • [479824585,479824585,479824585]
// • [61543881,61543881,61543881]
// • [1082205096,1082205096,1082205096]
// • …
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
- `fc.array(arb, {minLength?, maxLength?})`
- _`fc.array(arb, maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_
- _`fc.array(arb, minLength, maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_

*&#8195;with:*

- `arb` — _arbitrary instance responsible to generate values_
- `minLength?` — default: `0` — _minimal length (included)_
- `maxLength?` — default: `2 * minLength + 10` — _maximal length (included)_

*&#8195;Usages*

```js
fc.array(fc.nat())
// Examples of generated values:
// • []
// • [1044253015,881466391,1911917064,2,1706675196,26,29,23,30,854122437]
// • [1644861079]
// • [624842423,32338439,1321248893,980127887,850807339,1583851385,1093421004]
// • [505677510,559592731,1931700591,729662778,1771367027]
// • …

fc.array(fc.nat(), {minLength: 3})
// Examples of generated values:
// • [758331231,398217079,312666176,53143294,521680871,1862921771,1710362589,983796605,1814936084]
// • [1097867707,1901779976,15,20,1568142240,1311161179,973337534,1612556434]
// • [27,592551667,423050204,1343082443,19,22,219368377,6]
// • [16,3,171247186]
// • [23,10,952821768]
// • …

fc.array(fc.nat(), {maxLength: 3})
// Examples of generated values: [], [1097867707], [27,592551667,423050204], [1360904164,1953451342,1651990695], [1771169783]…

fc.array(fc.nat(), {minLength: 5, maxLength: 7})
// Examples of generated values:
// • [17,1889589762,1147911052,725992281,12,4]
// • [1503239805,742382696,478977019,1206184056,992934701,1081616342]
// • [1396368269,227325306,1918884399,1141338513,1861390920,1771550203,750875810]
// • [1,1984953187,60011223,10,7,27]
// • [20,13,3,22,2,360110028]
// • …
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
- `fc.set(arb, {minLength?, maxLength?, compare?})`
- _`fc.set(arb, maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_
- _`fc.set(arb, minLength, maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_
- _`fc.set(arb, compare)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_
- _`fc.set(arb, maxLength, compare)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_
- _`fc.set(arb, minLength, maxLength, compare)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_

*&#8195;with:*

- `arb` — _arbitrary instance responsible to generate values_
- `minLength?` — default: `0` — _minimal length (included)_
- `maxLength?` — default: `2 * minLength + 10` — _maximal length (included)_
- `compare?` — default: `(a, b) => a === b` — _custom compare function used to distinguish duplicates in order to remove them from the resulting array_

*&#8195;Usages*

```js
fc.set(fc.nat(99))
// Examples of generated values: [], [15,91,64,6,44,3,4,0,85,2], [79], [23,39,93,87,85,4,21], [58,31,39,26,75]…

fc.set(fc.nat(99), {maxLength: 3})
// Examples of generated values: [], [55], [1,67,4], [12,90,43], [31]…

fc.set(fc.nat(99), {minLength: 5, maxLength: 7})
// Examples of generated values: [5,10,0,29,4,3], [53,44,67,56,49,42], [69,6,47,13,20,3,58], [3,87,23,4,0,1], [6,1,5,28,70,4]…

fc.set(fc.hexaString(), {compare: (s1, s2) => s1.length === s2.length})
// Note: Resulting arrays will never contain two strings with the same number of characters
// Examples of generated values: ["20","016"], [], ["447","","893c89edb1","b31a5"], ["79429d9",""], ["0","c20ea408b9","1f1574","117d"]…

fc.set(fc.hexaString(), {minLength: 5, maxLength: 10, compare: (s1, s2) => s1.length === s2.length})
// Note: Resulting arrays will never contain two strings with the same number of characters and it will contain between 5 and 10 strings
// Examples of generated values:
// • ["","18028609c9","8b9e4d","bd945ddc","7262","63636"]
// • ["7e","59ae73fd9","2d50442","182a0c3b","1e7b59","e1c1b","5"]
// • ["65655ac0b","c20","02f6","42ff080184","80","f04e066",""]
// • ["322","","23","2","60af6ca3","50cf","1203143b82"]
// • ["","b","21a03b1","7ddf1bdd","e3","052844fe0a","c410"]
// • …
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
- `fc.subarray(originalArray, {minLength?, maxLength?})`
- _`fc.subarray(originalArray, minLength, maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_

*&#8195;with:*

- `originalArray` — _the array from which we want to extract sub-arrays_
- `minLength?` — default: `0` — _minimal length (included)_
- `maxLength?` — default: `originalArray.length` — _maximal length (included)_

*&#8195;Usages*

```js
fc.subarray([1, 42, 48, 69, 75, 92])
// Examples of generated values: [48,69,75,92], [75,92], [], [48,75], [1,42,48,75,92]…

fc.subarray([1, 42, 48, 69, 75, 92], {minLength: 5})
// Examples of generated values: [1,42,69,75,92], [1,42,48,69,75], [1,42,48,69,92], [1,42,48,69,75,92], [42,48,69,75,92]…

fc.subarray([1, 42, 48, 69, 75, 92], {maxLength: 5})
// Examples of generated values: [1,69,75,92], [42,48,69,75], [42], [69], [42,48,92]…

fc.subarray([1, 42, 48, 69, 75, 92], {minLength: 2, maxLength: 3})
// Examples of generated values: [42,75], [42,69], [1,75,92], [48,92], [42,48,92]…
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
- `fc.shuffledSubarray(originalArray, {minLength?, maxLength?})`
- _`fc.shuffledSubarray(originalArray, minLength, maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_

*&#8195;with:*

- `originalArray` — _the array from which we want to extract sub-arrays_
- `minLength?` — default: `0` — _minimal length (included)_
- `maxLength?` — default: `originalArray.length` — _maximal length (included)_

*&#8195;Usages*

```js
fc.shuffledSubarray([1, 42, 48, 69, 75, 92])
// Examples of generated values: [75], [75,48], [92], [75,92], [1,75]…

fc.shuffledSubarray([1, 42, 48, 69, 75, 92], {minLength: 5})
// Examples of generated values: [42,92,1,69,48], [48,1,42,75,69,92], [92,1,75,42,48,69], [92,1,42,48,69], [92,1,69,42,75,48]…

fc.shuffledSubarray([1, 42, 48, 69, 75, 92], {maxLength: 5})
// Examples of generated values: [], [48,1,42], [92,1,75], [92], [92,1,69,42,75]…

fc.shuffledSubarray([1, 42, 48, 69, 75, 92], {minLength: 2, maxLength: 3})
// Examples of generated values: [69,1], [92,1], [69,92], [69,42,1], [75,1]…
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
// Examples of generated values:
// • Stream(5,2,2,1,3,9,9,8,9,9...)
// • Stream(1,0,8,1,6,8,6,7,7,7...)
// • Stream(0,4,6,5,2,3,5,3,2,1...)
// • Stream(2,5,0,0,1,9,9,0,7,3...)
// • Stream(1,1,1,1,2,8,8,8,4,2...)
// • …
```
</details>

### Object

<details>
<summary><b>dictionary</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#dictionary">api</a>]</summary><br/>

*&#8195;Description*

> Generate dictionaries containing keys generated using `keyArb` and values generated by `valueArb`

*&#8195;Signatures*

- `fc.dictionary(keyArb, valueArb)`

*&#8195;with:*

- `keyArb` — _arbitrary instance responsible to generate keys_
- `valueArb` — _arbitrary instance responsible to generate values_

*&#8195;Usages*

```js
fc.dictionary(fc.string(), fc.string())
// Examples of generated values:
// • {"+":"iM#O7X(G58"}
// • {"y":"rm<45]&THs","KT$\"$#":"I","$":"2&#%EB","\" ":""}
// • {"H=>.L$K":";j %u9","PT":"l[jR4C"}
// • {"}9":"xp/g?g","'M":"UbM/K","534pHy":"T/","Z":"","9V02D":"\"#!","\"hI&\"K%w\"":"$9JL% /1&y"}
// • {"vT`":"~yWotB,m@1","LRwi":",kU~9",",qZ8":"ckz-r^?@","zQP=-!BC":";:S","dA+b<f-\"3T":"[if y\\"}
// • …

fc.dictionary(fc.string(), fc.nat())
// Examples of generated values:
// • {"":1389984732,"Yp$g&t^dp]":1638300335,"+":438403284,"41ST4G":1593876328,"sZ=":474921142,"wjFpf":912590676,"tFK(!":547671001,"Ot=":1404889232}
// • {"BS9-o":1729454479,"OQYWH":1003935961,"a{6S(OQ?\"":1204427717,"n6wY":452693617,"L":1919551662,"KlqB{{":360825924,"":1745761795,"#h#S$":1570990143,"G%":1211363041,"=.":158635507}
// • {}
// • {"Fb+6vZ=< ":589373246,"8!%":1202775460}
// • {"4":57689789,"d":2049278068,".b3n,":1846889886,":E":887324279,"*9\\$WNce":108003991}
// • …
```
</details>

<details>
<summary><b>record</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#record">api</a>]</summary><br/>

*&#8195;Description*

> Generate records using the incoming arbitraries to generate its values
>
> It comes very useful when dealing with settings.

*&#8195;Signatures*

- `fc.record(recordModel)`
- `fc.record(recordModel, {withDeletedKeys?})`

*&#8195;with:*

- `recordModel` — _structure of the resulting instance_
- `withDeletedKeys?` — default: `false` — _when enabled, record might not generate all keys_

*&#8195;Usages*

```js
fc.record({
  id: fc.uuidV(4),
  age: fc.nat(99)
})
// Examples of generated values:
// • {"id":"a7ccc7eb-f854-442c-8000-00167c2d9d89","age":96}
// • {"id":"0000001a-0005-4000-8000-000bad763658","age":2}
// • {"id":"00000005-ae2d-40cd-966f-6118fce8d6ef","age":6}
// • {"id":"0000000d-0012-4000-8000-0013b9358db8","age":0}
// • {"id":"1f27c491-0003-4000-bd47-0dfdea3d402d","age":5}
// • …

fc.record({
  id: fc.uuidV(4),
  age: fc.nat(99)
}, { withDeletedKeys: true })
// Note: Both id and age will be optional values
// Examples of generated values:
// • {"id":"00000001-0005-4000-8000-000898c76d78","age":1}
// • {"id":"00000009-0006-4000-9b3b-f16f0000001e","age":26}
// • {"age":34}
// • {"id":"2db92e09-3fdc-49e6-8000-0013ffeab39a"}
// • {"id":"00000002-000a-4000-8000-0019839786ea"}
// • …

fc.tuple(
  fc.record({
    id: fc.uuidV(4)
  }),
  fc.record({
    age: fc.nat(99),
    birthday: fc.date(),
  }, { withDeletedKeys: true }),
).map(([compulsary, opt]) => ({...compulsary, ...opt}))
// Note: id will always be defined, age and birthday will be optional
// Examples of generated values:
// • {"id":"7a85b7cf-bf0c-4437-8268-b669d0aed75a","age":0,"birthday":new Date("-271214-12-28T14:56:53.916Z")}
// • {"id":"a2302ffc-0006-4000-84a9-689434bc55da"}
// • {"id":"0000000b-000c-4000-9209-d91456cba116","age":6,"birthday":new Date("1970-01-01T00:00:00.011Z")}
// • {"id":"d5157d1d-001a-4000-8000-00050000001f","age":40,"birthday":new Date("+261944-10-24T20:27:26.782Z")}
// • {"id":"00000002-c04d-40cd-8000-001000000012","age":4}
// • …
```
</details>

<details>
<summary><b>object</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#object">api</a>]</summary><br/>

*&#8195;Description*

> Generate objects (key/values)

*&#8195;Signatures*

- `fc.object()`
- `fc.object({key?, maxDepth?, maxKeys?, withBigInt?, withBoxedValues?, withDate?, withMap?, withNullPrototype?, withObjectString?, withSet?, values?})`

*&#8195;with:*

- `key?` — default: `fc.string()` — _arbitrary responsible to generate keys used for instances of objects_
- `maxDepth?` — default: `2` — _maximal depth for generated objects (Map and Set included into objects)_
- `maxKeys?` — default: `5` — _maximal number of keys in generated objects (Map and Set included into objects)_
- `withBigInt?` — default: `false` — _enable `bigint` - eg.: `1n`_
- `withBoxedValues?` — default: `false` — _enable boxed values - eg.: `new Number(5)`_
- `withDate?` — default: `false` — _enable `Date` - eg.: `new Date('2020-10-14T16:52:36.736Z')`_
- `withMap?` — default: `false` — _enable `Map` - eg.: `new Map([['key', 'value']])`_
- `withNullPrototype?` — default: `false` — _enable objects not defining any prototype - eg.: `Object.create(null)`_
- `withObjectString?` — default: `false` — _enable strings looking as string representations of JavaScript instances - eg.: `"{}"`, `"new Set([1])"`_
- `withSet?` — default: `false` — _enable `Set` - eg.: `new Set([1, 2, 3])`_
- `values?` — default: _booleans, numbers, strings, null and undefined_ — _array of arbitraries producing the root* values - *non-object ones_

*&#8195;Usages*

```js
fc.object()
// Examples of generated values:
// • {"A%":{"KFfpp":0.15601632430569612,"R;AFyG":0.5147879172882253},"":[0.031204981839495605,{"-;wLYr]a1":9007199254740991,"?HA8T":true,"V:Cmm":1026063650},true,[""]],"WFt=u'":{}}
// • {"M{]xTH":{"#n;+\"uJ":-531067140,"#IBJPt8":[],"Bng_VbB&":[-938438981,true,1961200770,null,true]},"h(+;Pq":{"":[0,2.220446049250313e-16,2.220446049250313e-16,Number.NEGATIVE_INFINITY],"ck,":-0,"$p$ELwa4":0.665904321745444,"8Ei;%":"8vmt?65Y3j"},"-Gr":{},"(j&13ir":"sN~\\)Xb=L","":[{"Ld\"":0.5204080239001759,"zV":0.7037399006564362,"b]yOC":0.010565763906139058,"oW":0.13754518554962492,"LM[Ufcn":0.12116280558765191},true,[-9007199254740991,"bUe?2",undefined,1255384764]],"Rzdzb#:cJC":Number.POSITIVE_INFINITY,"ycMNhu2f^":{},"#0viE?":1393274772,"F9{":[{"d]#*":"nq2","-eEu3t{":"e`od","BidZM=lIH":"XofQAOc","Gj6xJ":-0},0.05500515729160249,{"3@":0.6057971878524023,"]g":0.8888049320696916,"":0.20253894580064236,"u":0.9986080909514845,"-EHGp..CD":0.8372973503851951}]}
// • {"NLpz":0.3819334142270202,"`guwWVp\\q":{"OjJ U%NIw":-1412821501},"=SL35Vyp":false,"w{Q_]ZyZ":[0.5792432605379005,0.37573694944373115,0.16947480325839004],"7o5i":{"":{},"i3NvX+":{},"qH ":null,"iFv`}D)":null,"W$d#":{"e6jj":"DjT>_><\\N","2`f1j":0.3137112850382896,"":";a#"}},"R85|iHDs+$":[null,5e-324,{" 6hP :#`Y4":0.17656752603223302,"w[JQ":0.6947822374109164}],"7bN":[[506417717,0.9439922098339762,false,-439421531],[],0.5176499969954053],"0n'+o1]0R":true}
// • {}
// • {"qrhd)uEl(b":{},"]fr _{^D":{"1/H-'WwF":{},"(K|5r6O":"tDi'?MuF"},"H":null}
// • …

fc.object({
  key: fc.constantFrom('a', 'b', 'c'),
})
// Note: Keys in ['a', 'b', 'c']
// Examples of generated values:
// • {"c":{"c":"DIxqj35h9:","a":"#P'DE&gY","b":"F"}}
// • {"b":-25}
// • {"b":false,"c":undefined}
// • {"a":4.872535319666582e-8,"b":{"c":"$Cf%"},"c":""}
// • {}
// • …

fc.object({
  maxDepth: 0,
})
// Examples of generated values:
// • {"^lx)`P":0,"</}}e{{":0.3250894455517638,"g21/@#y1B":-0,"8ULm U|p<":Number.NEGATIVE_INFINITY,"mrI#":Number.POSITIVE_INFINITY,"{sS8U7 %E!":2089101388,"=(":0.10812626313097728}
// • {"s!?U&|m":" !","m}7P4>bQM?":null}
// • {":WEs/srS+":-1416520206,"lb(<%.BW9":1.7976931348623157e+308,"":true,"PfnX>":0.08774441941808431,"pRw":null,"o};9PoD":"I[r7TL+"}
// • {"WW!oe%r(1":"FiY","l":0.03574426867100822,"R@~l-":false,"":1980690840,"E:' snhE\"}":" <4QOmI","=k]:kN3b~6":1139673390}
// • {"y.&&$":-9007199254740991}
// • …

fc.object({
  maxDepth: 1,
})
// Examples of generated values:
// • {"^lx)`P":[0.39657042602052384,-422075697,false,"g21/@#y1B",-0],"8ULm U|p<":["I#!.^",false,0,-893577503],"!7U{*=(D":{"":"Bv'W{LK"},"#zWizXp":[],"Q":[1.7976931348623157e+308],"l,yb3jK.Tr":{"BQ0r":-880138661,";G":-1868350386,"S\\":-907998987,"l@l]WFW":-1078718740},"YaIV[oS<":[0.5346349203332164,-1446721885,0.44013632045723694,-0]}
// • {"s!?U&|m":" !","m}7P4>bQM?":{"k>Eu":"`"}}
// • {":WEs/srS+":{"lb(<%.BW9":1.7976931348623157e+308,"":true},"":[5e-324],"X>QxWvd=":{"PYo};9PoD":0.7651338760998909,"tI[r7":0.8419325392498929,"k'*HxK?ok":0.5930196131336798,"= \\BMAD":0.31146228911196416,"$":0.5022020727144553},"n/>|":{},"%|>H4JG)JX":{"":false},"3@Vl}e":undefined}
// • {"WW!oe%r(1":[true,false,false,false,false],"8a$aR@~l":[],"*qB<GE":[undefined,"/er "],"4QOmI<=k]":{"~6T:#H":Number.NEGATIVE_INFINITY},"2V7Sy8YR%C":{"3":"<B3\"Hr","o8`}}V5g":Number.NEGATIVE_INFINITY,"VpV/JOM2s":0.9235439685155197,"`":"x0Og?1UC","":1.7976931348623157e+308},"zR9_1QI|":0.32516117831510116}
// • {"y.&&$":[3.677543293223451e-7,0.35124656565223245,1.6391277313232422e-7,0.5027824205092728]}
// • …


fc.object({
  withBigInt: true,
  withBoxedValues: true,
  withDate: true,
  withMap: true,
  withNullPrototype: true,
  withObjectString: true,
  withSet: true,
})
// Examples of generated values:
// • {"F,r0fx}OWg":[new Date("+160385-01-30T05:38:43.072Z"),22583622805204069477977266286996933943873259784384626171039405815620425326468n,{"{Y":"N",",;04yN":-107026440}],"6x*pJp&3^":"new Number(0.42255506544021615)"}
// • {}
// • {"hyu)K.|R-5":"new Set([new String(\"f0q}b8/2*\"),new String(\" scrLAI'KD\"),new String(\"P_krOW\"),new String(\"hZ\"),new String(\"VwvEE}s(;V\")])","85c":1955536278377593253161285446750593118355413969436917489136958056479360825003n,"Y*":new Number(0.4145363362551938),"[n7%b":"new Number(0.861563135058088)","L":-36290478173422814553429011041239932856189046009049526980429727311354359757843n,"qe80E%":new Set([undefined,new String("-:"),new String("@}gz6"),null,new String("f*;+=I8t")]),"":new Set([new Number(0.8938732846739627),new Number(0.5945807356752961)]),"fvH0g*vr":Object.create(null),"e67K#h_N>":Object.assign(Object.create(null),{"5yAgxxIc":null})}
// • {"r5B":Object.assign(Object.create(null),{"":false,"new Set([new Boolean(false),new Boolean(true)])":true,"G $D&  %#x":true}),"":{"-47n":1387385502,"POG^":15},"lf*":49n,"UN":new Date("1969-12-31T23:59:59.948Z")}
// • {")h%{":new Set([])}
// • …
```
</details>

<details>
<summary><b>jsonObject</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#jsonobject">api</a>]</summary><br/>

*&#8195;Description*

> Generate any object eligible to be stringified in JSON and parsed back to itself - _in other words, JSON compatible instances_

*&#8195;Signatures*

- `fc.jsonObject()`
- `fc.jsonObject({maxDepth?})`
- _`fc.jsonObject(maxDepth)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_

*&#8195;with:*

- `maxDepth?` — default: `2` — _maximal depth for generated objects (Map and Set included into objects)_

*&#8195;Usages*

```js
fc.jsonObject()
// Examples of generated values:
// • 0.5208574533462533
// • {"8-b;+Ua":0.6025187808808565,"jgMZ$w|b.":0.058392661106537846}
// • [false,false,true,true,false]
// • false
// • [[-31,-1747504894]]
// • …

fc.jsonObject({maxDepth: 0})
// Examples of generated values: -312267957, "C{X%3]Q$U", "M}7xc\" _", true, null…

fc.jsonObject({maxDepth: 1})
// Examples of generated values: -312267957, {"{":true,"Q$":null}, "M}7xc\" _", {".b?^O.":"","D1$L":"zDJWs","j*s 9%":"",".":"0N|^?8"}, {}…
```
</details>

<details>
<summary><b>unicodeJsonObject</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#unicodejsonobject">api</a>]</summary><br/>

*&#8195;Description*

> Generate any object eligible to be stringified in JSON and parsed back to itself - _in other words, JSON compatible instances_

*&#8195;Signatures*

- `fc.unicodeJsonObject()`
- `fc.unicodeJsonObject({maxDepth?})`
- _`fc.unicodeJsonObject(maxDepth)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_

*&#8195;with:*

- `maxDepth?` — default: `2` — _maximal depth for generated objects (Map and Set included into objects)_

*&#8195;Usages*

```js
fc.unicodeJsonObject()
// Examples of generated values: false, [[-1517505516,-480082521]], "⠵䟵谉ꏊ㓰捛멮켜", null, [null,null,null,null]…

fc.unicodeJsonObject({maxDepth: 0})
// Examples of generated values: 4.4703486135055925e-8, 1.7994014667177538e-7, true, -13, 2.451586696983199e-7…

fc.unicodeJsonObject({maxDepth: 1})
// Examples of generated values:
// • 4.4703486135055925e-8
// • {"减":null,"鲊ਉ뉄":null,"罧癤鷢൜牶":null,"횆쐌淪燀쯠蝒熹཯":null,"":null}
// • {"ꁺ척蜱젿됻⫄":true,"㠰䵤᧳ꊺ蹀":true,"劸웤鯁냠漼ⳍ㧞ﰗἭ∎":false}
// • []
// • ["疘쥱"]
// • …
```
</details>

<details>
<summary><b>anything</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#anything">api</a>]</summary><br/>

*&#8195;Description*

> Generate any kind of entities

*&#8195;Signatures*

- `fc.anything()`
- `fc.anything({key?, maxDepth?, maxKeys?, withBigInt?, withBoxedValues?, withDate?, withMap?, withNullPrototype?, withObjectString?, withSet?, values?})`

*&#8195;with:*

- `key?` — default: `fc.string()` — _arbitrary responsible to generate keys used for instances of objects_
- `maxDepth?` — default: `2` — _maximal depth for generated objects (Map and Set included into objects)_
- `maxKeys?` — default: `5` — _maximal number of keys in generated objects (Map and Set included into objects)_
- `withBigInt?` — default: `false` — _enable `bigint` - eg.: `1n`_
- `withBoxedValues?` — default: `false` — _enable boxed values - eg.: `new Number(5)`_
- `withDate?` — default: `false` — _enable `Date` - eg.: `new Date('2020-10-14T16:52:36.736Z')`_
- `withMap?` — default: `false` — _enable `Map` - eg.: `new Map([['key', 'value']])`_
- `withNullPrototype?` — default: `false` — _enable objects not defining any prototype - eg.: `Object.create(null)`_
- `withObjectString?` — default: `false` — _enable strings looking as string representations of JavaScript instances - eg.: `"{}"`, `"new Set([1])"`_
- `withSet?` — default: `false` — _enable `Set` - eg.: `new Set([1, 2, 3])`_
- `values?` — default: _booleans, numbers, strings, null and undefined_ — _array of arbitraries producing the root* values - *non-object ones_

*&#8195;Usages*

```js
fc.anything()
// Examples of generated values:
// • {"s":["","hTd@sWtR%)"],"-S9":0.3242989104896441,"GhNB:":0}
// • 0
// • "!u%%!"
// • {}
// • {"r1AA`>yA":0.25420680837157195,"hn:9":0.15814638137817438}
// • …

fc.anything({
  key: fc.constantFrom('a', 'b', 'c'),
})
// Note: Generated objects will come with keys in ['a', 'b', 'c']
// Examples of generated values:
// • {"b":7.12556398330122e-8}
// • [["(y","\"a>%","5AM2+"],"$%",{"c":Number.NaN,"b":1.708876607997567e-7}]
// • {"b":1104845694,"c":1617404783,"a":-86638758}
// • {"c":-694807229,"b":-1525211291,"a":-97094564}
// • 5e-324
// • …

fc.anything({
  maxDepth: 0,
})
// Note: Only root values
// Examples of generated values: 1.4608754717038153e-7, true, "<EO", 9007199254740991, 0…

fc.anything({
  maxDepth: 1,
})
// Examples of generated values: 1.4608754717038153e-7, true, "<EO", [], 0…

fc.anything({
  withBigInt: true,
  withBoxedValues: true,
  withDate: true,
  withMap: true,
  withNullPrototype: true,
  withObjectString: true,
  withSet: true,
})
// Examples of generated values:
// • 29n
// • {"new Set([new Number(658282252),\"F$\",new Number(0.3487903700973978)])":0.597600347119469}
// • 49923639470792901331007151703295270516608099603300111897468945883726467315714n
// • [{"lloo":new String("8k"),":6O":true,"1 J%S-":0.9811743941698315,"J~+`Qo1<o":new Number(0),"KV`MZ[":new Boolean(true)},{"new String(\"#Oi&%P\\\":\")":new Number(2),"lsA":0.16318916814007212}]
// • Object.assign(Object.create(null),{"K\\~c!jADJ5":new Date("-042008-05-13T02:10:57.427Z"),"rBi6zzh":2371026000844887995115928520799279159182492319348459568753669098566854816929n,":<Rzk3":Object.create(null),"&$IJ+Z71e":new Date("+104798-01-21T08:19:12.364Z"),"n&9A.;gcG_":Object.assign(Object.create(null),{"gY`+mW":new String("Ci(w+qXQ"),"A-leb&":new String("DIj`F@;")})})
// • …
```
</details>

### Function

<details>
<summary><b>compareBooleanFunc</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#comparebooleanfunc">api</a>]</summary><br/>

*&#8195;Description*

> Generate a comparison function taking two parameters `a` and `b` and producing a boolean value.
>
> `true` means that `a < b`, `false` that `a = b` or `a > b`

*&#8195;Signatures*

- `fc.compareBooleanFunc()`

*&#8195;Usages*

```js
fc.compareBooleanFunc()
// Examples of generated values:
// • function(a, b) {
//     // With hash and stringify coming from fast-check
//     const cmp = (hA, hB) => hA < hB;
//     const hA = hash('-1984194606' + stringify(a)) % 1019120836;
//     const hB = hash('-1984194606' + stringify(b)) % 1019120836;
//     return cmp(hA, hB);
//   }
// • function(a, b) {
//     // With hash and stringify coming from fast-check
//     const cmp = (hA, hB) => hA < hB;
//     const hA = hash('-1859641033' + stringify(a)) % 12;
//     const hB = hash('-1859641033' + stringify(b)) % 12;
//     return cmp(hA, hB);
//   }
// • function(a, b) {
//     // With hash and stringify coming from fast-check
//     const cmp = (hA, hB) => hA < hB;
//     const hA = hash('1845341787' + stringify(a)) % 31;
//     const hB = hash('1845341787' + stringify(b)) % 31;
//     return cmp(hA, hB);
//   }
// • function(a, b) {
//     // With hash and stringify coming from fast-check
//     const cmp = (hA, hB) => hA < hB;
//     const hA = hash('1127181441' + stringify(a)) % 3255607487;
//     const hB = hash('1127181441' + stringify(b)) % 3255607487;
//     return cmp(hA, hB);
//   }
// • function(a, b) {
//     // With hash and stringify coming from fast-check
//     const cmp = (hA, hB) => hA < hB;
//     const hA = hash('-31' + stringify(a)) % 1934705594;
//     const hB = hash('-31' + stringify(b)) % 1934705594;
//     return cmp(hA, hB);
//   }
// • …
```
</details>

<details>
<summary><b>compareFunc</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#comparefunc">api</a>]</summary><br/>

*&#8195;Description*

> Generate a comparison function taking two parameters `a` and `b` and producing an integer value.
>
> Output is zero when `a` and `b` are considered to be equivalent. Output is strictly inferior to zero means that `a` should be considered strictly inferior to `b` (similar for strictly superior to zero)

*&#8195;Signatures*

- `fc.compareFunc()`

*&#8195;Usages*

```js
fc.compareFunc()
// Examples of generated values:
// • function(a, b) {
//     // With hash and stringify coming from fast-check
//     const cmp = (hA, hB) => hA - hB;
//     const hA = hash('1501554938' + stringify(a)) % 22;
//     const hB = hash('1501554938' + stringify(b)) % 22;
//     return cmp(hA, hB);
//   }
// • function(a, b) {
//     // With hash and stringify coming from fast-check
//     const cmp = (hA, hB) => hA - hB;
//     const hA = hash('-700879918' + stringify(a)) % 386108697;
//     const hB = hash('-700879918' + stringify(b)) % 386108697;
//     return cmp(hA, hB);
//   }
// • function(a, b) {
//     // With hash and stringify coming from fast-check
//     const cmp = (hA, hB) => hA - hB;
//     const hA = hash('-579121620' + stringify(a)) % 26;
//     const hB = hash('-579121620' + stringify(b)) % 26;
//     return cmp(hA, hB);
//   }
// • function(a, b) {
//     // With hash and stringify coming from fast-check
//     const cmp = (hA, hB) => hA - hB;
//     const hA = hash('1112768059' + stringify(a)) % 242967477;
//     const hB = hash('1112768059' + stringify(b)) % 242967477;
//     return cmp(hA, hB);
//   }
// • function(a, b) {
//     // With hash and stringify coming from fast-check
//     const cmp = (hA, hB) => hA - hB;
//     const hA = hash('-235565807' + stringify(a)) % 1424836938;
//     const hB = hash('-235565807' + stringify(b)) % 1424836938;
//     return cmp(hA, hB);
//   }
// • …
```
</details>

<details>
<summary><b>func</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#func">api</a>]</summary><br/>

*&#8195;Description*

> Generate a function producing values using an underlying arbitrary

*&#8195;Signatures*

- `fc.func(arb)`

*&#8195;with:*

- `arb` — _arbitrary responsible to produce the values_

*&#8195;Usages*

```js
fc.func(fc.nat())
// Examples of generated values:
// • function(...args) {
//     // With hash and stringify coming from fast-check
//     const outs = [1681938411,278250656,2138206756,937216340];
//     return outs[hash('1975998514' + stringify(args)) % outs.length];
//   }
// • function(...args) {
//     // With hash and stringify coming from fast-check
//     const outs = [17,955622301,10];
//     return outs[hash('-1016968799' + stringify(args)) % outs.length];
//   }
// • function(...args) {
//     // With hash and stringify coming from fast-check
//     const outs = [1521748689,316610179,1601449343,1057761988,2088580527,1974557534,1618733983,882909472,1739615127];
//     return outs[hash('-31' + stringify(args)) % outs.length];
//   }
// • function(...args) {
//     // With hash and stringify coming from fast-check
//     const outs = [269035825,95461057,227736260,947243235,2103296563,1079794905];
//     return outs[hash('27' + stringify(args)) % outs.length];
//   }
// • function(...args) {
//     // With hash and stringify coming from fast-check
//     const outs = [755444117,555135045,511312424,1358336721,939579971,1343197442,421884569,2022508190,140388674];
//     return outs[hash('-708292322' + stringify(args)) % outs.length];
//   }
// • …
```
</details>

### Recursive structures

<details>
<summary><b>letrec</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#letrec">api</a>]</summary><br/>

*&#8195;Description*

> Generate recursive structures
>
> Contrary to `fc.memo` there is no easy way to stop the resursion. Structure may grow infinitely if growing scenarii are too frequent compared to terminal ones.

*&#8195;Signatures*

- `fc.letrec(builder)`

*&#8195;with:*

- `builder` — _builder function defining how to build the recursive structure, it answers to the signature `(tie) => `object with key corresponding to the name of the arbitrary and with vaue the arbitrary itself. The `tie` function given to builder should be used as a placeholder to handle the recursion. It takes as input the name of the arbitrary to use in the recursion._

*&#8195;Usages*

```js
// Setup the tree structure:
const { tree } = fc.letrec(tie => ({
  // tree is 1 / 3 of node, 2 / 3 of leaf
  // Warning: as there is no control over the depth of the data-structures generated
  //   by letrec, high probability of node can lead to very deep trees
  //   thus we limit the probability of a node to p = 1 / 3 in this example
  // with p = 0.50 the probability to have a tree of depth above 10 is 13.9 %
  // with p = 0.33 the probability to have a tree of depth above 10 is  0.6 %
  tree: fc.oneof(tie('node'), tie('leaf'), tie('leaf')),
  node: fc.record({
    left: tie('tree'),
    right: tie('tree'),
  }),
  leaf: fc.nat()
}));
// Use the arbitrary:
tree
// Examples of generated values:
// • {"left":8,"right":2}
// • 25
// • {"left":{"left":6,"right":502891881},"right":{"left":{"left":18,"right":10},"right":{"left":26,"right":3}}}
// • 1743617912
// • 260700055
// • …
```
</details>

<details>
<summary><b>memo</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#memo">api</a>]</summary><br/>

*&#8195;Description*

> Generate recursive structures
>
> Contrary to `fc.letrec` you can have a higher control over the depth of the resursion in your `builder` function.

*&#8195;Signatures*

- `fc.memo(builder)`

*&#8195;with:*

- `builder` — _builder function defining how to build the recursive structure. It receives as input the remaining depth and has to return an arbitrary (potentially another `memo` or itself)_

*&#8195;Usages*

```js
// Setup the tree structure:
const tree = fc.memo(n => fc.oneof(node(n), node(n), leaf())); // double the probability of nodes compared to leaves
const node = fc.memo(n => {
  if (n <= 1) return fc.record({ left: leaf(), right: leaf() });
  return fc.record({ left: tree(), right: tree() }); // tree() is equivalent to tree(n-1)
});
const leaf = fc.nat;
// Use the arbitrary:
tree(2)
// Note: Only produce trees having a maximal depth of 2
// Examples of generated values:
// • {"left":{"left":28,"right":17},"right":{"left":13,"right":210148030}}
// • 1883170510
// • 4879206
// • {"left":{"left":5,"right":1000891966},"right":2077419944}
// • {"left":{"left":9,"right":16},"right":1628923279}
// • …
```
</details>

### More

<details>
<summary><b>.filter</b> - [<a href="https://dubzzz.github.io/fast-check/classes/arbitrary.html#filter">api</a>]</summary><br/>

*&#8195;Description*

> Filter an existing arbitrary

*&#8195;Signatures*

- `.filter(predicate)`

*&#8195;with:*

- `predicate` — _only keeps values such as `predicate(value) === true`_

*&#8195;Usages*

```js
fc.integer().filter(n => n % 2 === 0)
// Note: Only produce even integer values
// Examples of generated values: -757498916, -70006654, -8, 10, 1991604420…

fc.integer().filter(n => n % 2 !== 0)
// Note: Only produce odd integer values
// Examples of generated values: -3, 220007129, 2035004479, -19, 13…

fc.string().filter(s => s[0] < s[1])
// Note: Only produce strings with `s[0] < s[1]`
// Examples of generated values: "dp]dA+GK", "Sa{6S(", ",hsLWj#=y", "]b", "cd+M."…
```
</details>

<details>
<summary><b>.map</b> - [<a href="https://dubzzz.github.io/fast-check/classes/arbitrary.html#map">api</a>]</summary><br/>

*&#8195;Description*

> Map an existing arbitrary

*&#8195;Signatures*

- `.map(mapper)`

*&#8195;with:*

- `mapper` — _transform the produced value into another one_

*&#8195;Usages*

```js
fc.nat(1024).map(n => n * n)
// Note: Produce only square values
// Examples of generated values: 680625, 441, 422500, 88209, 25…

fc.nat().map(n => String(n))
// Note: Change the type of the produced value from number to string
// Examples of generated values: "2076933868", "22", "1971335630", "260497460", "0"…

fc.tuple(fc.integer(), fc.integer())
  .map(t => t[0] < t[1] ? [t[0], t[1]] : [t[1], t[0]])
// Note: Generate a range [min, max]
// Examples of generated values: [30,1211945858], [-1079425464,-233690526], [-303189586,-12], [15,1592081894], [-1339524192,-9]…

fc.string().map(s => `[${s.length}] -> ${s}`)
// Examples of generated values: "[8] -> 40M;<f/D", "[2] -> 7a", "[2] -> %:", "[2] -> \\!", "[9] -> 0LFg6!aMF"…
```
</details>

<details>
<summary><b>.chain</b> - [<a href="https://dubzzz.github.io/fast-check/classes/arbitrary.html#chain">api</a>]</summary><br/>

*&#8195;Description*

> Flat-Map an existing arbitrary
>
> ⚠️ Be aware that the shrinker of such construct might not be able to shrink as much as possible (more details [here](https://github.com/dubzzz/fast-check/issues/650#issuecomment-648397230))

*&#8195;Signatures*

- `.chain(fmapper)`

*&#8195;with:*

- `fmapper` — _produce an arbitrary based on a generated value_

*&#8195;Usages*

```js
fc.nat().chain(min => fc.tuple(fc.constant(min), fc.integer(min, 0xffffffff)))
// Note: Produce a valid range
// Examples of generated values: [30,39], [722484778,1844243122], [52754604,52754611], [231714704,420820067], [3983528,3983554]…
```
</details>

## Others

<details>
<summary><b>falsy</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#falsy">api</a>]</summary><br/>

*&#8195;Description*

> Falsy values
>
> Generate falsy values ie. one of: `false`, `null`, `undefined`, `0`, `''`, `Number.NaN` or `0n`.

*&#8195;Signatures*

- `fc.falsy()`

*&#8195;Usages*

```js
fc.falsy()
// Examples of generated values: null, false, 0, Number.NaN, ""…

fc.falsy({ withBigInt: true })
// Examples of generated values: 0, false, Number.NaN, undefined, ""…
```
</details>

<details>
<summary><b>context</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#context">api</a>]</summary><br/>

*&#8195;Description*

> Generate an [instance of `ContextValue`](https://dubzzz.github.io/fast-check/interfaces/contextvalue.html) for each predicate run
>
> `ContextValue` can be used to log stuff within the run itself. In case of failure, the logs will be attached in the counterexample and visible in the stack trace

*&#8195;Signatures*

- `fc.context()`

*&#8195;Usages*

```js
fc.context()
// The produced value - let's call it ctx - can be used as a logger that will be specific to this run (and only this run).
// It can be called as follow: ctx.log('My log')
```
</details>

<details>
<summary><b>commands</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#commands">api</a>]</summary><br/>

*&#8195;Description*

> Iterables of commands
>
> Model based testing approach extends the power of property based testing to state machines.
> It relies on commands or operations that a user can run on the system. Those commands define:
> - pre-condition — confirm whether or not the command can be executed given the current context
> - execution — update a simplified context or _model_ while updating and checking the _real_ system

*&#8195;Signatures*

- `fc.commands(commandArbs)`
- `fc.commands(commandArbs, { disableReplayLog?, maxCommands?, replayPath? })`
- _`fc.commands(commandArbs, maxCommands)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_

*&#8195;with:*

- `commandArbs` — _array of arbitraries responsible to generate commands_
- `disableReplayLog?` — _disable the display of details regarding the replay for commands_
- `maxCommands?` — _maximal number of commands to generate (included)_
- `replayPath?` — _only used when replaying commands_

*&#8195;Usages*

```js
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

Refer to [Model based testing or UI test](./Tips.md#model-based-testing-or-ui-test) for more details.
</details>

<details>
<summary><b>scheduler</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#scheduler">api</a>]</summary><br/>

*&#8195;Description*

> Scheduler for asynchronous tasks

*&#8195;Signatures*

- `fc.scheduler()`
- `fc.scheduler({ act? })`

*&#8195;with:*

- `act` — _ensure that all scheduled tasks will be executed in the right context_

*&#8195;Usages*

Refer to [Race conditions detection](./RaceConditions.md) or [Detect race conditions (quick overview)](./Tips.md#detect-race-conditions) for more details.
</details>

## Going further?

- [API Reference](https://dubzzz.github.io/fast-check/)
- [Advanced arbitraries (guide)](./AdvancedArbitraries.md)
- [Model based testing or UI test](./Tips.md#model-based-testing-or-ui-test)
- [Race conditions detection](./RaceConditions.md)
- [Detect race conditions (quick overview)](./Tips.md#detect-race-conditions)