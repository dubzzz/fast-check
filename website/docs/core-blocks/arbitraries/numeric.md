---
sidebar_position: 2
slug: /core-blocks/arbitraries/numeric
---

# Numeric

Generate numeric values.

## Integer

### integer

Signed integer values.

Generate any possible integer in the specified range.
Both the lower bound and upper bound of the range are included in the set of possible values.

**Signatures:**

- `fc.integer()`
- `fc.integer({min?, max?})`

**with:**

- `min?` — default: `-2147483648` — _lower bound of the range (included)_
- `max?` — default: `2147483647` — _upper bound of the range (included)_

**Usages:**

```js
fc.integer()
// Note: All possible integers between `-2147483648` (included) and `2147483647` (included)
// Examples of generated values: 1502944448, 888414599, 1123740386, -440217435, 19…

fc.integer({min: -99, max: 99})
// Note: All possible integers between `-99` (included) and `99` (included)
// Examples of generated values: 6, 98, 8, 5, 0…

fc.integer({min: 65536})
// Note: All possible integers between `65536` (included) and `2147483647` (included)
// Examples of generated values: 65552, 2147483636, 65548, 1836480947, 1490866554…
```

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/integer.html).  
Available since 0.0.1.

### nat

Positive integer values (including zero).

Generate any possible positive integer between zero and the upper bound.
Both zero and the upper bound are included in the set of possible values.

**Signatures:**

- `fc.nat()`
- `fc.nat({max?})`
- `fc.nat(max)`

**with:**

- `max?` — default: `2147483647` — _upper bound of the range (included)_

**Usages:**

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

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/nat.html).  
Available since 0.0.1.

### maxSafeInteger

All the range of signed integer values.

Generate any possible integer ie. from `Number.MIN_SAFE_INTEGER` (included) to `Number.MAX_SAFE_INTEGER` (included).

**Signatures:**

- `fc.maxSafeInteger()`

**Usages:**

```js
fc.maxSafeInteger()
// Examples of generated values: -44, 7332126275469769, 32, -8631085038818688, 417563055004249…
```

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/maxSafeInteger.html).  
Available since 1.11.0.

## maxSafeNat

All the range of positive integer values (including zero).

Generate any possible positive integer ie. from `0` (included) to `Number.MAX_SAFE_INTEGER` (included).

**Signatures:**

- `fc.maxSafeNat()`

**Usages:**

```js
fc.maxSafeNat()
// Examples of generated values: 9007199254740981, 5859827138257099, 41, 5028419509524314, 9007199254740974…
```

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/maxSafeNat.html).  
Available since 1.11.0.

## Floating point

### float

Floating point values with 32-bit precision.

Generate any floating point value taken into the specified range.
The lower and upper bounds are included into the range of possible values.

It always generates valid 32-bit floating point values.

**Signatures:**

- `fc.float()`
- `fc.float({min?, max?, noDefaultInfinity?, noNaN?})`

**with:**

- `min?` — default: `-∞` and `-3.4028234663852886e+38` when `noDefaultInfinity:true` — _lower bound for the generated 32-bit floats (included)_
- `max?` — default: `+∞` and `+3.4028234663852886e+38` when `noDefaultInfinity:true` — _upper bound for the generated 32-bit floats (included)_
- `noDefaultInfinity?` — default: `false` — _use finite values for `min` and `max` by default_
- `noNaN?` — default: `false` — _do not generate `Number.NaN`_

**Usages:**

```js
fc.float()
// Note: All possible 32-bit floating point values (including -∞, +∞ and NaN but also -0)
// Examples of generated values: -1.1428610944376996e+35, -4.923316419364955e-39, 7.923675937604457e-9, 1.0574891476389556e+24, -0.012089259922504425…

fc.float({min: 0})
// Note: All possible positive 32-bit floating point values (including +∞ and NaN)
// Examples of generated values: 2.1019476964872256e-44, 837889914052804600, 3.4028228579130005e+38, 870708893032906800, 0.0000012031454161842703…

fc.float({noDefaultInfinity: true, noNaN: true})
// Note: All possible finite 32-bit floating point values
// Examples of generated values: 3.4028216409684243e+38, 1.2006116232075188e-20, -1.901408918296151e+27, 2.2420775429197073e-44, 3.4028177873105996e+38…

fc.float({noDefaultInfinity: true, min: Number.NEGATIVE_INTEGER, max: Number.POSITIVE_INTEGER})
// Note: Same as fc.float(), noDefaultInfinity just tells that defaults for min and max
// should not be set to -∞ and +∞. It does not forbid the user to explicitely set them to -∞ and +∞.
// Examples of generated values: 3.4028190042551758e+38, 76771269105680380, -3.402820018375656e+38, -3.5032461608120427e-44, -3.5804397670816536e-16…

fc.integer({ min: 0, max: (1 << 24) - 1 })
  .map((v) =v / (1 << 24))
  .noBias()
// Note: `fc.float` does not uniformly distribute the generated values in the requested range.
// If you really want a uniform distribution of 32-bit floating point numbers in range 0 (included)
// and 1 (excluded), you may want to use the arbitrary defined right above.
// Examples of generated values: 0.4440097212791443, 0.10951411724090576, 0.9122394323348999, 0.2517799735069275, 0.8096938133239746…
```

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/float.html).  
Available since 0.0.6.

