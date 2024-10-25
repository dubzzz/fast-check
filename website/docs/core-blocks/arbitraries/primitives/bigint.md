---
slug: /core-blocks/arbitraries/primitives/bigint/
---

# BigInt

Generate bigint values.

:::info
If supported by your JavaScript interpreter.
:::

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
