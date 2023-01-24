# Migration 2.x to 3.x

While version `3.x` of fast-check includes some breaking changes, some of them can already be applied starting at the latest versions of `2.x`.
In other words, you can switch to `3.x` style directly in `2.x` for some of the features.

How to read through this document:

- ✨ means _migration can be done within `2.x`_
- 💥 means _migration has to be done within `3.x`_
- 🔨 means _coming with a migration script doing part of the job_
- 👽️ means _mostly impacted very advanced users_

We highly recommend you to apply the ✨ within a `2.x` then plan for the 💥 in `3.x` to avoid having a potentially huge change to do but do it incrementally.

## Unify signatures accross arbitraries ✨🔨

In the past, some signatures used to be ambiguous[^1], some were not extensible[^2] and some did not follow the modern signature approach adopted by new arbitraries[^3]. [More details](https://github.com/dubzzz/fast-check/issues/992)

So signatures have been adapted to embrace our new approach:

- `array(arb, maxLength)` ➜ `array(arb, {maxLength})` _requires at least 2.4.0_ — [#2927](https://github.com/dubzzz/fast-check/pull/2927)
- `array(arb, minLength, maxLength)` ➜ `array(arb, {minLength, maxLength})` _requires at least 2.4.0_ — [#2927](https://github.com/dubzzz/fast-check/pull/2927)
- `asciiString(maxLength)` ➜ `asciiString({maxLength})` _requires at least 2.4.0_ — [#2929](https://github.com/dubzzz/fast-check/pull/2929)
- `asciiString(minLength, maxLength)` ➜ `asciiString({minLength, maxLength})` _requires at least 2.4.0_ — [#2929](https://github.com/dubzzz/fast-check/pull/2929)
- `base64String(maxLength)` ➜ `base64String({maxLength})` _requires at least 2.4.0_ — [#2929](https://github.com/dubzzz/fast-check/pull/2929)
- `base64String(minLength, maxLength)` ➜ `base64String({minLength, maxLength})` _requires at least 2.4.0_ — [#2929](https://github.com/dubzzz/fast-check/pull/2929)
- `fullUnicodeString(maxLength)` ➜ `fullUnicodeString({maxLength})` _requires at least 2.4.0_ — [#2929](https://github.com/dubzzz/fast-check/pull/2929)
- `fullUnicodeString(minLength, maxLength)` ➜ `fullUnicodeString({minLength, maxLength})` _requires at least 2.4.0_ — [#2929](https://github.com/dubzzz/fast-check/pull/2929)
- `hexaString(maxLength)` ➜ `hexaString({maxLength})` _requires at least 2.4.0_ — [#2929](https://github.com/dubzzz/fast-check/pull/2929)
- `hexaString(minLength, maxLength)` ➜ `hexaString({minLength, maxLength})` _requires at least 2.4.0_ — [#2929](https://github.com/dubzzz/fast-check/pull/2929)
- `string(maxLength)` ➜ `string({maxLength})` _requires at least 2.4.0_ — [#2929](https://github.com/dubzzz/fast-check/pull/2929)
- `string(minLength, maxLength)` ➜ `string({minLength, maxLength})` _requires at least 2.4.0_ — [#2929](https://github.com/dubzzz/fast-check/pull/2929)
- `string16bits(maxLength)` ➜ `string16bits({maxLength})` _requires at least 2.4.0_ — [#2929](https://github.com/dubzzz/fast-check/pull/2929)
- `string16bits(minLength, maxLength)` ➜ `string16bits({minLength, maxLength})` _requires at least 2.4.0_ — [#2929](https://github.com/dubzzz/fast-check/pull/2929)
- `stringOf(charArb, maxLength)` ➜ `stringOf(charArb, {maxLength})` _requires at least 2.4.0_ — [#2929](https://github.com/dubzzz/fast-check/pull/2929)
- `stringOf(charArb, minLength, maxLength)` ➜ `stringOf(charArb, {minLength, maxLength})` _requires at least 2.4.0_ — [#2929](https://github.com/dubzzz/fast-check/pull/2929)
- `unicodeString(maxLength)` ➜ `unicodeString({maxLength})` _requires at least 2.4.0_ — [#2929](https://github.com/dubzzz/fast-check/pull/2929)
- `unicodeString(minLength, maxLength)` ➜ `unicodeString({minLength, maxLength})` _requires at least 2.4.0_ — [#2929](https://github.com/dubzzz/fast-check/pull/2929)
- `shuffledSubarray(originalArray, minLength, maxLength)` ➜ `shuffledSubarray(originalArray, {minLength, maxLength})` _requires at least 2.4.0_ — [#2930](https://github.com/dubzzz/fast-check/pull/2930)
- `subarray(originalArray, minLength, maxLength)` ➜ `subarray(originalArray, {minLength, maxLength})` _requires at least 2.4.0_ — [#2930](https://github.com/dubzzz/fast-check/pull/2930)
- `commands(commandArbs, maxCommands)` ➜ `commands(commandArbs, maxCommands)` _requires at least 1.11.0_ — [#2931](https://github.com/dubzzz/fast-check/pull/2931)
- `option(arb, freq)` ➜ `option(arb, {freq})` _requires at least 1.17.0_ — [#2932](https://github.com/dubzzz/fast-check/pull/2932)
- `json(maxDepth)` ➜ `json({maxDepth})` _requires at least 2.5.0_ — [#2933](https://github.com/dubzzz/fast-check/pull/2933)
- `unicodeJson(maxDepth)` ➜ `unicodeJson({maxDepth})` _requires at least 2.5.0_ — [#2933](https://github.com/dubzzz/fast-check/pull/2933)
- `lorem(maxWordsCount)` ➜ `lorem({maxWordsCount})` — [#2934](https://github.com/dubzzz/fast-check/pull/2934)
- `lorem(maxWordsCount, sentencesMode)` ➜ `lorem({maxWordsCount, mode})` _requires at least 2.5.0_ — [#2934](https://github.com/dubzzz/fast-check/pull/2934)
- `double(max)` ➜ `double({max})` _requires at least 2.8.0_ — [#2928](https://github.com/dubzzz/fast-check/pull/2928)
- `double(min, max)` ➜ `double({min, max})` _requires at least 2.8.0_ — [#2928](https://github.com/dubzzz/fast-check/pull/2928)
- `float(max)` ➜ `float({max})` _requires at least 2.8.0_ — [#2928](https://github.com/dubzzz/fast-check/pull/2928)
- `float(min, max)` ➜ `float({min, max})` _requires at least 2.8.0_ — [#2928](https://github.com/dubzzz/fast-check/pull/2928)
- `integer(max)` ➜ `integer({max})` _requires at least 2.6.0_ — [#2939](https://github.com/dubzzz/fast-check/pull/2939)
- `integer(min, max)` ➜ `integer({min, max})` _requires at least 2.6.0_ — [#2939](https://github.com/dubzzz/fast-check/pull/2939)

As the migration is pretty automatable, a codemod is provided to do part of the changes linked to this part for you. More details at: https://github.com/dubzzz/fast-check/tree/v3.3.0/codemods/unify-signatures

**Other related issues and PRs**: [#992](https://github.com/dubzzz/fast-check/issues/992)

**Guidelines for v2 (≥2.8.0 recommended)**: Move any of the signatures specified above to its recent equivalent.

[^1]: Like `integer(max)` or `array(arb, maxLength)` and even `array(arb, minLength, maxLength)`.
[^2]: For instance, we added `size` and `depthIdentifier` onto `array` doing it with yet another set of extra parameters would have been problematic.
[^3]: Initially, the rule has been: one extra argument for each new option like `array(arb, maxLength)`. But it used to be replaced by constraints-based signatures like `object(constraints)` for the most recent additions.

## Drop some arbitraries ✨

Some arbitraries were duplicated, others had ambiguous names... so they got dropped in v3. The change below can be applied without having to bump to v3.

Here are the arbitraries that got removed and the replacement they got:

- `jsonObject` ➜ `jsonValue` _requires at least 2.20.0_ — [#2933](https://github.com/dubzzz/fast-check/pull/2933)
- `unicodeJsonObject` ➜ `unicodeJsonValue` _requires at least 2.20.0_ — [#2933](https://github.com/dubzzz/fast-check/pull/2933)
- `set` ➜ `uniqueArray` _requires at least 2.23.0_ — [#2938](https://github.com/dubzzz/fast-check/pull/2938)
- `dedup` ➜ `clone` _requires at least 2.5.0_ — [#2938](https://github.com/dubzzz/fast-check/pull/2938)
- `clonedConstant` ➜ `constant` _requires at least 2.15.0_ — [#2938](https://github.com/dubzzz/fast-check/pull/2938)
- `genericTuple` ➜ `tuple` _requires at least 2.14.0_ — [#2940](https://github.com/dubzzz/fast-check/pull/2940)
- `frequency` ➜ `oneof` _requires at least 3.0.0_ — [#2960](https://github.com/dubzzz/fast-check/pull/2960)

Be careful when doing the change from `set` to `uniqueArray` as the API changed a bit and the default comparison operator switched from `===` to `SameValue`. Most of the other changes should be straightforward with no major impact.

**Other related issues and PRs**: [#2457(jsonObject/unicodeJsonObject)](https://github.com/dubzzz/fast-check/issues/2457), [#1985(set)](https://github.com/dubzzz/fast-check/discussions/1985), [#530(dedup)](https://github.com/dubzzz/fast-check/issues/530), [#1750(constant)](https://github.com/dubzzz/fast-check/pull/1750), [#2955(frequency)](https://github.com/dubzzz/fast-check/pull/2955)

**Guidelines for v2 (≥2.23.0 recommended)**: Get rid off any of the signatures specified above, except `frequency` as `oneof` cannot handle its usages before version 3.

## New floating point arbitraries ✨

Up to version 2, the default behaviour of `fc.float()` and `fc.double()` has been to uniformaly generate entries within the specified range by including the min and not the max. In other words the probability to generate an entry from the first half of the range was close to[^4] 50%, the probability to generate one from the second half of the range was close to[^4] 50% too.

In version 2.6.0, we proposed new implementations for `fc.float()` and `fc.double()`. Those new implementations are accessible by passing the constraint `{next:true}` to the arbitrary. Contrary to the previous version, the new implementation has the following characteristics:

- not uniform on the values — _the probability to generate values from the first half of the range will probably not be the same as the one to generate values from the second half of the range_
- generate any possible value within the range — _any possible value within the range has the same probability to be selected but as there are more floating point numbers in range `[0, 1]` than in `[10, 11]` the first one will be more likely_
- min (included) and max (included) and min ≤ max — _max is now included and has to be higher or equal to min_
- any possible value means `NaN` too — _because `NaN` is often a missed value for double it will be included by default except if using the option `noNaN`_
- any possible value means infinity too — _because infinity is often a missed value for double it will be included by default except if using the option `noDefaultInfinity` or specifying an explicit range by setting both a `min` and a `max`_
- any possible value means `-0` too — _because `-0` is often a missed value for double it will be included by default if part of the requested range_
- default range includes all the possible floating point values — _by default, or `fc.double()`, means from -infinity to +infinity with NaN and -0 and the exact same probability go generate any of the doubles_

**Other related issues and PRs**: [#1040(float)](https://github.com/dubzzz/fast-check/pull/1040), [#1187(double)](https://github.com/dubzzz/fast-check/pull/1187)

**Guidelines for v2 (≥2.8.0 recommended)**: You can already toggle the new version or v3 version by passing the constraint `next: true` whenever you use a `fc.float()` or `fc.double()`. Please note from the characteristics detailed above that the default range for the previous versions differ from the default in new version, that exotic values like `-0`, `NaN` or infinity are now there by default...

[^4]: Actually because of bias, for smaller runs we tend not to follow the final and target distribution so it might not be exactly 50% when biased is on (the default). But as you go in the runs, then the bias will be close to 0 and you will reach the target distribution.

## No more support for TypeScript versions <4.1 ✨

Support for versions of TypeScript below 4.1 has been removed by [#2935](https://github.com/dubzzz/fast-check/pull/2935). No need to wait `fast-chech@3` to bump to `typescript@4.1` or later.

**Other related issues and PRs**: [#1492](https://github.com/dubzzz/fast-check/issues/1492), [#1517](https://github.com/dubzzz/fast-check/pull/1517), [#1520](https://github.com/dubzzz/fast-check/pull/1520)

**Guidelines for v2**: Start using TypeScript 4.1 or above even if you are still on v2.

## Depth follow the size ✨

We now try to limit automatically the depth of the recursive structures generated — [#2949](https://github.com/dubzzz/fast-check/pull/2949).

It has one major impact if you use `oneof` in conjonction with `letrec`: the first arbitrary you specify in `oneof` must be a leaf. In other words:

```ts
const { tree } = fc.letrec((tie) => ({
  tree: fc.oneof(tie('leaf'), tie('node')), // Good!!!
  node: fc.record({ left: tie('tree'), right: tie('tree') }),
  leaf: fc.nat(),
}));

// And not:
// const { tree } = fc.letrec((tie) => ({
//   tree: fc.oneof(tie('node'), tie('leaf')), // BAD!!!
//   node: fc.record({ left: tie('tree'), right: tie('tree') }),
//   leaf: fc.nat(),
// }));
```

By _leaf_, we mean something that does not re-run a potentially infinite recursion but will stop for sure in a finite amount of bumps. In the example above `tie('leaf')` is a leaf as it links to `fc.nat()` which definitely does not re-run yet another recursion cycle. But it could have been a constant value or any other terminal case (see it as the terminal case of your recursion).

**Other related issues and PRs**: [#2884](https://github.com/dubzzz/fast-check/pull/2884), [#1603](https://github.com/dubzzz/fast-check/pull/1603), [#1598](https://github.com/dubzzz/fast-check/pull/1598), [#1601](https://github.com/dubzzz/fast-check/pull/1601)

**Guidelines for v2 (≥2.25.0 recommended)**: In order to unlock this feature and change in v2, you must define a `baseSize` globally. It can be done with:

```ts
fc.configureGlobal({ baseSize: 'small' });
// 'small' is the default value when not specified
// but needs to be for v2 if you want to force its usage on depths
```

For backward compatibility reasons, in order to unlock the "depth inferred by size" in v2, you need to explicitely define a `baseSize` value globally or to define a `depthFactor` (now `depthSize` in v3) at the level of your recursive arbitrary. In v3, not specifying it will be fully equivalent to specifying it with value `'small'`.

## Specifying a `maxLength` does not mean reaching it ✨

In the previous releases of the library, `fc.string({ maxLength: 10_000 })` meant: generate any string from 0 to 10k characters, but please do generate entries with 10k entries too. In the recent versions, the `maxLength` is just a hint for the framework. The arbitrary above can be read as: _"My algorithm is supposed to work with any string having from 0 to 10k characters"_ which is not equivalent to _"Please check my algorithm with strings from 0 to 10k characters"_ (the old default) — [#2954](https://github.com/dubzzz/fast-check/pull/2954).

Why this change? We believe that properties have to express the contract your algorithm is supposed to follow. In the previous version, the use of `maxLength` has been extensively used to artificially increase the size of the values generated by the framework and not to define the contract, so things like `fc.string({ maxLength: 10_000 })` were like _"Ok, by default fasy-check generates way too small strings for me, I want to go with larger ones so I manually specified a upper bound"_. Now such usages can be replaced by things like: `fc.string({ size: 'xlarge' })` where we tell to the framework to generate extra large entries while we also tell to our reader that the length is not something we care about in our algorithm.

So how do I get the old behaviour now:

- Option 1: use `fc.string({ maxLength: 10_000, size: 'max' })`
- Option 2: use `fc.configureGlobal({ defaultSizeToMaxWhenMaxSpecified: true })`

**Other related issues and PRs**: [#2648](https://github.com/dubzzz/fast-check/issues/2648)

**Guidelines for v2 (≥2.22.0 recommended)**: In v2, when not specified globally we default `defaultSizeToMaxWhenMaxSpecified` to `true`. If you want to preserve the old behaviour you may want to explicitely use Option 2 when goind to v3. If you want to experiment, the new default in v2, you just have to use `fc.configureGlobal({ defaultSizeToMaxWhenMaxSpecified: false })` and you will be running with the same logic as v3 does by default.

## `Arbitrary` API changed ✨👽️

There are many ways you could be impacted by this one, but most of the time it corresponds to pretty advanced usages of the library:

- You call manually `generate` on one of the arbitraries defined by the library
- You implemented the API of `Arbitrary` to define your own arbitrary

While the first case, is one of the possible usages, it's probably not the most important usage making people rely on the API of `Arbitrary`.

The legacy API of `Arbitrary` has been replaced by the API of `NextArbitrary` (referred as `Arbitrary` in v3) — [#2944](https://github.com/dubzzz/fast-check/pull/2944) and [#2945](https://github.com/dubzzz/fast-check/pull/2945). More details on those APIs on the [documentation for advanced arbitraries](https://github.com/dubzzz/fast-check/blob/v2.25.0/documentation/AdvancedArbitraries.md#starting-at-version-2150).

**Other related issues and PRs**: [#1678](https://github.com/dubzzz/fast-check/pull/1678)

**Guidelines for v2 (≥2.15.0 recommended)**: In v2, you can already start to implement the new APIs internally and converting the produced instances when calling runners, properties or arbitraries exposed by v2. Once you adapted your custom arbitraries to the new API, you can convert them to the old one by calling `fc.convertFromNext` or to the new one (if you want to convert an arbitrary defined in the framework) with `fc.convertToNext`. The two converters have been added in v2 to help with the migration, they have been dropped in v3 as the legacy API does not exist anymore in v3.

## Random number generators must follow the new API exposed by `pure-rand` ✨👽️

The PR [#2941](https://github.com/dubzzz/fast-check/pull/2941) drops the support for legacy APIs of `pure-rand`. If you were defining your own random number generator and not using one of the packaged ones, you may probably double-check this change. We basically makes it compulsary for any passed random number generator passed to runner to come with `clone`, `unsafeNext` and `unsafeJump` (if `jump`).

The only users being impacted will be the ones using:

```ts
fc.assert(..., {randomType: (seed) => myRandomForSeed(seed)})
```

**Other related issues and PRs**: [#1953](https://github.com/dubzzz/fast-check/pull/1953), [#1978](https://github.com/dubzzz/fast-check/pull/1978), [#2463](https://github.com/dubzzz/fast-check/pull/2463)

**Guidelines for v2 (≥2.17.0 recommended)**: New API will already be used if exposed inside v2 runner. When receiving a new API the v2 version will just forward it as is to the rest of the code (as v3 does now), but contrary to v3 if it receives a legacy version of the API it wraps it into a new instance exposing the new API to the runners.

## No more defaulting of some constraints 💥

Some arbitraries used to come with hardcoded values for some of their constraints when they were not specified by the user. They tend to use values that differ from what we use for main arbitraries. In an attempt, to use as much as possible the same defaulting strategies throughout our arbitraries, we have dropped some of those defaulted constraints to make them fit with others.

Here is the list of the constraints that got impacted:

- `maxCount` will not longer be defaulted to `5` on `lorem`: it will now use the same defaulting logic as arrays do — [#2952](https://github.com/dubzzz/fast-check/pull/2952)
- `maxKeys` will not longer be defaulted to `5` on object-like arbitraries: it will now use the same defaulting logic as arrays do — [#2951](https://github.com/dubzzz/fast-check/pull/2951)
- `maxDepth` will not longer be defaulted to `2` on object-like arbitraries: it will now be defaulted to infinity to let the object goes as deep as possible with respect to size related constraints — [#2951](https://github.com/dubzzz/fast-check/pull/2951)

## `depthSize` the new name for `depthFactor` 💥👽️

`depthFactor` used to be ambiguous as `0` meant no bias on depth and `+infinity` meant full bias on depth while `'small'` meant lots of bias and `'large'` meant very little bias. As numerical version to bias the depth is mostly targeting very advanced users as we recommend using size-based versions instead, the naming as been updated — [#2951](https://github.com/dubzzz/fast-check/pull/2951).

You are impacted if and only if your codebase is using `depthFactor`, for most of users the change will simply be to rename it to `depthSize` and the code will behave the same way.

For users using `depthFactor` with numerical values — _in other words, `'small'`, `'large'`, `'='` or `'+1'` are all good but `0.1`, `1` and any other numeric values_ — the numeric value will have to be updated as follow: `1` ➜ `1/1` = `1`, `0.1` ➜ `1/0.1` = `10`, `10` ➜ `1/10` = `0.1`... More generally speaking: `depthFactor: n` becomes `depthSize: 1/n`.

## The value returned by the `run` method on properties changed 💥👽️

If you wrote your own `IRawProperty` or made direct calls to `run` on one instance of property, you may have to change your code to handle the new API properly — [#2959](https://github.com/dubzzz/fast-check/pull/2959). The API has also been impacted by [#2942](https://github.com/dubzzz/fast-check/pull/2942).

Side-note: As property is mostly an internal structure used to glue together arbitraries to predicate so that they can be passed altogether to the runner we don't expect too many users having played with it. But as the API has been exposed to our external users and can be extended by them to add extra features on top of existing properties[^5], we prefer to warn them about the change.

[^5]: In fast-check, we implement timeout on properties with a property instance rewrapping a source one.
