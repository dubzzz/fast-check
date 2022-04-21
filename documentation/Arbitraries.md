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
// • "{\"\":{\"\":true,\"xj)R+qu\\\"2\":null,\">4q'AU\":true},\"5C2[,Dk\":[],\"?\":{\"Bb6\":\"3[SVCv\"}}"
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
// Examples of generated values:
// • "[]"
// • "-1.2e-322"
// • "\"W!oe%r(\""
// • "{}"
// • "[\"]?Y]}I%d.\",[true,-2.8784042408894187e+203,null,\"T^\",null],[null,true,-9.863617988123046e-44]]"
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
// • "{\"摶顜\":\"ᐞ淙\",\"혎虎뙕斘\":{\"ꫠӄ쉠푆汥ᜁ\":true,\"ޢ촧츦僂券돣ૹ\":\"㕯鋰‽\",\"∮䪩璽\":null,\"ⷁ誀觉헑매悾鹦ୂ\":-1.0289953783837611e-158,\"ح潞鱷਑\":true},\"\":{\"㬓\":null,\"欱\":null,\"ﰺꨵ\":-1.8764916263131172e-36}}"
// • "{\"迵끀꧋좡ꏶ塣\":[true,6.618510806266541e-160,1.0241865186333266e-192,null],\"ቈ保婠꠨旞荫㹢ފ\":{\"畵콆쳑Ｈ᜞\":7.983065118744731e-96,\"㈇㍮ㅜ\":\"욵ꤣ漓ꉶ瀞뿱끮筡\",\"᧊ㇱɶ䋷곺缇㱐⢋\":\"끨\"},\"됉龞ꚢ薀ɿ⫝̸挖\":[\"䪔쬤\",8.348657760447008e-227,null,\"䙔炽ঞ弩⦄㒎泩ჷ푦⁴\",true],\"∗㋈쪺驎쓭籺뗪\":[\"ᳪ䦥⡗忽㤱镞鏩\"],\"淇颋ᄈ䩌耬貅氧ⵃ⏈\":{\"⥄ϛ\":\"맂䆩揼䐆\",\"鉲繴\":true,\"㽯묭\":\"꩘飾乿\",\"蔟䮐拉㡿࢞\":\"ݯᮿ䗠\"}}"
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
- `fc.array(arb, {minLength?, maxLength?, size?, depthIdentifier?})`
- _`fc.array(arb, maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_
- _`fc.array(arb, minLength, maxLength)`_ — _deprecated since v2.6.0 ([#992](https://github.com/dubzzz/fast-check/issues/992))_

*&#8195;with:*

- `arb` — _arbitrary instance responsible to generate values_
- `minLength?` — default: `0` — _minimal length (included)_
- `maxLength?` — default: `0x7fffffff` [more](#size-explained) — _maximal length (included)_
- `size?` — default: `undefined` [more](#size-explained) — _how large should the generated values be?_
- `depthIdentifier?` — default: `undefined` — _when specified, the array will impact the depth attached to the identifier to avoid going too deep if it already generated lots of items for current level_

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

fc.letrec((tie) => ({
  self: fc.record({
    value: fc.nat(),
    children: fc.oneof(
      { depthFactor: 0.1, depthIdentifier: 'id:self' },
      fc.constant([]),
      fc.array(tie('self'), { depthIdentifier: 'id:self' })
    ),
  }),
})).self
// Note: We define a recursive tree structure with children defaulting to the empty array with an higher probability
// as we go deeper (thanks to `fc.oneof`) and also as we tend to generate lots of items (thanks to `depthIdentifier`
// passed to `fc.array` and being the same value as the one passed to `fc.oneof`).
// Note: For the moment, `fc.array` cannot stop the recursion alone and need to be combined with `fc.oneof` or any other
// helper being able to fallback to base cases with an higher probability as we go deeper in the recursion.
// Examples of generated values:
// • {"value":1447079203,"children":[]}
// • {"value":10,"children":[{"value":7,"children":[{"value":484657936,"children":[]},{"value":1692465148,"children":[]},{"value":1320741625,"children":[]},{"value":2132099925,"children":[{"value":1081390649,"children":[]},{"value":1716372289,"children":[]},{"value":2105705831,"children":[]},{"value":2069947667,"children":[]},{"value":636635111,"children":[]},{"value":2069024739,"children":[]},{"value":414675008,"children":[]},{"value":948243032,"children":[]},{"value":1167381621,"children":[]}]},{"value":929038014,"children":[]},{"value":311696809,"children":[]},{"value":1195200048,"children":[{"value":344582362,"children":[]},{"value":2009951523,"children":[]},{"value":2023531107,"children":[]},{"value":2030829265,"children":[]},{"value":1263069330,"children":[{"value":51896552,"children":[{"value":774470028,"children":[]},{"value":432075605,"children":[]},{"value":1652017664,"children":[]},{"value":1824186089,"children":[]},{"value":847032128,"children":[]},{"value":1064757454,"children":[]},{"value":1872681830,"children":[]}]},{"value":743566625,"children":[{"value":487251465,"children":[]},{"value":938179104,"children":[]}]},{"value":280401763,"children":[]},{"value":173492519,"children":[]},{"value":1008923365,"children":[]},{"value":1024815112,"children":[]}]}]}]},{"value":26,"children":[]},{"value":1384376392,"children":[]},{"value":18,"children":[]},{"value":1705596402,"children":[{"value":988873203,"children":[{"value":5,"children":[]},{"value":887079520,"children":[]},{"value":3,"children":[]},{"value":13,"children":[{"value":19,"children":[]},{"value":4,"children":[]},{"value":977927966,"children":[]},{"value":2147483635,"children":[]},{"value":2147483634,"children":[]},{"value":209867439,"children":[]},{"value":523923006,"children":[]},{"value":95531156,"children":[]}]},{"value":1788324839,"children":[]},{"value":11,"children":[]}]},{"value":1800942271,"children":[]},{"value":2147483635,"children":[]},{"value":1111179503,"children":[{"value":28219883,"children":[]},{"value":1782291282,"children":[]},{"value":167428167,"children":[]}]}]}]}
// • {"value":1,"children":[{"value":575042990,"children":[{"value":1894139063,"children":[]},{"value":352857385,"children":[]},{"value":1903697278,"children":[]},{"value":922269867,"children":[{"value":2131772448,"children":[]},{"value":1345757888,"children":[]},{"value":1631158474,"children":[]},{"value":1692201649,"children":[]},{"value":1891360436,"children":[]},{"value":347742849,"children":[]},{"value":1646732557,"children":[]},{"value":900619543,"children":[]},{"value":844470369,"children":[]},{"value":155445977,"children":[]}]},{"value":1477773363,"children":[]},{"value":1287195986,"children":[]},{"value":105089669,"children":[]},{"value":64995032,"children":[]},{"value":757649092,"children":[]},{"value":2008609329,"children":[]}]},{"value":734575821,"children":[]},{"value":2028786702,"children":[{"value":914500667,"children":[{"value":1585379195,"children":[]},{"value":608872905,"children":[{"value":1208093408,"children":[]},{"value":2050848416,"children":[]}]},{"value":2011082704,"children":[{"value":1947772544,"children":[]},{"value":1915065296,"children":[{"value":634345018,"children":[]},{"value":664536641,"children":[]},{"value":1917464089,"children":[]},{"value":1919558769,"children":[{"value":2010823733,"children":[]},{"value":214728798,"children":[]},{"value":1683240353,"children":[]},{"value":1083113655,"children":[]},{"value":1398276155,"children":[]}]},{"value":1940262209,"children":[]},{"value":1608853810,"children":[]}]},{"value":1226661738,"children":[{"value":167860877,"children":[]},{"value":1798419625,"children":[]},{"value":1702121073,"children":[]},{"value":923616553,"children":[]},{"value":2030836415,"children":[]},{"value":407358439,"children":[]},{"value":1900458441,"children":[]},{"value":2116325975,"children":[]},{"value":287486452,"children":[]},{"value":113746757,"children":[]}]},{"value":1277922682,"children":[]}]},{"value":373196113,"children":[{"value":12843784,"children":[]},{"value":1491385009,"children":[]},{"value":1388716807,"children":[{"value":1436856197,"children":[]}]},{"value":1440609401,"children":[]},{"value":1069597054,"children":[]},{"value":308126458,"children":[]},{"value":687043059,"children":[]}]},{"value":821823621,"children":[]},{"value":1700442457,"children":[{"value":1545294887,"children":[]},{"value":968539702,"children":[]},{"value":1759669614,"children":[]},{"value":1960806238,"children":[]},{"value":1974017337,"children":[]},{"value":2038736950,"children":[]},{"value":1653800057,"children":[]}]},{"value":229191908,"children":[]}]}]}]}
// • {"value":25,"children":[]}
// • {"value":1962836578,"children":[{"value":1815598021,"children":[]}]}
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
- `fc.uniqueArray(arb, {minLength?, maxLength?, selector?, comparator?, size?, depthIdentifier?})`

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
- `depthIdentifier?` — default: `undefined` — _when specified, the array will impact the depth attached to the identifier to avoid going too deep if it already generated lots of items for current level_

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
- _`fc.set(arb, {minLength?, maxLength?, compare?, size?, depthIdentifier?})`_ — _deprecated since v2.23.0, prefer `fc.uniqueArray`_
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
- `depthIdentifier?` — default: `undefined` — _when specified, the array will impact the depth attached to the identifier to avoid going too deep if it already generated lots of items for current level_

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
- `fc.sparseArray(arb, {maxLength?, minNumElements?, maxNumElements?, size?, noTrailingHole?, depthIdentifier?})`

*&#8195;with:*

- `arb` — _arbitrary instance responsible to generate values_
- `minNumElements?` — default: `0` — _minimal number of elements (included)_
- `maxNumElements?` — default: `0x7fffffff` [more](#size-explained) — _maximal number of elements (included) - when not specified, the algorithm generating random values will consider it equal to `maxGeneratedLengthFromSizeForArbitrary(minNumElements, size)` but the shrinking one will use `0x7fffffff`_
- `maxLength?` — default: `0x7fffffff` [more](#size-explained) — _maximal length (included) - length includes elements but also holes for sparse arrays - when not specified, the algorithm generating random values will consider it equal to `maxGeneratedLengthFromSizeForArbitrary(maxNumElements used by generate, size)` but the shrinking one will use `0x7fffffff`_
- `size?` — default: `undefined` [more](#size-explained) — _how large should the generated values be?_
- `noTrailingHole?` — default: `false` — _when enabled, all generated arrays will either be the empty array or end by a non-hole_
- `depthIdentifier?` — default: `undefined` — _when specified, the array will impact the depth attached to the identifier to avoid going too deep if it already generated lots of items for current level_

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
// • {"A%":{"/$KFfpp":true,";":[],"":[],"EpEkV(":-4750785965265426},"J-":{"":7.773167704715093e-258,"(ffE?H":"bT:",":Cm":{"#":212440652433081,")'":"","WFt=u'":true,"[=`":"FY<","6p!UDE:m":"WU}|qld"},"u4ri-":{"&Ah9yY!,M.":"93V23Bl)y","3zf6H.9wz#":true},"i}P{9":{}},"0Z'_Y":[[-1787655370778611,8841297914417933,4.1791731982047655e-7],{},["&Kh:#",-3.047843247125413e+80,"x0vVS^%kc",1.4154255781724394e+64]],"9d=w5qQL<":{"*":2931986392063965,"BvIFy":{"7Kp6":-5.3653757571139825e-214,"<;=":"[:ls#(Q","c\\":1.4431450361091177e-184},"_^]kj":["Z0)"],"!B_)'k@":[]}}
// • {}
// • {"NLpz":true,"\"`guwWV":[{"=x":4558218590727633," U%NIwh":1383342983065661},{"":undefined,"~\"":-4976358045086261,"Q_]ZyZT":false,"5crt2@!":"5"},[undefined,true],"",["X+u'@h qH",false]],"v":{"v`}D)_tK<":[2.7926067939943626e-141,1.1200263281037906e+173]},"J~~]":{},"@6@M^c. ":7122338718932239}
// • {"Q[qz":3420299706657221,"vM5":undefined,"I=1ttlDa^~":[-2.20673229532495e-195,{"bY2bek":-6618824473918742," i":null,"cM F":-4177313723720847,"":true}]}
// • {"^":[[6054490631421891,false,"C}t",-1343826999673535],[],true,[""]],"19HB&":false}
// • …

fc.object({
  key: fc.constantFrom('a', 'b', 'c'),
})
// Note: Keys in ['a', 'b', 'c']
// Examples of generated values:
// • {"c":{"a":[false,-8390683989876872],"c":"'DE"},"b":{"c":"%N&@^dJ","b":{"a":undefined}},"a":[[9.948100983952378e-227,-6036585174861041,"J8|BQ4bO"],4.758781296739405e+104,["KFMf}\"p[w",false,true,true],["~0j\\JC",true,true,undefined,true]]}
// • {"b":"h\"","c":{}}
// • {"b":"aDA:0O%&"}
// • {"a":undefined,"c":{"b":{"b":-3.274138213073642e+214},"a":[],"c":1.2674907938049296e-227}}
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
// • {"Rsv1:ZP":[new String("K"),Uint32Array.from([633324001,2022017662,3426034973]),Object.assign(Object.create(null),{"Kk":2923297417873177,"C`-":19505173548517319155205197499507953276741196830895146254090781762455999677566n,";=9|i":new Number(-1.984939832786464e-30),"nbH4":new Number(2.3757795026530672e-15),"":new String("Vd1k<")})]}
// • {"p?EZci9K7":{"#5JexvBJ>":Object.assign(Object.create(null),{"":new Number(1284911286245549)}),"rP@8f!\"":null},"%=o2Y7C0'":[1.5343098691860774e-161,Object.assign(Object.create(null),{":,t+\\dQ]s0":new String("yk<+zg"),"i`":undefined,"IY+)IeR')":true,"Q5Ix2fA)I":false,"t4hp":new String("J7O_")}),new Number(-4.346883509275466e-256),new Set([new Boolean(true),4447609665931757])],"":Object.assign(Object.create(null),{"@G'f":"6.186618547845854e-65",",fK22nXa":[new Number(493370621937789),"op",new String("%kz`?")],"J]%Z":new Set([]),"v+'q":Float32Array.from([-9.748349622344785e-25]),"4xRf}c":Object.assign(Object.create(null),{"1":new Number(-2.909672459622621e-251),"Dnp":"IXc,Z)","wHMf,0.?)":8761439299775023469675885963930955556662167065012894693558113018141174779997n,"gN+(JV":true})}),"|\\-|M\"i":7547847335851485,"oFy0":Int32Array.from([-2104321722,1021045793])}
// • {"RrAs^,;_'d":new String("2cx:"),"rwe":"1n!c","^KL'jR":Object.assign(Object.create(null),{",=QAr":new Set([]),"\"';}PmFHH![\"":new Map([[null,undefined],[new Number(3121187726934787),"iy2S@z"]]),"]{&<":[]}),"ukv":Object.assign(Object.create(null),{"0h!+#":"\"*hPq'Hw\"","Y*l+|&=v{":new Map([[-1.7744826883712946e+52,"neIRu>m"],[new String("Ms"),new Number(-1773232336651419)],[-951530175583534,23764432056584146154023907889068027393405248345613652147679702680601065346692n]]),"NlbM":"2587700481451595","Sl,\"wKx":[new String("2l[!!jS")]}),"$Vh*.'":23070997946542854925041841413770434503170031373116973887592161799115254060253n}
// • {"zL{":[]}
// • …

