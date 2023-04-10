---
slug: /core-blocks/arbitraries/combiners/any
---

# Any

Combine and enhance any existing arbitraries.

## option

Randomly chooses between producing a value using the underlying arbitrary or returning nil

**Signatures:**

- `fc.option(arb)`
- `fc.option(arb, {freq?, nil?, depthSize?, maxDepth?, depthIdentifier?})`

**with:**

- `arb` — _arbitrary that will be called to generate normal values_
- `freq?` — default: `5` — _probability to build the nil value is of 1 / freq_
- `nil?` — default: `null` — _nil value_
- `depthSize?` — default: `undefined` [more](#depth-size-explained) — _how much we allow our recursive structures to be deep? The chance to select the nil value will increase as we go deeper in the structure_
- `maxDepth?` — default: `Number.POSITIVE_INFINITY` — _when reaching maxDepth, only nil could be produced_
- `depthIdentifier?` — default: `undefined` — _share the depth between instances using the same `depthIdentifier`_

**Usages:**

```js
fc.option(fc.nat());
// Examples of generated values: 28, 18, 2001121804, 2147483643, 12456933…

fc.option(fc.nat(), { freq: 2 });
// Examples of generated values: null, 1230277526, 10, 1854085942, 5…

fc.option(fc.nat(), { freq: 2, nil: Number.NaN });
// Examples of generated values: Number.NaN, 292454282, 990664982, 703789134, 278848986…

fc.option(fc.string(), { nil: undefined });
// Examples of generated values: "p:s", "", "ot(RM", "|", "2MyPDrq6"…

// fc.option fits very well with recursive stuctures built using fc.letrec.
// Examples of such recursive structures are available with fc.letrec.
```

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/option.html).  
Available since 0.0.6.

## oneof

Generate one value based on one of the passed arbitraries

Randomly chooses an arbitrary at each new generation. Should be provided with at least one arbitrary. Probability to select a specific arbitrary is based on its weight: `weight(instance) / sumOf(weights)` (for depth=0). For higher depths, the probability to select the first arbitrary will increase as we go deeper in the tree so the formula is not applicable as-is. It preserves the shrinking capabilities of the underlying arbitrary. `fc.oneof` is able to shrink inside the failing arbitrary but not across arbitraries (contrary to `fc.constantFrom` when dealing with constant arbitraries) except if called with `withCrossShrink`.

:::warning First arbitrary, a privileged one
The first arbitrary specified on `oneof` will have a privileged position. Constraints like `withCrossShrink` or `depthSize` tend to favor it over others.
:::

**Signatures:**

- `fc.oneof(...arbitraries)`
- `fc.oneof({withCrossShrink?, maxDepth?, depthSize?, depthIdentifier?}, ...arbitraries)`

**with:**

- `...arbitraries` — _arbitraries that could be used to generate a value. The received instances can either be raw instances of arbitraries (meaning weight is 1) or objects containing the arbitrary and its associated weight (integer value ≥0)_
- `withCrossShrink?` — default: `false` — _in case of failure the shrinker will try to check if a failure can be found by using the first specified arbitrary. It may be pretty useful for recursive structures as it can easily help reducing their depth in case of failure_
- `maxDepth?` — default: `Number.POSITIVE_INFINITY` — _when reaching maxDepth, the first arbitrary will be used to generate the value_
- `depthSize?` — default: `undefined` [more](#depth-size-explained) — _how much we allow our recursive structures to be deep? The chance to select the first specified arbitrary will increase as we go deeper in the structure_
- `depthIdentifier?` — default: `undefined` — _share the depth between instances using the same `depthIdentifier`_

**Usages:**

```js
fc.oneof(fc.char(), fc.boolean());
// Note: Equivalent to:
//       fc.oneof(
//         { arbitrary: fc.char(), weight: 1 },
//         { arbitrary: fc.boolean(), weight: 1 },
//       )
// Examples of generated values: true, "p", " ", ",", "x"…

fc.oneof(fc.char(), fc.boolean(), fc.nat());
// Note: Equivalent to:
//       fc.oneof(
//         { arbitrary: fc.char(), weight: 1 },
//         { arbitrary: fc.boolean(), weight: 1 },
//         { arbitrary: fc.nat(), weight: 1 },
//       )
// Examples of generated values: 12, true, 24, false, "N"…

fc.oneof({ arbitrary: fc.char(), weight: 5 }, { arbitrary: fc.boolean(), weight: 2 });
// Examples of generated values: false, true, "L", "b", "y"…

// fc.oneof fits very well with recursive stuctures built using fc.letrec.
// Examples of such recursive structures are available with fc.letrec.
```

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/oneof.html).  
Available since 0.0.1.

## clone

Multiple identical values (they might not equal in terms of `===` or `==`).

Generate tuple containing multiple instances of the same value - values are independent from each others.

**Signatures:**

- `fc.clone(arb, numValues)`

**with:**

- `arb` — _arbitrary instance responsible to generate values_
- `numValues` — _number of clones (including itself)_

**Usages:**

```js
fc.clone(fc.nat(), 2);
// Examples of generated values: [1395148595,1395148595], [7,7], [1743838935,1743838935], [879259091,879259091], [2147483640,2147483640]…

fc.clone(fc.nat(), 3);
// Examples of generated values:
// • [163289042,163289042,163289042]
// • [287842615,287842615,287842615]
// • [1845341787,1845341787,1845341787]
// • [1127181441,1127181441,1127181441]
// • [5,5,5]
// • …
```

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/clone.html).  
Available since 2.5.0.
