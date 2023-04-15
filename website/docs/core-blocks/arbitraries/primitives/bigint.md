---
slug: /core-blocks/arbitraries/primitives/bigint/
---

# BigInt

Generate bigint values.

:::info
If supported by your JavaScript interpreter.
:::

## bigIntN

N-bit signed `bigint` values.

Generate any possible `bigint` between <code>-2<sup>n-1</sup></code>(included) and <code>2<sup>n-1</sup>-1</code>(included).

**Signatures:**

- `fc.bigIntN(n)`

**with:**

- `n` — _maximal number of bits of the generated `bigint`_

**Usages:**

```js
fc.bigIntN(2);
// Note: All possible bigint values between `-2n` (included) and `1n` (included)
// Examples of generated values: -1n, 0n, -2n, 1n…

fc.bigIntN(128);
// Note: All possible bigint values between `-(2n**127n)` (included) and `(2n**127n)-1n` (included)
// Examples of generated values:
// • -83800032197379306566182873262516440540n
// • 25n
// • 158840340830794203739031705197707799935n
// • 109725055448354933906694468218886748868n
// • -58745679602443161432485692382267178456n
// • …
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/bigIntN.html).  
Available since 1.9.0.

## bigInt

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
fc.bigInt();
// Examples of generated values:
// • 40519302182168582469083131396737815984915854610111397506754347703341259198524n
// • 23951610212595764539175455250207245555782767082407094676187361741043426472154n
// • 30295980883260580261886608760731577493472838495202972700546280276253358609031n
// • -11868238563800054718695098172873792117821728883208728506070757173361404354997n
// • 35n
// • …

fc.bigInt({ min: 0n, max: 12345678901234567890n });
// Note: All possible bigint values between `0n` (included) and `12345678901234567890n` (included)
// Examples of generated values: 10743587536809719502n, 12345678901234567887n, 1n, 18n, 3991213889543870829n…

fc.bigInt({ min: -3000n, max: 100n });
// Note: All possible bigint values between `-3000n` (included) and `100n` (included)
// Examples of generated values: 1n, -2n, -1064n, 0n, -147n…

fc.bigInt({ min: 1n << 64n });
// Note: Any possible bigint value greater or equal to `1n << 64n`
// Examples of generated values:
// • 18446744073709551637n
// • 46981635298839638819090544091451527470150794541406966757340574520618867005787n
// • 18446744073709551630n
// • 56018523185942628466562775307785743268387645013311767424219309719910490250614n
// • 18446744073709551631n
// • …
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/bigInt.html).  
Available since 1.9.0.

## bigUintN

N-bit positive `bigint` values (including zero).

Generate any possible positive `bigint` between <code>0</code>(included) and <code>2<sup>n</sup>-1</code>(included).

**Signatures:**

- `fc.bigUintN(n)`

**with:**

- `n` — _maximal number of bits of the generated `bigint`_

**Usages:**

```js
fc.bigUintN(2);
// Note: All possible bigint values between `0n` (included) and `3n` (included)
// Examples of generated values: 3n, 2n, 1n, 0n…

fc.bigUintN(128);
// Note: All possible bigint values between `0n` (included) and `(2n**128n)-1n` (included)
// Examples of generated values:
// • 340282366920938463463374607431768211420n
// • 6n
// • 340282366920938463463374607431768211449n
// • 19225600100382209903875987741927437092n
// • 191040334565534699329412745278880000125n
// • …
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/bigUintN.html).  
Available since 1.9.0.

## bigUint

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
fc.bigUint();
// Examples of generated values:
// • 29188776411818523480346033977986676602009988876718162803882091273979244225635n
// • 115792089237316195423570985008687907853269984665640564039457584007913129639905n
// • 112701349138312466045130244851166888596859376772707754850552210833995965154463n
// • 82994824182483006257994272456693299050844471485097755282170665287589361844485n
// • 74n
// • …

fc.bigUint({ max: 12345678901234567890n });
// Note: All possible bigint values between `0n` (included) and `12345678901234567890n` (included)
// Examples of generated values: 7n, 12345678901234567880n, 11096355679684160765n, 12345678901234567877n, 9491461254506145738n…
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/bigUint.html).  
Available since 1.9.0.