fc.object({
  depthFactor: 0.1,
  maxDepth: 1000,
})
// Note: For the moment, we have to specify maxDepth to avoid falling back onto its default value
// Examples of generated values:
// • {"#$!":[[-9.659747334739587e-110],{"k\"!`1":null,"+":[]},[{"":[]},[1.0555217528630498e+260,[],{"T,62":"B56)k}","l2^tA@J%":false}],[[[false,[{"i8a(RLk":[",y84"],"av_EcPQc,":{":bw0?`OCF":true,"!":null,".7]sD":["\\WE9Y*yj",833640861928383]},"X":-916239036166129,"zS%i":[]}]],{"c":[[{"-3":false,"!;36ZZ":"X[`DyDnUw","Y":{},"N":5019023252673293,")\\\"K":[null,{"Y 3NMuog":[{"":false,"oD5oN":null,"&b>LQ":2087753674739045,"7-y'(":true},"M9/c!{7y\",",null,{"-]J>|b~":"Zg8Q!","fDLdq0A":false,"}1rL":true,"9#VLmH.":undefined}],"JXHW":-1991233005402721,"q1":"(1B"},{"f":{"#k":[-4.5751122191907966e+76,-3357768476007380],"~ph,'4":{},"yY0[5]FCO]":-1053215555293797,"oYFfAEK2$":7.852690339617559e-282},"h~k]Dl1pT":"M'Ay#y","(-JFKQh":1.865547669986116e+162},true]},{"+8":{},"o7pk!^":true}],"'f#f",{"":[3.778384236241283e-54,true,null,[-7178208408277807,"Utp1TM4",true,true],4077684769178753],"UrVNW77":{"3G":{"FR6vI":"gl","-O(8G":";Znmnw`M"},"gy":{":&\"S&ny":8832040780700727},"V{":{"gx":-6975430898753678},"`":-6.632075739663674e+59,"zctUZKGX)f":null},"xFo{>cu(":[{"!5ZET":false,"5C0.T$DL`2":false,"I":true,"^":-2.3699032141115173e+185,"N]yHJil":-4473995100552853},{"2;bh/":[false],"B-sR":{}},"",{"6":false,"MVhBW_xQ":-6.846351329089044e-19,"1&ZLWCD)":undefined,"'zXY":true,"C}A?Y=b*":[[{"`x":{"e{#In|g":{"@w.":-2803584021509555,"+\\k":-4962196106378073,"sV'>mPR\"":{"I]T~CQ:;":false,"`":undefined,"d>":-2.382313883403968e+289,"vl<(f@a":-1.3243988250613542e-169}}}},1.3329713456239054e+255],false,6137309189384745,false]}],"*e-8|-#ZA":{"6x":undefined,"m*?N":2.98486238414848e-137,"B}7mVmg3":true,"/]":"C"},"h\\0/*9(-B":["]f M.\"",[[181289694203405,{"'vvgX!":[[true,{},[true,{"y)d":-8880348508387923,"<StMXAxrKq":[{"q_'g":"6lFZ:*E?",":tb%H24{(3":"h;i.$'@6JW","VF,yV]U~":false},null,4.2586033958595587e-196,-4824647323459957]},8486987243981779,true,null],false,[-1.881883460222524e-192,{"sm":"t|ea=","^;w|Y1.":-6.001290467460375e-221,"t/(Ov+YrS":false},"O)",1.0243858413844243e-254,{"qcl0#pX[>}":{"qD/UUA}":8455457927399653}}]],"GOaq",true,{"":"/_","b+\\H9":6689423438162881,"dV":{},"n;J$ge":null}],"C:/KhR.us":-3.3699905167125992e-273,"[+=yy1g}9^":["i",{"uR\\p":-1.7356961102627824e-303},"\\Oixq",5449995984337709]},{"SJ\\i/{f":6.272950230255051e-34,"`P{ckaK":undefined,":=<(5\\qc":"kI#}N'Md>l"},-3041353324327642,true],8949529380244553,{}],false]},null,[]]}],[undefined,true,{",2Uxefm":{"=woK":{"":[2.2423695031805147e-48,[{"TPq'B":2.9940339036072394e-221,"Ytc+MZJJ":-8.463802916306815e+55}]],":5b<]_*eX7":[null,true,8638876559092477,{"":{"vdV+l,gvUW":8965122587840651},"\\U\\AljQ\"P":false}],"=<K#u:":{"^-":"0*/V","a":"","[eTTQ_4":false},"\\e#48":-2388056004982925},"}/]Q^P\\":{")|":[false],"/":[-1.718640230423885e-243,{},"`{_-5",[-7891268451142085,null,[],-5.776482447989983e-264,[{"/|":""},-1.4260511718548214e+171,"\\XVKSMi>",true]],".BR"],"oPEGSW=A]":"6/jd!C","0]vg%'ZS6I":[true,-3.9396515828148234e+74,-5.580911977703172e-16,[[],-1.3140813477820337e+93,{")~":["WkB^-`T]me"],"dzD\"@":{",)":undefined,"-X%>(-#Q6C":2709008290190291,"=af:QTXTj":false,",Wh":6.14953299415915e+78,"Z6W@n_F3t2":1.8621307058886873e+157},"":"W","Y":true}],"\\iSF?-"]},"":{}},"w/k4":[[[],{"rUT7}cB":-6.948499112376313e+23,"ufk-rc;m\"u":null},{},[{"":"%b[i50~Q="},-7.601608952884609e+251],"9*Ag2"]]},"$4tkBE$yXh"],[[[[],{"2":undefined,"<j":"KYM\\4B","+M @p )x]":[911447313485037,-7319219709306980,"",true]},[[{"0>r_":[null,[],[null,678601348347565,"1~EL% 3",{},"]%)!"]],"']D||>":true},null,[{"NqipfL":-7238853819285594,"vkcfFW80%9":"6]A[<='AP~","S_![@w`l":{";S0VNA$":-2517782171571522},"IZzVH|_`:$":[null,false]},undefined],[-2233718932926127,{},1.9222638919169872e-117,3416287486990517,"S"],{}]],{"46Vw":[[7.069831566149569e+116,-1.3281607104061776e-64,false,{"":true,",a":false,"\\F*UW@fGYg":{"[%@:":6.402608135096961e+127,"qrXwH|y\"V":">CfZ]~&","S7Z5&a9@_":-2161661844803234,"E^h,xb":true,"n":-5.440932803933146e+230},")1I<8eH":"/=q>"},-9.803122220966954e+123]],"1nQ":{"`{d`jo4":undefined,"5|W;P$em1$":"K","&8-a O@!":true,"16}02]PM<":[undefined],"Ed)|\"\\6":">[ISF"},"{B[#zsFFQ7":[false,-6936207934768891,-4.9062423961415194e-234],"m%6X":"-&gy2I! "},[[6.354794686787656e-263,"c",[{"_TCGsr%j*/":1312971746058271,"PK#&c":[],"u":2.6581531509528134e-182,"66!%":{"":1.8143961133798593e-281,"f3$V":-896337363139818},"u48~`A":false}],undefined],[-99446294895913,[false,-6714973617706373,null,{"|":false},{"LOCiH(":{},"SpbY.} t'":""}],{"4":"","*<AA>'_":["B``.}D/:t",true,[false,{"Kn":[[[-1.922987083798526e+267,true,[1.0280326634571032e+296,[false,-5304892179419090,[{"/CGok_OCV'":undefined,"AX5B~":-1325893021267523,"jUeb_":false,"":6820775418556533},[false,1.1266230421352159e+229],null]],true,true,"Z$p"],"<<kS)Jl`<h",5.170779930022616e+250],null,false,"}\"BE;C","oI"],567090183945853,""],"2[8DF3,Lk":false,"[P -u3":-1.2390128682194829e+25,"^0(,":undefined,"h`OX":[-5.47628090167689e-83]}],{"e":-5570450270678910," G!<&Q":-5760539012691909,"_#Fn6":"4 Bm"},true],"K_q]:`":"^;X#ZT2K,{","Q,Z":8.373153367499567e+214,"!TL#":2515109962394149}]]],[[],undefined,{"1>l_F2t]0":{}},[false]],[[2.547451053635072e+277,[[{},"KW!"],[-5623517760142198,true,"A =xzJY<M;","-vNtHa)}"],"F+Dm\\vU d",-8.594987444470906e+49,[]],{"r%O\\5{6.LW":[],"}$m;h3":-104655088576338,":3),Y":"=Pg4q"}]],{"~PaZ":{"kK+jOf":4362418965980537,"":-6.997809889233584e-79,"wGuYRD ":undefined,"6W=w[CP9?@":false,"m>S,":{}},"":{"db`5O8":[{"aa":"/Ruv3 ","z|/i&Z":"bs3<","yDuULa.0":true,"hVz":"8jLCvMF#","gY[6o^X'T":undefined},true,6281704526197159,[[3.0287049504889563e+44,-5500497075161270,false],"LSK:,&F)"],null],"66bTJ":null,"TUS~~6YC":7.883822381961462e+254,"":[3.3919229071477447e+298,4.5199190054916266e-207,"jeX#","fKy9(",{"gnq%1[:.":null,"":"Tt;UXrnkg","r9>jBpW":{},"|Y=":[5.038775738557797e-112,undefined,"N"],".CgG>":true}]},"xN@(5D=$w":{"jfm2PMx</":1654191313886463,"wiq{;`Z":undefined,"G{i-":[false,-639735797224761,true],"D;":-4063436582337398,"V":undefined},"d7fo":[">E"]}]],["sVOi"],[[{"QFE":6568513292076607},7.078031332499818e-271,[7825216124851457,"4{\"<gS"],[]],true,1.7104155490155957e-155,{"y":[{"":[[748096649133081,"2[BW0}5",9.245689230059161e-182,true],-2.5105395004839452e-297],"AsyJ|~9xv":[6668938108140089,[[]],-2.1375198063905716e-221,1712402125272049,{"+=& G@":false,"":null,"UF-~-#{":[undefined,undefined,4.820589803851947e+108,false,-5.91050623770542e+46],"m:%*TAr":[false]}],"/P":{}}],"Tl":{"U7":{"+6":-3306896719991959,"`L$F":true},"ZW[":{"iRS4J3}":[false,"0_E=2vh[}\"",false]},"RtdjCzR|":["`",":ikb",[-1.1252478562105219e-279],{"O#G":[[-2.035598940775637e-273,2430916148826763,[[{"Nm p":"|-c%khE2","":"?]bbpI5[","S":3379896981178519},"pZqWY[fA7"],3.664913102096556e-67,-1.2569376714220937e-290,-2.0672823824190392e-272],undefined],"zxIlOI4%]Y"],"Sw;c:p":580571008257469},"<D-+u Sej7"]},"FKM>]HF%(":null,",}q]'wI":-3113769290126956},{"}QHP":7.826521820089232e+138,",G,XN8%":[{"*|[Q6\\":[],"-n-":true},{},3371125576653.588]}]],[[{" 4F$=+cb":[]},null,"cu`/Uf}~vt",{"uoTA%_M":-1.328444103008943e-269,"%CD-E":"RK+g@*X","g":[[{"k\\}.F":[-1.4892928521042522e+250,894862788628681,2.4273933755595143e-38],"T{]UB":">V=tv l","KI5QGN}":[],"E":-6.547588793739659e+62}],6680569200152185,{"hY{1{":{"P^FkQxX":["Xf"],"ntG":"h4Tf61bv*","Y]m,P0":"","^t":0.055128615231265034},"L":{"(t}:s":"uD}\"b{K>@L"},"7O6?Tc":"Fk>Z6Zes"}],"HD":-2940329501511949},{"\\~,\\Sz.|g`":8614078396558155}],5.95656294650136e+139,[{"}>^7":[[],["(1L0JPg?",null],null,{"6Ax2M7Rh":[5.563130494789126e+231,"8wrH7U",";(p5Bd=*"]},"j'$F5T8@"],"5*)j,X":[[null,{"0K~}`":false,"op@I;6aTO":"|","":6759074477330541,"B'M8h":":=:P"},["aXB/",[],[["e",[8.662875735564662e-257,-747905144720222,"X\"WMnFL^5",-12866173120673],{"9a6{'OS":8.928533029322421e-88,"@5":-6.688240651113976e+207,"\\ ZL/":-8250960175046119,"Cmt&S75fB;":["\"\\k.9\\fB,",-1140655940466612,[[-4400480510160303,3116412149325039,"zZD+5",true,[{},-1.2858680799429027e+45,"{1GF-cwPC",false]],"(:<y-,z",4474591678325529,[null,"d*=P%nH,\\",true],-5628215952604011],"Q80","kr"]},[["J|B",true,true],"Iy/pE",-1.2954537755537504e-233]]],true,[]]],{"<;6`":[-0.005060068160719522],"7J_o":{"'":false,"$,t tx8VWe":{"p3-fL":[true,true,"ITH-[,,It"],"H+[T?q+U":true," HU.":-9.275566338795424e-200,"":"kZNtZn"},"":true,">U;":{"AL,z~d\\":3621047826639467,"6 ":-7717961137020052,"_'3V7a0":-5.1662500679331954e+191,"gI2+$)I":{}},"m4;;yK":6218500701636461}},[{},{"^":["m",{},"<N",1378567944065821],"`":[[5.187861804992728e+202,{},".f?D5Ju1/"],{"J5FU,1":{"`y+$#":-5858213076389282,"\\itgRY":1.5824761362046992e+183,"\\S":{"e?+G\"":-1.5404601316499215e+44,"_{|J~thf":"Zy0m&K_Bp["},"]|W=<7LZ":{"v|D$Z(Rm":-5.215764241353772e+103,"B}\"[4":[],"jTw`Z,":[[9.943745434314124e-157,false,{";Zf9i)\\0#":undefined,"KL":-5487302045202056,"Wr;pz0\\(j":[5039014793028193,9.790491735089169e-179,"R}U34",[undefined]],"`!":true},false],"rq\"0)",true,5004459046148397,-1.5080899465277638e+224],"b(K":["Ff(*_A"],"'lx":-5.481148683833473e-190},"x":8793711337348237},"GX)\\M*h1ze":-5424046578847029,"$BX7FnEjw":false,"L!8\\&":{"8f[o_V-":-8.732113810868149e+284}},undefined,[-2974479242203327,false,"s<",[451734861070113,[{"6L":null,"d$":4925614210036209,"EY^nQ<":"$!5rM?i","4R9aV":-1.3294975192856248e-215},null]],{"":undefined,"U.\\\\":-2112600034678890}],true],"3!cW|Ir":"oz","i":false,"*9mY_.i":[-1.2223016019541814e-261,"l3Tt$1w",-6611095978709861]},[-44203519332894,7575417446551061,"|iE(",{"9ZT(3":-3.2593072892053216e+286,"`ah`ik":"6","Z-)Y%ECv{Z":-4.594079692488707e-229,"MG(fL-FH":true}]],{},"&{O-l)AV[9"],"":{"0#":{"S+\\":[undefined,["9"],[6999851191635757,{"k%":3.690912907525458e+50,"y|+O(:":null,"R":{"7N":-1.2264529492934523e+203,"oZE%nR)":[]},"v\\7r:i":undefined}," HxT",false],-6861234619222598]},"*V/lXoJAQ^":4923654584201617,"bsti%v(T":[{"6KdpDL":true,"[)sw#I":"@x,lmmI","vU&gcT":-9.305374113608362e-24,":":{"":{}},"_i$":"'$,Kr"},["kAC",{"3m\\Rq":[1375317243499421,-7529366610091268,undefined]}],[{"*":[{" 5~kd3'ezI":["fl/~8F"]},7546537676874985,true],"IW]-T,":3.702952968394047e-168,"":-2.8360073624089295e-179},["DRXd",-1.5585278494301453e+283],5634522264381993],[-7.250763885832385e-234,1.9338333818498665e-64,"",[undefined],"1%OxaIs0_"]],"`g^m&nP":";9d7y9[gP"}},[[],7.464475572990343e-183,{},{"A":[[[{"U68H5\\YmT_":undefined,"|h@J,":[[false]],"F":"V3`3",":s%":[false,{"A:":"(r","3&\\aK gNjE":[{" n,L":false,"XZ":"d)Qd","Q' *ZUL":"(%26vx0.n"},undefined,[-6926147066411229,-5911388433235300,-1317499833552606,true,"Q_P|o09v"],"wfs`]N4",{"L":undefined,",G}":[],"tOp":null}],"/":false},-4710750580053031]}],true,-3.3819223590729954e-214,8103148532723947,""],{"S!C!06GYy":undefined,"":"7!t@aZA","ZO#s+0{<,/":8352491018127629},true,[{"N&?":false,"":false,"qe3zb3dg$t":"b]c{aUZDK"},[543217822237245,3553858396456905,"NIzQ`{"],"6`aI(","S?\\jHAmBze",{"R?]^":-2.5914956988100643e-46,"*zX6-":false,"":true,"9CT,/Q":2.685818133444548e-237,"sF":[false,false,[-1.954809694725281e+249,true,false,2.367300589253585e-182,[undefined,2852861269813065,"-I=)",undefined]]]}],4.7771837076905085e-113],",o/":[["2w",null,"3%Og$Y)",9.74904276177072e+97,true]],"'E~M9fS,":{"Fo":{",aa5!2rj\"":"sET<ST>\"'f",";]":["pDh"]},"":-8699578087027847,"nfg^_T>*aM":[["feI",undefined,5650369203373051,{}],{"":[[{"YT>|":false},-2.6167480488851758e-239],""],";M_":true,"P%tV(fij":-6960080914229141,"Sgz-oZ;RSI":[524703743007969]},"g"],"n,Mz":-1638126586735740},"x6El":{"~":[5.461425113817222e-297]},"":1177985103744737}]],{"":{},"s#IQ{)rw":6.654856470188694e-13},undefined]],{"KL5auu?":[1.0968851197655822e+220,-3716736114779580,false],"@z`ig?pN!":[[[[false,false,{}],false],-7.389144826952288e-223,[[3757868944019429,[[-5.057749263144401e+158,{"/":undefined,"8f\\B":undefined,"7!_h;t>":undefined},"b2[d>`"],{"@*5NR":3.3148005884894756e-83,"x:i0":{"_FX":297137434236361,")qDOK^V.":{"fvOj%/":[[3905310732473319,null,9.497445307616973e+114,-2.6186966591666403e+222],[{"mi'S,w?":{"/.vDCT}:?%":true,"r?_f:'#p#%":{"0;L":-5964971000810346,"":1.666633007594048e-54,"8i{YQLQ>g":-6925446116089306,"}8}fcLAlWw":-1303023901300170},"ldX":-5429395289239323,"YV#":[[false,"",false,undefined],"Pe",false],"#6\"\"W`>":-5121757972600662},"Ee>iz":".V!","ciHI2py}j@":"SU`$M6u","M":9.054836136563699e-279,"vO":3418872751455319},undefined,{}],undefined,true,-1.426716102988096e-85],"l9K+]>q &M":[]},"7UBtcyTI":[],"E>e#5":undefined,"9{<K<oZ,":"PzIxZN"}},true,[-3.0814455358210185e+249,true,"ZF_A",[]],{}],[{"lMfsFQ":"d``ek","X5":"x_2^W7Q","D&UX )-":"y","t@Kz ]9|":true,"^5a G":undefined}],[{"$7/>[Z0":"@","{8-\\mDPGR?":{"-|NG3`FG~-":{"Ylb4/>^UG":true,"aL ":8610817595971119,"Oa":-1.9743661073676525e-93,"v]|":{"1 *T":null,"8n8|XL4-}w":"D9:S","-":1374034555399081},"Yu~Z1":[]},"O}i' 7x":{"[(%O,2I ":"","_p":-5.3029996495248364e+306},"8<+pApZTi":"","t4Q\\z)":[",Auy",true,1.8763523722727713e+152]},"<QzT":null,"k":"&a"}]]],[],{"\"cG;Cw5Ew-":"<T8?kVD-h\"","qOH+5=^C":[{"}(l'y":null,"Xn`l`;Ho4":[undefined,"*z3(~KF'aF",{"hni\"":{"Uk[":[-9.803287417087526e+208,7.915518762178359e+136,-4920265186448105,[undefined,4389362599911957,false]],"..eBc.u":false,"W":false},"DZjv_Nf-":{"r=!~q":true,"&K":{},"{sj":"F'Qu","!":[-0.0032713340546916513,false],"/S":null},"G0i\"KQA5 6":null},-2.137508517468684e+211],";A/|?(\\\\_":{"":["|?&^a",-8816534023868641,[]],"c=^":-1.0712534040686817e-59,"ba6ixuRu":[],"v0fO":[{"":[false,[-3837518655282865],2.944446372023606e-52],":L#a":[964736282727227,["G>$agFz%",true,false,"t~W=]&}_"],"i*+ #M",{"PkwFh6Cpw":3.946105789524155e+162,"(m*d +]0":[[-7521204395346626,null,1.9629743818578017e+145,{"Q":undefined,"wz.$*IhD6":{"nW%s@d*":-2845451377117900},"Jgi9ABd\\)w":-7222711281824712,"Dk<Sft/:t;":true}],5.878537894721923e+258,{"{-O}":"Es","p^;]@":false,"m]HZEgJw":""},"yW~(",undefined],"]@9O":"8Qz"},5498783110508769],"|":[1.5761690516112437e-298,-1747356858349408,"wU3EXa,yW(",1304486450976439],"i4xEI,S*":1.4500363576209891e-176,"Z]h2U}X$":1.6773582576955922e+290},null,[true,"kt90bbV'+g"],{"*":["4,s](#s",7521620483439197,[[4.190962326551385e-94,1.2079953083598053e+24,[{"E":2990980175262785,"?e&#qn-G[I":[-6270297430577847,"hugt)V&\":",1.7805358396088847e-121,{"y":4362226361519439,"%_F":null}],"g9K":1576606719495105},[[false,423833859691933]],{"k;E'yot]h":-2140836127086756},4384317512816581],[],null]]],"vc":[" ^+IpXS",[true,{"~B7s":[false,{},1956947699328641,836254800694417,"br/QP4Rx"],"J)n*6{qm!n":[null,-9.203414273286875e-306,null,4.587470109946218e-101],"nKO3!eCWQ":{"*RmqGo@;-A":4.047062107745701e-156,"":true},"MVlr":-2.965126652844895e-104},-2.9768223365258544e+185],4110522633752765,3919443170944709]},-1.820539737436476e+46],"3uxE=B=|":"w(L/_=!J "},"1m3tg":-1.4520486620732748e-108,"":{"Z |06":false,"qoMn^q!'l*":true,"~@|":undefined,"}u]twHZ=YC":4162584486446149}},"E&r","%BV$o"],"":[{"k'JTfBpHLk":{"q;L*}PrD":[],"T&yIK>d":"I1iX","f,@?a'O`y":null},"D8k":{"E":"{M@Z","A":true,"bcX7Q]}\"8Z":4814868114009945,"ecN^$":[true,true,-915853526511021],"{jXs!2TN":false}},{},-4173162754482377,true,"4mB"],"12eGG2pzfr":{".ZMow(wC":-3001595202764225," ":"#>PU)","Ir":{"4D[yfo(u?I":[1.1381324803498012e+132,[false,6.505904510963113e+193,[null,";Z",{">D{*e`*:1g":"&3+A0]x"},true,[-7818931658761614,"\""]]]],"k,":{},"1c$k_vCE4D":false},"!awTRr5":5858812193663605,"\"":true}}],{"r#-":"s|u#kS5","~vI~DJe*":{"0@N":1.2154886588355591e+297,"gO/9A":[{"YaW":{},"":{"VvxJv; :_":-4.530277087291391e-210,"Aw":undefined,"mx":[],"m*wp.":{"":{"{@9k":{"YWZao&nw":-7378569999142728,"~5V":{}},"-Z~.":1853155696970817,"2?WKass(K":[{"$$\"C6":{"8":5657684816137361,"g{Q":[["0/HeX",-6786012384505261,null,6491734837328831]],"pKDh+*]":-2426317789364594,"k<=`":undefined,"ny$9kG":2.1792157088713833e+117},"(":{"H8(D9-4":["81UBaL",5602469061025109,true,{"BzZpQh":1.984346185077474e+61,".};q":"[H :","\\":"#R","9n":"VWt"},-2.7305400562135364e-42],"Ue!@kOC":[]},"":-1.7105505849261428e+64,"fAesg2Uz<&":"Il|:"}],"/~cXvV~IW":-1.0963003007790599e-296,"u":7591376857814521},"!6VQu^I(N":"P`o+E","=BCv@":undefined},"47>hqrck&q":6151142220151961},"lV0T":undefined},false,"3J"]},"Yo8Z7":"z'x$G5","cRW]VZxG<":8682422881827629},[{"^M6K5":[null,{"()^$8nJ4":{"":"r"},"l9rw":";)k","6]|Z[}$":[8237074817456317],"5<os":[-1.4926919822573771e-33,"!UYA",undefined]},{">`8=^I,Cy":[]},{"C$&K.oepr":false}],"ViP7":["K0%k"],":l]Yb%)'":[],"\\":{"qZc\"RO$A":{"s3L|L0L~=":[true,[-4.4324959641502796e-63,-4584396899661280,-960423400882394,{"S":-1.3296932083238969e-109}],true,-4.608967231802105e-28,["",null,-8741144287808052,-5419840107195698,4.551336555066814e-170]]},"G&cwvv3q}s":[{}]},"d;7?":{}},[[[[{"m":{"*O":[[],2368487113165905,"GfKP "],"6bL#~Q$OY/":{"]34-B&":{"&Ww@1e":[{"6X1KL=?Mi":-5.395579346730903e-131,"W!bLOu":-7874394596172338,"]cYJDP@+kA":"us.ez+"},-1.2050085850989522e-234,{"qc'":1.3220669072563534e+304,"=6%?u":-1.0546665003846245e-195,"i3TuJ\"qM/":"nf","!#s*":["uV.mQ","_j\\Oi",3028725389169085,-3.4226469932988622e+205,""],"EK56S":-5.609040163932389e-30},"#)TMgi,67"]},"a":[-5.154918063343835e-307,-3.2586085954457937e+121,false,[undefined,{"48":-2.07707906414463e+165,"=` U*EBT5I":null,".u=de":"H{=(W=C-r","~p-":"UQx#I","?sD":""},"*iKEe*"]],"RUYuu]IEe":"","_Dc5@p":{"":"LL",";D":{"JX;":4996672127805503}},"":2.766595198109983e-134},"\"QB.O>\\%%":790414680803793},"o(WAsw)?":undefined},{"qNC^m\\4GbM":[-1.7767523791931095e-159],"4F&Vzu":null,"]Ha~eg":{"?v":-6.441473911792075e-257,"rA[Mf":-2.5707562858175374e+228,"<ea\"n?bO":7977700324030195}}]],"Dm"],{"A1#KK= ":[],"g":{"^DIf,:\\)6":[[{"l\"mV":"W'4P(","c0'r,":undefined,"c1I!":4186157515206675},null,"&"]]},"#":{"2":[[true],[{},-766055008126.7318],{"3aG(B8}":-1412311648268274},"I_TPBf`",[{">+D,J?4":[true],"BQAX)Dsc":true,"J;eUHM]":true,"C":{"uY{*":-7815689557827386,"(RiPW":-1.4253175886479605e-207},"f":9.235358552841587e-304}]],"w.Z!TwQ{":{"@9L,\"%lU":"","":undefined,"Y|+`3kU.bt":undefined,"k<T,ocz/":{"2Tm1":875704615417331,"&~->>||o":null,"2^Jy":[4.165383294115879e+123,{"'n$}WKpG7":[null,"78e.d/PiY",""],"}Qo":83338339052459,"-t5b":-1.9826180594468477e+196,"_)-LH. ":[undefined,4.519833160713831e-191,"y:"]},5516786440545233,[[false],{"{":{"J":-1.3559462854761254e+78},"yQ":undefined,"8v":[[]],"":-6.647390050752114e-127,"[_%":-1507090960318172},4.84027662564341e+243,"(='k >!6l2",920854528798259],-3328778149010505]},"u6":{"mo4":-5.447722762732403e-34,",]T$3DH":{"GJ":"lU","J;}=h":true,"7\\n+\\U 7a":[{"x^:8_D%\\\\B":false,"l":"","D4]l('w":6573799462268737},"):",undefined,[{",p%":-2.196609257174219e+164,"VqFz":[],"?b":-551822107969473},{},3.988484835184153e-250,undefined,8.555474921590063e+225]]},"F0#l5hq-1":true,"@L}tPc":{"0BwtKa":-4.0306534660314804e+73,"1mN5V/N":false,"":[{"Q:m71sA$A":".</Th"}],"Qrk>U(.]K(":3100265402451041,"BG];DT":-1.6052324177247004e-268},"A;ec1(p.":{"Il^LC_(R,'":{"n":[-3.0423392498068543e+127,-2.6902198465151078e+230,[]],"plcYg[lw8":-6464160041585238},"iEpjn;=":{}}}},"f\\#h5'5$+":{"I2":[-2.3373228111590007e-160,5855353657976933,6969478690307775,-4.1082037940187766e+27],"`C=BZg":{}},"ziJa%":{"ZI9M{v1`]X":"A&|_Pj(N","W:v;pRE>m ":1.9846650677914772e+200,"v(nL1j7":1.7061399485147126e+238,"2#QWvGg":-7.03552827612313e-294}}},":}",[[[[-934541063403055,undefined,"M^eM)%\"7*",undefined]],-2.841609862684789e+36,{"T[n4":undefined,"bCgrR?v)9W":[false],"4bF5EA*Qi":{"x[;'#pr":[[],[1.6890479468247178e+54,6436700276561059,[],["Yo",3.7833642966245804e+230]],{"j3Q":-1982944849482359,"~h":false,"qNo*@7h>3M":4.345575242486769e+176},-117021515091893],"*":{}},".\"ex":1.9198228280254052e-134},-4.391382209424675,[]],[[true,{"a($":undefined,"N]Gc":"D@4?Qd,","@N^'":"1omSpX","Eox":7122569131289.921,"pLS(":"P]\\"},false,{"&Mv6g~<&":[8357396398576525,"IV",undefined,9.037546815819175e+82,{"3kp*y%cj2":undefined,"NYYrinH":">Fsh>VA]D^","Nn))O@ZiQ":{"{3wY*tJ":true,"4\"":-4.0481728625798356e+127,"L=TqDO-":-1.3935438395821458e+245,"L6G@^/Uq":false},"wI4J":{"c2uT$":true,"QPdW:>$a,\"":{" p|.w*":-2.0721443772614206e+263,"HF.h?l!":false,"v":-6632120463241997,"?\"<l":{"":true,"R1":undefined}}}}],"RCY8TvH!":6.139178710399615e+282,"r>Vd=}8":"Ta"}],{"":"-yo&Bt5ZT"}],{},{"":true,"&":{},"2dC=p":{"TT":{" _\":L3{J$Q":{"k@PA\\&$:!":{"\\zD@Hi":"jN"},",\\Ukk3":-1.24810721819144e-305,"Rq0":[[""],-2.399340265482846e-173,5.585372811565149e-286,true,{"c":"G}]\"","A":"&%'W)BA~","2`+*dp":"cP-CuE?"}],";M($Uk*B":"m",";wk":1.3120738435712277e-129},"0#{f>}WP":null,"":[],"(E[BhVb;9#":undefined},"XPn]3FF":6.197302610876907e-195}},{"0<^i":[[undefined],false,{"5*( +\",R\\":{},"R@yZ8wBp":5439012557510961},true],"aNn-0a":[{"`1n;5<`pA":{"7=x7":5.0638042651120204e+143,"4^E>]":true}},1.9535438220532975e-14],"PK]=vIK=":1.178480849764804e+28,"_d\\":undefined,"SJ>dQ/W*[":"Y"}]],5213034634633821,{"O":true}],{" ":[[{"w|p{mWvr":"%'/hx","L%&VI5`~":1967113568841281,">][":{},"ZeG\"2'mRN":false,"&L":-3090074662782902}],[],[[-4576309146711907,undefined,"gzH4sxQ",")o,HFZ",[{},false,{"HD":8.668622798386733e+253},"H}kuB$>"]],{"l8LSg":"_Cb[1Y!R","~t2|s3\"#F:":{}},{},"Qq4+z~"],-2.8737781415126517e-124,[]],"M;qV9.E":[],"R}lqvD4+HD":-8330187897796954,"*VF|2]#;Z":true,"gGSgk`YN":{"":[],"v ';$k":true}},[{"":[[-188191858601607],"v`w5hN9]tF"],"KB&.AOCq8\\":null},"G8L#L6xX"]],"1z)":null,"w'Su7_F":-2.294888658049877e-55,"Gi2RAM&Mi\"":{"a`M":9.755154330003802e-127,"H4tr4#-":"o6","\\[+":[{"":[{"H7[":[{"|\"fq":"",":}.;{F@l":true,"xhEMD(/O":{" t|":{"g":"Z]>q)R?Z?","D2D>5T#":"VU"}},"Gt":[{"-_wt3,jW":true,"*":1.438259496294519e-209,"LHT*":true},"^[b+}R?x",-1.9753002452893745e+276,1462020716749385],"hpl)kAZ<;":true},undefined],"d":[],"u6.\\z>sGk":{"hnf/y\\'":undefined,"+d\\to=K\\m6":"","n>#i|B}Qh#":-2058703967460575,"nD":{"d1":["4XOpRC",true,-5316444189282748,{"S(mVn^1":[false,[[[2376402849184613,"z~t'gNa\\s"],true,false,4560829288618969]],{"":2605448741305735,"B}|J0[uL":-3585571079608148,";IQ":-1.5207131494042503e+77,"mw\"[SEU+!":"i1z@j{!\"K\"","K;:gWZ0j":"sX2w"},"p;gt0.),"],"[}eB":1.2374471344069977e+115,"$cd^6":"?GR6BwU"}]}}}]," 2p^% M2":[[{}],1795556766377783,true,"u"],"L":[true,242350900263241,"",[]],"!":[[{},-5427950425010967]],"AU02xPlh]+":[{"$A2y)kH`P":-6.658933979479126e-265,"Ea":"j3F","C|}`Qwm":[1.4542466788180865e-272,["x"]]},{"":-6808030213952055},{"T`{]F+":{"6mM.":{"":["G4|?Vb"],"pTtr^8PR/z":[true,"}^|[uL-;>",[],undefined,-5.087247606827788e+177],"3R<l_,q":null,"Ky>W":"pI6lLMs","K0QX1N>)+":false}},"g[TsJ.-m<|":[{"=":false},43305777417795,-3484562398480948],"Q,)E":[null,true,1.2427235462308057e-228,true]}]},6971213491368829,[{"N~74H3T7":true,"$x{":[2099147440032249,null,{"aZ9ZB":[[[-2630455099135369,true],{"U":"k5`{pU","GQ}Iiu":"YKJhaI8"},2.641063651769856e+54,[false],undefined],false,"IU]qD-"]}],"":"`xoyaW%;S","TKRJ+lu":-6178008733378326,"c":{"":{"`]]skB#":[-8917991901900270,true,"_M:9"],"X":[-4.7420206938926384e+190]},"P6b":"0","x0[/I=\"/":false}},false],[4231800373145133,[1965695665706697,[{"[}g p# ":false}],"}j,WF~",{"":"%","N]b+{I":false}],undefined,[],{"=X:%":"TJaH","=Yl2R.T/lR":{"gs)":{"}?%J4pq3P3":-4.888916500205182e-123,"bvB5":undefined,".yeS{JS":true,":maG#":""}},"gATpO4":[]}]]}},[{"":[{},4.0721105396197184e+182,[8148371074153839,{"[cj":[],"gq]P>,?a7X":{},"O":{"e@7wL^Ux1v":"6`4Cn","A+#.:7d/":[],"L`0m":"QB&)x=n"," c5":{"Azqzx{w7":{"H$":{"LNA:/":{"rqk.j":{"g\"lR>I1":"S]\"mh\"-I(<"},":C":-5042674500763322},"H":"@"},"Nf:M`[":[],"WPH?3OQch?":[-9.1578912751286e-261,"Y(c2",false,{"*'D!f":8.41865532712857e-279,"cT}QU{8T^M":-4.3295606939302035e-13,"_1P!x":[[]],":aXk":2691624616274197,"[Oyw":-5.287117080087458e-283}],"Be}I;4|t":"1U1ig'v","X!H\"z*@":[6217133200533821,"",[-2.9708193539860725e+149,"MmVcP|F",null,undefined]]}}},"jQ\"P":1.8496466968387583e+260}]]},{"30":{"E":-2.8318186299480774e+257},"n*_[d":[2.8936891543595835e+136],":-VrLq{^":["RRrq:.aV2",[920820696350127,"7MsbS>y?]",null],undefined,{"A#":[],">k4\"n":{"\"F":undefined,"chfY@sB":5.53021430209882e+294,"-X(?O[E5":[" Lt",{"}8)4b#NfiQ":-2.5138030379504734e+85,"":[[null,-1.0519075819971305e+129],"q",-1.5179587484353494e+61,2.374868350960674e-233,-6192723561250547],"m@qKCp92Dg":{" DAI":-3607758298033973,"x":true,"0Z{6q0G":false,"JA":""},"2y":-6085105963720753},"_0",[],7385716972819203],"@XB{L":{"#":1.099418936130275e-201,"0NQ-/iLs":null,"5;\\Wc$":-6.596376011987221e+176}},"":[1796564039770093,{"":true,"*<?dpD":{",b J.c":-1.6493234254131e-95,"~=g@A 2B":true,"%\"]_~jUi":"M","\\p$o/3n,":7826565884427021,"C<'%=j4UD":"\\J*`"}},{"&RA>HARn":[[-1118577334810518,1.4007730582506847e-149,true,"/+w_cOaQM"],{"<":true,"":"fw|T\\<E","Pln":{"-b":"qT"}},"4`MH<\"*foS"],"bi@\"v":{",cf":5322967319296767,"8yi=z$W":[],"]o;iQE":[[1196915277966041,[{},undefined,{"O\"I:>/x'":{},"'CVLchd":[6.1741978171322456e-71,8987729928443083,{"hzC(6&*\\":-8437803438391071,"M=":"$%W*Lg","2;TX~":true},null]},"bbs27&."]],8.251661699051975e-71],"|OC":false}},"s;%cNc^"],"\\-h?":{"u<GtO":[{"`Yn<4dv":-1.2465849217022755e+218,"":undefined,"F&jl":"6r7","}lqG":{")N;&Y=}cA":{":Gn)rD@_n":1.9694690459804675e+71,"jNs9Z7":[[[[1016046454773917,6212025063591705],-4366836898506776,{"kU,":"[u$dlL","k,G":true,"1b,":false,"`dIFwXt":".y9TO1CXh"}],[-6324580832312523,-8558915533029357]],true,2506613447415.63],"SXPLLE(mJ[":{" &'Zi":-2257605172164675,"VVBwxhC)VQ":{},"S9wk@4s 7":false,"{40":{"%]LSvZfxc*":"+2q;|","mXUE":[4.197103458220447e-253,{",F,TgXQ4":true,"VsU":[]},{"c*~K":4.270172415030544e+109,"n[\\n1zlj$-":2107718117599701,"(O:L>Rp|SN":false},"Jt'"],"yiEk8TO@9W":[{"?z`":[6471014186.451798]},{"~MyzSd@+c@":"$","DX%~ob4cF{":"r~HvF","Z":"6](A6Ln","an":false,"d":103280820004317},-1.0356101023159846e+128,null],". 7":3468374286163223},"Q=":"\\QeYVBZeDE"},".cT":-2.492596567270946e-8,"ab.}.V+n.W":{"m.9J(fAOy-":false}},"`(1[iuoKw&":757187256238945,"uwjex@k SI":"=b?","E6iC8DY*^*":true,"'jDU(D":4.62180957912672e-206}},{"hiN*%":-8415901635616430,"^d|B":"-"},[-3956025825074955,false],2.9107800418686593e-183],"q":{"h3cVgef*o":{"JAZ)'2":-2.334784831989716e+240,"^|!_H":"}fP","#<e'9pC":-4415048313202196,"":",}A0axNn;"},"(NfMR]vF2":{"{tPGZbX":true,"fA=":5493703962332191,"Z7":[[undefined,[],"pb@?|\"a",false,null],"L",[9.62054600772635e+50,null,"GSU9^v:",-5600126334155777]],"B4];":[{"dxqJ7PNg":-1122883941367043,"[]@nQd{ $F":-512038710012002,"":-7.458560171788636e+306,"=<5.NI5*R":undefined},true,["\\",false,false,4.690772510326647e-90,1028029955091603],[-8.924493024200999e-144]]}},"]-9t":true,"":[undefined,[[[-5.411644472650144e+23,-674275282779206],{"8J ":true,"h&8v[":7463438096229085,"VN24+uf& S":5090939466214345,">":[true,["z@;o","~{Zhnad",4183337087831317,"$0",false]]}],{"}y44Qo":true,"\"du{.JU]0":"0?lzd9","Nk?OkJ86D":3.92317241584464e-280,"vK:?:X+102":true},"}qe.c&uaq=",{"A`Y-Krgl/":7.939869868397196e-15,"u&J>I?":[],"}n":6724129532392501,"DydO":[null,null,[],"|"]},[]]],"46'":"]x$]"}},{"x F!":false,"7a/UnhXE4L":[{"uRS<5=07":"","3Mmz|c":[false],"W7/:C(2I":{"os5:C":false,",j?Lj$X|gG":[["29G$t$",-9.251898907081784e-55]],"":"IU~q*lB","$1H'w?":{"$283{Td":-4754221884871809,"+(NQ":{"Bky8q'":{},"Q\"wt`HU":{},"~'":"#","z":{"s":{"tt&s7G":"JG2z"},"C&bhs#V8":[-3.415691528485042e+268,2175521048115649,-2.4201862942838022e+173],"@_Y==g:XZ":null,"GEr":{"7":-1.9214894131478984e-229,"'G{2i }Cx":-5547411347919470,"6v][L~~":null,"/K":false},"s8K":null},"]R;Fk":[{"e8wWW2":[],"1?o4gIR.":[],"K,*Z":535295293822209,"92fY":8769483806074521},"{oFkTzttjd",-1.3674061700300161e-40,"+"]},"P B+C":{},"$":[".\"OpX:@@",null],".":{"K":"PIbHAv","xg":true,"F<":["Vzl;1ZzJf+",[""]],"*Zml(":"&D","s]M3y":{"/~y":false,"]>v":null,"wZEK ":4.784175999860578e-52,"yW[P":"T:wV","O|.":{"W7g@HzO}":{},"aDY":false}}}}},"+18O ":{"om%":-1377807470634935},"Bio=tN;+{":{"$a\\\\k":false}},{"sVX=)6(":[-4.189727287057934e-30],"?;jOH9)!":2.1368549390060467e+132,"M-":[],"^H#F{>p>dT":1885177595569493,"%<7":2175752939071963}],"}|>Bt,":6912905296199067,"8MVeF>7m":[1321386018808955,[-4.525734434311579e+58,{"^FKKi":{},"":null}],-6697251627302263,{"X":1008825175149513,"Vg":[[[[true,"",null,[undefined,")",undefined,{"F|dDu(":"N7;Q/Jw","+:DzC~/W@{":{"VHq|Chm9*E":undefined,"|j":undefined},"kt]":-5744979503953342,".=BD!":true,"":[{"":3059643534867821,"/pdYKSQ":null,"(wae":6078352177155233}]},{"H;":"al0"}],false],null,{"Ra&HIeb":-6822713089117178},-7.057361792399346e+69,{"_!":-4153316603387263,"8!{]$sExd%":{},"P":"enw<.O\\","_E>U_q":-799301578915775,"(*p@{En":[{"S\"":[true],"I%;#0~":[false,7778931871423031,[false,undefined,null,3.2393621876286094],["Z",1.0395639550351516e+206]],"o#VF[Ne%":[-1156894426576434,undefined],"dK7(XtDK":-1902176705731111,"qdAu~o":undefined},{}]}],null,[]],false],"AC ":{}}],"K+RyI":[{"@L?;FZ4a2":[],"l:0'0 ":[-3.7999774804967602e-177,{",U#MDn":false,") Z[~40^t>":null,"UNhg:*>:=":[],"1si9YI~=c":{";5pn_G7h":"xvm!","p_{Bzj2":{"N[\\>/7Cdd":-1.1701208191415842e-298,"N=^^$<<xFj":true,"aQ[l":2.1179997168609152e+200},"w;A!Zd.a6":6.378066090026814e+216}},[-2.3460207021635406e+71,[{"A08":1.0270338742176228e+283,"f:j&/?`<D":[],"4fC2":true},-5.003499392632652e-87,-3.4527180274720536e-160,{"":{"VVvAT":9.061721534589322e+251,"?BpG;r;":-7.451345543638533e+278,"GN":-1445588468270167,"CZvoh":[undefined,"3_",[false,true,null,2136362348329665],"^WlW^Z_~"],"=,(<71+":true},"ql#":false,"!g+25!":"K}=8bD`r/=","_dW":3.3868188666992315e+121},-7386882935165672]],[{"*El~An(A_":false,"P9AF6GL/":{"<ean3,;PB":[-1.4627730188869045e-128,false,false,true],"W+;0":1375472365135289,"Gp{#":false,"dJ*`":{}}},false,undefined,"]_|aRP",{"":"lx?&","*KZP9\\-2":-7761155738579018,"LqT9d\\&f]":"X\"5YNPda","do":null,"6owL7":{"nLPx":[-3760276355151569,undefined,{"":[{"!_":[undefined,{},-2.654410141679361e-53,"/HpQA4sB"],"z6F(!-":false,"_Q":{}},[2.213499536235838e-175,"ThU'SV","`U Y6Qq:Yy",{"/n}":false,"2@":"/c4l$HK"}],6107159713945725],"Z(c2c":null,"i^v&wjdy1":true,";\\Kd\"L]bk":{"4b":{"C'kL":-1686315679201870,"xt&1B":-4814675420935332,"fw*":true},"{QDP":"*ZK]F3!Z@>","B^m":{"lYS\\$1":-2.5469252376335727e-113,"{:2[h$Y":1503146657385431,"#e":null,"v@QxY":[{},"NU*z5*4",-3.6614253756651285e-184,false]},":kqeW":[]}}],"r#.g":true,"w;lacx{y":-8093902835432923}}],undefined],"-l+nUOYnhE":"r"},{"7RR1hdWz-t":{"++V@_":"qn|Y#=","9%":false,"'":":GK@9p","6'@!sOvghy":[1505915293189041,4.691986230998452e+158,{"}8(sN^N?":true,"Q~":false,"W:AC":{"e*s5kB>":".L|Ld)O=yF"},"":true," V":2.8673056959249604e-45},undefined]},"v[":[3477862468249773,false,"","Q"],"'8*Y":[-4.979659944633839e+287,"TNu{,7{aJa",[8187452638165707,-6990183402648650,[8858335318890301,null,{}],[-1388619872938666,6316898423046699]],[["y\"`-k",[],-7.873764456600855e+117,undefined,["sER|\"","Pa*8[",-1.0665343220606306e+107]],["})\"R9",-2.1540962365675994e-253,"D'ra{fX",7509564327542491,4009387270658389],-7.687565490979236e+145]],"_8":{"v`":true,"j":-3682736527985127,"i|n{q":{"":2.962604616249494e-15}},"PN?Y":undefined},{"M1tbVs'~~3":{"FaJF":[],"kbg%":true,"1U/":[{"VLaQ]6diw'":true,"l?":"a!7j|"},1997891802165523],"":6377061430828649,"3JU8FG":{"TqY3XQxP":true}}},[[7.072904587871182e+145,[[],[undefined,-4910140389787836,[[]],"VE^<xI*"],undefined,null],[3551949872575891,false,{"oNR":3110860484768909,"VXTDvo{":[null,-5.227779033359493e+126,false,{"mm:":"]$aIE",".Wo.":-6401608253266137,"":true,"kfp<?wJF~":{"cvX\"":{"A.Xrg/t+KT":-3.773113167316742e-204,"P%6+3`q2":"U1(H","NwC":{"f":["bKUg;TBG",true,6.110799548872779e+269],"-yP::l7":[false,false,2880921288196147],"<kP/*":-7098874745861756,"*4RtNj":{"&hwvO7b-":{"U":undefined,"Tz":true,"m":-2.476794300229742e+245},"2l}i":true,"g{kp)":4733582136590199,"D":[undefined,6757263553033405],"^":null}}},"n":-3369078432252715,"'":undefined,"XmO3FX":null},"yI":{"jt^/#TW>F":null,"\\dH.":[true,{"g~XpehzUZW":"K","A":"UJtCj]G","qL|5UwS;Y":4521311840710037,"GS":{"rF>(~=t}.Q":{"%~ss=f":undefined,"!.~,A;3@":7357868922738045,")":-3.111361173850699e-23,"7H^'jTW!":2337960386688873,",+":"j"}},"\"}$!3}]":[]},{">xjL*p4":",F?d&}Jx","pMq?)s\"5;q":6522837906332321,"~z)\"":true,")eFWp5v,":undefined},undefined,undefined],"Rd#nQ5dBj":8995198438821125}},9.875449783243729e-138],"Y":9.1521485854793e+48,"eSbz,&VA":"R*H(+X+MhT"},{"IYg/":"t1x","":false}]],-4594390626691295,[],[[{"wT@-+e:9e":-5.266420014145054e+259},139461670907453,"@w",[true,"n 0",false]],{},null]]]}]}]],"#C{":["$=\"+",{"A":"9|"},[[{"H^T#Q9]@":"bb~a{","43-cB$&":undefined},null,[1.0307400302257116e+290,{"Hxbq@f_F":[{"^":{"}R|<3|":[[],"1\"Z",9.60465305761962e+43],"?mJX":{"eVl":false,"yV__@!kPXA":"VL]G;3u) "},"x7MU-?{/":false},"qF)E-.,G<G":[-1914555471672618,false],"5e=kt\"-W":["5h"],"v6? _!R":{}},{"/hc.mEQ{":[],"Z(^&CR~SPM":{"@O]6g":undefined,">y+zP$}":"/"}},{"S":{"Gp}JkIbk":-1.9008018315665017e-52,".|tNW9":[[]]},"in/":true,"":false,"-cil":[]},{"-":{"x=c}zL[6!i":"lKn@t!(\"7W","Y;K<2Q(wH:":[]},"+:":{"5;P*I*i":false},"eLrV=":undefined}],"BN$z:(c|M=":4633072652090481,"0)DrimLE)@":null,"e|u{":3.0094820333415983e+21},[],1.8775191951365194e-169],null,{"1|q":false}],{"9{*}Fg@r":[{},-870925320768690,3.7667397466405547e-59,{}],"N)9=":["26"],"M{bn7:Q":[{},-6.947983880418741e+238,[{"0Yt5Y":[[],[{},"i.|\"AO'5"]],"":{},"3X0":-2333380843953187}]]},-5.04904546175503e-97,3680929497370497,[[[{},[{"5z7\\{:-":true,"ZAs?wG0":[false],"v\"\\Acw}?+":["hNBI","m!r,N&s",true,[[{">siUUm^J":{"2&":true,"|Vr<4q2":-4402368809867858,"BXA@":1.5149585520166144e-217,"2e,fGs":[-6879865522773433,"P$.~{XV","V"]}},["XI vt",-9.291976443919332e+241,-6162144095245469,["1h!ECj\\u",undefined]],{"6w\"],?":[{},1.9398405011087194e+153,{"\"6GR@7,Eh#":{"F:*PI!o":7786587039396937,">":{"p&[no~n":"Q3VFw4J","z4l`O":false},"f":"^q@o75VQ","TzJq":{"^":[[],1.0347102831637897e-114,-2.208824082739267e+260],"4f":-2.497112472002041e+97,"":"yNZ}<H64:","[.Mm":{"f}M=T!":false,"b]~":1059295126400.5349,"VMeU2'nGK":true,"S":-1.2160483522589317e-74},"Z~-":5982358303963477},"SJ3NnM/":false},"O1!n":{"LUy=U1":false,"q&u":"+>CyUX","VA?h=KIL)":true},"\\eG8D=z0":-1.1470189687261572e-242,"{-Hn`V>&u@":{"0w}#^n=nez":5456806836720985,"V$u":3249910915705923,"LL#;|g":{"W<?":{"t!<,yw<":840411554789833},"qRmtA#~'":false,"dir[z<im":[6869651440606399,6174919337754777],"=-K,q":"R","I1":[]},"sm:e9":true,"h~p1!\"X":-3.386170841423944e-210},"1Ko\"Y":undefined}],"s`mfl":-6162755061168542,"WI!":-8100462896417242,"{C&=h":["<H{","Z~",undefined,-3.853675719018066e-290],"bG":[undefined,"s2T`>u",1176607350597997]}],[],6.761524717823415e-103]],"=}":false},[false,-1.7894570057975252e-172,-3.123936190930243e+24,[-6330531716073150,[],{}],{"a7Z6":false,"{Bb&(&yf":[[[],-4653803154973169,{}]]}],{"lk":[[2.496937469990138e-303],["z_)_]/N",true,-1.334161517295686e-56],null,""],"Mo&TfFMU":{"vL/":[-2.6231244854677764e-205,false,"Wp2",[-2002609594161852,"ten7R(q9ua",{"uP*Pe&":{"\\6.<JaB":-2.0178213410734287e-119,"6oARu:Fb":-124436218992572},"wv+":[],"u":null,"}174MciI-":-1.4039313707055183e+52,"ZSNqy0mlBp":[{"DoAmB<qJ7/":92526834105845,"Gk#>1ofL\":":1993616875318553,")k%fB!j":2094812006810333}]},false]],">cnGv":null,"":4.6521264644614546e+73,"QO/P":-3262555383892536,"m ":[true,{}]},"1p?{K*\"`G":{"Z:x)GBTu6":[2.0482186626208343e-61],"j":true,"y":true,"kL,5bu;G0s":{"n*e<@l=|i":-507791840354814}}},{"B{;;":3.94348556702364e+95,"I":{"lXx":{"":"1\\&y?L|c#6","sHPs}yw":{"T0{rJ:R":[],"H":"y={rxQq","fVz4pXqV":"","j'Ex\"T\\":false,"'!zFYM":-3.473435410980493e-223},"WE2}8|B*w4":"*h{\\IM'3"}},"L|'g":{"P":[2.1181315487358792e+115],"u@oa}k":null,"sss":-7050710974531946,"#rDAIm&ML":{"PfG":-5687334244668183,"PknJ>kMVpc":false},"2-w]":"D%<`FeE|"},"WAoQP":[{"":"Ht1","f[srOEQQ":true,"c]fQS\"YO":-5557272503579753},{"u_g[]~":"FsI^}o","1pP%2PsQ`":7912491283541713},{"7":"&m<N~","(\"":[[false,{"$De-":"*Rg^+Gd","D~NONu/":true},undefined,{"lO]":[2.1281785450102672e+186,"M?GQNo&qf*",true,true],"":["F8~"," =W\\0Ei",-1490473546013051,"U:j,>y-,=",2.0186231973561694e+240],"2J26mr:Y9":" P","0(0=5>{DS":"`OS^&","5%XR":true}],"Y$1nHu"],"5z":null},"Ak/y=+"]}],"",{"Y7ZpvA~>'":[{},";Vl|SaKNj",{"?_Ow":[]}],"":[{},4579273741219147,{"bCmm)O#":"pVSHBnNv3"}]}],{"5JW.9~o":{"_]":8981052514963853,"":[[-8.510290164205638e-111,["(d/C","",8609134058094239],null,[]]],"=<A.NGm":{"K":["~Up0|9|I)e",false,"",[[]]],"`N":undefined,"?tJ":{"#ul4@t&":false,"|x2,D!e[f":"(","f-8D,->":"BA6=L|)/o3"}},"nSMYlHa":{"#um{8^ZS":"o W3",",$x":"J|~_|","e":"ZvvEx*2b","l~x$":["jVr/:{g",-8425563715674817,{"T Uc_":undefined,"-0n1O":[-4.8844448779819145e-158,[true,-304394324082105,[],{"sC-)\\jG5LT":undefined,"BAU 6;~<[=":[]}],1.1063207769109435e-73],"#OdOAdBq5":true,"p~4":[{"BY*{":-7308244126704851},undefined,[[-5.397511705979688e+167],"'M"],{"DdF^f9[U":null,"":-2.2376718511537072e-50,"^W_NYEX":2.701594057532574e-291,"0i8j| Byt":"y6p1Td=-"},true]}],"^l~dRnH":{}}}},[{"D":[],"-iyvP4.w#":false,"AO>,$u":[{"z}74v'}Z`d":[true,{"":[{"u)=Fvdf":null},[7502430788516393,null,[1.242109937536775e-33,{"WpXYP2f6}7":-8.208547483643266e+62,"8y!(:3z$6":5692123448855133,"y#>v;a>":735301819916347},null],true,5.653697350846533e-42],"PO6EaT4kVd"]}]},null],"U2I]?o#Kt5":[[{},42023259247057,-3006871853646339],[-3.332295291385117e-294,true,null,false,true]]},"1kw8cL{\"("],{}],{"xm`V":8376677287195619,"E0~azT0a":{},"!\\I20\\":true,"\\oq,e=p0":{"t]f9^h^k":["g",{"hU{!#va":-3.2966397931906465e+214,"L0":-7464222017302760,"H)+e":null,"vezR>N":["zV\\7zb",{"`IXT":{"?/<~":false,"c*qDu@U:":undefined,";X":true}}],"k":"r9i"}],"A.j~h]4":{},"BCVX":{},"*m`zJ":{"s?%":[],"":false}}},{"7":[[],-781774157775608,"~"],"K8":"2","V|f|}b,q":[],"1:h`\\}y":[[{"":false},{"9#=4":{"2Yd$":-161090509122088,"a1|/$ndpCQ":false},"c}Z'6U`u":[5963559360386465,{"]M ?":{},"!-kWPUv":{},"Ez09vDTBb{":[393327612750301,{"Tz4V":5.154884800243268e-95,"vh |":2.8055948289223805e+220,"Hs%av":[undefined,[4.432513520157978e+52,1.5877813915648706e-122,{"":2.3086863078081894e-178,"`~ug,t]H+7":[{"|Hjv*?(z3":null,"z":"Z&Z&rL ","+uWnyd?U7":"8)VwI\"C07I","kju9d<oE":197548137579393,"<yEKU:":-7.786945107011706e+124},"3;m",9.787562911825103e+241]},2.202321840832901e+36,false],9.307856785597729e+154],"THI":"lL\\"},false,undefined,"B'uBFI:7"],"Wb} rotb":{"?qE":"-+UU!q@9T"}},false],"":[[],[],"o')uE0Imoi","RSC35j9*m","'\"x_y"]}],null,[[[]],{},[{"!.(@":-9.937952852974376e-29,"tql^h{P&kv":[true,[3.27352706638158e+29,7.789130362196604e-181,{"(0T;W(Fs":"",")5,E)n":[-1.8471560663418192e+50],"f\\":7497376474655529,"I^9G":undefined}]]},1.883323531409228e-139,true,{}]],{"V2U:L,Azqw":5257424598579657,"c8%!h6vqIe":"7Q[wHjO;./","fT3apKqeCc":["u",["Q","%4^tW"]],",|#;iEi=":8.169306680043746e-168}],"\"u5XgxD":{}}]],"",[[[{"x":[[2.9236185162773283e+273,-8591258985090015,"r}kPVRVW(V"],{"(h$oOZ":false},-6.402822688997619e-306],"hX76@P":undefined,"x?2se6vEy":[-9.864381856705027e+129,[{"(3":false,"5g{":[{"6":[],"yK&q Q#w>":{"`e$H/I`":{"(J[":[false,{},null,-5.852241455983561e-286],"htK2-D%H:":null,"+":{")B/(Y.":false,"sH)`en":null},"i\\9":"f )l+","qdf:|.'":-6540161519428035},"K":false},"I<_'jiA":{},"5lG!v*(":false},null,-6262758669989942]},[],{"l>JDR{[":{"6:qG0-\\| *":[[[-2962373126319839,3418531042203489,1.2897188185393724e+82,undefined,undefined]],{"":{"~_OBXX3TQ":3417687109185703,"#.*t%I9]Pw":true},"Yd]c{R4c":"","%":[false,true,[],null],">":true},false,-3918166873112553],"":-6152134534912068,"2,0kQ-ZJ":null,"Ek|e":-1.9182732894272382e-63},"@w|}+FOjZ":{"Yj7":"w\\GE|pqt0.","-i{DUp?":{"":1.6092132355097167e+212,"?Q4\"\"3\" [":3.8716813796823786e+34,"{p>^;JFV0":{}}},"j":{"7&)":[],"[7X~3.<t}`":"mG9h","A=-":"s,Um4Q","tS?":false},"nza.":""},{"n<u*AHiV":-948630301650532,"8/$BPY roP":3.0317084112921125e-129,"(":"^cKw"},["",{"":1.1810993892950025e+247,"0b~/?F&":"(ZSu\" c-O","89J#,;w=":6.157597209641715e+106,"O6C_k,Pl*":3765397813029669},"W*JFfJ,\\",{"{&>":{"N)d7KFAB:1":2.0122112782683556e+142," fWmJ":["JUK]-[Fdbv"],"XmmMVp[":-8412773764046065,"":{"lRDc/mH":true,"I?F?eeWGD":{"442v":null,"fe?>sD":-6.817113735392211e-32,"GyA0Xv":5023880260202537},"j<":true,"[A\\@":false}},">":7.035909487002664e+141,"0%}^)":[undefined],"?_SL":{},"(ve<(":{"nTm:1 >z@":7744323738563197}},-4091837332826757]],[-1.9295433542894497e+163,{"7'":":Gy)Ps\\>","~":-6366789779648848},[6894955292202317,"VL[K?",",-jut*fB"],[undefined],{"5b@)y":[-1.5434273661129632e-265],"iT:P1}t":"D9TI-8g ",",k ":["q",[-6.500920898727509e+85,"&v","yTwh#7"],3.992073693246941e-261],"[":{"ve<G^":"${.=[GTL","}":"~!-DO&-","Et":"BO\"","OQ2T24mV#Z":{"A^G":"1Ww9eo"}},"0'gE,1'.":true}]]},[],[[[],{"!u(>CYu":["g",undefined,2.0417546028615963e+142],"oDXGiMKhl":null,"Rt~f1Oe":[{},true,null,{}],"U?3g`":"2UcE","Qy~#4V":"[1c?KcQMd"},-761319993609918],"_h",[{"#":[false,["",{"]v>se":{"QR%Bci":false,"[I^C^>taW":"o","l`YJrVn":null,"ho:qA":{"f!{jCs*0":["cR[ak H(Wy",3.1741404342815037e+268,false,false,-1.1623746017162867e-102],"hf":"g+T"},"":[{"Z4{\\EfGJ":{"Wl:":3237334784601811,")Vgk":-0.0000024227763640998967,"sui":true},";V/:wcT=":{"2":-2.086617964621719e-210,"":5.082250659736424e-140,"K):&":-6448073018657169,"/Rq+Vbu<![":{"ff4We":3.0086216177094677e+227,"UenM5,;,==":true,"^0j8":2.5303067740932974e+209,"{{1F":false,"\\GDw`,_N":true},")+gJmZJj":true},"!1s":"x&yC}_z{"},"fd4QF%`9mN",-4.036026165965826e-114,{"LRG2>*+?":-1.2988415215913668e+299,"R41":null,"D5Fy1|vj":[[true,"KSB`",true,"."],"",5.2247577110410403e-45],"'E8U9]~?v":{"f1":[true,undefined,8.217788332922825e+263,7.1124648695282835e+239,-2.6677929484295945e-307]},"p+^ZWAv":false}]}},"=",[3.110467723133277e+262,-4.616691300371297e+39,{},{"@1qwfU?":[{"|":"'","^v":-7852853726866999,"  V":"Z!+!","aLf>b}9&3":3.3414870878941496e+263,",E$P":1.1827185032693195e+83},1483749120312245],"":false,"r}|}{~":-6367947284525572},"~aFD& Le"]],{"":["CN@;",[]],")WiG":{"rs|BH0":":0g~","2D":"'TFOZ","":false,"nK2KO":{},"c$kJQ*=":-5.828873830287389e-81},"z6H15.b":""}],"8+":{"$q\"9":3.361540668482217e+41,"R":3.1903786724075335e-232},"@jU":[],".CD1VD1r-_":false,"c":{}},{"NMd\\":[-1.5348853825706756e-203,"D'"],"COG_2":false,"n|8":[undefined,":mK;DT",{"dK8-":[2565092308204769,{"/bn?":"t","dq_L,j}zLh":-8.453412122576711e-200,"u^K D":null,"+h%NDik}\\.":6.588638422356719e-251},1.697152871080063e+53,-7.927941649805656e+29,1.25225927280764e+140],"RU":undefined,"<w":true,"/6":{}},{},false],"pjN-":{"R1hBQWZ.`5":[-1.158899457050326e+292],".j7oYz'{B%":"=(8A"},"q#B":-4.8485918270386576e-213}]],[{"4{\"1id":["C?yp",{"&:g.amoQlV":-2.598329052701274e-196,"":undefined,">":undefined}],"":[{"P4":-7.652990672586196e+183,".!f?l":{"$ At<yM":{"k":true},"zF0tf8":-7908530345411789}},{"TmiN":true,"":8000250189792697,"SX!=WR":4655224864323793,"AOi":"V","l{":{"P{7/-|0Dt!":true,";:FA":[]}},[{"+":-5143996733201874,"Dg\")CA":"z/a","":undefined,"=;N":[true,3089603715358847,-2159257248385168],"sz":false},[],true],{"~(uY|Jf^b":true,",[*ka":false,".*IJmk~":"Yu]"}],"nwS1":{"saa":null}," /C":"S","[+K|O 4Wi":{}},{"YJ]4Q":[{"d:|==u":"","~kO_Z":{"UD":"u>q_1|S"},"s{1o":undefined,"9`":{"{x=":[],"\"=XYx":2470553603528349,"ymt]gpD":"w!\"\"8a"},"*eun&d":true}],"Y-~8|sD":[-731252605634935,[],[]],"h@A]?+9n":[{}],"P(0D$@b":{"v:\"I_JA1":[true,-4687281952051122,"x)\"5>k.",[4.638768349186536e+157,["|G2lxAm","SGNu1",{">((\\F-M":{"I":"jqmr:","yhM":-2845820227276374,"{<&`.$":"i"},"B99r":3623633944500733,"@4I>":{},"82NZCZmm,q":3.130888825480023e-252,"E":8457539265237357}],undefined,{"K>[i":"Q"}],null],";s#Y{":false},"":[{"am:#a":8.455589836156972e-91,"\"tZ(":"SV*)068n@","|5":"U"}]},[[[-1557465967486577]],8312220048640793,{"<LB":undefined,"p?tyZe:))q":362276157085169,"jh<@lIy:c":{"Q&sk":{"Ahl _l]aj":-6.664911801150749e-276,"i+D(mTiWsV":undefined,"iI,HvJ2rV|":false,"A(MT.X$":{"2~p":[{},-9.470266266479744e+29,"5"],"}":-663094081471093,"b\"EDZ?":0.1264451061908793,"Na?GCai":true},"-@;oz":"5\\zx*:h=L"},"R\\B\\":true}},{"=":{"G1<1jF":false},"vV2 Q":{"v|4$<W?FDz":-3.6274687746515455e+43,"fEzRk":[],"F)UwENfnP":[{"0>V@7PEQx}":true},false,null],"Hrh~Qb~c4":5485864509349045,"f#+z(/b":["",375768127413985,false,{"9rh":false,"A%7A.>]EGd":-1.059447463408231e+24,"/sCEA\\A":{"`W":[7.686415774755019e-88,{"r%":[null],"o7vw7yp5":{},"A7?`h":[]},["`",false]]," NWdp-w":{">9#C|E":undefined,"6,iKG":true,"4}m[a":"L9LUeE%v","":[undefined,"oV:*^mp,","InxjUUUyU"]}},"}zvzT":5117068751531301},"H?D[MDWNd"]},"jrT%d":undefined},"}"],[[[4508177481646979,{"y'PYR1h":{"i[cxa^s":null},"m@&=V":[undefined],"!]&M0E:":"AMpAKu!V","PU{y84#0":null},""],"LfZ",[false,undefined],-5.331691592999667e+255],[{"{~+!SzhkL":null,"bJ,wi":[false,"{'X<4",false,{"#M":{"/vji":2694815461169561,"":undefined,"U":{">SB":1257204966155109,"K9p#*.}\\b":[{},false,false,{"{LE&\\":"^xg","J-q+\\ \"Be":-199785807936774,"8-]AmA&":{"^~":-3127451990109491,"jKik~":{}},"M$SE]ZB":[{"8v_K;":-1.0860913984070802e-241,"1ghIw":false},-5650314674439945,true,"w}Y!1",-2.2545638009092887e+105]},[]],"l'S!AB<QM":"g9X$6CZ]"},"E\"eIIA3":":%/+\\}j~W"},"":"Az<Y+U#/+ "," p30E":false,"9A":{"9":{"s73#l":false,"":"ckc]GRZ9!"},"Vg":[],"InSTdI":"MwEW"},"<m`Km6JT":false}],"yb}":4.335121797565009e-99}],[],false]]]]]]}
// • {"eE:":[[{"u'4s{$4":{"`?{/$^Sz":true,"|y)-$J":false},"Ai%":[[[{"5p[P<":[],"X5BF[d6&'I":[-4.447497077591872e+27,false,[[]],{}],"[waR\\H":[[false,true,false,4132248318901977,-2090683984718377],345356635062921,"IE?)Ykx"]},{"-jd-i":null,"g":{"D lxo>e1":{},"^":null,"m}-tBgvv4\"":",{*"}}]],[undefined,[[25464.107009677078,[],{"p>=C$ x66S":{},"(":"VDu[6","L ^1b_":"m+vw'bG","W6/#Y<RX}k":"v"},[-6402631443958135,[false,null,"S =\\Bg",undefined],false,3.165232537738501e-264]],{}],[undefined]]]},"4}+aOK 1n"],[[-3.579770834086869e-8,[3.0739318817560877e+175,":shJ&[v:s"],[[{"":[-5812142818391377,";xS3"]," fS":{}},false,[[6.847055047842704e-146,{"2h":{"s+`9Rkui":undefined},"\"kb":"","$;sTkb~IL5":true},{"[":null,"?.?":true,"%c<So":2900157900152457,"I|_I*~|j":7278237198968405},[true]]]],{"^7P5g:fC":null,"tUyF":undefined,"c":{"9rmPGGsa":[],".<{<":{},"K":[{"b7TzTH8":{"N1":"","$":""},"|@eKQBhj~d":{"H o2z/":"'t9yPf^U","qU0{ ADX^|":true,",hg5f#iu":-3.8554553632674136e+145},"%Nod.>&`kR":-3.244167202064661e-303},-7959633537957650],"%KpN)D$H":{"a":[false,[1959066425449485,["c4\\ '53",null],{"":{"u":{}}}],{"ld3nUu":true,"[y^jOv_":"P$ke\\",",R$#=-":"j/se"},true],">t":false},"1keP*pPl,|":[[],{"Vq0h3'Lz":[2.536920983255022e-168,"","yu",4907730603681109,-3384339191673958],"9ckE42GBgn":-4.849875463947571e-73,"bL`Im^tk=":"+~"},{":`_-S":[],"[":null,"P@%uyzu6m":"m1!"},[true]]},"z|oA":[8765634956778833,{}]},"1?\\Wfd9"],{"5":{"|t":true,"":"O<\"w|-j"},":psW":[{"2L)a>F=7Nw":[{"8.K":-4.6010019995309236e+60}],"f":"Qt/q$","dW_z[9zN9U":{"6":[901067295230603,{"-2%\\z5E~,":5.059223969363607e-206,"^x{H":-6056995300286835,"wz>*wvjT":undefined,"4,[Q:k":4.3455833533100143e-75,"":"{c5%0Yk"},undefined,")%0"],")J5H":8776391880294979},"`Gt{":true},[],[[1.2795788746182128e+38,{"@":"s","?6^J)E":".J","N~;H:eq":null,"^AhsNI2@5N":{")4|&tz'1*":false,"":null,"g?":null,"gch~+FUe*":false,"xv":"0{{>Yje54E"},"KyokQ~>":-7129402013811944}],[true,{"9":"iy,5"},[-7854464604463798,true,"Lg1l+DEygF",{"":-2.507042599193213e+66,"Gt#(+":"[-GzbjHKY","WM}":["bM~7'",[],-8077029564528900,-8632292307892538]}],{"NclnX$CP=4":"s/","e ":7.906890442788587e+250,"5\\":{"":[{"_Hs7^oE":[563392301983199,"n[d",-682307639389129,[]]},{}],"@3":[4.014442632953931e+297,-8094805317062595,[true,"8TI6C!M:="],""],"n/ eM8O*":undefined,"`bM[lAdx}t":[]}}],{},[{},{},"cnW=P6f%I9",{"AEI}KiM":{"!X4T0UI!(":{"Hv0V\"kK3m":")8_1",";.63l ":"xMtF","'":{"4":-4.603871379374832e-237,"w;":true,">UEo,e":{"X*wW9}z!":-5.777214362872407e-215,",":"a{Gjnq.Go`","r5s 3G":false,"TS_H1GLT":true,"ks":2466779662149209}}},"&Gvl8/j":{"+)":true,"c-":false,"/V?cf+NB;":7.918637963831566e-115},"#!G0I4DR":"^~","nJe0":-2.2801379704751037e+277,"iz#1bXQ":true},"H":".YMdq>",">Ii5L>BFw":5626779820959901}]],[[4425541798674929,["Y",{"tIGo{_":[]},7.319132553085687e+226],[]],-2.1864250881592505e-28,[{"@U.`c4AgF":{"?s>1":false,"b":[{"6$1\"B":-1.244632177785291e+225,"W\"iHv~m":1905682008947769,"DY6\\fYut '":null,"&":{"":true,"X:":")>%dV#Y"}}]},"eCwm$)rZJ'":4.017957990216278e-301,"V%iu0z":-3447460217926093},[{"rva?":undefined,"s2aK":"W)X/C","c[LqfJh_":-8311672821439533,"YDg!Hf[i":-2.2517348691386652e+73,"BZ_":{}},3035107183605129,{"woQ.`,]o~":"(E3aHO}"},"\""],"C",[true]],{},{"i:7%sQ":true,":cF0kv<":null,"82)j":true}]],"MB[:;C":7.863195999165382e+292}],{"I":{"U;pgC,.-S":{"w#nqM8}X":{"KP":true,"/juu:53O":{},"1wHL@W":[false,{"8,xh$O,":false,"0_kV:m":7.362480546664535e-135},-3.130704271670736e+39,[{"rz*P{N":null,"~QZg$":[[],{"Vw":"ooA:l?w"},undefined],"f?ou(YFK":false}]],"=M>@V'yW.":487799173485573},">f":{"ZgNabHR<y-":[{"/>p;[`U)T":["uSqV","ZS1@a<w)w?",3577727380511195,2427720552466473,false],"O_iPWO0@.":8683034086949939},{"S 3Hu G8Q":3.5340772865143696e-121}],"&":false,")Vvb|#GQ":[true,{"":2.2372309487339117e+32,"Y\"7":{}},[],[true,undefined,false,-8914984852580029,6157056829748949],[1.6171420540489554e+75]]}},"1=w7s=N":-6697182658599495,"x,N}vAM":-1.2436613669494102e+229,"XY}_":[{"^_w":{"V?<\"4":{"%7.,cv":{"&+%*":"|",":y":"KU"},"dFSJCAY`A":{},"":{"Q":"H<7);{euUS","":[[{},[-5214645760962029],{"":1.940703186204623e-101}],true],".":-2531256819769936,";dS[":-1.674152956027542e+263,"`oFS":[[{"euL62i:":-4607741691011924,"c1CE3yTgm&":3.970381633006074e+39,"Xc;5@Dz":"sjS?-,;W-","al'":-5202599688657882,"3\"~V9-hCd ":true},[[3.773693493863017e+236,-7951721385382543,null,false,null],-6313183481319748,"d",false],true,{},[5.5157285930180706e-160,9.6028992186835e+233,"(#w",undefined,"7rnEF)\"v[R"]],-6.292666516251153e-259,"+<",6952878119765029]}},"(t\"IX":3756325356630457},"'/N":[],"MUaCZ*":{"{XDT":1.2870987393394214e-291,"Wo0?S)P,<X":["<c{3",{},-6134204119564748]},"\\&nAq-X":{"J2":false,"OJD <xW,%":{"Tt%v":false},"$":[{"":[-3647238693004218],"CX|5":2155252365161047,"+bZ9XA@eFc":3200676748898397,"woc/cd":true},6458605924594769],"":{"":[{"2h%yX":6.125306318450413e+45},-4.6019972276722034e-95],",}8L":-8.430744472311159e-301,"VU\\3":-1071862026827968}},"":[{"|":5733988319138495},-1615991746092002,["J0au",-2742645191435355,"VXv\"ZU]\\",1.5094812476485164e+205],7758050422852913]}],"(35":{"b?Cu4]u?S":[[{"8dKw6":4256082564976707,";1Ep0lr":2.8011083197971755e-300,"lrafF=K":null,"Am&WR":{"%A.vwD":8.799840696578752e+70,"GwY^H7`|,2":{"~V'":[false],"mAW#":"d,@G","_$B`=Jg":"`."},"8O":true},"1Yq09FC/Nq":{"q?3~":5.741290461192477e+71,"JoUDh{sQKw":1.0772327018015034e-91,"4s\\":true,"AvFN[M++|8":-6.524216880359512e-207}},[8064448689812973,"1)",{")":[],"VKaOQ['{\\":-7.570488382915976e-147,":byrkA)S]g":[-6427118431396523]},{"oz@ax@>54/":{"6":"+","wH":[5.7599932130165556e+253],"sKcE>\"9&U":-3181600169015002},"Rh}i":-1.1798533416887459e+129,"h}9Kh":-7565988220162704},2089710528862041]],[true],false,{"Us]z038k>":{"^.HI":[{"$Q":true,"rU":{"PY+ 9":null},"6>?WxFFJ6T":[-1.5505525397067822e-114,[],595.9962416422105]},{"":-1950454351693732," GE@":{"7":6.108059724216624e+215,"":true,"]Efvj ":true,"!C}BrkN8l":false,"`=":"ho)d*;["},"Lw":{"106":false,"})k":undefined,"Lj;I2":"M^","c":5.164190097487211e-286,"+q?#cIG(SP":{"]Tue)*^[{":-4080625412593799,"_~V2f":undefined,"*`T-op;Mt~":6.598371681004221e-203,"I'>mUA/":4011382872285123}},"joGmB4<":-4.744570737367294e+92,"nZ":{}}],"\\F&2L|Mj9":2552836313999421,"tHj1L":{"6T<KJ\\P":false}},"qPW/=JR\"6i":["4",-2714254670647017,-2.1269522474791407e-247,undefined,[-1.0314685893928608e+244,null,5.427657800347252e+218,"\\U9ubf2qF"]],"ZZ>K 2V":{"@20(CF(qp":"g=&O'="},"q*A":{"Y).":[{"{aB8:fm":-1.7667134400656262e+305,"2o?L-7[Uu_":">-|O$S","?~":true,"ci4j":5152074922771775,"xDF":-8.243089392334845e+227},"D",""],"1S":{}}},{}],"y\"?oE\"":{">pd[YAE!":-577003147698974,"k_~\"":["k&lwc?",[2721388860999161]],"=ZR/}bvRH5":{"S2/Z<99h?%":{},"gMY\\.vk+|G":[[],{"":true},{"YB\"J2N&Q":true,"i@b:]T6'4":7.614580292024091e-235,"};$":false,"nZx2@F|R)F":true,"IB":undefined},{"EYl":-1.7719400397344317e+292,"*QWH9z/P1%":-3768808104874462,"F@=.2m$>|-":-5263490052645332,"84+Mr":false,"+kq0Jt\"kCX":-916213497616998},"oS`e(D"]},"dcMj":[{},[["ui[",-4583660501847999,"df7qN",null,8093134173992229],true,"\\Ri","\\^iV",false],{"P^YB$e":375137385926441,"M 3@":"b^gny/hK?P","cjCS`":[["mKj6",3.0018393292942794e-166,{"O$t5M\"6":"O{","#N>DE":1.150684273174057e+95,"C\\m@R+7%":[false,null,false,"_uz:HD3rO^"],"":[{"":{"\"G/7B-C>2":5265040978742335,"1AQf":8001328289556813,"S":false,"q":[-3.988950406661687e-173,[undefined,false],[undefined,"]G9oUbq8t",{"#p$WF":"","_U@":5.716459285030324e-240,"6,M@`Q":true,"iK;":false,"%a{tV":"{sd0"},"V~[Z|bd"],-2.5223987636249343e+199,null],"R?":{"c7iWbLA":-8.674506064291527e-94}},")C:<+}#":[undefined,false,-4.5275992410017327e+306,-4.481267619212394e+25]},-5793203574551209],"=F{aZ`u!@":false},-4.5862421156721876e+244],[],[3.4991123828638267e-280,["0yv"],[{"#X~NK&":{"h|=rDsG}C[":"UK","\\H@`":["TC<_?","~n*u<",true,2416532954645945,-1.9677947742481842e-146]},"G>?5Hs":[3928315446648.377,null],"Z":"6T@n$;"},1757810998094593,undefined,"ye*!"],false,"fT)4E\\;=^"],null],">2xRPOx#_":[]}]},"iB":{"\"(p[* ":{"Wb}?FEnG4i":"}LB)8m#"},"":"j\\D#oH","J(`FDX$4":[[],[-8706662260573544],{"+Lk":undefined,"Nr":1.3290979598710882e+237},7.200567819652244e+289]},"gbgxm~c$hv":[[{"P":{"rG":"G","":false,"[TbfMCXZZ":[false,1.389204413292354e+109,"$X7\"",-1.1790545380379632e-86],"Wk$":undefined,"j=IU4d2":undefined},"'2_!q_&w":undefined,"W[\"\"XQc":{"aB;\"bfs+S;":false,"v7].{":[undefined,[false,"bX([4"],-1.1396987200783862e+195,":`6v",true],"~?m^m%e":"f"},"V":true,"Lbm><78LX.":false},[[true,{"ccb?se&":2.4383520249624784e-299,"^bmf!GlzP":["OaP>}",true],"(8oEZ,,(f8":"i"},true,true],"A ma/j/n",false],{"$jc":"","uj4B{i=%":{"":[{")":2689194437146583,"HUYXT,nE":false,"S?kO2j\\z5c":" KY^"}],"0p`tE7vb@A":"RiOK{;u8o"},"GvT!":{"!LTS<z&/":6270329031510147}},[false,false,true,1.1662625933672876e+168]],{".G&K7l":{"a(4@":-8.717756382557518e+126},"~<xV":[[8259752487429313,{"~lL":undefined,"uuLs/dCB?":true,"gY$3ui (`-":undefined,"O":-7873375586166361,"s$:,<>!ud^":null}]]},[-4819025485383535],{";EkE":{"q\\/]S":[{"E[(rY<b":[7493368320443885,2.2266776179962833e-129,[-1198076553505339],-5019912265903107],"":-7518027098565179},{",GDmIai":1.5172099277026464e+121,"#8":-6781869528969606},"2o<24>&\\!",{"ANZ0":1.3789278277677552e-38}],"If$teNn!y":{},"*4R2sLOc":undefined," eUH/#uz":[true],"|]qF8W%6M":undefined},"[":-1.0363726893839376e-143},9.36383996768672e-181]}}},{},"NkLLV*\\7(_",{" G2":"&","cC}moeN":[],"?3h}C90":3614398241819089,"]QM)M.":-7882862781676325,"|&N,8{]":7447574117526439}]],"E2>":{"\\@CrC%":[{"B%)h":{},"/u4fi":6749556088765623},-4295054154308604,{"i":[{"H":{"_v&oW":true,"1QH":-3371401163783442,"&Rcr#&zJ":4.186605067617721e+255}}],"":{">t":"",">g_Zx:my":false,"/.]#}":6.26858746337423e-190},"lXhL~":["i@!i6t&",[[{"&LHX%Z40":[],"lc,LG":-2.7266788929753485e-283,"[G":[3980611640965.131],"7;rTo":14273055549.166483},"_.Q/"]],{"w 9u[2I":{"q5H>-":null,"":{"!oIr#ue8":[1.6701115677880958e+273,true,[false,"36.jVzPB("],"<Cf.]^xa s"],"xP5":[],"H\").l;3Jg@":false,"kF":[3102049581257245],"-<":[[-1.4932934835256857e+55,-61055938293522],{"A":[116681802.543275],"~2n\\Jl":true}]},",BN})Q":{",} lBbQL":["",-5431607115354784,5.77771395531596e-278],"wG5d":["H",6826488351228789,[-6.084656031468501e-273,{")^7h9C#o6":false,"]s":[5082498116922005,false,-9.540398684734434e-206,"V"]},[5053513375240557],["c",-8792633180017719],1.5999139308268175e+307],{"UJ[YzE":{},"i~-`;":-7580275485069612}]},"A}":[{}]},"ErTWk":[],"%nNSD":[[{",":8462097555035457,"!zN<V3q":[true,-988475988006610,".CM!<"]},":Ri`zCO~u9",["F"]],[[-3.559312730778144e-173,false,"L87Z",";S"],{},[false,"gWJ>*di2x5",7.895342723502934e+284]],{"bS| ":-723397479130975}],"w!":-1.6734038354405925e+260}]},"}al@y",{"Iu":-8.491894607576094e+52,"wT":[]}],"~q{":[],"I_Uosan<f":[-2.267933514500449e+300]},"a`R":{"m@EH.O#e":[],"UrSx":[{"":{"!9~&":[[[[],{"":[],"{UQ*HPiSRJ":{},"rIzS+":-8.191182456357735e+93,"_#p~Yq?":6.117581934901708e-230,"l'0o9y":[true,["GP0;",undefined,")EP~",7.056023998392506e+164,8.161283519409311e+232]]},{"@OqAm<k":"T^-H79?U","":false,"Feucxal@":[null,"Kke","9aijU"],"-":-8368098349364467}],false,true]],"*[TA":"d^","tw?":{"DVuw3":[{"k{d1F4^X/Z":["_*t_P","\\4`J(un",5641834293676309,"k",[{"708":false,"\"{~b%S<1":false}]],"M?|":{},"C-:;$@F":[[],"",-6.05513770829724e+49,["B5U8vxv","2Z"]],"Bz":false},[{"'JO!c$":{},"mywUf&":{"gLC":["}N**!g",2.6012914643997732e-166,["%)3'C",undefined,true]],"#cFft+|":-1137929513005836,"9_\\n":-4116547667737578,"":undefined},"LF?=,0(bn4":8.940405142252225e+200,"KckgV,KNfh":-1.7660833821086052e-65,"Co^dCC+-":[5001749978991329,null,1.1393343103272336e+238,6228645283066253,undefined]},[],".SH2p'd",-3584802710790466,false],{"":"S8;=&"},[[]],{"[2":{},"T}e[":1.7997981995860015e-31}],">-Ao4":[null,undefined,true,{"q":["","wJ^,Y}R"],"L@~2l":"+","6lk%wk>o'":undefined,"98.bA+":["g","5z5l')",[{},"ZBj[i"],true,true]},[]],"&>rl":[[8.659107118797093e+74,{},7.228943251636372e-228,{"":null,"]}2CK":-789298788304895,"a":[{"#":-1.9512201532568189e+68,"#l":[[false],undefined,null,false,[]],"J":{"s'Zzw":3947426868018479,"HcTEp":"/$FA\"","J":-1.0827292360883183e+68,"\"^e":null},"ZM":{},"X=Ph":3169570680685725}],"P$sb&^*]0":[[false,{"P5{hs":{"e_xd`Ri":null,"'(QA#Ra}cN":"K)|i9%","CrP1?P":null,"g \";uhv":"S'x","W(":"X"},"{41U@u":false,"S9+":null},"6'bi4:g",{"?;NdHNa/FI":[],"`T,yqK;":-1698960188662810}],2.6228184294012268e+97,-5494524898260582,-2.348280696959091e-14],"v)X~F856":{"E_":"l]h","5<X3es3Ib":{"":undefined,"#/Im/":"9s]5[fpwHE"," [Oel&_T*\"":[{"l^U":{"-D&R&.~0":"\"H;$o~","l|ie":"","oLOHCSFu":[undefined,undefined,true,-5218063085279633],"pR+Tz}[Fvq":4973301064733801,"+/E!RO7KY":-1766720477593278},"`":"=Q7N^SngZb","^^Md3E{eEU":-1787808960898133,"WB?5":{"HE=[3@":null,"":-1.0075269793418823e-16,"Yz-M4ZG":-2.4458243993166837e-59,"nHS#'giU":{"lmzn'Sl":false,"H^x:(Cp;":"","u)Dpq#V+":"*c","Q9H":-2.1937713217090366e-237},"cea3<":true}},true,{"i":false,"J1a%":-4.4293402129074237e-265,"l8IW@>v":true,"s^\\":null}],"B]|mar1Ytb":-1103246419799542},"f#":4980881358312101}},"_+"],[["fM\"=;:q"],null]],"puLPL[cf":{"Euv9!j5NV":[],"NpV":{"":{},"MC":{},"+2k\\":{},"Qy}as":[{"+Q4SD`dP&":{}},{"Pvg":{"mC?ebkNq%":"`5L"},"Gy":"/HC}TZ","qRCl,[?e{9":[],"F\\Kx":9.913824462490066e-54}]},"Qa:W^U":{".i}Q'WjH;l":true,"":false,"M=P]A1,":{"Y~D":[],"([qinY'Os":undefined},"1d7S)RPagu":{"_Y":"","":true},"N":true}}},"!?!%":{"-*9ei*wol":[[3.5907891943527437e+21,{"7":{"iE]JKSYb":false,"|g'DA..":{},"hOM[w":[-3.434713340378387e-167],"~=20ng":"","('\"gB1}[Q":-9.508302463398611e+242},"Z_)p%R5U.V":341457191605247}]],"1\"":true,"a4L":{},"6La9)wi7":5183006556418181,"o":["xM7]Ga",[[-7.207387648597147e+54,{},"~@!",[{"DPdL":856759373734019,"zJ":"","_#LlktW>47":"R:N6MvV","":{":7":[true,-4230724251548740,[],{},["})[%D","$(I!+",[],"yt76YWV","Ic\\QId-"]],";jGg*_h}":{"(":null,"$*j(rLl7S":1.905573240418201e-239,"XUJnn4S":{"TF\\$+[&":{"=UDy;ujQH8":null,"#19Il'e":"\\^CrOh"},"t 6*i0]T]Z":["6"],"V":[[{},"&K!un"],undefined,"a",false],"%c":{"RA6":{".":undefined," ^Nnh)ZI":-3700758194967746,"C;'8G":2.806397874478508e+74,"zB%Lei":[3829613794312601,"eBdf%M","ob.hP"]},"(N\"?oow/h":")"}}},"AA@`SItk":{":*<\\":-2.2517515730247623e+223},"V ":false,"LLHZYB:cT{":{"DU|qTX%!":[]}},"N{7j|QIq":-431976263.8308902}],[{"gk":1.3105904592187575e+188,"_":false},{"3vJGj`E.8":-4213617607486671,"A~\\yNx":{",]P>":true,"O8eV`,":{},"HIy)O":undefined,"#}7":112977004921225,"J? ;9k":{"/GxE=y-k":[],"']zB@":[-3664651286354669,4.6824842476586756e-21,5577815550480885,"l5-N",""]}},"`kE":null},"o{Q#^v",false,[[undefined],7700494883940847]]]],{"\\@);theb":[[{"v;d18hDo":-1935789986607382,"I#l6k(":"i","{#":["O",[1791847448207423,"b-b\\m",2.372109862968282e+81,-5549401585520774,-7779610736422239],-1.1034674297613307e+142,"aVL&B."],"B_":{},"r\"gy)<{":[-5334994637328305,[{}],"r}q=tY,}f&",[[{"9":false,"VqM-{ty[RW":-1665663198437519}],"w5!",{},true],[]]},[".tP*hD",7.65618309164983e-263,undefined,[2195172984866529,"*fG0+5e'7",{"Y(":5685753935529365,"(/7":{"$G\\^":-4535985055798631,"};U`":false},"BC}":-3.3937844394521992e-102,"D5}?S":378697574240553},-5216813355801695,true]]],[4.41226502169167e+157,false],-2.972204265301282e+115],"=2jIJ":7736681520463773,"*":62601408333745},{"q":{"LAZe:":-7672598828244640,"U{?wDQDu":undefined,"0epH@4M":-1786766752262508}}]},"K9w":{"rVZ{StZ^":-2901304840998899,"~d$a":[{},[[[],["z?E@a!tbA",{"Zv/r@D|C#":-5107132416836446,"2+P3\"t":"nS}","\\ph!vQ3p":{"]?hCnN$3f":2890222124864413,"I}n]V<^~A":"3G2","5k\"vY`@~qd":{"m&":2.1996410113543457e+56,"f0J_3fz|":"4","x=%W1":6840949624063095,"94\\)y":{"aM@":"M}C-W"}},"":";GY2)c!i","Du.0L|":{}},"8LUiFrr":{"Qg5'":-0.0000010881254177762079},"~S1":-4.4432602576554536e-33}]],-8826268793718528,["sH",5638432618135589,{"p~:yW&Y70t":2.4374578426732845e-58,"?$(>GFx":[""],"7 -@LdU":[7.259675570478992e-172,"sNJqU3G",1.1875071830234792e-182],"#<AR{:0":true}],"z11+PB)iU7"]],"t609%R9[Wi":"3#.@rAj","c(2)0?,&I=":[[{"":true,"`E":{"{IL%":"_yK","Zmk&\"H>oM.":undefined,"Pe":"]$f%"}},undefined]],"uM`":[[4380536743079365,[],["Qp:.OWIo.R",true,". !F#]?"],{"6DHM|?q(0":[],"0V6DYV'":false,"}2KO%TyU":"JJfcb","[+":"y,Z+I`olu!","tpI+?Asv3t":-195774923903359}],undefined]}}},[],"Nr",{}]},"ic-nRQ,K=":true}
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
// • [{"v!56":9.04706953546473e+137,"@en.":-7.2488213247700825e+146},["WeB","sT@wTo+vJj","IB1S_,",true,true],[null,2.8100151127167008e+168,"!j6>:",2.1514446993715809e+43,"]2R)hy%"],["6","g",true]]
// • -1e-322
// • {"z&Nhzz%":[-5.3192112419002805e-31,"KPc","|sD.+@+",null],"$L":[-4.139701243454471e-167]}
// • {"L|hZ":{"5":null,"~(":-4.2184257965655483e-243,"jKldvae":-3.887902006100109e+60,"U(bvLV5Q<X":1.267307532296178e-55},"o<|c":true,"< bZ] ":false,"wS,Riq}CV4":-5.298684866824531e+64}
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
// • [{},{"ၹ値佺ꯃ鼰熏ᗚ᤻":null,"ԍ늞垭쮛㢙":"ấ䞭⥫欚㧛","䆸덾騹㷽":null,"馿斴捇":true,"Ⴃ":"닚끂髙署䉇䅣"},{},{"씁둙㒿耥⻈䏾第":-1.962083886502571e+117,"‪찞":"︨콇旼","픜單ﺅꆡ㳫⎀":null,"":7.669854270085703e+270}]
// • [{"ࢁ퍿|댞浱犇":false,"":"ࡪ쨙㣶꛱","奲펿㩁ꊊ％⁣켬ڳ籨":true,"ኼ⛻얽榺섰娲ｙ夾":false,"꾖觲樼肨ᷱ崪빘":"ാ"},{"颖魍":8.509346019856899e-99,"껗":false},{"轔瘉":true,"ᰋ噓퉇讉౳Ჺ":true},[false,true,"䂐癷莶","蜄踊끘圆㉁ꂪ"],"₅ඔ"]
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
// • [[null],{"쐔峏ꮜ㶧㾆⇈᎒":-7.438916753144021e+219},-8.167496025794687e-193,-601540026865531.6,null]
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
// • {"腌ꊖ璄諰晜ᩝ鬬ᅗ":true,"":{"꽂ꥑ讧霵ꎽ歪䠯":-2.700259619933619e-181,"Ó":false,"嗒줹朗큶꡷獺":true,"춇菒":-4.581442170446369e-31},"ꈼ䭈묤︻⪭꽡":[],"ƅ䌬":["㟺㙰㒈♖暶ጼ뎲",null,"몖Ғ䷷ﾵ쪲",-3.2024785442153727e+50,true]}
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
// • {"0sv'Tmhu":["s",true,true,null],"S":6.210811001358758e+80,"":null,"B:<":{"":1.199634109927457e+93},".2Ja":{}}
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
// • {"a":[true],"b":false,"c":[2.714052930051328e+158,"rC)%A|>f","g ","@CfUH>y",false]}
// • {"c":-1.7242695920426168e-109,"b":undefined,"a":""}
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
// • [Uint32Array.from([3281742357,1338023626,3836558467,3268059952,4294967271]),{"~U;f@8":new Number(8.122454607691793e-132)},new Date("1969-12-31T23:59:59.995Z"),[,,-1.6e-322,,,,,,new Date("1970-01-01T00:00:00.043Z")],Object.assign(Object.create(null),{"o{Z":"5[","Tgl":"OSm+8lX<9"})]
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
// • [[[[],{"&bIKoG7_":[],"N/|A\\":"","g2Yf57C-[":false},null,[4.9012242311220864e-86,["",{"Suicq)":[{"5":undefined,"O":[{},[],2.0897751972426306e+257],"a#d49\"GU":-5861219495259182,"NGG":null,"}6ZZ~L=O":false},"^Qx>M>|w'6",5934247659843273],"cos%s.s|J":{"":{"7^":"!F}MpxWV","fT>S;h":undefined,"*i":7890698275323953,"O%g1":-5.789121411196954e+78,"x,yvI":true},"e2co":["",null],"Lg.;D6w)ts":undefined}},[undefined,{"a)EZ9`":[true,[{"(tO/:Au!":-3757999164837927,"hG\")KR":undefined,"mnwD":false}],false,4.0283696875728125e+77]}],0.00005003620097881509,[[[true,{"7T%\\":false},{"!":"5a$~I\\h;bm"}],{"":{}},{"ZV ":{"2":null,"#p'p7cl%T1":false,"U":8.372982918432618e+285}},-3174973144746793],[-6533361343232096,[[],false],true]]]],-5.683202308111601e+205],{"H`\"<":1.6718710769923281e-226,"/XNi]":{"qtS:":[{},{"k5zm%PXP7":[[[{"u< qc!.{":[",HET,BJ|",false],";*,9)\\jcO":null,"P\\G":{}},false],[1.4846488244873905e-151,"mkAE&s][h",5.482845277375955e-163],true],"e&F:7N","#^w1^",-7764702494223941,true],"LG5|":[{"oBIk":1504930012863969,"<Hy":{"d3Bd":[],"OuFBTwVyI":-8246152822891128,"/:":{"4HN;_ s-|E":undefined,"3&F":[[undefined],false,null],"2N5.ZSE*L":{"Ih:A6M^,0":"^vdD{p","HBqm":-4351124758151393,"4.>Fm!":-1542692451988883,"5~s":{"O)":{"cAcS":"y9A`"},"\"QfCi{y":undefined,"@e}>aQ.":[],"C":{},"Z7~y?i8":[{},undefined,5232718572590989,"uYny/7q0"]},"Krs4<o ":5.874325267825042e+260},"R":{"`bmEt":3547280851260995,"kV9)Ly":8309122518398067}},"q]ARU6":[[],-4.667092045238725e-25,true]},"M'*z{c":true,"|^XbBr`$C|":[[2.46136196338935e-241,[{"${oUe":-971686273392712,"isCflRd7t":{"q/m":["&*M@mQ&O",-3.4541667054588784e-253,true,true,-5.736750629823755e-131]}},undefined,5808855100642261,null],undefined],"`1luj"],"ql:Y.qy6np":[[undefined,-8649278814548938,{"M8cb":8916000174940913,"tffhD":true,"":[]},3.3826998452340853e+159],null]},false,"B\"HI]/Lp","M/",[false]],"":{"":"!B9jxAK"," }o'%!'?":[[{},[{"z=Q`":null,"2h(":2099495256660961,"{>jQ<H":false,"7<u*|*6#f/":false},[true,"iJnncg{O\\z",-1.4632341458348534e+54,[{},-3.5371952391681625e-28],true]],-5.5811995895977765e-189,{"Es_C;JK)#":{"#s8_:^Ab":{";|":[[undefined,"dN7v=Zg5",8378893232767477],5258997571089833],"":[],"\"`~l0":""},"[*7h]a":"q?D","T4l_":null,"?lO/DY":"Y7Nq7"},"Y>iLsrRo2":false,"9@F}tTuH&L":[[undefined,[-4.129204412022915e+167,"JA","CteW,Yp",true,-4.9631749948563755]],true,["TTdmqXmWo",false,-7.592610327041735e+155]]}],{},{"RA":true,"4X2cd":"2\\)g}","nq s(L.":null},{"":{},"\"":6.237902521560552e-151,"_":"P?Lv @~}Y[","#v'6 XG":"p4HgC/:IL9"},2119431673376725],"\"$@a!{j;":true},">,\\=qy0v9":true,"oifHTm":[]},[{}]],"VYw":{"|9 [A`qK{":[],"I(z_":{"+.":false}},"w":[-8631433092572175,"?`c",4.621115154537531e-255,""]},"?~Y|q2iL":{"B%cV>]*3":"`quy","=5r=Y":"S`8hFpY ","+uNMnB":[[{"<?":{"4yd":-7413856702458244}},4.1716467744742795e-260],3532302542652237,[{"(xps":[8.229235158107716e+152,"Uzna09j/"],"Bq}z)xUD4":[["*X{qG",true,false,-1.4204332210241904e+152],{"Y.%MOe4TV7":[],";":{"sSDXHx{YH7":{},"":["+3GZdz0T","{pwZh:",{"+":"k|Gn}<;Zb%"},{"f":8.448678683732168e+148,"-:|":false,"{TYn":-4.450390198532036e-290,"=":{}},[[{},-1.4115477091045967e+301,1.1682119726853664e+120,"b&jv$rd#|","a\\9&a"]]],"o:o{:Qh":null,"@B/Fxnf":undefined},"[e":-5.979556635542985e-137,"J2":1434274010924193},-9.793216140771267e+263,{"gcHA![)":[{"(n8Vdj":true}],"=\"H(":-7918947425197370,"A>;=#.HX\"":"JsFL}Hc","Y`_0":2009228862854905}],"Jz":"%Y+fr","U4/":[3042952166880865,null,{"9AMbi7a":{"]5Fw":true},"3dj0mJk\"":false,"q>i#U":{"fh<3EIAX|W":-1283106122602594,"|xk/&To{m":false,"::":3.39737004091232e-293,"Dc":["v{",{"N":-1.2205624134927076e+24,"{7+hjy/L":352641417395129,"":8754888354229921},2.1334721387803907e+90]},"cJ[2e]u":{"wv8be]x":4545904681987423}},5574438931216709],"*D=}n":{"yV'W?(WM":null,">-Ph_6u&)r":{"vcP0Xx":1.935989064238697e-279}," E":{},"n-@5Rt)":{"10WXT":"#_B(VPzd3","!#UX":{"l":[-3.463776745509408e-295,[undefined,")^pw-TA;R_"],null,1.044871922397151e+265],"":false,"MH,7Jsp":[[5652907072611237,undefined,1.2167110551066569e+172,null],false]},"wf<q$w7!_":"OaF1Q5J[P}","D{[4SN":-4.3991543695660825e-88}}},{"0Y8La":undefined},{"":-7.03655323779012e+221,"IcvA*Uo":{},"I0|J-":{"UdwF!:i>dB":2657010160520177}},true,{}]]},"iXE`xrF":[],"l&":3.76447327291821e+269},{")^U`R[9B":false,"i":false,"_5:Kawn?D)":{"$Qyb3b3":"","pg}":{"2":{"7&X":"+@_{kP:Y","g+@k":[{">4*IUxb":{":4O.G":-7074372423550829,"X'rR\\*y":"X{","W":true,";?UKsx7K]/":"s`d_|I_\\","#j<fV(6yw":undefined},"Z":{"`rk?k*~O~":"K*","!&=":-8763382843630548,"Y^IAF9Vf":[null],"5cw5^":{"K89v|8)L:":{"F":{"{@":{"ieZB{z":"","+H<R6.@":"p"},"e{]#~8+":123974732775373},"4C+r#R":true}}}},{"k|4rh[u9":"","fPAm":null}],"<w]":[{"HRklX":3.323485868644894e+246,"*UA6[Z":{":U,V)3)T":-6.135092454749706e+87,"z&yS+M|:I":"",")N1P\"n$1":{"":5331536069385389},"E{>v^":true},"|g":"kcql^CX"},{"' km[3b=xA":"p ?`(w~(","r0\"J!/":{"z*":true},"U":"bqWc{a",":t&G^":{}},{" iZY,.D":"-,$o"}],"8iz+B<VwDx":[{},[],-8455698325671885,3.441229517337065e+157,[6842141474319075,{"J/?&f%'":{}},undefined]],"Ug3e*mv&":[{"V:#H2C":{}},6933142021693269,6959999198471265]},"y":3.477658402517628e-69,"":{"^L>":["s"]},"[I":[{},{},"N?,F6U+",[-7268010926642498,{"i#\"*1":4.397336891513713e-114}]],"H":false},"6=9":-8846550106711402,"^)1}mK":"L?.b$tE3t","YmN=&/":":`O!yt"},"":{"GhRa;F -":{"dz-W_ux":"ca*Lx"},"0%Aic3:>R`":[[{"AX`7PsWa8":[],"\\0\"{a=]}":true,"|3J[":[""],"XH":[8.690271207174801e-160],"N)E":[false,false]},[[false],true,[undefined,"cN(Hq}"]],undefined,false],{"@2MO'":{},",hP9kH^O":4611823815967497,"Hk0":7127388519023369},[[{"gANNARI#":-6896678977833237,"":"t<6.kN=TFo","rCKU;":false}]]],"":[],"*_iR":[-5.070357128512908e-150,2.7467819652755695e+236,448139828465399,[3.765405129315042e-249,-1.892389313318622e-136],undefined]},"~f('0)x*C^":{"*#{-":{"$(":{">u\\AOl":[{"6":4.292320837266848e-282,"oV4u#|p0":-7846861365743666,"ns":null},[2.2106614883706737e+104],null,{"j9":{"C#4e,:h":[true,"\"T",[2.930164470479706e+188,[],"~_"],-3644219488822495,5360185015657327],"4U<m":"^pA/,e"},"":[true,[undefined,-4723628080999160,undefined],undefined],"N,=%0&EP":-3865136530993273,"~>s`jC%J":3.70033701307325e-251},{}],"vBSA)Z!":{"$@":[-6.333957553376249e-296],"jX[D&Fk[":{".R-ue'X":{},"x":-7758302697139715,"6On1,D8@P+":true},"":[],"&p.8YvSP<":5344054969547089,"m*=W?.PZ":[undefined,true,{},{".WE$":8740896432703703}]},"1S/`ng?":-318473669.8686091},"A\\`N":[{}]}}},[undefined,{"^s~tXiS?":[{"+/gs5CRg":true,"!6NZOvx%x]":[false]},{"JyQB;":{"1c[^O4":[-2920540267940955,{"@n?jz":"JEE~m1","(+Dr6O%/.K":"","q":false}]},"?'08y>VN+":{}}],"I9g*&n#ijj":{"j}[":{}},"g<e+ZK2":true,"":"*K?616"},{"mN#YX9[":[],"Lv;h7522b":[{"O~DHXy{x-":{"cV ":true,"":null,"-":{"/'Shb{":-4660948800322518,"HVOOj/":3.7967570025898074e+149,"":{"e(>ZSWZ.&":"0td}Gmer1N","p":{"NWF:a":"yj f-A3HDH","$8%)":undefined},"o#{":-3.930157114433976e-208},"j++w":1971911251496037,"~zmXgP":undefined},"Z7F\"x;5[":{"KaS":3.299420254569047e+198}},"W&":{"_A":"V@A_"}},{},{"":7.621100896304419e-196,"Ycg]|P<c@":1197310306123465,"WGOFJf+":false},[{},3.516269644585437e-53,[7.081026410957603e+107,[{"gRr%V":[{},undefined,2.7606359423451426e+301,-5557481694411222,false],"/r":{"5":false,"rWE8lb@":-1.1796754608438176e-11,"1[!$":-6.357649320965825e+143,"-":null},"L{ =|":-1718112503852364,"pVv\"":[-926182426165835,{"S<hKG m4":{"'guAWq|":"nr9ofVwX","~+2q ":1436749928907571,"Oz{I":-5701833399083308,"9GoORaa+f8":[],"42,7$ ":"8T~:<"}},false,[1605669809764197,-1517781331631796,"T#\"WR4yUj.",8449503825967803,true],7747832542494961],"?FSGY1U":"\\"},6422620948613837],null,"9<@lwXeH3"]]],"":[],"q":{"Y":7592545617274845,"$":["Xkiy,?0jyT",-4513669585076017,{"k":-2.98059699174343e-66},{"aO=B ":-8072554226764832,"Kc":{"GRP]_":false},"61)Iw`}":{"?+a@d?_":5007341541147887,"K&Ajh4L*t":false}}],"HA:>tY":true},"`>u":-481957601863211}]],[{"6":[],"H&$Z~1&-":true,"<":"'"},{"Z&D":[{"2s;A":6578161815675789,"k:PLub":{"s&C7=":{"":"D(|(U","d$I@,c`":"G"},"wxz:":["I I1a,@)%",[[],["e=cTC\\][",-4.698002252892508e-176],-1.3424254208472768e-25,[false,8535218927194993,"Z|RVV6"]],{"3":"Sly)<hd\"","z5`?gUAMq":-3057688129677860,":Jb2_\\z$I":false},{"T<":{"0?'Na":{"e&":["!(xIlae",undefined,["c$Cw&WM{:J",8039374471891809,-5.314705526089472e+184,null],null],"iH:_5l@uow":{"":undefined},")":"{;&3v@"},"u K":{"?GATPEx7L0":{"|%":2.815146309209686e+284,"yp]\"mi-S":-1.313418870667539e-78,"LS]":4199863531631697,"*|-@2":{"UB[6M-":-3583690682583440,"f`{i&`":"gEErmO^|>","":{"G{V":"BJ7GH%3Rb","cm]n|i":{"a\"8":true,"vC?-eY":[null,"J;z^",false,"AU_-\"CiZs",true],"m0$?}":1.8033441742656307e-252}}}},"%QgvL":{"T8v|O`Uw":true,"/Q":-8636078288798624}}},"TAkYm&Xmj!":[366195410978633,{},5763716107996561],"3vi":undefined}]}},5.929258166565061e+240],"Up!%#":{},"&;~U3":[{"":["I}w'$","o82EF",{},[true,undefined],[[],{"E\"{Zq":5972784979038695," u~6gNE{jc":{"":{"YG":null,"b/\\":{"9":"","@X[tuke/;D":{},"_":"[%K"}},"7|S":3.0288990822114878e-248}}]],"'l;OYG":[],"=g+0O":[{"":-1.968458012519437e+47,"MjM":-8.887579195166373e+290,")CB":"|3","I?Ga":{"OR`xBkJ}~":false,"4?a<:|":-9.341326031227575e-277,"=":["2~&*ON."]}},{"h":[{",'":true,"(RflC":{"{$846KH":[["bh-STW1J=D",false,4357305503475103,"",762907329051267],{"8/M_rG/":null,"%`.wcS":{"x>IOHc<f":-1320195059737548,">+6z":"vsD.Ib","MYf@":[false,4.817634429787768e-134,{}]},"|o<~I@V":5261548163309609,"p":2.050684196509975e-194,"?X|x:?":false},{"ffK":true},"?z~nIBUSp\"",-3.9558308680369677e-140],"DGf0":{"W/":"bpJ=y9&)g"},"SA&?-n=":[false,{"a":-2.5762304417530904e+205,"fIF8@NV":3.2363672006709876e-134,"":[-2492124543090424,null,"M"]}],"C*DT":"cx"},",3":undefined,"@=\"|":-4.6894460150863026e+269},[6471632975846593,{"3":-1651898718981803,"GNUB":null},true],[[{},undefined,1.686075228018e-94,4955754769209093,"90@eT"],"K%>{L"]],"!_fd!F/W&y":{"E":{"-l8Q67":5245812702699605},"":[undefined,"BrK","S[~]LY{",8206701789495353]," UB2_":5.8494252014741795e+249,"^rMSz":["k3T","g6_z.'","v,{,\"J"],":O":-2.1512045075571898e+170},"mZzdmM!D":{"v":{"Y\\Cr":true},"O7":true,"zyx^Av":"[/iGXO@=\\",".L":{"KH|\"":{"~.{SVP":{"JpgX4bB0b":{"w\">sXx":-8054964369494104,"(<=":true}},"":"",",;9l!6m:9":false},"H&o*Wx":2.0354442634665704e-64}},"%'":-1.819257771003214e+28},[{".6":-9.083503148045633e-182,"^^G":{"?&_":[],"0fl?!.":"+,JySJnM5","fFMM":{"x7zho@V*O^":true},"`x\\":-5.97836055363617e-305}}],[{"M&f-8V<9\"o":[-7787561604318831,{},"dl"]}],"|%3$+A.!"],"TI!u":[{},[],[]],"f r":[]},-2.9400302127610542e-198,false,-5639297943293645,"\"<C:>dp"],"iOyL/":[-5.251271539280282e+258,{"i!'],(71":[[["08",-1.1347723589241378e-139,["$*{aO) Oi",-6.9983064464930405e-186,-8759141420749716,"P;K"],undefined],-2.2375905853574756e-163,[null,[],null,"68|CZD<YUc"],{"Y#":-0.0000012888662517788035,"]BYI7)0;":[true],"Q9fB":[-7873523500199802,false]}]]},[],{"":[{">y":"lE","^`f\"c":{">":4487086786923313}},8858714483760077,{"2bU+k":1.4594230614717794e+280,"":""},[[["(9ePVZ"]],""],{}],"<]FyKH }":[-5283755720708911,6.520228503940209e-193,{},{"vOA":{"sakok":{"JDA[Mi=Z":"_*TC","2p,":{"|g":"<Np\"0imW1","0\\cp":[true,2003728740356027,8849068797311485,-1651220047371317,false],")TN;W_c":false,"g{qYfOfLOr":"eevyc"},"51l5Sy{":"!Grr,cC","d\"Cvg":["x^^Pgqv","~",{},true,false],"-Zrd":"C|}9YU"},">;@X-Dy?|V":-3.0324898478687565e+157,"sE\"":-1.0081439535222407e+210," {g":{"Zo":"NT*1(","3$Z":"6r="}},"5K\\":{"Tl":false,"$@":{},"5FR":1.0653555142822673e+214,"T|Ixc}":8493824710717365},"@&S>N":{"4":"co<S t5",".clNjh9w)_":true,"Z":null},"\"w":[{"(_xP[|/h4":false,"\\2m&E%5h":[undefined,"N3w?~(ZC2/"],"":"T$!~9ax5_","<":false,"X2YNH;oJ":false}],"YFxg5EwO1":[-6230665049390168,-7732527531966787,1.5929042242273627e+128,[{"":undefined},"6J",2425628190447651,true]]}],"> 3M":"","^ld;v#HP":{"-sTK\"`":[],"<P;":[{"bHbl,B317S":-1.7231659943567417e+116,"^6<(vQ":[],"J/":undefined,"P:J>":-7537597283588900},-7.855362521650136e-38,{"":-4.500376279955111e-295,"%R?1rQ&\"U`":{"}*0}{{AIlK":-1.8172555672101217e-230,"4K'/XjoNC2":6193424124230091,"{#/}":2.605025878191455e+38},"z[":"j;"},true],"v":"-&n^{k%jHt","X]":">V>w","a@bo)":[]}}],"5(:6TH":true}],{"tu%(":["9CIw",{"eRJ~8zo8kz":{},"\"Wd1y%=F:i":true},{"!c Nfb$j":{"f=kd P":[405420784282989,{"J\"O_8r":"1wRo&}\"","":"v-y~EwSwo","hQ}{^GQ":"QT]~3C","7#jq^!":{"+eM":-2.592839733087033e+289,"u<":true,"lWpJWa":{"D)":"&<"},"9H":"@{e4D-Fy","Xj1_sQej&P":-8.61581033512413e+167}}],"iZ{0ER20A":[{"?,-2":["mE0A_W","C|}wS",{},{"'8|xKR7y":[{"WDJ?II07o":[8.508753136274952e-125,"6-2P,C"],"e":"|Zs\"(w3`","uFN":"x~K"},[null,"K.ek","b0N2Pw<("],-4.9851546562512966e+89,true,7.351043208787483e-77],"Jv":[[],5.6280911814549966e+54,-8619273923226752]},null],"":{"":undefined,"f|H-[_Q1*v":"w'oSRKYP;","HZO7":true},"/x":[[]]},false,null,undefined,-9.721700968240016e-135],"R6y]Q#<e":{"!p":["MGV?_Hc~",["C@-, ",["^I/]",-2.46945756366707e-225,"."],[],-1.5883723659773578e-112,undefined]],"?iLy.fIV":{"\"oJ9^fH$-":{"2N":{"e":8581616287482217}},"{Dv,":{",3q[l{^":"T.2_",":xt3^H6wj":{"_]{YM":-0.07301514271002112,"&9*g":null,"\"pa4u]K.'":1500330293128617,"-8sgoU":[-2132787056213818,[{":":953614191307697,"":-1.6233764122800746e-142,"?":false},null,"\"j]<Z%"],5408256264808615,true,{"/4P}<oU":{"|aQ zd64]5":{"=<|g@":true,"=/a$3P":-2.2060481862465423e-214,"\"U-ncs~=":8.576385219729376e+214,"=K?]}ik":-2965112962971438,"$TRajV":true},"bV}FOu?a":{"m-rW":-1.26101430205245e+38,")$:[Mh`BS7":"Nv8","@=G?l":{"'p.ew":undefined,"-#?zW":7306922610807745,"`YyZ":-4187229685436794,"7X3OhkJ":[[true,{},{"XpGt":"g~pzP\"0","~aS.U":6.3149385668291585e+227,"":[],"aM":false,"9kR":2.094044452223287e+297}]],"QL: /#":undefined},"%ktl,e":";^d)m\"M $"}}}]},"n":[-4.827711147860226e-98,{"@":[],",=8 2_;":{"e7V+y!u":undefined,"^[rv":undefined,"":[undefined],"N!Gp":""}},-1.4021507850673122e-157,true]},"98'6fnv{C.":"+\\GL!J|x7;","Qm!\"O}65|!":{"J]h;t*5.~P":"\\TDj"},"\\:/xWXpB":[[{"":[false,false,{"vmyy/=Ls":"W:jG"}],",|K!V":-4.226930884828648e-26,"RIf":"r?aP$","N~(HM%6M":{";nP@I8":{";ch(?xH":"]S)8_"},"f^dH":[undefined],"W-7<t":true,"pJX":[true,"Su!wM;Gl$"]},"#\"edYLNp%/":null},"j4Z?K>"],[[556799200655165],-8650984796079823,[{"LI>":null,"6Q*J@2.r7":{},"gO_fCFX":{"sw7qzWpK":"l}Ylcn6","ot/.J":-8597862401839117,"poB:":undefined,"*S%Y":335195496163039},"L0B":["Kk\"hNZ3hf",";<+G0-",-7874896413546543,{",":"4E@HS,W","":1.6961627059985028e-295,"jY":[9.948105319423375e+282,"hwh&8","Y_*1",4761225744246223,-8.528665664134025e-172],"r[!So":{"2Za":["0r^%'KvY",false,8710580131796757,"="]},"[4BM\"":"S_L5QIA:b"}]},true,{"":{"F1z.'-..~u":[false,-3.45152239246663e+118,[""],"d("],"(1_ZhL":true,"j<VQr}?":4.222315707702817e-274},"'.":5752695093530013,"xc}?MSVpJ.":[{"F@lW`":"%sAPI",",HJ\\(":"P"},-5.720801785946491e-54,-2.623964040535371e-55,[{"mes":"*y aJ","+@":"u2?","(8g:lL+":[],"":null,"SF":true},3.1015041509595854e+55,["OL",-6289427032028599,"k"]]],"uBE":{}},"",false],-7.980489323372913e+37]]},"&SL\"":{"Zf_$":[1.1810850391279018e+306,"SMRy%MT","(XJ","W"],"vtVB":false,"{;jb":[{"itim'<Uy":{"5c":1220592212618805,"@+uk@X#":{"":""},"NRNcoBc>6k":-2.1453570342398285e-259,"/":1908705008752629},"!nE]c#*":{}},382725248210181,[false]],"zR":{"np/jQk":"q!d;bh6","#":{},"CQ\\zT":{"KjYP+":-95.61225260453907,"":-1.7892168741228414e+46,"v":4412331572109937},"glz+vTr":-1.4681078906733182e-40},"U9JLP\\":{}}},"}8bD":"s)zr9","Gln Z{":[{},-6816732287264591,{"yu":{"fhs!_-Z":[false,{},{},true],"Rahi[7<u#H":5.112172664432472e+118,"":true,"6HR%4?/&W6":false},"WuX+>G|":114574407658477,"M]w":-7261304506493148,"|Nl*H2*S(l":[],"":[-1973362778435058]},true]}}],"(S;Y]n(":{"Oc(7&+H":[],"phkXfK>xZ":[{}],"?Q$y;'7":2032377851181651,"F":{"~Ij*":{"e#C&I-O":{"#mLsV^vB%x":1.461654624914205e+211}},"IMh3z":true,"UWtDn":null,"[J":-5222441772921045}}},3.3043588276793886e+116]
// • [{"ngSe":-2077051464454645},[false,-4038212482942537,{"l5zuK":false},{},{"L=S'XnP":{"Yi={mK\"":false,"ApbF(EjC":{"O_DY5":[{"Y_OW":-1.2303461185856603e-285}],"dSQ":{"qN":{"d4AL":undefined,"@6}+x#":null}},"`7S":3.3117151001445056e+279,"--nd&2'~/<":[{"S^3rAM0":[[null,{"<J#qvV<c":{"vq77":"AU|9>T","0B^&2B!3":{"]3Xq-#K+)":[-6260561492609564,5662192708373733,[false],{"bCk9Ia\"X\"":false,"H*N&{ba;-p":undefined}]}},"Kq5}V}":{"y 1Y+":5.633538957703262e+139,")?":"oY","m@tR":null}," NJ":false,"$":6452078229874177,"(r8}$":-3985185555250375},-1.6509992871149431e-257,3303927111148551,[{"0zfbl@;xBN":{"u+)q!xG3k":"","Y}J>y!n@":{"gX\"r-}m9":true},"$:hJiYGM":-3921765975747558,"j5X\\<v":[],"Lc\\6U}":{}},"W":true,"nfCE":undefined,"r[huN^[<2":1.97271717135988e+261},[{"gfP f.":"3","|M[":[-0.0003832044822771802,-2.8568816099520264e-100,false]},-6329880083561390,8387582887338233,[]],2.8511727138146212e+262,"'=2MG&l",[[],{"fo{}6ll )%":["=]",{"O":true,"":[[null,"UGpNF9g",2.378475751827879e-107,-3.5692715861994763e+109],"m\"i;S,/7",1.5986013983554472e-67],"PZ=0gye":[null,-5.5198468111101496e-300,3543303603368167,2.858089904327393e+32,["jh&-' D+X",-2.1380032005105025e+151," V,",3.100511999255206e-62,[]]],"\"9SbN":[-1.978962726210639e+249,"{8`jZ"],"A":null},-7915509142775328,-8531390561251548],"":-10348.383905253493,"daQLB9[)?7":2276452204135965},{"Y!P|r":2.089261741201411e+59},true]]],-2.2550216083517756e-29,-3494064432167105,{")eve!":-6092544649653809}],"":{"":1.022346203405067e+145,"?Z":"M0?*1MeH.","OAJyz!E":[null,1.8620486008867656e-160,undefined,"SN:yk","\\M\\aA{O>g`"]}},[{"I0C":true," .sKpK":-407101297538637},"HK&TNy,x+*","uXp9SBm@",[4.162460270230247e+98,"M+>swh",-1.8255028013785822e-243,"A6a:+",-5.225032775016773e+42]],[-3.7653679351018314e+155,[[2.9936851926998917e+69,true,-2747277931790456],"@",",:Q=","2Ar+os",true],undefined,"Lh^!fX"],7.286311010239187e-240]},"&~+`":{"-i":[{"'YS9Bf^y":[2.1115126241625812e+49,{},[{"\\JQP d]?n9":-8.458257065323982e+111,"XZl<zx":[{"sRr":["g4D(#mAj-",-5.157284759604535e+56,false,null],"":true,"i":-7953495312703058,"8'%TMf(\\;4":"8vwO!.l"}],"B/8tdfN":{"&`SH$~T":[651082667214555,false,",[\\TS"]},">#-}":{"F3":true,"NC":undefined}}],1436395965442153]},[[],{},[[[{"lS<S17.hkc":null,"!M":true,"wG<Ep3{":"Q"},true]],false,1.5155877617889843e+223,[]]],{},1.494808830853222e-176,4069177987085121],")Uw`(K&&1.":[-5667452365118792,{"p/SBm":true,"\\yy0":[{"6b ":[-3.5646952975199412e-155,"q",{"P\\@PB`2B":[]},false,-6509023889461594],"9e[M.!":{},"/\\Hy%Hc]":-7.551494221225346e-88,"Ko":"P>,>","]gK+%":undefined}]},{")$OO":["",null,{"OF5":-3.149842393780507e-254,"W{":{"VPbJf/VSr6":-3193038923559529,"w+AFd":true,"":4.941137082391009e+159,"C@&bO#$N":"/nDp","4b":""}},false,[[[],-1.05763778110677e+167,true,2.8873719365067984e-183,[undefined,"pC,K'","B9:",true]],"3%(jiwuN~y","~ n?_i",{"!Z\"&S_":[2725561345537201,[{"":"RVM!LA"},5.955471852297331e+145,true,{"EQ":"XuvEwV}2b3"}],{"@}m75`?7":{"+":null,"@?QyU":true,"+1/#fF":true},"v":9.949177131961071e-55,"o":null,"K&tM{s":6921453670933473,"T4dXiQv":["+M4&y8%fz",[1.2949086238351651e-269],3675967604878293,"yH;UI< "]}],"-/u5D*.":4494561644622367,"Dy(u%o7aoV":null,"5h":-2323044851336178,"WRhv<Uoh0":-618980885653785},"/Xp"]],"{/<~":[{"!IT{MlB3J":{"La8Dm":508864750386037," .8#Pl6<$":{"t#*{~KCN":"CV99|:g","@J7IHIQ|z":undefined},"qEK":null}},-6590519219527653,"rK(+pM","BydJ?Z0"],"PZYlzfz":[true],"v/f>":undefined},"=8|UJ/I9!","E"],"<#;Qca":{},":>)='rk":[-3.5751536056889245e+254,{"}1?NMq":{"":undefined,"FrTA|":"vkNnF#Y"},"SV":["PxsV!w"]},{"C/C ":[5786222432527821,[[{},[-1.9574218555358894e+203,{},3.158889391194429e+78," "],-1.1278639405205659e-267,1.6890552604361564e-37],[["h]P7"]],true,false,-7224842072790206],1.7277493918301825e+94],"S';xkf":[-1.853455325029994e-54,-2.2332727248960647e-172]},{},{">":false,"ZI-":["PP;",[8162149508442581,false,null,false],true],"":[-2273138926628731,2.318388316885818e+136]}]," -\"<6":[]}}}]]
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
