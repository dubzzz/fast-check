# [:house:](../README.md) Arbitraries

Property based testing frameworks rely on two main building blocks:
- [Runners](./Runners.md) — _they are responsible for running, executing and checking that properties stay true whatever the generated value_
- Arbitraries — _they are responsible for the random *but deterministic* generation of values, they may also offer shrinking capabilities_

This documentation lists all the built-in arbitraries provided by `fast-check`. Please note that you can still create your own ones by either [combining them together](#combinators) or by [building it from scratch](./AdvancedArbitraries.md#build-your-own). You can refer also to the [API Reference](https://dubzzz.github.io/fast-check/) for more details.

In a nutshell, when defining your tests and properties you will have to combine both the [Runners](./Runners.md) and Arbitraries as follows:

```js
fc.assert( // run the property several times (in other words execute the test)
  fc.property( // define the property: arbitrary and what should be observed (predicate)
    arb1, arb2, ..., // 1 to +infinity arbitraries
    (valueGeneratedByArb1, valueGeneratedByArb2, ...) => { // predicate receives generated values
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
- [Typed Array](#typed-array)
- [Combinators](#combinators)
  - [Simple](#simple)
  - [Array](#array)
  - [Object](#object)
  - [Function](#function)
  - [Recursive structures](#recursive-structures)
  - [More](#more)
- [Others](#others)
- [Going further?](#going-further)
  - [Size explained](#size-explained)
  - [Various links](#various-links)

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
// Examples of generated values: 1502944448, 888414599, 1123740386, -440217435, 19…

fc.integer(1000)
// Note: All possible integers between `-2147483648` (included) and `1000` (included)
// Examples of generated values: -1057705109, -8, -1089721660, -1878447823, -741474720…

fc.integer(-99, 99)
// Note: All possible integers between `-99` (included) and `99` (included)
// Examples of generated values: 6, -1, -96, 91, 5…

fc.integer({min: -99, max: 99})
// Note: All possible integers between `-99` (included) and `99` (included)
// Examples of generated values: 6, 98, 8, 5, 0…

fc.integer({min: 65536})
// Note: All possible integers between `65536` (included) and `2147483647` (included)
// Examples of generated values: 65552, 2147483636, 65548, 1836480947, 1490866554…
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
// Examples of generated values: 2147483640, 1747563639, 2, 2075457316, 2146229148…

fc.nat(1000)
// Note: All possible integers between `0` (included) and `1000` (included)
// Examples of generated values: 299, 997, 225, 750, 4…

fc.nat({max: 1000})
// Note: All possible integers between `0` (included) and `1000` (included)
// Examples of generated values: 0, 833, 995, 496, 1…
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
// Examples of generated values: -44, 7332126275469769, 32, -8631085038818688, 417563055004249…
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
// Examples of generated values: 9007199254740981, 5859827138257099, 41, 5028419509524314, 9007199254740974…
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
>
> Next version: Always generate valid 32-bit floating point values.

*&#8195;Signatures*

- `fc.float()`
- `fc.float({next: true, min?, max?, noDefaultInfinity?, noNaN?})`
- `fc.float({next?: false, min?, max?})`
- `fc.float(min, max)`
- _`fc.float(max)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_

*&#8195;with:*

*When `next` is `true`...*

- `next` — _use the new version of float_
- `min?` — default: `-∞` and `-3.4028234663852886e+38` when `noDefaultInfinity:true` — _lower bound for the generated 32-bit floats (included)_
- `max?` — default: `+∞` and `+3.4028234663852886e+38` when `noDefaultInfinity:true` — _upper bound for the generated 32-bit floats (included)_
- `noDefaultInfinity?` — default: `false` — _use finite values for `min` and `max` by default_
- `noNaN?` — default: `false` — _do not generate `Number.NaN`_

*Otherwise...*

- `min?` — default: `0.0` — _lower bound of the range (included)_
- `max?` — default: `1.0` — _upper bound of the range (excluded)_

*&#8195;Usages*

```js
// New behaviour...

fc.float({next: true})
// Note: All possible 32-bit floating point values (including -∞, +∞ and NaN but also -0)
// Examples of generated values: -4.979507809409578e+32, -1.6702151959801674e+28, 1.9627621397599177e+28, 350.84765625, 3.363116314379561e-44…

fc.float({next: true, min: 0})
// Note: All possible positive 32-bit floating point values (including +∞ and NaN)
// Examples of generated values: 2.802596928649634e-45, 2.1029948291590276e+24, 9.80908925027372e-45, 2.2572006841955642e+36, 2.1019476964872256e-44…

fc.float({next: true, noDefaultInfinity: true, noNaN: true})
// Note: All possible finite 32-bit floating point values
// Examples of generated values: 4.0637655465419695e-44, 1.4038274882832713e-11, -2.8106043967884853e-14, -2.2420775429197073e-44, 3.053702712160785e+32…

fc.float({next: true, noDefaultInfinity: true, min: Number.NEGATIVE_INTEGER, max: Number.POSITIVE_INTEGER})
// Note: Same as fc.float({next: true}), noDefaultInfinity just tells that defaults for min and max
// should not be set to -∞ and +∞. It does not forbid the user to explicitely set them to -∞ and +∞.
// Examples of generated values: -3.4028222494407124e+38, -5.1506072030609065e-26, -3.4028190042551758e+38, 3.4028183957828877e+38, 2.382207389352189e-44…

// Legacy mode...

fc.float()
// Note: All possible 32-bit floating point values between `0.0` (included) and `1.0` (excluded)
// Examples of generated values: 0.8121654987335205, 0.2905852794647217, 0.5317489504814148, 0.8747345805168152, 0.2262873649597168…

fc.float({max: 100})
// Note: All possible 32-bit floating point values between `0.0` (included) and `100.0` (excluded)
// Examples of generated values: 0.00007748603820800781, 99.99992251396179, 60.498785972595215, 99.99995827674866, 24.220764636993408…

fc.float({min: -100, max: 100})
// Note: All possible 32-bit floating point values between `-100.0` (included) and `100.0` (excluded)
// Examples of generated values: 99.99995231628418, -99.9998927116394, 81.314218044281, -100, -99.99988079071045…
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
- `fc.double({next: true, min?, max?, noDefaultInfinity?, noNaN?})`
- `fc.double({min?, max?})`
- `fc.double(min, max)`
- _`fc.double(max)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_

*&#8195;with:*

*When `next` is `true`...*

- `next` — _use the new version of float_
- `min?` — default: `-∞` and `-Number.MAX_VALUE` when `noDefaultInfinity:true` — _lower bound for the generated 32-bit floats (included)_
- `max?` — default: `+∞` and `Number.MAX_VALUE` when `noDefaultInfinity:true` — _upper bound for the generated 32-bit floats (included)_
- `noDefaultInfinity?` — default: `false` — _use finite values for `min` and `max` by default_
- `noNaN?` — default: `false` — _do not generate `Number.NaN`_

*Otherwise...*

- `min?` — default: `0.0` — _lower bound of the range (included)_
- `max?` — default: `1.0` — _upper bound of the range (excluded)_

*&#8195;Usages*

```js
// New behaviour...

fc.double({next: true})
// Note: All possible floating point values (including -∞, +∞ and NaN but also -0)
// Examples of generated values: 2.37e-322, 8.585001320826223e-158, -2.5e-323, 5.895761138020238e+302, -3.7859248062812417e-171…

fc.double({next: true, min: 0})
// Note: All possible positive floating point values (including +∞ and NaN)
// Examples of generated values: 1.7976931348623093e+308, 2.8e-322, 3.0427667746799623e-174, 1.2e-322, 1.3e-322…

fc.double({next: true, noDefaultInfinity: true, noNaN: true})
// Note: All possible finite floating point values
// Examples of generated values: 7.708517430762217e-92, 8.177542674298762e-87, 5.4e-323, 1.7976931348623071e+308, 4.3922193704082206e+39…

fc.double({next: true, noDefaultInfinity: true, min: Number.NEGATIVE_INTEGER, max: Number.POSITIVE_INTEGER})
// Note: Same as fc.double({next: true}), noDefaultInfinity just tells that defaults for min and max
// should not be set to -∞ and +∞. It does not forbid the user to explicitely set them to -∞ and +∞.
// Examples of generated values: 1.7976931348623157e+308, -1.7976931348623061e+308, -2.4e-322, 1.14e-322, 1.7976931348623055e+308…

// Legacy mode...

fc.double()
// Note: All possible floating point values between `0.0` (included) and `1.0` (excluded)
// Examples of generated values: 0.3956174850463876, 0.2384091532256838, 0.7450366348797337, 0.4402490407228471, 3.278255483740722e-7…

fc.double({max: 100})
// Note: All possible floating point values between `0.0` (included) and `100.0` (excluded)
// Examples of generated values: 78.93341183662397, 0.000004502756623114834, 98.5225079632713, 10.198144676861675, 99.99998476502925…

fc.double({min: -100, max: 100})
// Note: All possible floating point values between `-100.0` (included) and `100.0` (excluded)
// Examples of generated values: -99.99996125698067, 37.98004388809261, 1.4435261487965079, 99.99994039535542, -99.9999523162838…
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
// Examples of generated values: -1n, -2n, 0n, 1n…

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
// Examples of generated values: 8n, 11376877730870697597n, 1349784798053983117n, 12345678901234567877n, 9n…

fc.bigInt({min: -3000n, max: 100n})
// Note: All possible bigint values between `-3000n` (included) and `100n` (included)
// Examples of generated values: -1169n, -2n, 3n, 0n, -2680n…

fc.bigInt({min: 1n << 64n})
// Note: Any possible bigint value greater or equal to `1n << 64n`
// Examples of generated values:
// • 32214219993684643449722944918025059692370181015953432795318507902966520589940n
// • 39382683564378805230116691834855902707168271164394481253375072148371261997983n
// • 57219012822578120981130257612614965800502300168860147954523587474583795051388n
// • 25423414325897465771981521346031075469986997563517783083160644823268642168363n
// • 18446744073709551637n
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
// Examples of generated values: 0n, 2n, 1n, 3n…

fc.bigUintN(128)
// Note: All possible bigint values between `0n` (included) and `(2n**128n)-1n` (included)
// Examples of generated values:
// • 86341151263089925165504430453367665188n
// • 14n
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
// • 24n
// • …

fc.bigUint({max: 12345678901234567890n})
// Note: All possible bigint values between `0n` (included) and `12345678901234567890n` (included)
// Examples of generated values: 2140173898915155879n, 4446193883774321594n, 12345678901234567890n, 12345678901234567882n, 19n…
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
// Examples of generated values: "3", "e", "2", "d", "1"…
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
// Examples of generated values: "#", "&", "}", "A", "J"…
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
// Examples of generated values: "5", "\u001a", "7", "}", "A"…
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
// Examples of generated values: "", "熇", "ዢ", "⢥", "\""…
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
// Examples of generated values: "￻", "훺", ")", "", "￰"…
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
- `fc.hexaString({minLength?, maxLength?, size?})`
- _`fc.hexaString(maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_
- _`fc.hexaString(minLength, maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_

*&#8195;with:*

- `minLength?` — default: `0` — _minimal number of characters (included)_
- `maxLength?` — default: `0x7fffffff` [more](#size-explained) — _maximal number of characters (included)_
- `size?` — default: `undefined` [more](#size-explained) — _how large should the generated values be?_

*&#8195;Usages*

```js
fc.hexaString()
// Examples of generated values: "3c4", "bf2", "f", "a9cb", "02e25e"…

fc.hexaString({maxLength: 3})
// Note: Any hexadecimal string containing up to 3 (included) characters
// Examples of generated values: "", "c", "0", "1", "c0"…

fc.hexaString({minLength: 3})
// Note: Any hexadecimal string containing at least 3 (included) characters
// Examples of generated values: "132", "c63baf", "064133", "1e412e", "0e479d13"…

fc.hexaString({minLength: 4, maxLength: 6})
// Note: Any hexadecimal string containing between 4 (included) and 6 (included) characters
// Examples of generated values: "c3108", "f911e", "db35", "00fa", "09a7ba"…
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
- `fc.base64String({minLength?, maxLength?, size?})`
- _`fc.base64String(maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_
- _`fc.base64String(minLength, maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_

*&#8195;with:*

- `minLength?` — default: `0` — _minimal number of characters (included)_
- `maxLength?` — default: `0x7fffffff` [more](#size-explained) — _maximal number of characters (included if multiple of 4)_
- `size?` — default: `undefined` [more](#size-explained) — _how large should the generated values be?_

_When using `minLength` and `maxLength` make sure that they are compatible together. For instance: asking for `minLength=2` and `maxLength=3` is impossible for base64 strings as produced by the framework_

*&#8195;Usages*

```js
fc.base64String()
// Examples of generated values: "rgk=", "BI==", "RD/Evefg", "xBE=", "FoRD"…

fc.base64String({maxLength: 8})
// Note: Any base64 string containing up to 8 (included) characters
// Examples of generated values: "", "YycWxD==", "CF==", "udGFHc==", "xBk="…

fc.base64String({minLength: 8})
// Note: Any base64 string containing at least 8 (included) characters
// Examples of generated values: "ES8A9c87", "7BPvpeDlf2BE", "7WXEBForaLaj2H8mGc==", "YycWxDA+KMsIEQg0B6M=", "CFx/rD9F6AI="…

fc.base64String({minLength: 4, maxLength: 12})
// Note: Any base64 string containing between 4 (included) and 12 (included) characters
// Examples of generated values: "rUs8bJfAngr=", "uFDtEE==", "rB+EZD==", "B4DP", "C379"…
```
</details>

<details>
<summary><b>string</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#string">api</a>]</summary><br/>

*&#8195;Description*

> String containing characters produced by `fc.char()`

*&#8195;Signatures*

- `fc.string()`
- `fc.string({minLength?, maxLength?, size?})`
- _`fc.string(maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_
- _`fc.string(minLength, maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_

*&#8195;with:*

- `minLength?` — default: `0` — _minimal number of characters (included)_
- `maxLength?` — default: `0x7fffffff` [more](#size-explained) — _maximal number of characters (included)_
- `size?` — default: `undefined` [more](#size-explained) — _how large should the generated values be?_

*&#8195;Usages*

```js
fc.string()
// Examples of generated values: ".A%", "aM{]xTH&)", "^NLpz5/y", "", "eqr"…

fc.string({maxLength: 3})
// Note: Any string containing up to 3 (included) characters
// Examples of generated values: "", "~*2", "{Z", "[!", "jlZ"…

fc.string({minLength: 3})
// Note: Any string containing at least 3 (included) characters
// Examples of generated values: "W=*$Fm V4Yf4<qC", "JeT[$", "~*2[s\\,qgwio", "nDL?K[,", "{Z:gG\")"…

fc.string({minLength: 4, maxLength: 6})
// Note: Any string containing between 4 (included) and 6 (included) characters
// Examples of generated values: "x<H+`", "!z$#", "%0b $", "}%[~z", "z&x~"…
```
</details>

<details>
<summary><b>asciiString</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#asciistring">api</a>]</summary><br/>

*&#8195;Description*

> ASCII string containing characters produced by `fc.ascii()`

*&#8195;Signatures*

- `fc.asciiString()`
- `fc.asciiString({minLength?, maxLength?, size?})`
- _`fc.asciiString(maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_
- _`fc.asciiString(minLength, maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_

*&#8195;with:*

- `minLength?` — default: `0` — _minimal number of characters (included)_
- `maxLength?` — default: `0x7fffffff` [more](#size-explained) — _maximal number of characters (included)_
- `size?` — default: `undefined` [more](#size-explained) — _how large should the generated values be?_

*&#8195;Usages*

```js
fc.asciiString()
// Examples of generated values: "2u1\u001aWQ", "", "*y", "\bT\u0013.\u0017|h&>", "si3\u0016`kA\u0017\u0004"…

fc.asciiString({maxLength: 3})
// Note: Any ascii string containing up to 3 (included) characters
// Examples of generated values: "", "vC", "", "'\u0010*", "%"…

fc.asciiString({minLength: 3})
// Note: Any ascii string containing at least 3 (included) characters
// Examples of generated values: " \"\"!\u001a)\u001a\u001e\u001dFF", "vCkn&}{", "\u001c\u0006p", "'\u0010*6ua\u0017JEpG\u000bg<#\u0007", "%f\"\u001fBO"…

fc.asciiString({minLength: 4, maxLength: 6})
// Note: Any ascii string containing between 4 (included) and 6 (included) characters
// Examples of generated values: "0(0E\"", "!.Qj?-", "V\u0002\u0014z\fT", "!#!\"", "\u0007U\u0006t#"…
```
</details>

<details>
<summary><b>unicodeString</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#unicodestring">api</a>]</summary><br/>

*&#8195;Description*

> Unicode string containing characters produced by `fc.unicode()`

*&#8195;Signatures*

- `fc.unicodeString()`
- `fc.unicodeString({minLength?, maxLength?, size?})`
- _`fc.unicodeString(maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_
- _`fc.unicodeString(minLength, maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_

*&#8195;with:*

- `minLength?` — default: `0` — _minimal number of characters (included)_
- `maxLength?` — default: `0x7fffffff` [more](#size-explained) — _maximal number of characters (included)_
- `size?` — default: `undefined` [more](#size-explained) — _how large should the generated values be?_

*&#8195;Usages*

```js
fc.unicodeString()
// Examples of generated values: "", "ॗﰗ騈)￻,揖￵ᛦ￸", "㚗", "娇\u001eᨫ㽹矌", "┛䅯퉳"…

fc.unicodeString({maxLength: 3})
// Note: Any unicode (from BMP-plan) string containing up to 3 (included) characters
// Examples of generated values: "-", "", "⇾燏", "*❚", "ሖꧾㆳ"…

fc.unicodeString({minLength: 3})
// Note: Any unicode (from BMP-plan) string containing at least 3 (included) characters
// Examples of generated values: "-(*臑憚.ḙ葢￸獲戽+(⑆", "杮಴⿆뎶蝐母쪀㩑ᶔ䰚搞慢䲉欐", "⇾燏ᅙ秱뵴ꇺ꿵玽鄧돟鐎䕝ᑿ", "*❚\"%*", " 嬵ߍ�섁"…

fc.unicodeString({minLength: 4, maxLength: 6})
// Note: Any unicode (from BMP-plan) string containing between 4 (included) and 6 (included) characters
// Examples of generated values: "紫ᡔ楬莼媛", "ኮ࿅!릭", "ū/￶$ﭙ+", "'ָ/㳏", "랂巻ᗽ"…
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
- `fc.string16bits({minLength?, maxLength?, size?})`
- _`fc.string16bits(maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_
- _`fc.string16bits(minLength, maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_

*&#8195;with:*

- `minLength?` — default: `0` — _minimal number of characters (included)_
- `maxLength?` — default: `0x7fffffff` [more](#size-explained) — _maximal number of characters (included)_
- `size?` — default: `undefined` [more](#size-explained) — _how large should the generated values be?_

*&#8195;Usages*

```js
fc.string16bits()
// Examples of generated values: "埫쒠爤", "#\udb48", "૑ᚃ⵿⫄㖯孞℠", "⤱黁醙", "⦕끅Ȩ鋑\uda43"…

fc.string16bits({maxLength: 3})
// Note: Any string (not really legal ones sometimes) containing up to 3 (included) characters
// Examples of generated values: "", "￱", "ऻ㨖ẗ", "ﾮ뾝꜆", "㓱"…

fc.string16bits({minLength: 3})
// Note: Any string (not really legal ones sometimes) containing at least 3 (included) characters
// Examples of generated values: "徵 씒", "￱!婏숯", "ऻ㨖ẗ倄쾁伅周쀫", "䯘趲䴜", "&/꫿鐫"…

fc.string16bits({minLength: 4, maxLength: 6})
// Note: Any string (not really legal ones sometimes) containing between 4 (included) and 6 (included) characters
// Examples of generated values: "孢\udbcd퉭⻵", "↩㄁\ude77䟾鏹撜", "軫쒍#驆䥖", "旲'+￲\ud870", "䵬ଛ쩀蛩‮৶"…
```
</details>

<details>
<summary><b>fullUnicodeString</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#fullunicodestring">api</a>]</summary><br/>

*&#8195;Description*

> Unicode string containing characters produced by `fc.fullUnicode()`

*&#8195;Signatures*

- `fc.fullUnicodeString()`
- `fc.fullUnicodeString({minLength?, maxLength?, size?})`
- _`fc.fullUnicodeString(maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_
- _`fc.fullUnicodeString(minLength, maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_

*&#8195;with:*

- `minLength?` — default: `0` — _minimal number of characters (included)_
- `maxLength?` — default: `0x7fffffff` [more](#size-explained) — _maximal number of characters (included)_
- `size?` — default: `undefined` [more](#size-explained) — _how large should the generated values be?_

_Be aware that the length is considered in terms of the number of glyphs in the string and not the number of UTF-16 characters. As a consequence `generatedString.length` might be greater than the asked maximal length but `[...generatedString].length` will not and always be in the required range_

*&#8195;Usages*

```js
fc.fullUnicodeString()
// Examples of generated values: "𾪖򘔼򭐂񿈋𰥞", "񫪥񫹚򻰌􏿮", "󘅽󘺂򦀵򈄓񧟵", "󥐫򱡭􌺛愋Ꚁ𻧗ᨘ񀄮􍹣", "򈼴.򯃗􏿻'()􋇶/\""…

fc.fullUnicodeString({maxLength: 3})
// Note: Any unicode string containing up to 3 (included) code-points
// Examples of generated values: "🷣", "𪇍򱲆", "", "󟙀", "򒎧"…

fc.fullUnicodeString({minLength: 3})
// Note: Any unicode string containing at least 3 (included) code-points
// Examples of generated values: "🷣󸯜򎪳񖶌󪊀򳘟𙂄󟠷󄏧𰷡", "𪇍򱲆𖰌󣉄𵨡𻥕𰆏򦇘󜁳򁿳򎗯􈤘񖇅󑃙񡳏", "򞭽𜔱򠹉", "󔌧򞡺􏿮񞊙􂣐", "𞄊􊪆󧁴𦳫󇗋𨖸񉵊򫧏𞩻󓖞򼦃𘅏񀔾"…

fc.fullUnicodeString({minLength: 4, maxLength: 6})
// Note: Any unicode string containing between 4 (included) and 6 (included) code-points
// Examples of generated values: "񅈡򅰻񱅜򾐬񲆗񃯹", "𕩴𦿗񙷦-򽺺", ",􏿶 !𼻃񚸺", "-,񟟺񼐹", "􏿼𬑪12"…
```
</details>

<details>
<summary><b>stringOf</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#stringof">api</a>]</summary><br/>

*&#8195;Description*

> String containing characters produced by the passed character generator

*&#8195;Signatures*

- `fc.stringOf(charArb)`
- `fc.stringOf(charArb, {minLength?, maxLength?, size?})`
- _`fc.stringOf(charArb, maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_
- _`fc.stringOf(charArb, minLength, maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_

*&#8195;with:*

- `charArb` — _arbitrary able to generate random strings (possibly multiple characters)_
- `minLength?` — default: `0` — _minimal number of characters (included)_
- `maxLength?` — default: `0x7fffffff` [more](#size-explained) — _maximal number of characters (included)_
- `size?` — default: `undefined` [more](#size-explained) — _how large should the generated values be?_

*&#8195;Usages*

```js
fc.stringOf(fc.hexa())
// Examples of generated values: "6c2be", "5acc", "d2535", "bdbb078e3", "407d300602"…

fc.stringOf(fc.char(), {maxLength: 3})
// Note: Any string containing up to 3 (included) characters extracted from `fc.char()`
// Examples of generated values: "$", "KU", ")H", "", "Z"…

fc.stringOf(fc.char(), {minLength: 4, maxLength: 6})
// Note: Any string containing between 4 (included) and 6 (included) characters extracted from `fc.char()`
// Examples of generated values: "*jlRI", "}<6Fm", "4P\"x ", "Q\"2R", "ZgIk"…

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
- `fc.json({depthFactor?, maxDepth?})`
- _`fc.json(maxDepth)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_

*&#8195;with:*

- `depthFactor?` — default: `0` — _factor to increase the probability to generate leaf values as we go deeper in the structure, numeric value >=0 (eg.: 0.1)_
- `maxDepth?` — _maximal depth of generated objects_

*&#8195;Usages*

```js
fc.json()
// Examples of generated values:
// • "{\"\":-2.2052192979331875e-140,\"xj)R+qu\\\"2\":null,\">4q'AU\":true}"
// • "null"
// • "{\"im$\":[-9.240765166268931e+301,-1.5146555856635233e-68,true,2.2779168123106603e+175],\"z\":-4.735523409620518e-174}"
// • "[true]"
// • "{\"1Cu*#{v\":[null,\"d*J8hB]$\",\"X1=H\"],\"sfH\\\" ^\":[false,false,\"qn4Rq\"]}"
// • …

fc.json({maxDepth: 0})
// Examples of generated values: "null", "2.393389240281231e+175", "false", "true", "\"E\""…

fc.json({maxDepth: 1})
// Examples of generated values:
// • "{\"mTZw9f!~2\":\"N'!U6\",\"9=\":-3.6221384866363086e-275,\"\":\"cq\"}"
// • "{\"UzMWL`G@{_\":null,\"znC\":\"nY\"}"
// • "{\"jUW6CH\":false,\"tX\\\">W2\":3.1467045696127526e+168}"
// • "{\"Q|t9};*Iow\":true,\"r(>uO\":false,\"I$2`I_6@\":false}"
// • "[1.73e-322]"
// • …

fc.json({depthFactor: 0.1})
// Examples of generated values: "[]", "-1.2e-322", "\"W!oe%r(\"", "{}", "[false,\"?Y]}I%d\",2.7395116183994342e+35]"…
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
- `fc.unicodeJson({depthFactor?, maxDepth?})`
- _`fc.unicodeJson(maxDepth)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_

*&#8195;with:*

- `depthFactor?` — default: `0` — _factor to increase the probability to generate leaf values as we go deeper in the structure, numeric value >=0 (eg.: 0.1)_
- `maxDepth?` — _maximal depth of generated objects_

*&#8195;Usages*

```js
fc.unicodeJson()
// Examples of generated values:
// • "[[-3.8889674402925734e+155]]"
// • "{\"￺\":\"%￿㷹\",\"￱螽렲$￶\":{\")\\\"⻜￺￲￲\":false,\"糐馺骩㊙廒ͣ砡땉㙐瓬\":-1.1e-322,\"▘㴉䨢\":4.615868404720035e+294}}"
// • "{\"\":null}"
// • "{\"摶顜\":false,\"ᐞ淙\":null,\"虎뙕斘뱹葛\":\"\"}"
// • "{\"迵끀꧋좡ꏶ塣\":false,\"뒓䬹Ⱝ䧎﹥ï飸\":true,\"婠꠨旞荫㹢ފ漀\":null,\"콆쳑Ｈ᜞紽ѳ㑓\":null,\"ㅜޞ욵ꤣ漓ꉶ瀞뿱끮\":-2.747809153946476e-271}"
// • …

fc.unicodeJson({maxDepth: 0})
// Examples of generated values: "false", "\"켔Ꚗޔ넡+/\"", "null", "\"倣\"", "4.1604273853370814e+265"…

fc.unicodeJson({maxDepth: 1})
// Examples of generated values: "false", "true", "\"㬻켔㣃Ꚗ⧅ޔ\"", "[\"⩡傒胀녠鯑\",null,null,\"犨녎짨\",null]", "-2.787348602876926e-78"…

fc.unicodeJson({depthFactor: 0.1})
// Examples of generated values:
// • "true"
// • "[{\"ﰈ矂䵑\":\"鬗쮠嫁\",\"ꚓᎾ麷梒쨼䰻㝚堊ﲽ\":false,\"\":-2.032086846640786e-16}]"
// • "[[null,null,-6.73497623395787e+186]]"
// • "false"
// • "{}"
// • …
```
</details>

<details>
<summary><b>lorem</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#lorem">api</a>]</summary><br/>

*&#8195;Description*

> Lorem ipsum values

*&#8195;Signatures*

- `fc.lorem()`
- `fc.lorem({maxCount?, mode?, size?})`
- _`fc.lorem(maxWordsCount)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_
- _`fc.lorem(maxCount, sentenceMode)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_

*&#8195;with:*

- `maxCount?` — default: `5` — if `sentenceMode` is `true`: lorem ipsum sentence containing at most `maxCount` sentences, otherwise: containing at most `maxCount` words_
- `mode?` — default: `"words"` — _enable sentence mode by setting its value to `"sentences"`_
- `maxWordsCount?` — _maximal number of words to produce_
- `sentenceMode?` — default: `false` — _enable sentence mode_
- `size?` — default: `undefined` [more](#size-explained) — _how large should the generated values be?_

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
// Examples of generated values: "7.149.25.7", "7.7.6.6", "254.21.210.1", "98.5.251.31", "221.2.9.255"…
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
// Examples of generated values: "160.0372.0x3", "5.031355510", "0x92df1683", "0x85b09ec1", "0x45.0103.03236"…
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
// Examples of generated values: "5998:7144:3dc:ff:b:5ae5:3::", "::c1e0:b3a:3:5.249.0.0", "59::9:150.144.165.251", "d::fa8f", "::f3:be0:0c2a:e:252.1.4.153"…
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
// • "0000000f-ca95-1bc1-9399-f11900000017"
// • "00000017-0016-1000-8000-001c00000016"
// • "fffffffe-7e15-511f-800b-6ed200000009"
// • "8d6aee62-0002-1000-bfff-ffffbdd4f31f"
// • "c2156fdd-0018-1000-bd96-0109ffffffef"
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
// • "05cfea14-bcac-3b1b-8d87-f0d2ffffffe8"
// • "7f4a63cc-0010-3000-bfff-ffeeffffffeb"
// • "b18820b3-04b5-347a-a800-88270000000c"
// • "e6dfee9b-0003-3000-8000-0018d16c26be"
// • "4339edf8-0000-3000-92e8-dd5800000000"
// • …

fc.uuidV(5)
// Examples of generated values:
// • "d9951cc0-000f-5000-886d-743b90c0903c"
// • "b4f42187-7bd2-5385-8000-000794a930da"
// • "c2faeae2-2bd2-51a4-81e8-3f5800000007"
// • "65c2d0a5-0004-5000-8000-000e579a5fa4"
// • "00000002-0008-5000-8000-000b1bc90950"
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
- `fc.domain({size?})`

*&#8195;with:*

- `size?` — default: `undefined` [more](#size-explained) — _how large should the generated values be?_

*&#8195;Usages*

```js
fc.domain()
// Examples of generated values: "j6ib52zarmf.dec", "00.wk", "35b10n-w.7xe2.xai", "0.h6a4sfyde.ju", "c.cb"…

fc.domain({size: '-1'})
// Note: Generate smaller domain name compared to default. As default size is 'small' (if unchanged), it is equivalent to 'xsmall'
// Examples of generated values: "ec.ob", "1nl.0it.oxt", "za.kjs", "3tu.d.bl", "rn.d0.kfx"…

fc.domain({size: '+1'})
// Note: Generate larger domain name compared to default. As default size is 'small' (if unchanged), it is equivalent to 'medium'
// Examples of generated values:
// • "e3lmceoiktylhwob3i097i07lbqe.g.ew2a5jzl4dm7y4.fx8-cc9.a8mp77soh3743x58n3bx85s-a8bkfnda8-bbnke3gjrr7ui57nqt.ez-ns69b5k6g8ugc1t7zvwsf0dzq1wywm7okkc1w6pt2.w.b5q7l242x-fcosehdxghwp1js5oykwo14t-7y5x.7gftao9au5u-ynym-yq027d9kc.iyxwwefae"
// • "1n2983iaqbaqqez.j5exoz885-r97uinqna5rb0u35junfiav5p6q3xrw-ceribgdz.xdyncrdcuyzcbs"
// • "z72rbhb9tjfoqq4whcj589.r94hzbjrbnrt2r8s0b3zu83fa0ysem2dbaf0quiow7d.7o-riknfagqdyaf-4dqibda.p.dn.5f.bs62gc.c.eg23f3h9n257004x7gt2xz1lb1nzfw5xz8yl0r4ddazujmdl-9bv6-kohtr.ye"
// • "3twerafs1lktsebj9o0p2g6p2adbdu63vwsr7kw57-lkbeb3p7ef1383xqmej69.80h5rjtsk4n2c82ecntzsy1tt0-1udt3fsc2rdctnnu68w6x3re1yk9gp.6.6ah5085en0kni5y25swn0aoahmhknzf00.15czrzh4wu00hes7p4860s6ui8-htm5x4b-cquy9rbal6.4.fv"
// • "rq42wt9mq67kg30r5iz55yh9.5g4zvgp29o.mrgob7gvx4r85rpwosrgr1dpw6dlvn6--pneig1.7co96i0-5d0zaw7thxb30jt9eyq6c67v7o0tnz4xhc8twkiyy46h.7tpqwpzihjluq4h4d0hwtcikxiyackva3xkk78.98b2cnk7yr-1kdxkq4vlikoly658f6d1j8ddrzo95.q739viaqbdk2u3etgcclbe4u7-kqnoe2i.ire"
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
- `fc.webAuthority({withIPv4?, withIPv4Extended?, withIPv6?, withPort?, withUserInfo?, size?})`

*&#8195;with:*

- `withIPv4?` — default: `false` — _enable ip v4
- `withIPv4Extended?` — default: `false` — _enable ip v4 extended_
- `withIPv6?` — default: `false` — _enable ip v6_
- `withPort?` — default: `false` — _enable port_
- `withUserInfo?` — default: `false` — _enable user info_
- `size?` — default: `undefined` [more](#size-explained) — _how large should the generated values be?_


*&#8195;Usages*

```js
fc.webAuthority()
// Examples of generated values: "qj5h7-5.d6je1ud1x.ay", "5w6.mn", "qtabs87.4j6.zce", "vyd-xdhj.vu94x4.nl", "5sr6j0ayq2et.a.eur"…

fc.webAuthority({
  withIPv4: true,
})
// Examples of generated values: "227.252.4.231", "6.1.143.3", "nlefeaoklaq7.ijm", "168w.uvr", "6.3.255.158"…

fc.webAuthority({
  withIPv4Extended: true,
})
// Examples of generated values: "4dfi9d-5.qe5.odw", "0xa", "0xefebe5f3", "6abqd.nf", "0345.077777767"…

fc.webAuthority({
  withIPv4: true,
  withIPv4Extended: true,
  withIPv6: true,
  withPort: true,
})
// Examples of generated values: "0352.0x89bbdd:3", "154.0372.0xbd3d", "[4522:29:b:fc75:83e:964c:108::]:12037", "250.102.83.229:13", "025:13850"…
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
- `fc.webFragments({size?})`

*&#8195;with:*

- `size?` — default: `undefined` [more](#size-explained) — _how large should the generated values be?_

*&#8195;Usages*

```js
fc.webFragments()
// Examples of generated values: "hip", "wc", "K/z=)RtC", "E7y", "%F0%B5%81%85:w,+"…
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
- `fc.webQueryParameters({size?})`

*&#8195;with:*

- `size?` — default: `undefined` [more](#size-explained) — _how large should the generated values be?_

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
- `fc.webSegment({size?})`

*&#8195;with:*

- `size?` — default: `undefined` [more](#size-explained) — _how large should the generated values be?_

*&#8195;Usages*

```js
fc.webSegment()
// Examples of generated values: "==:", "097", "6", "BgyH", "vn0qo*"…
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
- `fc.webUrl({authoritySettings?, validSchemes?, withFragments?, withQueryParameters?, size?})`

*&#8195;with:*

- `authoritySettings?` — default: `{}` — _[constraints](https://dubzzz.github.io/fast-check/interfaces/webauthorityconstraints.html) on the web authority_
- `validSchemes?` — default: `['http', 'https']` — _list all the valid schemes_
- `withFragments?` — default: `false` — _enable fragments_
- `withQueryParameters?` — default: `false` — _enable query parameters_
- `size?` — default: `undefined` [more](#size-explained) — _how large should the generated values be?_

*&#8195;Usages*

```js
fc.webUrl()
// Examples of generated values: "https://lo.vu/@", "https://4.kcl", "https://710n-lu1.s.zl", "https://a9c.nus/.q%F0%9B%A6%A1rkoLYs", "https://6uzbj4.dp/;"…

fc.webUrl({
  validSchemes: ['ftp', 'ftps'],
})
// Examples of generated values: "ftps://ld0fa.1k.ve/3Ne", "ftps://5ana.x02y.sv", "ftp://f.d.nl/1", "ftp://d3mhpf.xtb", "ftps://4.cn"…

fc.webUrl({
  withFragments: true,
  withQueryParameters: true,
})
// Examples of generated values:
// • "https://6teotdbx.wnc?c=#%F4%8F%BF%BBa%E4%B0%8E"
// • "http://ntgafkj31t.8x7x09flrvhg.yd?,$#FVSy"
// • "http://e4.17v9z34.xh/?e#;cbd?:b"
// • "http://8.jef?o#GD"
// • "https://qc.ieele4.fcg?P%F1%81%9C%A5N+0DN%F3%97%8C%85fX"
// • …

fc.webUrl({size: '-1'})
// Note: Generate smaller urls compared to default. As default size is 'small' (if unchanged), it is equivalent to 'xsmall'
// Examples of generated values: "http://d.ue", "https://h.lp/%F3%A0%B4%9E", "http://64.e.tod/%F0%9F%AA%B3", "https://b.uq.xl", "https://g26.ben"…
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
- `fc.emailAddress({size?})`

*&#8195;with:*

- `size?` — default: `undefined` [more](#size-explained) — _how large should the generated values be?_

*&#8195;Usages*

```js
fc.emailAddress()
// Examples of generated values:
// • "e0f7||'5tqsh61k_opz+r*%^'k&wscdddsv{'*=f{1e2@azcddep.brd"
// • "8d{cdrddb5a^}dc|g}#bacd0bfn0bdfoa}fbslf7f''#xe2-_aj?.&*9bi6-@du5h8ii.sf5vf2yd9khk.ub"
// • "|bi9r}1|9lm^biw8i3.$~doz=|dlrlnl}~gfu+px0pr-{%*mh&*8efxj4`b6y}m@mada.bbv"
// • "/22{9=mp&2?e#w-b%-'=%itdenn?8#_c1g_3c#=#0e~/_j^n&*@sflar.xk"
// • "z*3y`3kteb}4~6|&&xepg{@7t-ze.m.iat"
// • …

fc.emailAddress({size: '-1'})
// Note: Generate smaller email addresses compared to default. As default size is 'small' (if unchanged), it is equivalent to 'xsmall'
// Examples of generated values: "hn@s1v.i9.ws", "%@xo.s.iaw", "n@vq.mz", "kg.kg@5a.cz", "_.7@nr.i.hx"…
```
</details>

<details>
<summary><b>mixedCase</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#mixedcase">api</a>]</summary><br/>

*&#8195;Description*

> Switch the case of characters generated by an underlying arbitrary

*&#8195;Signatures*

- `fc.mixedCase(stringArb)`
- `fc.mixedCase(stringArb, { toggleCase?, untoggleAll? })`

*&#8195;with:*

- `stringArb` — _arbitrary producing random strings_
- `toggleCase?` — default: _try `toUpperCase` on the received code-point, if no effect try `toLowerCase`_ — _custom toggle case function that will be called on some of the code-points to toggle the character_
- `untoggleAll?` — default: `undefined` — _transform a string containing possibly toggled items to its untoggled version, when provided it makes it possible to shrink user-definable values, otherwise user-definable values will not be shrinkable BUT values generated by the framework will be shrinkable_

*&#8195;Usages*

```js
fc.mixedCase(fc.hexaString())
// Examples of generated values: "", "7E", "Dfc", "0De05933ef", "c"…

fc.mixedCase(fc.constant('hello world'))
// Examples of generated values: "HELlo WoRlD", "HeLLo WOrLD", "heLlo WoRLd", "hEllo wORLd", "hELLO woRLd"…

fc.mixedCase(
  fc.constant('hello world'),
  {
    toggleCase: (rawChar) => `UP(${rawChar})`,
    // untoggleAll is optional, we use it in this example to show how to use all the options together
    untoggleAll: (toggledString) => toggleString.replace(/UP\((.)\)/g, '$1'),
  }
)
// Examples of generated values:
// • "UP(h)eUP(l)UP(l)o woUP(r)lUP(d)"
// • "UP(h)elUP(l)UP(o) world"
// • "hUP(e)UP(l)loUP( )UP(w)UP(o)rUP(l)d"
// • "helUP(l)UP(o)UP( )wUP(o)rUP(l)UP(d)"
// • "UP(h)UP(e)lloUP( )wUP(o)rUP(l)UP(d)"
// • …

fc.mixedCase(
  fc.constant('🐱🐢🐱🐢🐱🐢'),
  {
    toggleCase: (rawChar) => rawChar === '🐱' ? '🐯' : '🐇',
  }
)
// Examples of generated values: "🐯🐢🐯🐢🐯🐢", "🐯🐇🐯🐇🐯🐢", "🐯🐢🐯🐇🐯🐢", "🐱🐇🐯🐇🐯🐢", "🐱🐇🐯🐇🐯🐇"…
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
// • new Date("1969-12-31T23:59:59.993Z")
// • new Date("1970-01-01T00:00:00.017Z")
// • new Date("-271821-04-20T00:00:00.036Z")
// • new Date("+117887-07-07T17:12:49.936Z")
// • new Date("-091653-05-18T10:16:24.518Z")
// • …

fc.date({ min: new Date("2000-01-01T00:00:00.000Z") })
// Examples of generated values:
// • new Date("+275760-09-12T23:59:59.959Z")
// • new Date("+275760-09-12T23:59:59.949Z")
// • new Date("+251844-04-28T11:49:32.856Z")
// • new Date("+275760-09-12T23:59:59.999Z")
// • new Date("+258781-01-23T17:20:22.591Z")
// • …

fc.date({ max: new Date("2000-01-01T00:00:00.000Z") })
// Examples of generated values:
// • new Date("-271821-04-20T00:00:00.011Z")
// • new Date("-271821-04-20T00:00:00.001Z")
// • new Date("-061471-10-15T20:55:54.168Z")
// • new Date("1969-12-31T23:59:59.995Z")
// • new Date("-135742-01-31T09:23:17.695Z")
// • …

fc.date({ min: new Date("2000-01-01T00:00:00.000Z"), max: new Date("2000-12-31T23:59:59.999Z") })
// Examples of generated values:
// • new Date("2000-06-25T11:59:12.750Z")
// • new Date("2000-12-31T23:59:59.993Z")
// • new Date("2000-09-24T05:26:49.182Z")
// • new Date("2000-12-31T23:59:59.999Z")
// • new Date("2000-07-08T09:22:33.042Z")
// • …
```
</details>

## Typed Array

<details>
<summary><b>int8Array</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#int8array">api</a>]</summary><br/>

*&#8195;Description*

> Generate _Int8Array_

*&#8195;Signatures*

- `fc.int8Array()`
- `fc.int8Array({min?, max?, minLength?, maxLength?, size?})`

*&#8195;with:*

- `min?` — default: `-128` — _minimal value (included)_
- `max?` — default: `127` — _maximal value (included)_
- `minLength?` — default: `0` — _minimal length (included)_
- `maxLength?` — default: `0x7fffffff` [more](#size-explained) — _maximal length (included)_
- `size?` — default: `undefined` [more](#size-explained) — _how large should the generated values be?_

*&#8195;Usages*

```js
fc.int8Array()
// Examples of generated values:
// • Int8Array.from([5,-2,49,5,-6,-74,-48,-2,122,4])
// • Int8Array.from([85,-55])
// • Int8Array.from([1,-6])
// • Int8Array.from([-48,102,-78,52,4,81])
// • Int8Array.from([-1,2])
// • …

fc.int8Array({min: 0, minLength: 1})
// Examples of generated values:
// • Int8Array.from([99,92,51,12,0,31])
// • Int8Array.from([77,6,12,68,33,85,15,88,115,115,111])
// • Int8Array.from([125])
// • Int8Array.from([39,122,124])
// • Int8Array.from([10,6,116,107,75,56,74,79,123])
// • …
```
</details>

<details>
<summary><b>uint8Array</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#uint8array">api</a>]</summary><br/>

*&#8195;Description*

> Generate _Uint8Array_

*&#8195;Signatures*

- `fc.uint8Array()`
- `fc.uint8Array({min?, max?, minLength?, maxLength?, size?})`

*&#8195;with:*

- `min?` — default: `0` — _minimal value (included)_
- `max?` — default: `255` — _maximal value (included)_
- `minLength?` — default: `0` — _minimal length (included)_
- `maxLength?` — default: `0x7fffffff` [more](#size-explained) — _maximal length (included)_
- `size?` — default: `undefined` [more](#size-explained) — _how large should the generated values be?_

*&#8195;Usages*

```js
fc.uint8Array()
// Examples of generated values:
// • Uint8Array.from([3,248,4])
// • Uint8Array.from([203,79,114])
// • Uint8Array.from([251])
// • Uint8Array.from([90,185,172,171])
// • Uint8Array.from([0,2,254,2,69,254])
// • …

fc.uint8Array({max: 42, minLength: 1})
// Examples of generated values:
// • Uint8Array.from([16,1])
// • Uint8Array.from([12,28,2,26,4,38,3])
// • Uint8Array.from([7,41,34,25,16,18,2,10,30,6,16])
// • Uint8Array.from([16])
// • Uint8Array.from([4,12])
// • …
```
</details>

<details>
<summary><b>uint8ClampedArray</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#uint8clampedarray">api</a>]</summary><br/>

*&#8195;Description*

> Generate _Uint8ClampedArray_

*&#8195;Signatures*

- `fc.uint8ClampedArray()`
- `fc.uint8ClampedArray({min?, max?, minLength?, maxLength?, size?})`

*&#8195;with:*

- `min?` — default: `0` — _minimal value (included)_
- `max?` — default: `255` — _maximal value (included)_
- `minLength?` — default: `0` — _minimal length (included)_
- `maxLength?` — default: `0x7fffffff` [more](#size-explained) — _maximal length (included)_
- `size?` — default: `undefined` [more](#size-explained) — _how large should the generated values be?_

*&#8195;Usages*

```js
fc.uint8ClampedArray()
// Examples of generated values:
// • Uint8ClampedArray.from([150,60,2,11,94])
// • Uint8ClampedArray.from([165,90,12,252])
// • Uint8ClampedArray.from([125,130,53,19,245])
// • Uint8ClampedArray.from([43,109,155,11,128,215,24,46,99])
// • Uint8ClampedArray.from([52,4,215,253,7,4,4,246,4,2])
// • …

fc.uint8ClampedArray({max: 42, minLength: 1})
// Examples of generated values:
// • Uint8ClampedArray.from([40,11,6,19,35,37,25])
// • Uint8ClampedArray.from([34,22,2,4,39,27,19,37,25])
// • Uint8ClampedArray.from([11,34,1,31,25])
// • Uint8ClampedArray.from([15,3,1,37,30,12,38,40,35,41,5])
// • Uint8ClampedArray.from([17,35,21])
// • …
```
</details>

<details>
<summary><b>int16Array</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#int16array">api</a>]</summary><br/>

*&#8195;Description*

> Generate _Int16Array_

*&#8195;Signatures*

- `fc.int16Array()`
- `fc.int16Array({min?, max?, minLength?, maxLength?, size?})`

*&#8195;with:*

- `min?` — default: `-32768` — _minimal value (included)_
- `max?` — default: `32767` — _maximal value (included)_
- `minLength?` — default: `0` — _minimal length (included)_
- `maxLength?` — default: `0x7fffffff` [more](#size-explained) — _maximal length (included)_
- `size?` — default: `undefined` [more](#size-explained) — _how large should the generated values be?_

*&#8195;Usages*

```js
fc.int16Array()
// Examples of generated values:
// • Int16Array.from([32761,-15,19460])
// • Int16Array.from([-7989,4687,24946])
// • Int16Array.from([-32765])
// • Int16Array.from([5978,-14151,-10068,-4949])
// • Int16Array.from([1,7,-32762,-11,21829,-32762])
// • …

fc.int16Array({min: 0, minLength: 1})
// Examples of generated values:
// • Int16Array.from([8,12886,11,10845,32410])
// • Int16Array.from([24045,28817])
// • Int16Array.from([8634,263,21637,10150,30007,13375,30165])
// • Int16Array.from([32753,32759,19209])
// • Int16Array.from([11936])
// • …
```
</details>

<details>
<summary><b>uint16Array</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#uint16array">api</a>]</summary><br/>

*&#8195;Description*

> Generate _Uint16Array_

*&#8195;Signatures*

- `fc.uint16Array()`
- `fc.uint16Array({min?, max?, minLength?, maxLength?, size?})`

*&#8195;with:*

- `min?` — default: `0` — _minimal value (included)_
- `max?` — default: `65535` — _maximal value (included)_
- `minLength?` — default: `0` — _minimal length (included)_
- `maxLength?` — default: `0x7fffffff` [more](#size-explained) — _maximal length (included)_
- `size?` — default: `undefined` [more](#size-explained) — _how large should the generated values be?_

*&#8195;Usages*

```js
fc.uint16Array()
// Examples of generated values:
// • Uint16Array.from([40338,3413,32529,37241,31799,27569])
// • Uint16Array.from([])
// • Uint16Array.from([37642,20057])
// • Uint16Array.from([20327,25524,65394,34318,27766,53340,23112,2822,26910])
// • Uint16Array.from([26963,18761,50835,51189,22592,18891,8353,62454,6243])
// • …

fc.uint16Array({max: 42, minLength: 1})
// Examples of generated values:
// • Uint16Array.from([27,8,29,3,39,34,13,14])
// • Uint16Array.from([3,37,4,3,4,16,40,20,0,21])
// • Uint16Array.from([5,31])
// • Uint16Array.from([40,2,42,42,41])
// • Uint16Array.from([19,5,40])
// • …
```
</details>

<details>
<summary><b>int32Array</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#int32array">api</a>]</summary><br/>

*&#8195;Description*

> Generate _Int32Array_

*&#8195;Signatures*

- `fc.int32Array()`
- `fc.int32Array({min?, max?, minLength?, maxLength?, size?})`

*&#8195;with:*

- `min?` — default: `-0x80000000` — _minimal value (included)_
- `max?` — default: `0x7fffffff` — _maximal value (included)_
- `minLength?` — default: `0` — _minimal length (included)_
- `maxLength?` — default: `0x7fffffff` [more](#size-explained) — _maximal length (included)_
- `size?` — default: `undefined` [more](#size-explained) — _how large should the generated values be?_

*&#8195;Usages*

```js
fc.int32Array()
// Examples of generated values:
// • Int32Array.from([2147483619,-7,841665540])
// • Int32Array.from([-754622261,809800271,-1634737806])
// • Int32Array.from([-2147483645])
// • Int32Array.from([-1499097254,-1996207943,160127148,-1135579989])
// • Int32Array.from([1,29,-2147483626,-17,-1705126587,-2147483642])
// • …

fc.int32Array({min: 0, minLength: 1})
// Examples of generated values:
// • Int32Array.from([30,1812443734,26,662645341,620592794])
// • Int32Array.from([536894957,149319825])
// • Int32Array.from([1265639866,1672446215,356045957,1686054822,2086860087,2035004479,1523119573])
// • Int32Array.from([2147483618,2147483620,1209289481])
// • Int32Array.from([946187936])
// • …
```
</details>

<details>
<summary><b>uint32Array</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#uint32array">api</a>]</summary><br/>

*&#8195;Description*

> Generate _Uint32Array_

*&#8195;Signatures*

- `fc.uint32Array()`
- `fc.uint32Array({min?, max?, minLength?, maxLength?, size?})`

*&#8195;with:*

- `min?` — default: `0` — _minimal value (included)_
- `max?` — default: `0xffffffff` — _maximal value (included)_
- `minLength?` — default: `0` — _minimal length (included)_
- `maxLength?` — default: `0x7fffffff` [more](#size-explained) — _maximal length (included)_
- `size?` — default: `undefined` [more](#size-explained) — _how large should the generated values be?_

*&#8195;Usages*

```js
fc.uint32Array()
// Examples of generated values:
// • Uint32Array.from([2729221522,2511211861,3996745489,4234383737,1407876151,483945393])
// • Uint32Array.from([])
// • Uint32Array.from([1188401930,1080708697])
// • Uint32Array.from([4079898471,242967476,1070530418,2475263502,20278390,848810076,2651478600,509283078,418212126])
// • Uint32Array.from([995846483,1424836937,374064787,802080757,2308659264,165366219,2215846049,310244342,1942755427])
// • …

fc.uint32Array({max: 42, minLength: 1})
// Examples of generated values:
// • Uint32Array.from([27,8,29,3,39,34,13,14])
// • Uint32Array.from([3,37,4,3,4,16,40,20,0,21])
// • Uint32Array.from([5,31])
// • Uint32Array.from([40,2,42,42,41])
// • Uint32Array.from([19,5,40])
// • …
```
</details>

<details>
<summary><b>float32Array</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#float32array">api</a>]</summary><br/>

*&#8195;Description*

> Generate _Float32Array_

*&#8195;Signatures*

- `fc.float32Array()`
- `fc.float32Array({min?, max?, noDefaultInfinity?, noNaN?, minLength?, maxLength?, size?})`

*&#8195;with:*

- `min?` — default: `-∞` and `-3.4028234663852886e+38` when `noDefaultInfinity:true` — _lower bound for the generated 32-bit floats (included)_
- `max?` — default: `+∞` and `+3.4028234663852886e+38` when `noDefaultInfinity:true` — _upper bound for the generated 32-bit floats (included)_
- `noDefaultInfinity?` — default: `false` — _use finite values for `min` and `max` by default_
- `noNaN?` — default: `false` — _do not generate `Number.NaN`_
- `minLength?` — default: `0` — _minimal length (included)_
- `maxLength?` — default: `0x7fffffff` [more](#size-explained) — _maximal length (included)_
- `size?` — default: `undefined` [more](#size-explained) — _how large should the generated values be?_

*&#8195;Usages*

```js
fc.float32Array()
// Examples of generated values:
// • Float32Array.from([2.838487790382467e+22,1.1814616040137283e-28,-1.2447510050843058e-39])
// • Float32Array.from([-7.006492321624085e-45,-9.633964538574219])
// • Float32Array.from([50677384277393410,2.815765430662526e-27,35189715715342990000,-3.809889793395996,1.0517918868948659e+37,8.993062611852643e+32,-2.7968944295546947e-20,-7335792])
// • Float32Array.from([-7.639300007131037e+28,3.3218551999276265e-35,1.811662677611599e-30])
// • Float32Array.from([-267187306496,-4202965385667936000,2.647066979020766e-20,66189066240,0.00006144169310573488])
// • …

fc.float32Array({minLength: 1})
// Examples of generated values:
// • Float32Array.from([-503561310315741200])
// • Float32Array.from([-3.4028220466166163e+38,-1.961817850054744e-44])
// • Float32Array.from([-3.5715513740798766e+36,1.3295048537642752e+23,2262949.5,-0.0000026030456865555607])
// • Float32Array.from([8.539668944857956e-14])
// • Float32Array.from([-5.605193857299268e-45,3.4028181929587916e+38,2.5736176825164795e-23])
// • …
```
</details>

<details>
<summary><b>float64Array</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#float64array">api</a>]</summary><br/>

*&#8195;Description*

> Generate _Float64Array_

*&#8195;Signatures*

- `fc.float64Array()`
- `fc.float64Array({min?, max?, noDefaultInfinity?, noNaN?, minLength?, maxLength?, size?})`

*&#8195;with:*

- `min?` — default: `-∞` and `-Number.MAX_VALUE` when `noDefaultInfinity:true` — _lower bound for the generated 32-bit floats (included)_
- `max?` — default: `+∞` and `Number.MAX_VALUE` when `noDefaultInfinity:true` — _upper bound for the generated 32-bit floats (included)_
- `noDefaultInfinity?` — default: `false` — _use finite values for `min` and `max` by default_
- `noNaN?` — default: `false` — _do not generate `Number.NaN`_
- `minLength?` — default: `0` — _minimal length (included)_
- `maxLength?` — default: `0x7fffffff` [more](#size-explained) — _maximal length (included)_
- `size?` — default: `undefined` [more](#size-explained) — _how large should the generated values be?_

*&#8195;Usages*

```js
fc.float64Array()
// Examples of generated values:
// • Float64Array.from([1.616891650937421e+175,-2.6304053149712647e-306,-4.243132822801271e-219])
// • Float64Array.from([2.5e-323,-54826743.81511721])
// • Float64Array.from([1.7365802452981713e+129,1.320991370898586e+152,9.109051404240327e+291,-3.6562625294902846e-157,-6.9216731040462545e-192,2.4523695375398673e-67,-1045.8897076512326,-1.9672082630551467e-215])
// • Float64Array.from([-1.1080655465042191e+231,5.559295309739158e-243,1.5204711046897551e+296])
// • Float64Array.from([-2.5297510012561425e+91,1.4452619284617389e-161,1.238133303287883e-38,-1.4441430640880058e+187,-9.20327913781559e+267])
// • …

fc.float64Array({minLength: 1})
// Examples of generated values:
// • Float64Array.from([-3.0129659915228672e+141])
// • Float64Array.from([-1.7976931348623157e+308,1.14e-322])
// • Float64Array.from([-1.7441105727027757e+292,3.7278990325311785e+46,-2.97662671796463e-185,-2.0953226219959493e-272])
// • Float64Array.from([1.0842009835971395e-109])
// • Float64Array.from([-8.4e-323,1.7976931348623131e+308,1.1447746735519345e-185])
// • …
```
</details>

## Combinators

### Simple

<details>
<summary><b>constant</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#constant">api</a>]</summary><br/>

*&#8195;Description*

> Always produce the same value

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

- _`fc.clonedConstant(value)`_ — _deprecated since v2.15.0, prefer `fc.constant`_

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
  const withCloneMethod = () => {
    const clone = {...objectInstance};
    Object.defineProperty(objectInstance, fc.cloneMethod, {
      value: withCloneMethod,
      enumerable: false,
    });
    return clone;
  };
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
- `fc.option(arb, {freq?, nil?, depthFactor?, maxDepth?, depthIdentifier?})`
- _`fc.option(arb, freq)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_

*&#8195;with:*

- `arb` — _arbitrary that will be called to generate normal values_
- `freq?` — default: `5` — _probability to build the nil value is of 1 / freq_
- `nil?` — default: `null` — _nil value_
- `depthFactor?` — default: `0` — _this factor will be used to increase the probability to generate nil values as we go deeper in a recursive structure_
- `maxDepth?` — default: `Number.POSITIVE_INFINITY` — _when reaching maxDepth, only nil could be produced_
- `depthIdentifier?` — default: `undefined` — _share the depth between instances using the same `depthIdentifier`_

*&#8195;Usages*

```js
fc.option(fc.nat())
// Examples of generated values: null, 773390791, 2147483625, 25, 2039519833…

fc.option(fc.nat(), { freq: 2 })
// Examples of generated values: 214938453, 2147483645, 2130844098, 748471782, null…

fc.option(fc.nat(), { freq: 2, nil: Number.NaN })
// Examples of generated values: 2147483617, Number.NaN, 259062763, 13, 23…

fc.option(fc.string(), { nil: undefined })
// Examples of generated values: "^_|\"T.5rB", "&&", "OqA3D$", undefined, "}"…

// fc.option fits very well with recursive stuctures built using fc.letrec.
// Examples of such recursive structures are available with fc.letrec.
```
</details>

<details>
<summary><b>oneof</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#oneof">api</a>]</summary><br/>

*&#8195;Description*

> Generate one value based on one of the passed arbitraries
>
> Randomly chooses an arbitrary at each new generation. Should be provided with at least one arbitrary. All arbitraries are equally probable and shrink is still working for the selected arbitrary. `fc.oneof` is able to shrink inside the failing arbitrary but not across arbitraries (contrary to `fc.constantFrom` when dealing with constant arbitraries).

*&#8195;Signatures*

- `fc.oneof(...arbitraries)`
- `fc.oneof({withCrossShrink?, maxDepth?, depthIdentifier?}, ...arbitraries)`

*&#8195;with:*

- `...arbitraries` — _arbitraries that could be used to generate a value_
- `withCrossShrink?` — default: `false` — _in case of failure the shrinker will try to check if a failure can be found by using the first specified arbitrary. It may be pretty useful for recursive structures as it can easily help reducing their depth in case of failure_
- `depthFactor?` — default: `0` — _this factor will be used to increase the probability to generate instances of the first passed arbitrary_
- `maxDepth?` — default: `Number.POSITIVE_INFINITY` — _when reaching maxDepth, the first arbitrary will be used to generate the value_
- `depthIdentifier?` — default: `undefined` — _share the depth between instances using the same `depthIdentifier`_

*&#8195;Usages*

```js
fc.oneof(fc.char(), fc.boolean())
// Examples of generated values: "&", false, true, "@", "2"…

fc.oneof(fc.char(), fc.boolean(), fc.nat())
// Examples of generated values: true, 234471686, 485911805, false, "\\"…

// fc.oneof fits very well with recursive stuctures built using fc.letrec.
// Examples of such recursive structures are available with fc.letrec.
```
</details>

<details>
<summary><b>frequency</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#frequency">api</a>]</summary><br/>

*&#8195;Description*

> Generate one value based on one of the passed arbitraries
>
> Randomly chooses an arbitrary at each new generation. Should be provided with at least one arbitrary. Probability to select a specific arbitrary is based on its weight, the higher it is the more it will be probable. It preserves the shrinking capabilities of the underlying arbitrary.
>
> **Warning:** In the upcomping major releases of fast-check the first arbitrary specified on `frequency` will have a privileged position. Constraints like `withCrossShrink` tend to favor it over others and will probably be enabled by default.

*&#8195;Signatures*

- `fc.frequency(...{ arbitrary, weight })`
- `fc.frequency({withCrossShrink?, maxDepth?, depthIdentifier?}, ...{ arbitrary, weight })`

*&#8195;with:*

- `...{ arbitrary, weight }` — _arbitraries that could be used to generate a value along their weight (the higher the weight, the higher the probability to select this arbitrary will be)_
- `withCrossShrink?` — default: `false` — _in case of failure the shrinker will try to check if a failure can be found by using the first specified arbitrary (if and only if its weight is strictly greater than 0). It may be pretty useful for recursive structures as it can easily help reducing their depth in case of failure_
- `depthFactor?` — default: `0` — _this factor will be used to increase the probability to generate instances of the first passed arbitrary if its weight is not zero_
- `maxDepth?` — default: `Number.POSITIVE_INFINITY` — _when reaching maxDepth, the first arbitrary will be used to generate the value even if its weight is zero_
- `depthIdentifier?` — default: `undefined` — _share the depth between instances using the same `depthIdentifier`_

*&#8195;Usages*

```js
fc.frequency(
  { arbitrary: fc.char(), weight: 2 },
  { arbitrary: fc.boolean(), weight: 1 }
)
// Examples of generated values: true, "&", "8", false, "["…

fc.frequency(
  { withCrossShrink: true },
  { arbitrary: fc.boolean(), weight: 2 },
  { arbitrary: fc.array(fc.boolean()), weight: 1 }
)
// Note: In case of failure on an array of boolean values the shrinker will first try to check
// if a failure can also be triggered with a simple boolean (the first arbitrary specified)
// if not it will carry on the classical shrinking strategy defined for arrays of boolean.
// Examples of generated values: true, [true,false], [true,false,false], [false,true,true], [false]…

// fc.frequency fits very well with recursive stuctures built using fc.letrec.
// Examples of such recursive structures are available with fc.letrec.
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
// Examples of generated values: "9", "4", "b", "d", "7"…
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
// Examples of generated values: [25,25], [2147483629,2147483629], [13,13], [815456380,815456380], [2147483643,2147483643]…

fc.clone(fc.nat(), 3)
// Examples of generated values:
// • [1395148595,1395148595,1395148595]
// • [7,7,7]
// • [1743838935,1743838935,1743838935]
// • [879259091,879259091,879259091]
// • [2147483640,2147483640,2147483640]
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
// Examples of generated values: [25,25], [2147483629,2147483629], [13,13], [815456380,815456380], [2147483643,2147483643]…

fc.dedup(fc.nat(), 3)
// Examples of generated values:
// • [1395148595,1395148595,1395148595]
// • [7,7,7]
// • [1743838935,1743838935,1743838935]
// • [879259091,879259091,879259091]
// • [2147483640,2147483640,2147483640]
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
// Examples of generated values: [2147483621], [28], [2147483641], [242661188], [263784372]…

fc.tuple(fc.nat(), fc.string())
// Examples of generated values: [2147483619,"6*xn_VkQ"], [12,"!Z}%Y"], [468194571,"*_J"], [14,"2&0"], [5,"&S"]…
```
</details>

<details>
<summary><b>genericTuple</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#generictuple">api</a>]</summary><br/>

*&#8195;Description*

> Generate _tuples_ - or more precisely arrays - by aggregating the values generated by its underlying arbitraries.
>
> Note: This arbitrary is mostly there for typings related needs. Most of the time, `fc.tuple` will do the job.

*&#8195;Signatures*

- `fc.genericTuple(arbitraries)` — _deprecated since v2.14.0_

*&#8195;with:*

- `arbitraries` — _arbitraries that should be used to generate the values of our tuple_

*&#8195;Usages*

```js
fc.genericTuple([fc.nat()])
// Examples of generated values: [1322560433], [472890492], [1878169203], [1642558158], [343133589]…

fc.genericTuple([fc.nat(), fc.string()])
// Examples of generated values: [498298066,"xx]ZF."], [1035210183,"x{Y"], [2147483646,"kAw19&5T"], [2147483640,"ZY{&DB+5-Y"], [21,"RN6Cb1a:"]…
```
</details>

<details>
<summary><b>array</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#array">api</a>]</summary><br/>

*&#8195;Description*

> Array of random length containing values generated by `arb`

*&#8195;Signatures*

- `fc.array(arb)`
- `fc.array(arb, {minLength?, maxLength?, size?})`
- _`fc.array(arb, maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_
- _`fc.array(arb, minLength, maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_

*&#8195;with:*

- `arb` — _arbitrary instance responsible to generate values_
- `minLength?` — default: `0` — _minimal length (included)_
- `maxLength?` — default: `0x7fffffff` [more](#size-explained) — _maximal length (included)_
- `size?` — default: `undefined` [more](#size-explained) — _how large should the generated values be?_

*&#8195;Usages*

```js
fc.array(fc.nat())
// Examples of generated values:
// • []
// • [1044253015,881466391,1911917064,3,2147483643,11,1097098198,2147483640,292366054,2147483642]
// • [1644861079]
// • [624842423,32338439,1321248893,980127887,850807339,1583851385,1093421004]
// • [505677510,559592731,1931700591,729662778,1771367027]
// • …

fc.array(fc.nat(), {minLength: 3})
// Examples of generated values:
// • [758331231,398217079,312666176,53143294,521680871,1862921771,1710362589,983796605,1814936084]
// • [1097867707,1901779976,13,49685271,2147483645,973337534,1612556434,2147483620]
// • [15,156619197,2147483622,0,845007549,1361626270,314708047,437471639]
// • [6,26,17]
// • [2147483640,4,12]
// • …

fc.array(fc.nat(), {maxLength: 3})
// Examples of generated values: [], [1097867707], [15,156619197,2147483622], [1360904164,1953451342,1651990695], [1771169783]…

fc.array(fc.nat(), {minLength: 5, maxLength: 7})
// Examples of generated values:
// • [4,26,725992281,7,1186699848,180356277]
// • [1503239805,742382696,478977019,1206184056,992934701,1081616342]
// • [1396368269,227325306,1918884399,1141338513,1861390920,1771550203,750875810]
// • [20,668325235,1112668370,7,8,847065979]
// • [19,3,15,16,117940422,25]
// • …

fc.array(fc.nat(), {maxLength: 50, size: 'max'})
// Note: By specifying size to "max", we enforce the fact that we want generated values to have between
// 0 and 50 items. In other words, we want to use the full range of specified lengths.
// Note: If not defined, by default, the size is "=" except if there is a maxLength provided and the
// global setting defaultSizeToMaxWhenMaxSpecified explicitely set to true (the default in v2). In such
// case it will automatically be defaulted to "max".
// Examples of generated values:
// • [4,26,725992281,7,1186699848]
// • [1503239805,742382696,478977019,1206184056,992934701,1081616342,1979615602,100017132,1937766941,1785237624,89742033,1144227677,1828223609,1661385382,1964114158,526345403,1355567259,101888470,985865568,1687809116,147253818,1849736419,89389898,137520571,1171150892,127470621,827241914,1255338411]
// • [1396368269,227325306,1918884399,1141338513,1861390920,1771550203,750875810,981796650,1210223397,1985219249,1479511918,479227607,1642390464,1556279791,979433247,1634278654,2044481643,1849523874,1519384141,987434773,1605111061,2138565492,1265703106,806958408,907237474,1655276397,1704888094,1830702455,1909917028,1307794976,1257188319,571159719]
// • [20]
// • [19,3,15]
// • …

fc.array(fc.nat(), {maxLength: 100000, size: '+1'})
// Note: From a specification point of view, the algorithm is supposed to handle up to 100,000 items.
// But, even if I want to test the algorithm on large entries I don't want to spend hours in it (it may
// not scale linearly...). By setting size to "+1" I tell fast-check that I want values larger than usual
// ones (~10x factor). If I wanted even larger ones I could have used "+2" (~100x factor), "+3" (~1000x factor)
// or "+4" (~10000x factor). On the opposite, if I wanted smaller arrays I could have used "-1" (~10x smaller)...
// Note: Size could also have been set explicitely to "=" to say: "I want the size used by default no matter the
// specified maxLength". If not defined, by default, the size is "=" except if there is a maxLength provided
// and the global setting defaultSizeToMaxWhenMaxSpecified explicitely set to true (the default in v2). In such
// case it will automatically be defaulted to "max".
// Examples of generated values:
// • [2013730136,353952753,1490777806,634915573,1978586276,205766418,1175483977,32404726,52946578,1069691063,626810743,719356509,1263272304,1824194201,1899370697,1015020872,1705828766,1764355915,1972277951,1015470108,2117817188,449185274,666877613,1210503432,1201056411,777517406,772222564,821394475,850614998,717040931,2031665271,1786858369,1041895508,1725564736,1214876488,1554660788,1241812368]
// • [11,2147483643,1549284389]
// • [131262217]
// • [29,1410245876,741880759,944485652,27,15,870882976,20,184434798,2147483622,344218127,27,409824723,2147483642,329043996,927489807,2035126132,11,2039439877,5,493467004,124950538,26,405637559,2147483620,471069585,931537132,667497301,1621370022,1798147982,10,251298872,867523191,1446431080,1609229900,2147483639,1618986483,1213793840,2147483618,23,2147483639,717045226,928729912,16,2147483637,2147483626,14977076,340466387,13,2042862990,2147483618,2147483631,2147483628,2147483627,18,11,2147483626,2147483640,2147483647,275841729,21,2090499420,983160949,188709474,18,30,1192240225,0,2147483635,22952275,825333491,1138859947,2147483624,5,26,689872800,17,1697943758,384986459,2147483628,1947943844,218900368,12]
// • [1558059373,1486409544,138880328,1775525007,1289633061,2110277820,2132428886,243113350,370748226,1289875763,1926931276,777271555,200391383,382812004,767046802,1658449850,471365442,258979782,1763577358,875799138,1041944829,769854926,874760332,442170309,91717126,113325162,88812665,1097842037,804561500,1870859458,853896552,50228752,492015973,149076083,2093833652,220810263,257405203]
// • …
```
</details>

<details>
<summary><b>uniqueArray</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#uniqueArray">api</a>]</summary><br/>

*&#8195;Description*

> Array of random length containing unique values generated by `arb`
>
> All the values in the array are unique given the provided `selector` and `comparator` functions.
> Two values `a` and `b` are considered equal and thus would not be selected together in the same generated array if and only if `comparator(selector(a), selector(b))` is `true`.
>
> If not specified `selector` defaults to the identity function and `comparator` defaults to `SameValue` aka `Object.is`.
>
> For performance reasons, we highly discourage the use of a fully custom `comparator` and recommend to rely on a custom `selector` function whenever possible.
> Such custom `comparator` — outside of provided ones — cannot be properly optimized and thus includes a potentially huge performance penalty mostly impacted large arrays.

*&#8195;Signatures*

- `fc.uniqueArray(arb)`
- `fc.uniqueArray(arb, {minLength?, maxLength?, selector?, comparator?, size?})`

*&#8195;with:*

- `arb` — _arbitrary instance responsible to generate values_
- `minLength?` — default: `0` — _minimal length (included)_
- `maxLength?` — default: `0x7fffffff` [more](#size-explained) — _maximal length (included)_
- `selector?` — default: `v => v` — _project the generated value in order to compare it_
- `comparator?` — default: `SameValue` — _compare two projected values and returns `true` whenever the projected values should be considered equal. Possible values for `comparator` are:_
  - `SameValue` to rely on `Object.is` to compare items ([more details](https://tc39.es/ecma262/multipage/abstract-operations.html#sec-samevalue))
  - `SameValueZero` to rely on the same logic as the one of `Set` or `Map` to compare items ([more details](https://tc39.es/ecma262/multipage/abstract-operations.html#sec-samevaluezero))
  - `IsStrictlyEqual` to rely on `===` to compare items ([more details](https://tc39.es/ecma262/multipage/abstract-operations.html#sec-isstrictlyequal))
  - Fully custom function having the signature: `(selectedValueA, seletedValueB) => aIsEqualToB`
- `size?` — default: `undefined` [more](#size-explained) — _how large should the generated values be?_

*&#8195;Usages*

```js
fc.uniqueArray(fc.nat(99))
// Examples of generated values: [10,9,90,39,48,7,55,69], [22,9], [39,5,73,64,83,55,2,86,16,12], [43,31,79,16], [21,88,36,31,94,12,9,65,97]…

fc.uniqueArray(
  fc.record({
    id: fc.nat(),
    name: fc.constantFrom("Anna", "Paul"),
  }),
  { selector: entry => entry.id }
)
// Note: Resulting arrays will never contain two entries having the same id
// Examples of generated values:
// • [{"id":1882378367,"name":"Paul"},{"id":45488570,"name":"Paul"},{"id":2147483645,"name":"Anna"},{"id":1221182843,"name":"Paul"}]
// • [{"id":2005739200,"name":"Anna"},{"id":1864243668,"name":"Anna"},{"id":475283529,"name":"Paul"},{"id":337619666,"name":"Paul"},{"id":1035242675,"name":"Paul"},{"id":1055074819,"name":"Paul"},{"id":1103318469,"name":"Anna"},{"id":1509365027,"name":"Paul"}]
// • [{"id":7,"name":"Anna"},{"id":720182288,"name":"Paul"}]
// • []
// • [{"id":15,"name":"Anna"},{"id":5,"name":"Paul"},{"id":2147483644,"name":"Anna"}]
// • …

fc.uniqueArray(fc.constantFrom(-1, -0, 0, 1, Number.NaN))
// Note: By default `uniqueArray` is using `SameValue` algorithm
// so 0 is different from -0 and NaN equals NaN...
// Examples of generated values: [0], [Number.NaN,0,1,-1,-0], [1,-0,0,Number.NaN,-1], [Number.NaN,-0,-1,1,0], [1,0,Number.NaN]…

fc.uniqueArray(
  fc.constantFrom(-1, -0, 0, 1, Number.NaN),
  {comparator: 'SameValueZero'}
)
// Note: ...but it could be overriden by `SameValueZero`
// so 0 equals -0 and NaN is equals NaN...
// Examples of generated values: [Number.NaN,0,-1,1], [], [-1,-0,Number.NaN,1], [-0,-1], [Number.NaN,0,1]…

fc.uniqueArray(
  fc.constantFrom(-1, -0, 0, 1, Number.NaN),
  {comparator: 'IsStrictlyEqual'}
)
// Note: ...or it could be overriden by `IsStrictlyEqual`
// so 0 equals -0 and NaN is different from NaN...
// Examples of generated values:
// • [-0,1,Number.NaN,-1,Number.NaN,Number.NaN]
// • [Number.NaN,0,Number.NaN,Number.NaN,-1,1,Number.NaN,Number.NaN,Number.NaN,Number.NaN]
// • [Number.NaN,-0,Number.NaN]
// • [-0]
// • [-0,1,-1,Number.NaN,Number.NaN,Number.NaN,Number.NaN,Number.NaN,Number.NaN,Number.NaN]
// • …

fc.uniqueArray(
  fc.constantFrom(-1, -0, 0, 1, Number.NaN),
  {comparator: (a,b) => Math.abs(a) === Math.abs(b)}
)
// Note: ...or overriden by a fully custom comparator function
// With the function defined in this example we will never have 1 and -1 toegther, or 0 and -0 together
// but we will be able to have many times NaN as NaN !== NaN.
// Examples of generated values:
// • [1,Number.NaN,Number.NaN,0,Number.NaN,Number.NaN]
// • [1,-0]
// • [-0,Number.NaN,1,Number.NaN,Number.NaN]
// • []
// • [Number.NaN,-1,0,Number.NaN,Number.NaN,Number.NaN,Number.NaN,Number.NaN]
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

- _`fc.set(arb)`_ — _deprecated since v2.23.0, prefer `fc.uniqueArray`_
- _`fc.set(arb, {minLength?, maxLength?, compare?, size?})`_ — _deprecated since v2.23.0, prefer `fc.uniqueArray`_
- _`fc.set(arb, maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_
- _`fc.set(arb, minLength, maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_
- _`fc.set(arb, compare)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_
- _`fc.set(arb, maxLength, compare)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_
- _`fc.set(arb, minLength, maxLength, compare)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_

*&#8195;with:*

- `arb` — _arbitrary instance responsible to generate values_
- `minLength?` — default: `0` — _minimal length (included)_
- `maxLength?` — default: `0x7fffffff` [more](#size-explained) — _maximal length (included)_
- `compare?` — default: `{type: 'IsStrictlyEqual', selector: v => v}` equivalent to `(a, b) => a === b` — _custom compare operator used to distinguish duplicates in order to remove them from the resulting array. it can either be an object `{type,selector}` or a function returning `true` whenever items are equivalent (function-based is less optimized for large arrays)_
  - `type` can be one of:
    - `IsStrictlyEqual` to rely on `===` to compare items ([more details](https://tc39.es/ecma262/multipage/abstract-operations.html#sec-isstrictlyequal))
    - `SameValue` to rely on `Object.is` to compare items ([more details](https://tc39.es/ecma262/multipage/abstract-operations.html#sec-samevalue))
    - `SameValueZero` to rely on the same logic as the one of `Set` or `Map` to compare items ([more details](https://tc39.es/ecma262/multipage/abstract-operations.html#sec-samevaluezero))
  - `selector` to define how to project values before comparing them together
- `size?` — default: `undefined` [more](#size-explained) — _how large should the generated values be?_

*&#8195;Usages*

```js
fc.set(fc.nat(99))
// Examples of generated values: [], [15,91,64,4,96,0,98,95,2,94], [79], [23,39,93,87,85,4,21], [58,31,39,26,75]…

fc.set(fc.nat(99), {maxLength: 3})
// Examples of generated values: [], [55], [2,97,98], [12,90,43], [31]…

fc.set(fc.nat(99), {minLength: 5, maxLength: 7})
// Examples of generated values: [4,3,29,1,48,25], [53,44,67,56,49,42], [69,6,47,13,20,3,58], [5,35,70,0,6,27], [3,5,0,70,6,20]…

fc.set(fc.hexaString(), {compare: {selector: s => s.length}})
// Note: Resulting arrays will never contain two strings with the same number of characters
// Examples of generated values:
// • []
// • ["9c06b50b60","030fcd41f","1f89","84d8c","7cb","3","e9b9af","c5ee4a9","","eb301204"]
// • ["f296eb0"]
// • ["","a76be85","8"]
// • ["d3","912966f8","82b07f","822","0d714","","2ff2623190","137c99f","eee7"]
// • …

fc.set(fc.hexaString(), {compare: (s1, s2) => s1.length === s2.length})
// Note: Same behaviour as the one above BUT less optimized in terms of runtime (function-based compare
// has poor performances for large arrays)
// Examples of generated values: ["20",""], [], ["447","","893c89edb1","b31a5"], ["79429d9",""], ["0","c20ea408b9","1f1574","117d"]…

fc.set(fc.hexaString(), {minLength: 5, maxLength: 10, compare: {selector: s => s.length}})
// Note: Resulting arrays will never contain two strings with the same number of characters and it will contain between 5 and 10 strings
// Examples of generated values:
// • ["0d4","1cef","20d51","74","bb8afd3e0b","916c7c4"]
// • ["fd0d3c99f9","95b0","f42","f","0cc997"]
// • ["835f9","692caf3d1","46f08be","","8","ab46","22"]
// • ["","a31e3f74c","1ae0b","3c17","782","a","eb","cb724e","68c79c08db"]
// • ["c2f3c9621f","","32352ef","6e","91b0ef","11c","5f6c34d88","8509","8","21131"]
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
<summary><b>sparseArray</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#sparsearray">api</a>]</summary><br/>

*&#8195;Description*

> Sparse array of random length containing values generated by `arb`.
> 
> By default, the generated array may end by a hole (see `noTrailingHole`).

*&#8195;Signatures*

- `fc.sparseArray(arb)`
- `fc.sparseArray(arb, {maxLength?, minNumElements?, maxNumElements?, size?, noTrailingHole?})`

*&#8195;with:*

- `arb` — _arbitrary instance responsible to generate values_
- `minNumElements?` — default: `0` — _minimal number of elements (included)_
- `maxNumElements?` — default: `0x7fffffff` [more](#size-explained) — _maximal number of elements (included) - when not specified, the algorithm generating random values will consider it equal to `maxGeneratedLengthFromSizeForArbitrary(minNumElements, size)` but the shrinking one will use `0x7fffffff`_
- `maxLength?` — default: `0x7fffffff` [more](#size-explained) — _maximal length (included) - length includes elements but also holes for sparse arrays - when not specified, the algorithm generating random values will consider it equal to `maxGeneratedLengthFromSizeForArbitrary(maxNumElements used by generate, size)` but the shrinking one will use `0x7fffffff`_
- `size?` — default: `undefined` [more](#size-explained) — _how large should the generated values be?_
- `noTrailingHole?` — default: `false` — _when enabled, all generated arrays will either be the empty array or end by a non-hole_

*&#8195;Usages*

```js
fc.sparseArray(fc.nat(), {maxLength: 20})
// Examples of generated values:
// • [,,,925226031,,,,,,,,,,1586792878]
// • [1711696119,,,,,1046941565,398052668,,,,,,1397870591,,,572805240,1214320037,1229050246,,,]
// • [,,,,,,,,,,,,,,,,,,,,]
// • [,,,20]
// • [11,15,1308253671,,,,,2147483637,,,,,,,,1336335293,,,,,]
// • …

fc.sparseArray(fc.nat(), {maxLength: 20, minNumElements: 1, maxNumElements: 3})
// Examples of generated values:
// • [,,,,,,,,,,,,,,263508609]
// • [,,,,,,,,,,,,,,,,,,1014930196]
// • [,170533977,,,]
// • [,,,,,,133210559,,,1882833716,,,,,,,]
// • [,,21,,,30,,,,,,,,,,,7]
// • …

fc.sparseArray(fc.nat(), {maxLength: 20, noTrailingHole: true})
// Examples of generated values:
// • [,,,1241501051,269051095,392920841,,,,,,1786812914,876995905]
// • [,,,748833099]
// • [,,,25,,,,,,,,,,,,9,,,1300755505]
// • [,450394074,,,,1990006143,,1762425504,,1295052026,979115506,,891113643,,1920597213,1280943861,,517193993]
// • []
// • …

fc.sparseArray(fc.nat())
// Examples of generated values:
// • [,,,,,,,,,,,,,,,,,,,,,,,,,2104277073]
// • [,,,,,,,,,,,,,,,,,,,,,,535782498,,,,794213966]
// • [791160306,,2147483632,1071842921,29,,,,444714173,,,,,,,,,,,,,,,,3,,,,,1935118950]
// • [273021873,,,,,,,,,1700974328,,1016859405,1953708154,,1993296911,,1530566650,,,,,651418517,,187425710,783209689,,,,2043763242]
// • [,,,,,,,,,,,661680466,,227120261,,,,,,,,,,,1637939285]
// • …

fc.sparseArray(fc.nat(), {size: '+1'})
// Note: By specifying a size higher than the currently configured one, we ask for larger arrays in terms of number of
// elements (see minNumElements and maxNumElements) but also in terms of length (see maxLength).
// Examples of generated values:
// • Object.assign(Array(1030),{6:23,173:21,1029:245254457})
// • Object.assign(Array(1199),{3:6,6:668263032,7:1787798462,32:502062992,102:600391750,166:20,273:1057836355,384:1802990240,623:709780132,655:1078130226,841:2147483632,920:10,1015:862158711,1157:2147483644,1173:5,1198:1643619536})
// • Object.assign(Array(1191),{64:1831228621,76:1817271240,103:1921971101,126:1151598222,136:509449625,164:2063169310,167:9966971,180:716310497,183:1391462004,267:1244974369,280:907777027,299:914009386,301:1501506463,306:1485504152,330:450412034,349:1091620465,374:488501875,375:293512875,395:83583365,413:547212156,444:2095112818,459:1656090255,500:2091997175,529:639981495,537:99145273,598:1910525476,606:1155542565,608:667117961,617:1776601619,630:1706777334,637:1641310106,665:1981801593,731:1076709770,754:318485053,756:112106916,758:1067570843,767:1777935574,768:992467967,770:453767451,784:583294476,798:1943597138,806:175982967,815:1574347535,817:1381685022,824:721401545,862:95257528,864:375028203,909:881794603,918:338522106,936:1896261182,938:615938023,960:548232086,978:58068928,982:1843395911,1003:1376820042,1008:507090629,1028:1962031277,1047:387323122,1124:1139870126,1133:236136183,1134:367536700,1139:1889874465,1155:1705599240,1157:429945468,1178:1579280378,1190:500187115})
// • Object.assign(Array(1200),{0:410562142,1:7,2:112946363,3:23,4:17,5:2147483646,6:348775181,7:2,8:957372836,9:2147483643,10:0,35:2147483642,78:1442184813,90:2147483639,117:481546958,130:281316978,139:1354078375,167:28,178:461591681,182:1349441172,186:22,250:1174761236,277:2147483625,296:9,307:16,342:9,346:1080318260,366:1884425340,425:275477999,431:2147483622,444:2,452:1662365833,455:1053746216,461:14,475:0,483:26,501:638926135,530:2147483620,621:1268124692,649:11,663:1891585551,664:1024794525,688:2147483619,697:27,708:1,713:1941436426,715:1805586088,719:1561513881,744:0,752:2147483642,780:2147483631,784:1395048031,806:1,807:16,816:79188245,837:26,846:2147483636,847:1,855:13,873:809885548,887:833559649,927:2147483633,991:29,1041:1968909467,1044:1360402673,1052:3,1054:325367005,1060:1257804707,1084:2024901486,1087:2147483646,1109:1739477681,1113:8,1123:483827998,1133:17,1173:2147483617,1190:897758518,1191:2147483642,1192:11,1193:2,1194:1,1195:16,1196:29,1197:0,1198:8,1199:2128860591})
// • Object.assign(Array(1171),{104:1638804142,117:602011150,129:313752679,185:1448469803,222:768117918,263:1554819660,277:1288756625,359:2059980427,440:1867105842,454:2061521669,462:1801440074,469:135779881,508:856264357,522:2113002129,530:1762964315,536:2038762560,588:789315360,614:1151676895,652:542336121,667:467837917,669:1190486377,690:1072930284,718:601332128,772:569548857,781:999860594,802:1900067120,823:1944768495,826:1474566472,830:1950423455,839:1964123632,848:1866472223,852:937790976,877:1266959932,889:1249315120,896:578387423,939:521841256,950:486372919,986:1983847533,1009:1183067405,1027:2519446,1059:423431392,1081:50338564,1086:1927133080,1149:1141117415,1160:1555762662,1170:1465608282})
// • …
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
// Examples of generated values: Stream(…)…
```
</details>

### Object

<details>
<summary><b>dictionary</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#dictionary">api</a>]</summary><br/>

*&#8195;Description*

> Generate dictionaries containing keys generated using `keyArb` and values generated by `valueArb`

*&#8195;Signatures*

- `fc.dictionary(keyArb, valueArb)`
- `fc.dictionary(keyArb, valueArb, {minKeys?, maxKeys?, size?})`

*&#8195;with:*

- `keyArb` — _arbitrary instance responsible to generate keys_
- `valueArb` — _arbitrary instance responsible to generate values_
- `minKeys?` — default: `0` — _minimal number of keys in the generated instances (included)_
- `maxKeys?` — default: `0x7fffffff` [more](#size-explained) — _maximal number of keys in the generated instances (included)_
- `size?` — default: `undefined` [more](#size-explained) — _how large should the generated values be?_

*&#8195;Usages*

```js
fc.dictionary(fc.string(), fc.string())
// Examples of generated values:
// • {"+":"iM#O7X(G58"}
// • {"y":"rm<45]&THs","KTzJY!":"%","":"<2Khdb","q+& ":""}
// • {"H=>.L$K":";j %u9","PT":"l[jR4C"}
// • {"}9":"xp/g?g","'M":"UbM/K","534pHy":"T/","Z":"","9V02D":"xG#","r+hJ":"\"K"}
// • {"vT`":"~yWotB,m@1","LRwi":",kU~9",",qZ8":"ckz-r^?@","zQP=-!BC":";:S","dA+b<f-\"3T":"[if y\\"}
// • …

fc.dictionary(fc.string(), fc.nat())
// Examples of generated values:
// • {"":1389984732,"Yp$g&t^dp]":1638300335,"+":438403284,"41ST4G":1593876328,"sZ=":474921142,"wjFpf":912590676,"tFK(!":547671001,"Ot=":1404889232}
// • {"BS9-o":1729454479,"OQYWH":1003935961,"a{6S(OQ?\"":1204427717,"n6wY":452693617,"L":1919551662,"KlqB{{":360825924,"":1745761795,"#h#S$":1570990143,"G%":1211363041,"=.":158635507}
// • {}
// • {"Fb+6vZ=< ":589373246,"8}r":17}
// • {"4":57689789,"d":2049278068,".b3n,":1846889886,":E":887324279,"*9\\$WNce":108003991}
// • …

fc.dictionary(fc.string(), fc.nat(), {minKeys: 2})
// Note: Generate instances with at least 2 keys
// Examples of generated values:
// • {"T<M3<":620901509,"DaM\"":1958316323}
// • {"Tc\"":2147483642,"bIKoG7_j":2147483643,"A\\`~@<Y":258879863}
// • {"| !C":2029887034,"{!uI}":2147483644,"$}?":1412302943,"":823604874,"\"@%D5\";\"J-":153893444,"[q":1165972584,"A$":26,"+":22,"7\"~":29,"{<$ 3A0":22}
// • {"%":1708431354,"\"9":1897938290,"I}J?ki>_\\1":892495069,"m":2,"/n":7,"df`":1149626585,"$7\"A{>y":190005547,"":1891531363,"\"!yS#":1190061756," ~Zt;x":2147483641,"\"{W":2073394934,"odV8&u":5,"C!":5}
// • {"":860828778,"$.x~\"|5!X$":2147483626,"{XNUt3<g#":28,"hr%":10,"#!":1561530792,"4}U%n":776916316}
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
- `fc.record(recordModel, {requiredKeys?})`
- `fc.record(recordModel, {withDeletedKeys?})`

*&#8195;with:*

- `recordModel` — _structure of the resulting instance_
- `requiredKeys?` — default: `[all keys of recordModel]` — _list of keys that should never be deleted, remark: cannot be used with `withDeletedKeys`_
- `withDeletedKeys?` — default: `false` — _when enabled, record might not generate all keys. `withDeletedKeys: true` is equivalent to `requiredKeys: []`, thus the two options cannot be used at the same time_

*&#8195;Usages*

```js
fc.record({
  id: fc.uuidV(4),
  age: fc.nat(99)
})
// Examples of generated values:
// • {"id":"a7ccc7eb-f854-442c-8000-00132dd1a2df","age":0}
// • {"id":"ffffffee-faae-46b1-af49-0fc500000001","age":1}
// • {"id":"00000005-096b-4556-8000-0007fffffff6","age":3}
// • {"id":"00000018-0013-4000-b935-8db80000000f","age":91}
// • {"id":"1f27c491-000b-4000-96bd-ae4367d1570e","age":93}
// • …

fc.record({
  id: fc.uuidV(4),
  age: fc.nat(99)
}, { requiredKeys: [] })
// Note: Both id and age will be optional values
// Examples of generated values:
// • {"id":"00000000-ffea-4fff-8000-0010220687cc","age":6}
// • {"id":"fac4b0f1-000e-4000-8000-0013d4108685","age":74}
// • {"id":"098dd732-d92d-42e3-8000-0004a6defef0","age":34}
// • {"id":"fffffffa-0007-4000-891f-7a8c033fd020","age":0}
// • {"id":"00000007-217b-48d8-925a-dd0e0000000c","age":3}
// • …

fc.record({
  id: fc.uuidV(4),
  name: fc.constantFrom('Paul', 'Luis', 'Jane', 'Karen'),
  age: fc.nat(99),
  birthday: fc.date({min: new Date("1970-01-01T00:00:00.000Z"), max: new Date("2100-12-31T23:59:59.999Z")})
}, { requiredKeys:['id'] })
// Note: All keys except 'id' will be optional values. id has been marked as required.
// Examples of generated values:
// • {"id":"00000010-e2be-4b98-8d3a-944affffffe2","age":4,"birthday":new Date("2100-12-31T23:59:59.959Z")}
// • {"id":"00000001-0005-4000-bfff-fff03ec646bf","age":48,"birthday":new Date("2069-12-20T11:27:18.998Z")}
// • {"id":"00000003-ffed-4fff-bfff-fff400000012","name":"Jane","birthday":new Date("2028-02-06T17:18:26.370Z")}
// • {"id":"fa5630bc-000f-4000-8000-001600000018","age":0,"birthday":new Date("1970-01-01T00:00:00.039Z")}
// • {"id":"00000018-ffee-4fff-8a22-b8770000001b","age":93}
// • …

fc.record({
  id: fc.uuidV(4),
  age: fc.nat(99)
}, { withDeletedKeys: true })
// Note: Both id and age will be optional values
// Examples of generated values:
// • {"id":"00000004-27f6-48bb-8000-000a69064200","age":3}
// • {"id":"ffffffee-ffef-4fff-8000-0015f69788ee","age":21}
// • {"age":34}
// • {"id":"2db92e09-3fdc-49e6-8000-001b00000007","age":5}
// • {"id":"00000006-0007-4000-8397-86ea00000004"}
// • …
```
</details>

<details>
<summary><b>object</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#object">api</a>]</summary><br/>

*&#8195;Description*

> Generate objects (key/values)

*&#8195;Signatures*

- `fc.object()`
- `fc.object({key?, depthFactor?, maxDepth?, maxKeys?, size?, withBigInt?, withBoxedValues?, withDate?, withMap?, withNullPrototype?, withObjectString?, withSet?, withTypedArray?, values?})`

*&#8195;with:*

- `key?` — default: `fc.string()` — _arbitrary responsible to generate keys used for instances of objects_
- `depthFactor?` — default: `0` — _factor to increase the probability to generate leaf values as we go deeper in the structure, numeric value >=0 (eg.: 0.1)_
- `maxDepth?` — default: `2` — _maximal depth for generated objects (Map and Set included into objects)_
- `maxKeys?` — default: `5` — _maximal number of keys in generated objects (Map and Set included into objects)_
- `size?` — default: `undefined` [more](#size-explained) — _how large should the generated values be?_
- `withBigInt?` — default: `false` — _enable `bigint` - eg.: `1n`_
- `withBoxedValues?` — default: `false` — _enable boxed values - eg.: `new Number(5)`_
- `withDate?` — default: `false` — _enable `Date` - eg.: `new Date('2020-10-14T16:52:36.736Z')`_
- `withMap?` — default: `false` — _enable `Map` - eg.: `new Map([['key', 'value']])`_
- `withNullPrototype?` — default: `false` — _enable objects not defining any prototype - eg.: `Object.create(null)`_
- `withObjectString?` — default: `false` — _enable strings looking as string representations of JavaScript instances - eg.: `"{}"`, `"new Set([1])"`_
- `withSet?` — default: `false` — _enable `Set` - eg.: `new Set([1, 2, 3])`_
- `withTypedArray?` — default: `false` — _enable typed arrays for ints, uints and floats - eg.: `Int8Array.from([1, 2, 3])`_
- `values?` — default: _booleans, numbers, strings, null and undefined_ — _array of arbitraries producing the root* values - *non-object ones_

*&#8195;Usages*

```js
fc.object()
// Examples of generated values:
// • {"A%":{"/$KFfpp":-4187493920938036,";":"yGR","EpEkV(":true,"@'J-;wLY":7.773167704715093e-258},"(ffE?H":"bT:",":Cm":{"#":212440652433081,")'":"","WFt=u'":true,"[=`":"FY<","6p!UDE:m":"WU}|qld"},"u4ri-":{"&Ah9yY!,M.":undefined,"V":[null,undefined,5669800404242669,false]}}
// • {}
// • {"NLpz":true,"\"`guwWV":[1693661275033917,null,4558218590727633,-2.23248912192686e-162,true],"whq=S":{"":undefined,"~\"":-4976358045086261,"Q_]ZyZT":false,"5crt2@!":"5"},"\"=?\\)D":[],"i3NvX+":{"h qH H}v":{"v`}D)_tK<":-5750863503658640},"JO":"~~]\\ni"}}
// • {"Q[qz":3420299706657221,"vM5":undefined,"I=1ttlDa^~":[-2.20673229532495e-195,{"bY2bek":-6618824473918742," i":null,"cM F":-4177313723720847,"":true}]}
// • {"^":[null,6054490631421891,false,"C}t"],"":[{},-2e-323]}
// • …

fc.object({
  key: fc.constantFrom('a', 'b', 'c'),
})
// Note: Keys in ['a', 'b', 'c']
// Examples of generated values:
// • {"c":{"a":undefined},"b":{"b":"rI}4(","a":"","c":"Cceu+)"},"a":-1847783524257149}
// • {"b":"h\"","c":{}}
// • {"b":"aDA:0O%&"}
// • {"a":undefined,"c":{"b":null,"a":-3791799540816451},"b":[-16,"kF",1.0899496740837103e-166,38,4216714785601633]}
// • {}
// • …

fc.object({
  maxDepth: 0,
})
// Examples of generated values:
// • {"^lx)`P":undefined}
// • {"s!?U&|m":-1.0485154233556375e+169," !":1.4341461931946127e-41,"":">bQM?p[+^"}
// • {":WEs/srS+":-1.4306206862420248e-230,"lb(<%.BW9":-1.12096281696434e+147}
// • {}
// • {"m \"]?Y]":"%d.","":">7,FIjW","pBl_JL":true,"4LDzA":null,"YJa,v":undefined}
// • …

fc.object({
  maxDepth: 1,
})
// Examples of generated values:
// • {"^lx)`P":[-0.00029931903965333046,false,"{{Og>-Jg21",true,""]}
// • {"s!?U&|m":false," !":{"7P4>bQM?p[":4203343495210831,">":2.0906852232169096e+42},"`":{"+LGy":2.5529776970484772e-129,"%-aE*3":true,"Rp8-Eo":"haz","P30=(JIie8":-7.998009365281407e+224}}
// • {":WEs/srS+":{"":6943949833833631},"<%":{"96d^[vb)H":true}}
// • {}
// • {"m \"]?Y]":[true,null,">7,FIjW",1.1547540562130815e+110],"":false,"_JL4W.4":1895816035044233,"\\3":5.098016612215807e+266,"=k":{"8":2201154146612185,"G$x4ri>qe,":"lh*sgIA","(qcCJ4\".b":5058630183075029,"ASVo(SR$>":-4844644956269543}}
// • …


fc.object({
  withBigInt: true,
  withBoxedValues: true,
  withDate: true,
  withMap: true,
  withNullPrototype: true,
  withObjectString: true,
  withSet: true,
  withTypedArray: true,
})
// Examples of generated values:
// • {}
// • {"Rsv1:ZP":[new Boolean(true),new String("&ZTIJ#Q"),true]}
// • {"p?EZci9K7":{"#5JexvBJ>":Object.assign(Object.create(null),{"":new Number(1284911286245549)}),"rP@8f!\"":null},"%=o2Y7C0'":[null,new Boolean(false),-39055364290714174025896751147965663449675189551559579892892971034035068470118n,new Boolean(false)],"s0x":[false,new String("g(vi`]/Q"),new String("Y"),new Boolean(false)],"eR'){`qiQ":Uint16Array.from([5410,58829,5449,28572]),".":new String("t4hp")}
// • {"RrAs^,;_'d":new String("2cx:"),"rwe":"1n!c","^KL'jR":Object.assign(Object.create(null),{",=QAr":new Boolean(false),"undefined":new String(";}Pm"),"H![":-9.823190949107251e+182}),"Q%*-ci{}iy":{},"zeo]{&<":[]}
// • {"zL{":[]}
// • …

fc.object({
  depthFactor: 0.1,
  maxDepth: 1000,
})
// Note: For the moment, we have to specify maxDepth to avoid falling back onto its default value
// Examples of generated values:
// • {"#$!":[[-9.659747334739587e-110],{"k\"!`1":null,"+":[]},[{"":[]},[1.0555217528630498e+260,[],2.10145070050725e-68],{"*K!B56)k":1.7238260377637445e+296,"":[-1.453265193336188e+159,"lc;",true,2717180447126721],"^ji8a(RLk:":false},6.051647936668976e+72],[-4.2966099035421346e-92],[false,-2.557632531089398e-66]],"CFZaJe":[undefined]}
// • {"eE:":[[{"u'4s{$4":{"`?{/$^Sz":true,"|y)-$J":false},"Ai%":[[[{"5p[P<":[],"X5BF[d6&'I":[-4.447497077591872e+27,false,[[]],{}],"[waR\\H":[[false,[true,false,6789588778525917,"DBr*",false],2.6381314792921957e-23,["!-jd-iH","%v^D lxo>",1.1820262988293646e-235,6.279994976457497e-199,-4415986702117909],null],{},false]},[-5.531151013615685e+111,true,{"B\\_k6CU,S":">=C$ x66","wjz":["Du[",5967631330850793]}]]],-5.4166112845197825e-210]},"m+vw'bG"],[{"Y<RX}kDn":-6575384764727873},-6402631443958135,[false,[null,3205785911400815,[[740183519778143]]],[")^(","]Pk4}+aOK ","fF+y^*.ov"],3.0739318817560877e+175],":shJ&[v:s"]],"YVe1`":[{}],"prHyOM":{"":[{"Q2FH":[-4868083945887084],"^":["hq=4s+`9Rk","=]a\"k",[6264891220961473,[],false],-4585343528361222,true]},{"[":null,"?.?":true,"%c<So":2900157900152457,"I|_I*~|j":7278237198968405},[{"`":["5g:fCS)_V"],"UyFj8y<cN":{"rmPGG":false,"+.":[false],"K":[{"b7TzTH8":-891344229961676,"@7mg$o2`":-1.0617661805165056e+212,"QBhj~d":" o2z/oZg"},null],"Pf^U/q":-4309405892483806}}],{"^|{4fY,hg5":"","{":["od.>",undefined,"",[-7959633537957650]],"%KpN)D$H":{"a":[false,true,null,-1.9437000348500585e-107],"c4\\ '53":null},"J":-1.4595087919522817e-82,"9J$.":4140446975608453}],"Uus":undefined,"y^":-2.5141358816406088e+166,"xUP$ke\\":{"$#":{},"<9j/s":[{">t":false,"1keP*pPl,|":["i6Vq0h3",null,3053305551308271,-9.257396480966598e-172],"":"yu","09$K&joi9":false,"2GBgn>hZQA":undefined},4.025937102241588e+88],"=(F":[true,7536643750474195,{}]}},"@":[]}
// • {"{1Z\\sxWae_":[],"":"","7y":{},".'O":{},";Y\\,S'":{}}
// • {"M\\ ":{}}
// • {}
// • …
```
</details>

<details>
<summary><b>jsonValue</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#jsonvalue">api</a>]</summary><br/>

*&#8195;Description*

> Generate any value eligible to be stringified in JSON and parsed back to itself - _in other words, JSON compatible instances_.
>
> As `JSON.parse` preserves `-0`, `jsonValue` can also have `-0` as a value.
> `jsonValue` must be seen as: any value that could have been built by doing a `JSON.parse` on a given string.
>
> Please note that: `JSON.parse(JSON.stringify(value))` is not the identity as `-0` are transformed into `0` by `JSON.stringify`.

*&#8195;Signatures*

- `fc.jsonValue()`
- `fc.jsonValue({depthFactor?, maxDepth?})`

*&#8195;with:*

- `depthFactor?` — default: `0.1` — _factor to increase the probability to generate leaf values as we go deeper in the structure, numeric value >=0 (eg.: 0.1)_
- `maxDepth?` — default: `2` — _maximal depth for generated objects (Map and Set included into objects)_

*&#8195;Usages*

```js
fc.jsonValue()
// Examples of generated values: {}, {"3O":[null,null,null],"lU ;Wao@":{"\"~~!":"}|#ux"}}, "y^-", "#5", {"&$l":"E","i":[null]}…

fc.jsonValue({maxDepth: 0})
// Examples of generated values: 7.890307626412925e-165, null, 2.57e-322, -1.7976931348623153e+308, false…

fc.jsonValue({maxDepth: 1})
// Examples of generated values: [], -1.2e-322, "W!oe%r(", {}, [false,"?Y]}I%d",2.7395116183994342e+35]…
```
</details>

<details>
<summary><b>jsonObject</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#jsonobject">api</a>]</summary><br/>

*&#8195;Description*

> Generate any object eligible to be stringified in JSON and parsed back to itself - _in other words, JSON compatible instances_.
>
> As `JSON.parse` preserves `-0`, `jsonObject` can also have `-0` as a value.
> `jsonObject` must be seen as: any value that could have been built by doing a `JSON.parse` on a given string.
>
> Please note that: `JSON.parse(JSON.stringify(value))` is not the identity as `-0` are transformed into `0` by `JSON.stringify`.

*&#8195;Signatures*

- `fc.jsonObject()` — _deprecated, prefer `fc.jsonValue` instead_
- `fc.jsonObject({depthFactor?, maxDepth?})` — _deprecated, prefer `fc.jsonValue` instead_
- _`fc.jsonObject(maxDepth)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_

*&#8195;with:*

- `depthFactor?` — default: `0` — _factor to increase the probability to generate leaf values as we go deeper in the structure, numeric value >=0 (eg.: 0.1)_
- `maxDepth?` — default: `2` — _maximal depth for generated objects (Map and Set included into objects)_

*&#8195;Usages*

```js
fc.jsonObject()
// Examples of generated values: true, {"z":["Zw"]}, [], false, -1.7976931348623033e+308…

fc.jsonObject({maxDepth: 0})
// Examples of generated values: null, "", 4.4e-323, true, false…

fc.jsonObject({maxDepth: 1})
// Examples of generated values:
// • true
// • {"C{X%3]Q$U":"$","D(]?*(9d'":"Fm19PeBSc","!s'%s":true,"/='zds[1f":null,"\"#ctQ":3.667237923224054e+176}
// • "M}7xc\" _"
// • {"":"G  ","JWsn":false,"9%Gp.m0":1205948.4747851335,"E(":null,"p7*8>":true}
// • {"fS7":"iH0r ~?oNf"}
// • …

fc.jsonObject({depthFactor: 0.1})
// Examples of generated values:
// • 2.6e-322
// • [null,"v!56",9.04706953546473e+137,"en.Z-KP}"]
// • -1e-322
// • {"z&Nhzz%":[-5.3192112419002805e-31,"KPc","|sD.+@+",null],"$L":[-4.139701243454471e-167]}
// • {"L|hZ":"]~(nJA4","Kl":-6653836332.612048,";X)NU(bv":null,"":1.1551959384329293e+176}
// • …
```
</details>

<details>
<summary><b>unicodeJsonValue</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#unicodejsonvalue">api</a>]</summary><br/>

*&#8195;Description*

> Generate any value eligible to be stringified in JSON and parsed back to itself - _in other words, JSON compatible instances_
>
> As `JSON.parse` preserves `-0`, `unicodeJsonValue` can also have `-0` as a value.
> `unicodeJsonValue` must be seen as: any value that could have been built by doing a `JSON.parse` on a given string.
>
> Please note that: `JSON.parse(JSON.stringify(value))` is not the identity as `-0` are transformed into `0` by `JSON.stringify`.

*&#8195;Signatures*

- `fc.unicodeJsonValue()`
- `fc.unicodeJsonValue({depthFactor?, maxDepth?})`

*&#8195;with:*

- `depthFactor?` — default: `0.1` — _factor to increase the probability to generate leaf values as we go deeper in the structure, numeric value >=0 (eg.: 0.1)_
- `maxDepth?` — default: `2` — _maximal depth for generated objects (Map and Set included into objects)_

*&#8195;Usages*

```js
fc.unicodeJsonValue()
// Examples of generated values:
// • [[null]]
// • "펯氅䧲㽸"
// • [[true,8.168294643820882e+174,true,null,true]]
// • [1.83e-322,"ꮦၹ値佺ꯃ鼰熏ᗚ᤻",null,-6.552298543933699e+72]
// • [null,null,"퍿|댞浱犇괤ώ枖硂ഋ","㣶꛱裏奲펿㩁ꊊ％⁣",true]
// • …

fc.unicodeJsonValue({maxDepth: 0})
// Examples of generated values: -1.7976931348623047e+308, true, "힮褣", "", 1.128781208000642e+83…

fc.unicodeJsonValue({maxDepth: 1})
// Examples of generated values: true, [null], ["褣䛳"], false, {}…
```
</details>

<details>
<summary><b>unicodeJsonObject</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#unicodejsonobject">api</a>]</summary><br/>

*&#8195;Description*

> Generate any object eligible to be stringified in JSON and parsed back to itself - _in other words, JSON compatible instances_
>
> As `JSON.parse` preserves `-0`, `unicodeJsonObject` can also have `-0` as a value.
> `unicodeJsonObject` must be seen as: any value that could have been built by doing a `JSON.parse` on a given string.
>
> Please note that: `JSON.parse(JSON.stringify(value))` is not the identity as `-0` are transformed into `0` by `JSON.stringify`.

*&#8195;Signatures*

- `fc.unicodeJsonObject()` — _deprecated, prefer `fc.unicodeJsonValue` instead_
- `fc.unicodeJsonObject({depthFactor?, maxDepth?})` — _deprecated, prefer `fc.unicodeJsonValue` instead_
- _`fc.unicodeJsonObject(maxDepth)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_

*&#8195;with:*

- `depthFactor?` — default: `0` — _factor to increase the probability to generate leaf values as we go deeper in the structure, numeric value >=0 (eg.: 0.1)_
- `maxDepth?` — default: `2` — _maximal depth for generated objects (Map and Set included into objects)_

*&#8195;Usages*

```js
fc.unicodeJsonObject()
// Examples of generated values:
// • null
// • [null,-4.295089174387055e-293,-2.6704522931006526e-132,null,true]
// • 3.4453237274410463e+71
// • [["䓂-￳",""]]
// • [{"ᴿ렷浻灰썻鞘١⓼":"ᚄ秈搉糛힘ﯨ⯞","":-8.037747235177182e-192,"䐀⥌㚃뚹퐒孵ᱚ鼊鴓ᚔ":null},null]
// • …

fc.unicodeJsonObject({maxDepth: 0})
// Examples of generated values: 1.7976931348623131e+308, false, "꙰ꁺ蜱", "⛙", -9.43140467271473e+139…

fc.unicodeJsonObject({maxDepth: 1})
// Examples of generated values:
// • false
// • {"觽竑减":1.7976931348623051e+308,"癤&嬩￸ ":false}
// • {"ꁺ척蜱젿됻⫄":6.0080802185466595e-276,"":true,"웤鯁":false}
// • [null]
// • ["凛瞸㾡끴疘쥱潅䀱",null]
// • …

fc.unicodeJsonObject({depthFactor: 0.1})
// Examples of generated values:
// • "荽醮郺旽粈㈾"
// • [{"訌諄붥좕杽റ솆薠":"嬞⥨萳퐋Ї鏺","᪤퟿䧂콂":-3.1968066710437204e-71,"쒖ꊦ퍪掎":null,"㞃ﾼॏ鼟所蛂癶ஒ䍛䵮":5.019276820129658e+122,"佰㠋":false},[]]
// • false
// • {}
// • {"腌ꊖ璄諰晜ᩝ鬬ᅗ":null,"⤇瑃若꽂ꥑ讧霵ꎽ":"ᑙ㊆辧눴Ó","鐘莵嗒줹":"꡷獺ㆴ㰍ᨬ춇菒켙者","销ꈼ䭈묤︻":-3.7583877362857114e+279}
// • …
```
</details>

<details>
<summary><b>anything</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#anything">api</a>]</summary><br/>

*&#8195;Description*

> Generate any kind of entities

*&#8195;Signatures*

- `fc.anything()`
- `fc.anything({key?, depthFactor?, maxDepth?, maxKeys?, size?, withBigInt?, withBoxedValues?, withDate?, withMap?, withNullPrototype?, withObjectString?, withSet?, withTypedArray?, values?})`

*&#8195;with:*

- `key?` — default: `fc.string()` — _arbitrary responsible to generate keys used for instances of objects_
- `depthFactor?` — default: `0` — _factor to increase the probability to generate leaf values as we go deeper in the structure, numeric value >=0 (eg.: 0.1)_
- `maxDepth?` — default: `2` — _maximal depth for generated objects (Map and Set included into objects)_
- `maxKeys?` — default: `5` — _maximal number of keys in generated objects (Map and Set included into objects)_
- `size?` — default: `undefined` [more](#size-explained) — _how large should the generated values be?_
- `withBigInt?` — default: `false` — _enable `bigint` - eg.: `1n`_
- `withBoxedValues?` — default: `false` — _enable boxed values - eg.: `new Number(5)`_
- `withDate?` — default: `false` — _enable `Date` - eg.: `new Date('2020-10-14T16:52:36.736Z')`_
- `withMap?` — default: `false` — _enable `Map` - eg.: `new Map([['key', 'value']])`_
- `withNullPrototype?` — default: `false` — _enable objects not defining any prototype - eg.: `Object.create(null)`_
- `withObjectString?` — default: `false` — _enable strings looking as string representations of JavaScript instances - eg.: `"{}"`, `"new Set([1])"`_
- `withSet?` — default: `false` — _enable `Set` - eg.: `new Set([1, 2, 3])`_
- `withTypedArray?` — default: `false` — _enable typed arrays for ints, uints and floats - eg.: `Int8Array.from([1, 2, 3])`_
- `withSparseArray?` — default: `false` — _enable sparse arrays - eg.: `[1,,,3]`_
- `values?` — default: _booleans, numbers, strings, null and undefined_ — _array of arbitraries producing the root* values - *non-object ones_

*&#8195;Usages*

```js
fc.anything()
// Examples of generated values:
// • {"0sv'Tmhu":-1.3887208152149362e-162,"s":true,"%)`-S9;[":"","GhNB:":"!66","L%.2Jag":2.1916039785634694e+262}
// • 43
// • "&,} ~"
// • {"'{RS":"Q&L","a)~#":-6069883125884153}
// • {"L;r1AA`>yA":true,"Ohn:9}|uP":{"WW/~|":"_C}_k","Dx\\f5&|":"x1k^I}\"OQ"}}
// • …

fc.anything({
  key: fc.constantFrom('a', 'b', 'c'),
})
// Note: Generated objects will come with keys in ['a', 'b', 'c']
// Examples of generated values:
// • {"a":[2.455340534985444e+159,undefined,",3kWU",true]}
// • []
// • {"a":-33,"c":-4.371592165833154e-284,"b":false}
// • {"c":-39,"b":"zRg","a":undefined}
// • 1.022676058193833e-127
// • …

fc.anything({
  maxDepth: 0,
})
// Note: Only root values
// Examples of generated values: undefined, false, "H<EO!&", -718042952162017, -1.9263249085363102e-246…

fc.anything({
  maxDepth: 1,
})
// Examples of generated values:
// • -9007199254740952
// • 1068292005279453
// • "<EO"
// • [false,5823643812448959,undefined,"}",9.124929382447695e-86]
// • -2.7873486028769266e-78
// • …

fc.anything({
  withBigInt: true,
  withBoxedValues: true,
  withDate: true,
  withMap: true,
  withNullPrototype: true,
  withObjectString: true,
  withSet: true,
  withTypedArray: true,
  withSparseArray: true,
})
// Examples of generated values:
// • {"$2U":new Map([[new Boolean(true),new Number(-1.6072112720590742e+253)]])}
// • [new Number(-7340448526666366),new Date("+101296-01-12T18:14:38.996Z"),45537367055854732942122861729418908327985837390729150814414733194634917325090n,7.246839255814512e+218,"@"]
// • []
// • 73n
// • "\"-60n\""
// • …

fc.anything({
  depthFactor: 0.1,
  maxDepth: 1000,
})
// Note: For the moment, we have to specify maxDepth to avoid falling back onto its default value
// Examples of generated values:
// • "<M3<BDD"
// • [[[-110560703978116,-4135563583433119,"_","N/|A\\",""],{"":true},{},{"HEu`\\SZn":true,"./i3W\"FSui":-5033652632686285,"1]'O_2G!}k":2.0897751972426306e+257,"a#d49\"GU":-5861219495259182}],[undefined,{"G}$I#}":"~L=O","R9?Fb^":"M>|w","6bD'":"os","s.s|J":{"":{"7^":[-1486179414402945],"p":false,"fT>S;h":undefined,"*i":[-2468034424525772],"g1nha":{",yvI9a%":undefined,"o9":8.108192475126723e-268}},")t,Lg.;D":{},"mF^":"NAa)E"}},{"$yif|%":[true,3.2570109080410608e+156,true,-3757999164837927,-1.2988535168196527e+176],"KRtVz":7.851356955999629e+66,"laz&zH":4.0283696875728125e+77}],0.00005003620097881509,[[[true,{"7T%\\":false},{"!":"5a$~I\\h;bm"}],{"":{}},{"ZV ":{"2":null,"#p'p7cl%T1":false,"U":8.372982918432618e+285}},-3174973144746793],[-6533361343232096,[[],[]],[]]]]
// • [{"ngSe":-2077051464454645},[false,-4038212482942537,{"l5zuK":false},{},{"L=S'XnP":{"Yi={mK\"":false,"ApbF(EjC":"_DY5yf","":1.0050964903872983e+34}}]]
// • true
// • -1.0395574284395397e-83
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
//     const hA = hash('-1859641033' + stringify(a)) % 19;
//     const hB = hash('-1859641033' + stringify(b)) % 19;
//     return cmp(hA, hB);
//   }
// • function(a, b) {
//     // With hash and stringify coming from fast-check
//     const cmp = (hA, hB) => hA < hB;
//     const hA = hash('1845341787' + stringify(a)) % 2;
//     const hB = hash('1845341787' + stringify(b)) % 2;
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
//     const hA = hash('-26' + stringify(a)) % 3334963066;
//     const hB = hash('-26' + stringify(b)) % 3334963066;
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
//     const hA = hash('1501554938' + stringify(a)) % 18;
//     const hB = hash('1501554938' + stringify(b)) % 18;
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
//     const hA = hash('-579121620' + stringify(a)) % 8;
//     const hB = hash('-579121620' + stringify(b)) % 8;
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
//     const outs = [28,1046862664,29];
//     return outs[hash('-181015797' + stringify(args)) % outs.length];
//   }
// • function(...args) {
//     // With hash and stringify coming from fast-check
//     const outs = [1521748689,316610179,1601449343,1057761988,2088580527,1974557534,1618733983,882909472,1739615127];
//     return outs[hash('28' + stringify(args)) % outs.length];
//   }
// • function(...args) {
//     // With hash and stringify coming from fast-check
//     const outs = [269035825,95461057,227736260,947243235,2103296563,1079794905];
//     return outs[hash('-9' + stringify(args)) % outs.length];
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
> Prefer `fc.letrec` over `fc.memo`. Most of the features offered by `fc.memo` can now be implemented with `fc.letrec`.

*&#8195;Signatures*

- `fc.letrec(builder)`

*&#8195;with:*

- `builder` — _builder function defining how to build the recursive structure, it answers to the signature `(tie) => `object with key corresponding to the name of the arbitrary and with vaue the arbitrary itself. The `tie` function given to builder should be used as a placeholder to handle the recursion. It takes as input the name of the arbitrary to use in the recursion._

*&#8195;Usages*

```js
// Setup the tree structure:
const { tree } = fc.letrec(tie => ({
  // Warning: In version 2.x and before, there is no automatic control over the depth of the generated data-structures.
  //   As a consequence to avoid your data-structures to be too deep, it is highly recommended to add the constraint `depthFactor`
  //   onto your usages of `option`, `oneof` and `frequency` and to put the arbitrary without recursion first.
  // In version 3.x, `depthFactor` and `withCrossShrink` will be enabled by default.
  tree: fc.oneof({depthFactor: 0.5, withCrossShrink: true}, tie('leaf'), tie('node')),
  node: fc.record({
    left: tie('tree'),
    right: tie('tree'),
  }),
  leaf: fc.nat()
}));
// Use the arbitrary:
tree
// Examples of generated values:
// • {"left":5,"right":214707493}
// • {"left":{"left":29,"right":1113327548},"right":{"left":693255074,"right":7}}
// • 2
// • 1879186405
// • 2147483618
// • …

fc.letrec(tie => ({
  node: fc.record({
    value: fc.nat(),
    left: fc.option(tie('node'), {maxDepth: 1, depthIdentifier: 'tree'}),
    right: fc.option(tie('node'), {maxDepth: 1, depthIdentifier: 'tree'}),
  })
})).node
// Note: You can limit the depth of the generated structrures by using the constraint `maxDepth` (see `option`, `oneof` and `frequency`).
//   On the example above we need to specify `depthIdentifier` to share the depth between left and right branches...
// Examples of generated values:
// • {"value":1667728700,"left":{"value":22,"left":null,"right":null},"right":{"value":202444547,"left":null,"right":null}}
// • {"value":674845341,"left":{"value":29,"left":null,"right":null},"right":{"value":1113327548,"left":null,"right":null}}
// • {"value":2147483624,"left":null,"right":{"value":949167600,"left":null,"right":null}}
// • {"value":11,"left":{"value":47603542,"left":null,"right":null},"right":{"value":4,"left":null,"right":null}}
// • {"value":13,"left":null,"right":{"value":23,"left":null,"right":null}}
// • …

fc.letrec(tie => ({
  node: fc.record({
    value: fc.nat(),
    left: fc.option(tie('node'), {maxDepth: 1}),
    right: fc.option(tie('node'), {maxDepth: 1}),
  })
})).node
// ...If we don't specify it, the maximal number of right in a given path will be limited to 1, but may include intermediate left.
//    Thus the resulting trees might be deeper than 1.
// Examples of generated values:
// • {"value":22,"left":{"value":27,"left":null,"right":{"value":13,"left":null,"right":null}},"right":null}
// • {"value":1909660399,"left":{"value":2147483632,"left":null,"right":null},"right":{"value":456478505,"left":{"value":452045085,"left":null,"right":null},"right":null}}
// • {"value":12,"left":{"value":1619318555,"left":null,"right":{"value":27,"left":null,"right":null}},"right":null}
// • {"value":8,"left":null,"right":{"value":1744036864,"left":{"value":1633200200,"left":null,"right":null},"right":null}}
// • {"value":2147483622,"left":{"value":1241600186,"left":null,"right":{"value":92657426,"left":null,"right":null}},"right":null}
// • …

fc.letrec(tie => ({
  tree: fc.frequency({maxDepth: 2}, {arbitrary: tie('leaf'), weight: 0}, {arbitrary: tie('node'), weight: 1}),
  node: fc.record({ left: tie('tree'), right: tie('tree') }),
  leaf: fc.nat()
})).tree
// Note: Exact depth of 2: not more not less.
// Note: If you use multiple `option`, `oneof` or `frequency` to define such recursive structure
//   you may want to specify a `depthIdentifier` so that they share the exact same depth.
//   See examples above for more details.
// Examples of generated values:
// • {"left":{"left":2146012257,"right":5},"right":{"left":4,"right":92286720}}
// • {"left":{"left":17,"right":105221773},"right":{"left":10,"right":1282731170}}
// • {"left":{"left":289678323,"right":1527632810},"right":{"left":1031855048,"right":861569963}}
// • {"left":{"left":1001661803,"right":2147483623},"right":{"left":2147483617,"right":729999584}}
// • {"left":{"left":1517743480,"right":1007350543},"right":{"left":12,"right":2147483643}}
// • …
```
</details>

<details>
<summary><b>memo</b> - [<a href="https://dubzzz.github.io/fast-check/index.html#memo">api</a>]</summary><br/>

*&#8195;Description*

> Generate recursive structures
>
> ⚠️ Initially `fc.memo` has been designed to offer a higher control over the generated depth. Unfortunately it came with a cost: the arbitrary itself is costly to build.
> Most of the features offered by `fc.memo` can now be done using `fc.letrec` coupled with `fc.option`, `fc.oneof` or `fc.frequency`.
> Whenever possible*, we recommend using `fc.letrec` instead of `fc.memo`.
>
> *But sometimes it is not possible and `fc.memo` will be the way to go.

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
// • {"left":{"left":23,"right":2},"right":{"left":210148030,"right":283093342}}
// • 1883170510
// • 4879206
// • {"left":{"left":2147483622,"right":2147483643},"right":{"left":1297112406,"right":883126194}}
// • {"left":{"left":13,"right":2147483635},"right":{"left":1861062539,"right":20}}
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
// Examples of generated values: -757498916, -70006654, 1709734166, 1038114938, 1991604420…

fc.integer().filter(n => n % 2 !== 0)
// Note: Only produce odd integer values
// Examples of generated values: -5, 220007129, -144485771, -17, 194205091…

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
// Examples of generated values: 680625, 441, 422500, 88209, 81…

fc.nat().map(n => String(n))
// Note: Change the type of the produced value from number to string
// Examples of generated values: "2076933868", "2147483636", "1971335630", "260497460", "9"…

fc.tuple(fc.integer(), fc.integer())
  .map(t => t[0] < t[1] ? [t[0], t[1]] : [t[1], t[0]])
// Note: Generate a range [min, max]
// Examples of generated values: [-2147483620,1211945858], [-1079425464,-233690526], [-2147483633,-2], [1592081894,2147483645], [6,25]…

fc.string().map(s => `[${s.length}] -> ${s}`)
// Examples of generated values: "[8] -> 40M;<f/D", "[2] -> 7a", "[2] -> %:", "[2] -> \\$", "[9] -> 0LFg6!aMF"…
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
// Examples of generated values: [2147483631,2602190685], [722484778,1844243122], [52754604,4294967287], [231714704,420820067], [3983528,3983548]…
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
- `fc.commands(commandArbs, {disableReplayLog?, maxCommands?, size?, replayPath?})`
- _`fc.commands(commandArbs, maxCommands)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_

*&#8195;with:*

- `commandArbs` — _array of arbitraries responsible to generate commands_
- `disableReplayLog?` — _disable the display of details regarding the replay for commands_
- `maxCommands?` — default: `0x7fffffff` [more](#size-explained) — _maximal number of commands to generate (included)_
- `size?` — default: `undefined` [more](#size-explained) — _how large should the generated values be?_
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

### Size explained

Since version 2.22.0, there is a distinction between constraints required by specifications and what will really be generated. When dealing with array-like arbitraries such as `fc.array` or `fc.string`, defining a constraint like `maxLength` can be seen as if you wrote "my algorithm is not supposed to handle arrays having more than X elements". It does not ask fast-check to generate arrays with X elements, but tells it that it could if needed or asked to.

What really drives fast-check into generating large arrays is called `size`. At the level of an arbitrary it can be set to:
- Relative size: `"-4"`, `"-3"`, `"-2"`, `"-1"`, `"="`, `"+1"`, `"+2"`, `"+3"` or `"+4"` — _offset the global setting `baseSize` by the passed offset_
- Explicit size: `"xsmall"`, `"small"`, `"medium"`, `"large"` or `"xlarge"` — _use an explicit size_
- Exact value: `"max"` — _generate entities having up-to `maxLength` items_
- Automatic size: `undefined` — _if `maxLength` has not been specified or if the global setting `defaultSizeToMaxWhenMaxSpecified` is `false` (in v2 it defaults to `true` for backward compatibilty reasons) then `"="`, otherwise `"max"`_

Here is a quick overview of how we use the `size` parameter associated to a minimal length to compute the maximal length for the generated values:
- `xsmall` — `min + (0.1 * min + 1)`
- `small` (default) — `min + (1 * min + 10)`
- `medium` — `min + (10 * min + 100)`
- `large` — `min + (100 * min + 1000)`
- `xlarge` — `min + (1000 * min + 10000)`

### Various links

- [API Reference](https://dubzzz.github.io/fast-check/)
- [Advanced arbitraries (guide)](./AdvancedArbitraries.md)
- [Model based testing or UI test](./Tips.md#model-based-testing-or-ui-test)
- [Race conditions detection](./RaceConditions.md)
- [Detect race conditions (quick overview)](./Tips.md#detect-race-conditions)
