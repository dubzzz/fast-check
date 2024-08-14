---
slug: /core-blocks/arbitraries/primitives/number/
---

# Number

Generate numeric values.

## integer

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
fc.integer();
// Note: All possible integers between `-2147483648` (included) and `2147483647` (included)
// Examples of generated values: -1064811759, -2147483638, 2032841726, 930965475, -1…

fc.integer({ min: -99, max: 99 });
// Note: All possible integers between `-99` (included) and `99` (included)
// Examples of generated values: 33, -94, 5, -2, 97…

fc.integer({ min: 65536 });
// Note: All possible integers between `65536` (included) and `2147483647` (included)
// Examples of generated values: 487771549, 1460850457, 1601368274, 1623935346, 65541…
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/integer.html).  
Available since 0.0.1.

## nat

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
fc.nat();
// Note: All possible integers between `0` (included) and `2147483647` (included)
// Examples of generated values: 2, 5, 2147483618, 225111650, 1108701149…

fc.nat(1000);
// Note: All possible integers between `0` (included) and `1000` (included)
// Examples of generated values: 2, 8, 4, 270, 0…

fc.nat({ max: 1000 });
// Note: All possible integers between `0` (included) and `1000` (included)
// Examples of generated values: 917, 60, 599, 696, 7…
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/nat.html).  
Available since 0.0.1.

## maxSafeInteger

All the range of signed integer values.

Generate any possible integer ie. from `Number.MIN_SAFE_INTEGER` (included) to `Number.MAX_SAFE_INTEGER` (included).

**Signatures:**

- `fc.maxSafeInteger()`

**Usages:**

```js
fc.maxSafeInteger();
// Examples of generated values: 4, -6906426479593829, -9007199254740981, 1468597314308129, -31…
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/maxSafeInteger.html).  
Available since 1.11.0.

## maxSafeNat

All the range of positive integer values (including zero).

Generate any possible positive integer ie. from `0` (included) to `Number.MAX_SAFE_INTEGER` (included).

**Signatures:**

- `fc.maxSafeNat()`

**Usages:**

```js
fc.maxSafeNat();
// Examples of generated values: 8974418498592146, 7152466311278303, 7682568104547082, 5480146126393191, 6062166945524051…
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/maxSafeNat.html).  
Available since 1.11.0.

## float

Floating point values with 32-bit precision.

Generate any floating point value taken into the specified range.
The lower and upper bounds are included into the range of possible values.

It always generates valid 32-bit floating point values.

**Signatures:**

- `fc.float()`
- `fc.float({min?, max?, minExcluded?, maxExcluded?, noDefaultInfinity?, noNaN?, noInteger?})`

**with:**

- `min?` — default: `-∞` and `-3.4028234663852886e+38` when `noDefaultInfinity:true` — _lower bound for the generated 32-bit floats (included)_
- `max?` — default: `+∞` and `+3.4028234663852886e+38` when `noDefaultInfinity:true` — _upper bound for the generated 32-bit floats (included)_
- `minExcluded?` — default: `false` — _do not include `min` in the set of possible values_
- `maxExcluded?` — default: `false` — _do not include `max` in the set of possible values_
- `noDefaultInfinity?` — default: `false` — _use finite values for `min` and `max` by default_
- `noNaN?` — default: `false` — _do not generate `Number.NaN`_
- `noInteger?` — default: `false` — _do not generate values matching `Number.isInteger`_

**Usages:**

