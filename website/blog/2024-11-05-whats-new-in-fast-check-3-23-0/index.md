---
title: What's new in fast-check 3.23.0?
authors: [dubzzz]
tags: [release, strings, unicode, performance]
---

The previous release introduced the `unit` concept to the string arbitraries, enhancing control over string generation. In version 3.23.0, we’ve extended this feature to even more arbitraries, broadening its applicability. This update also includes several performance optimizations to make your testing faster and more efficient.

Continue reading to explore the detailed updates it brings.

<!--truncate-->

## Polyglot `string` to the next level

Polyglot string was introduced in [version 3.22.0 of fast-check](/blog/2024/08/29/whats-new-in-fast-check-3-22-0/#polyglot-string), allowing for more diverse string generation. In this release, we've extended the unit option to several additional arbitraries:

- `anything`
- `json`
- `object`

With this change, we recommend using the new `stringUnit` constraint to specify the type of characters you'd like in generated JSONs, objects, and other structures. The new syntax is as follows:

```ts
fc.json({ stringUnit: 'grapheme' });
```

## Dichotomic search in `mapToConstant`

The `mapToConstant` arbitrary provides an easy-to-use API for generating values based on an index. Our documentation includes an example that shows how to create an arbitrary to generate characters from `a` to `z` and numbers from `0` to `9`:

```ts
fc.mapToConstant(
  { num: 26, build: (v) => String.fromCharCode(v + 0x61) },
  { num: 10, build: (v) => String.fromCharCode(v + 0x30) },
);
// Examples of generated values: "6", "8", "d", "9", "r"…
```

This arbitrary is actually more central to the library than it might seem at first glance. It’s a core building block backing the `string` arbitrary and playing a crucial role in the codebase. Given its importance, maximizing its efficiency is essential.

When benchmarking different variations of `string` with various `unit` values, we noticed a significant performance disparity: the `grapheme` unit was significantly slower than the `grapheme-ascii` unit. We traced this slowdown to a linear search within the `mapToConstant` implementation, where each call to `generate` involved looking up the right `build` function. Initially, our code looked something like this:

```ts
function buildForChoiceIndex(choiceIndex: number) {
  let idx = -1;
  let numSkips = 0;
  while (choiceIndex >= numSkips) {
    numSkips += entries[++idx].num;
  }
  return entries[idx].build(choiceIndex - numSkips + entries[idx].num);
}
```

Unfortunately, this approach has poor performance due to its linear complexity. For small entries arrays (like in our example with just two entries), the impact is minimal. However, for larger entries arrays (as with `grapheme`), this linear complexity results in significant slowdowns, as each lookup’s average time increases in proportion to the number of entries.

To improve this, we introduced a new `start` field to each entry (only internally), marking the starting index for each range. Applied to our example, the entries now look like this:

```ts
const entries = [
  { start: 0, num: 26, build: (v) => String.fromCharCode(v + 0x61) },
  { start: 26, num: 10, build: (v) => String.fromCharCode(v + 0x30) },
];
```

With this additional information, we can perform a dichotomic search to locate the correct `build` function. Instead of iterating through each entry, we can efficiently narrow down the search range, achieving logarithmic complexity. Here’s the updated implementation:

```ts
function buildForChoiceIndex(choiceIndex: number) {
  let min = 0;
  let max = entries.length;
  while (max - min > 1) {
    const mid = Math.floor((min + max) / 2);
    if (choiceIndex < entries[mid].from) {
      max = mid;
    } else {
      min = mid;
    }
  }
  return entries[min].build(choiceIndex - entries[min].start + entries[min].num);
}
```

This optimization yielded a performance improvement from 1,800 operations per second to 3,700 operations per second for the following code:

```ts
fc.assert(fc.property(fc.string({ unit: 'grapheme' }), (s) => true));
```

While 1,800 operations per second may already sound substantial, the impact becomes more noticeable in real-world applications where multiple strings are generated in combination, such as arrays of strings or objects with string properties. This improvement can make a tangible difference in CI performance.

For more details on this change, take a look at the [PR#5386](https://github.com/dubzzz/fast-check/pull/5386). We also applied a similar optimization to reduce the cost of `canShrinkWithoutContext` on `constant`, where we replaced a linear search with direct access, as described in [PR#5372](https://github.com/dubzzz/fast-check/pull/5372).

## Cached computations for faster instantiation

Our next set of performance optimizations focused on reducing the cost of instantiating the `string` arbitrary. In version 3.22.0, this cost was still relatively high — _and for good reason_.

By default, the `string` arbitrary in fast-check can generate values such as `__proto__` and key, among others. To achieve this, we need to confirm that these specific values are valid outputs of the generator. This requires checking if `__proto__` or other reserved values could actually be produced by `string({ unit })`, where `unit` might be something like `constantFrom('a', 'b', 'c')` or even more complex. This validation step is computationally intensive.

To improve efficiency, we realized that for a given `unit`, the set of acceptable strings remains consistent across calls to `string({ unit })`. Based on this, we implemented a caching mechanism backed by a `WeakMap`, with the arbitrary linked to the specified `unit` used as the cache key.

This change led to a dramatic improvement, boosting instantiation performance from 20,000 instances per second to 260,000 instances per second.

These optimizations are detailed in [PR#5387](https://github.com/dubzzz/fast-check/pull/5387), [PR#5388](https://github.com/dubzzz/fast-check/pull/5388) and [PR#5389](https://github.com/dubzzz/fast-check/pull/5389).

## Changelog since 3.22.0

The version 3.23.0 is based on version 3.22.0.

### Features

- ([PR#5366](https://github.com/dubzzz/fast-check/pull/5366)) Add support for string-`unit` on `object`/`anything` arbitrary
- ([PR#5367](https://github.com/dubzzz/fast-check/pull/5367)) Add support for string-`unit` on `json` arbitrary
- ([PR#5390](https://github.com/dubzzz/fast-check/pull/5390)) Add back strong unmapping capabilities to `string`

### Fixes

- ([PR#5327](https://github.com/dubzzz/fast-check/pull/5327)) Bug: Resist even more to external poisoning for `string`
- ([PR#5368](https://github.com/dubzzz/fast-check/pull/5368)) Bug: Better support for poisoning on `stringMatching`
- ([PR#5344](https://github.com/dubzzz/fast-check/pull/5344)) CI: Adapt some tests for Node v23
- ([PR#5346](https://github.com/dubzzz/fast-check/pull/5346)) CI: Drop usages of `it.concurrent` due to Node 23 failing
- ([PR#5363](https://github.com/dubzzz/fast-check/pull/5363)) CI: Move to Vitest for `examples/`
- ([PR#5391](https://github.com/dubzzz/fast-check/pull/5391)) CI: Preview builds using `pkg.pr.new`
- ([PR#5392](https://github.com/dubzzz/fast-check/pull/5392)) CI: Connect custom templates to `pkg.pr.new` previews
- ([PR#5394](https://github.com/dubzzz/fast-check/pull/5394)) CI: Install dependencies before building changesets
- ([PR#5396](https://github.com/dubzzz/fast-check/pull/5396)) CI: Proper commit name on changelogs
- ([PR#5393](https://github.com/dubzzz/fast-check/pull/5393)) Clean: Drop unused `examples/jest.setup.js`
- ([PR#5249](https://github.com/dubzzz/fast-check/pull/5249)) Doc: Release note for fast-check 3.22.0
- ([PR#5369](https://github.com/dubzzz/fast-check/pull/5369)) Doc: Typo fix in model-based-testing.md
- ([PR#5370](https://github.com/dubzzz/fast-check/pull/5370)) Doc: Add new contributor jamesbvaughan
- ([PR#5383](https://github.com/dubzzz/fast-check/pull/5383)) Doc: Properly indent code snippets for the documentation
- ([PR#5372](https://github.com/dubzzz/fast-check/pull/5372)) Performance: Faster `canShrinkWithoutContext` for constants
- ([PR#5386](https://github.com/dubzzz/fast-check/pull/5386)) Performance: Faster generate process for `mapToConstant`
- ([PR#5387](https://github.com/dubzzz/fast-check/pull/5387)) Performance: Faster tokenizer of strings
- ([PR#5388](https://github.com/dubzzz/fast-check/pull/5388)) Performance: Faster initialization of `string` with faster slices
- ([PR#5389](https://github.com/dubzzz/fast-check/pull/5389)) Performance: Faster initialization of `string` with pre-cached slices
- ([PR#5371](https://github.com/dubzzz/fast-check/pull/5371)) Test: Add extra set of tests for `constant*`
