---
slug: /core-blocks/arbitraries/combiners/any/
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
- `depthSize?` — default: `undefined` [more](/docs/configuration/larger-entries-by-default/#depth-size-explained) — _how much we allow our recursive structures to be deep? The chance to select the nil value will increase as we go deeper in the structure_
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

Resources: [API reference](https://fast-check.dev/api-reference/functions/option.html).  
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
- `depthSize?` — default: `undefined` [more](/docs/configuration/larger-entries-by-default/#depth-size-explained) — _how much we allow our recursive structures to be deep? The chance to select the first specified arbitrary will increase as we go deeper in the structure_
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

Resources: [API reference](https://fast-check.dev/api-reference/functions/oneof.html).  
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

Resources: [API reference](https://fast-check.dev/api-reference/functions/clone.html).  
Available since 2.5.0.

## noBias

Drop bias from an existing arbitrary. Instead of being more likely to generate certain values the resulting arbitrary will be close to an equi-probable generator.

**Signatures:**

- `fc.noBias(arb)`

**with:**

- `arb` — _arbitrary instance responsible to generate values_

**Usages:**

```js
fc.noBias(fc.nat());
// Note: Compared to fc.nat() alone, the generated values are evenly distributed in
// the range 0 to 0x7fffffff making small values much more unlikely.
// Examples of generated values: 394798768, 980149687, 1298483622, 1164017931, 646759550…
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/noBias.html).  
Available since 3.20.0.

## noShrink

Drop shrinking capabilities from an existing arbitrary.

:::warning Avoid dropping shrinking capabilities
Although dropping the shrinking capabilities can speed up your CI when failures occur, we do not recommend this approach. Instead, if you want to reduce the shrinking time for automated jobs or local runs, consider using `endOnFailure` or `interruptAfterTimeLimit`.

The only potentially legitimate use of dropping shrinking is when creating new complex arbitraries. In such cases, dropping useless parts of the shrinker may prove useful.
:::

**Signatures:**

- `fc.noShrink(arb)`

**with:**

- `arb` — _arbitrary instance responsible to generate values_

**Usages:**

```js
fc.noShrink(fc.nat());
// Examples of generated values: 1395148595, 7, 1743838935, 879259091, 2147483640…
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/noShrink.html).  
Available since 3.20.0.

## limitShrink

Limit shrinking capabilities of an existing arbitrary. Cap the number of potential shrunk values it could produce.

:::warning Avoid limiting shrinking capabilities
Although limiting the shrinking capabilities can speed up your CI when failures occur, we do not recommend this approach. Instead, if you want to reduce the shrinking time for automated jobs or local runs, consider using `endOnFailure` or `interruptAfterTimeLimit`.

The only potentially legitimate use of limiting shrinking is when creating new complex arbitraries. In such cases, limiting some less relevant parts may help preserve shrinking capabilities without requiring exhaustive coverage of the shrinker.
:::

**Signatures:**

- `fc.limitShrink(arb, maxShrinks)`

**with:**

- `arb` — _arbitrary instance responsible to generate values_
- `maxShrinks` — _the maximal number of shrunk values that could be pulled from the arbitrary in case of shrink_

**Usages:**

```js
fc.limitShrink(fc.nat(), 3);
// Examples of generated values: 487640477, 1460784921, 1601237202, 1623804274, 5…
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/limitShrink.html).  
Available since 3.20.0.

## .filter

Filter an existing arbitrary.

**Signatures:**

- `.filter(predicate)`

**with:**

- `predicate` — _only keeps values such as `predicate(value) === true`_

**Usages:**

```js
fc.integer().filter((n) => n % 2 === 0);
// Note: Only produce even integer values
// Examples of generated values: -1582642274, 2147483644, 30, -902884124, -20…

fc.integer().filter((n) => n % 2 !== 0);
// Note: Only produce odd integer values
// Examples of generated values: 925226031, -1112273465, 29, -1459401265, 21…

fc.string().filter((s) => s[0] < s[1]);
// Note: Only produce strings with `s[0] < s[1]`
// Examples of generated values: "Aa]tp>", "apply", "?E%a$n x", "#l\"/L\"x&S{", "argument"…
```

Resources: [API reference](https://fast-check.dev/api-reference/classes/Arbitrary.html#filter).  
Available since 0.0.1.

## .map

Map an existing arbitrary.

**Signatures:**

- `.map(mapper)`

**with:**

- `mapper` — _transform the produced value into another one_

**Usages:**

```js
fc.nat(1024).map((n) => n * n);
// Note: Produce only square values
// Examples of generated values: 36, 24336, 49, 186624, 1038361…

fc.nat().map((n) => String(n));
// Note: Change the type of the produced value from number to string
// Examples of generated values: "2147483619", "12", "468194571", "14", "5"…

fc.tuple(fc.integer(), fc.integer()).map((t) => (t[0] < t[1] ? [t[0], t[1]] : [t[1], t[0]]));
// Note: Generate a range [min, max]
// Examples of generated values: [-1915878961,27], [-1997369034,-1], [-1489572084,-370560927], [-2133384365,28], [-1695373349,657254252]…

fc.string().map((s) => `[${s.length}] -> ${s}`);
// Examples of generated values: "[3] -> ref", "[8] -> xeE:81|z", "[9] -> B{1Z\\sxWa", "[3] -> key", "[1] -> _"…
```

Resources: [API reference](https://fast-check.dev/api-reference/classes/Arbitrary.html#map).  
Available since 0.0.1.

## .chain

Flat-Map an existing arbitrary.

:::warning Limited shrink
Be aware that the shrinker of such construct might not be able to shrink as much as possible (more details [here](https://github.com/dubzzz/fast-check/issues/650#issuecomment-648397230))
:::

**Signatures:**

- `.chain(fmapper)`

**with:**

- `fmapper` — _produce an arbitrary based on a generated value_

**Usages:**

```js
fc.nat().chain((min) => fc.tuple(fc.constant(min), fc.integer({ min, max: 0xffffffff })));
// Note: Produce a valid range
// Examples of generated values: [1211945858,4294967292], [1068058184,2981851306], [2147483626,2147483645], [1592081894,1592081914], [2147483623,2147483639]…
```

Resources: [API reference](https://fast-check.dev/api-reference/classes/Arbitrary.html#chain).  
Available since 1.2.0.