```js
fc.float();
// Note: All possible 32-bit floating point values (including -∞, +∞ and NaN but also -0)
// Examples of generated values: -1.1428610944376996e+35, -4.923316419364955e-39, 7.923675937604457e-9, 1.0574891476389556e+24, -0.012089259922504425…

fc.float({ min: 0 });
// Note: All possible positive 32-bit floating point values (including +∞ and NaN)
// Examples of generated values: 722749030400, 9.80908925027372e-45, 4.549913925362434e+24, 4.32932694138799e-7, 3.4028224522648084e+38…

fc.float({ noDefaultInfinity: true, noNaN: true });
// Note: All possible finite 32-bit floating point values
// Examples of generated values: 0.0030062051955610514, 5.605193857299268e-45, 3.4028212353202322e+38, -2.802596928649634e-45, -160112.453125…

fc.float({ noDefaultInfinity: true, min: Number.NEGATIVE_INTEGER, max: Number.POSITIVE_INTEGER });
// Note: Same as fc.float(), noDefaultInfinity just tells that defaults for min and max
// should not be set to -∞ and +∞. It does not forbid the user to explicitely set them to -∞ and +∞.
// Examples of generated values: -5.435122013092041, 1981086548623360, -2.2481372319305137e-9, -2.5223372357846707e-44, 5.606418179297701e-30…

fc.float({ min: 0, max: 1, maxExcluded: true });
// Note: All possible 32-bit floating point values between 0 (included) and 1 (excluded)
// Examples of generated values: 3.2229864679470793e-44, 2.4012229232976108e-20, 1.1826533935374394e-27, 0.9999997615814209, 3.783505853677006e-44…

fc.float({ noInteger: true });
// Note: All possible 32-bit floating point values but no integer
// Examples of generated values: -7.006492321624085e-45, 1.4734616113175924e-21, 8.407790785948902e-45, 1.5815058151957828e-9, Number.POSITIVE_INFINITY…

fc.noBias(fc.integer({ min: 0, max: (1 << 24) - 1 }).map((v) => v / (1 << 24)));
// Note: `fc.float` does not uniformly distribute the generated values in the requested range.
// If you really want a uniform distribution of 32-bit floating point numbers in range 0 (included)
// and 1 (excluded), you may want to use the arbitrary defined right above.
// Examples of generated values: 0.06896239519119263, 0.5898661017417908, 0.7715556621551514, 0.4010099768638611, 0.8638045787811279…
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/float.html).  
Available since 0.0.6.

## double

Floating point values.

Generate any floating point value taken into the specified range.
The lower and upper bounds are included into the range of possible values.

**Signatures:**

- `fc.double()`
- `fc.double({min?, max?, minExcluded?, maxExcluded?, noDefaultInfinity?, noNaN?, noInteger?})`

**with:**

- `min?` — default: `-∞` and `-Number.MAX_VALUE` when `noDefaultInfinity:true` — _lower bound for the generated 32-bit floats (included)_
- `max?` — default: `+∞` and `Number.MAX_VALUE` when `noDefaultInfinity:true` — _upper bound for the generated 32-bit floats (included)_
- `minExcluded?` — default: `false` — _do not include `min` in the set of possible values_
- `maxExcluded?` — default: `false` — _do not include `max` in the set of possible values_
- `noDefaultInfinity?` — default: `false` — _use finite values for `min` and `max` by default_
- `noNaN?` — default: `false` — _do not generate `Number.NaN`_
- `noInteger?` — default: `false` — _do not generate values matching `Number.isInteger`_

**Usages:**

```js
fc.double();
// Note: All possible floating point values (including -∞, +∞ and NaN but also -0)
// Examples of generated values: 6.978211330273434e+123, 2.6272140589206812e-53, 947075901019127, -1.3737004055555409e-182, -4.4e-323…

fc.double({ min: 0 });
// Note: All possible positive floating point values (including +∞ and NaN)
// Examples of generated values: 8.762813623312512e-262, 5.0929130565593696e-226, 1.3411163978818024e+222, 8845029414547763, 8.4e-323…

fc.double({ noDefaultInfinity: true, noNaN: true });
// Note: All possible finite floating point values
// Examples of generated values: -3.0862366688503372e+144, -1.7384136409372626e-212, 1.7976931348623153e+308, 2.5e-323, -1.1800479468035008e+224…

fc.double({ noDefaultInfinity: true, min: Number.NEGATIVE_INTEGER, max: Number.POSITIVE_INTEGER });
// Note: Same as fc.double(), noDefaultInfinity just tells that defaults for min and max
// should not be set to -∞ and +∞. It does not forbid the user to explicitely set them to -∞ and +∞.
// Examples of generated values: 7.593633990222606e-236, -5.74664305820822e+216, -1.243100551492039e-161, 1.7976931348623143e+308, -1.7976931348623157e+308…

fc.double({ min: 0, max: 1, maxExcluded: true });
// Note: All possible floating point values between 0 (included) and 1 (excluded)
// Examples of generated values: 4.801635255684817e-73, 4.882602580683884e-55, 0.9999999999999998, 0.9999999999999991, 2.5e-323…

fc.double({ noInteger: true });
// Note: All possible floating point values but no integer
// Examples of generated values: 9.4e-323, 4503599627370491.5, -1.8524776326185756e-119, 2.5e-323, -5e-323…

fc.noBias(
  fc
    .tuple(fc.integer({ min: 0, max: (1 << 26) - 1 }), fc.integer({ min: 0, max: (1 << 27) - 1 }))
    .map((v) => (v[0] * Math.pow(2, 27) + v[1]) * Math.pow(2, -53)),
);
// Note: `fc.double` does not uniformly distribute the generated values in the requested range.
// If you really want a uniform distribution of 64-bit floating point numbers in range 0 (included)
// and 1 (excluded), you may want to use the arbitrary defined right above.
// Examples of generated values: 0.5424979085274226, 0.8984809917404123, 0.577376440989232, 0.8433714130130558, 0.48219857913738606…
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/double.html).  
Available since 0.0.6.