### double

Floating point values.

Generate any floating point value taken into the specified range.
The lower and upper bounds are included into the range of possible values.

**Signatures:**

- `fc.double()`
- `fc.double({min?, max?, noDefaultInfinity?, noNaN?})`

**with:**

- `min?` — default: `-∞` and `-Number.MAX_VALUE` when `noDefaultInfinity:true` — _lower bound for the generated 32-bit floats (included)_
- `max?` — default: `+∞` and `Number.MAX_VALUE` when `noDefaultInfinity:true` — _upper bound for the generated 32-bit floats (included)_
- `noDefaultInfinity?` — default: `false` — _use finite values for `min` and `max` by default_
- `noNaN?` — default: `false` — _do not generate `Number.NaN`_

**Usages:**

```js
fc.double()
// Note: All possible floating point values (including -∞, +∞ and NaN but also -0)
// Examples of generated values: 6.978211330273434e+123, 2.6272140589206812e-53, 947075901019127, -1.3737004055555409e-182, -1.83e-322…

fc.double({min: 0})
// Note: All possible positive floating point values (including +∞ and NaN)
// Examples of generated values: 6e-323, 1.0831873918053913e-126, 1.7976931348623061e+308, 2.2758419366316956e+156, 2.5e-322…

fc.double({noDefaultInfinity: true, noNaN: true})
// Note: All possible finite floating point values
// Examples of generated values: 2.157966683814365e+235, 2.4413012903419427e-55, -1.7976931348623067e+308, -1.7976931348623071e+308, 1.7976931348623043e+308…

fc.double({noDefaultInfinity: true, min: Number.NEGATIVE_INTEGER, max: Number.POSITIVE_INTEGER})
// Note: Same as fc.double(), noDefaultInfinity just tells that defaults for min and max
// should not be set to -∞ and +∞. It does not forbid the user to explicitely set them to -∞ and +∞.
// Examples of generated values: -2.57e-322, 7.4e-323, 1.4e-322, -1.7976931348623055e+308, -2.131202798475727e-213…

fc.tuple(fc.integer({ min: 0, max: (1 << 26) - 1 }), fc.integer({ min: 0, max: (1 << 27) - 1 }))
  .map((v) =(v[0] * Math.pow(2, 27) + v[1]) * Math.pow(2, -53))
  .noBias()
// Note: `fc.double` does not uniformly distribute the generated values in the requested range.
// If you really want a uniform distribution of 64-bit floating point numbers in range 0 (included)
// and 1 (excluded), you may want to use the arbitrary defined right above.
// Examples of generated values: 0.9216838857781072, 0.010859774545431855, 0.2629468413267495, 0.7832272629526738, 0.3333448204689443…
```

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/double.html).  
Available since 0.0.6.

## BigInt

_if supported by your JavaScript interpreter_

### bigIntN

N-bit signed `bigint` values.

Generate any possible `bigint` between <code>-2<sup>n-1</sup></code>(included) and <code>2<sup>n-1</sup>-1</code>(included).

**Signatures:**

- `fc.bigIntN(n)`

**with:**

- `n` — _maximal number of bits of the generated `bigint`_

**Usages:**

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

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/bigIntN.html).  
Available since 1.9.0.

### bigInt

Signed `bigint` values.

Generate any bigint value taken into the specified range.
Both lower bound and upper bound are included into the range of possible values.

**Signatures:**

- `fc.bigInt()`
- `fc.bigInt({min?, max?})`
- `fc.bigInt(min, max)`

**with:**

- `min?` — _lower bound of the range (included)_
- `max?` — _upper bound of the range (included)_

**Usages:**

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

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/bigInt.html).  
Available since 1.9.0.

### bigUintN

N-bit positive `bigint` values (including zero).

Generate any possible positive `bigint` between <code>0</code>(included) and <code>2<sup>n</sup>-1</code>(included).

**Signatures:**

- `fc.bigUintN(n)`

**with:**

- `n` — _maximal number of bits of the generated `bigint`_

**Usages:**

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

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/bigUintN.html).  
Available since 1.9.0.

### bigUint

Positive `bigint` values (including zero).

Generate any positive bigint value taken up to upper bound included.

**Signatures:**

- `fc.bigUint()`
- `fc.bigUint({max?})`
- `fc.bigUint(max)`

**with:**

- `max?` — _upper bound of the range (included)_

**Usages:**

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

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/bigUint.html).  
Available since 1.9.0.