---
title: What's new in fast-check 3.20.0?
authors: [dubzzz]
tags: [what's new, arbitrary]
---

This release introduces new arbitraries to enhance shrinking capabilities and deprecates the `noShrink` and `noBias` methods in favor of these new arbitraries.

Continue reading to explore the detailed updates it brings.

<!--truncate-->

## Bye bye `Arbitrary.prototype.noBias`

The `Arbitrary.prototype.noBias` method is deprecated in favor of the new `fc.noBias`. Starting from version 3.20.0, users should use:

```ts
fc.noBias(anyArbitrary);
```

Instead of:

```ts
anyArbitrary.noBias();
```

## Bye bye `Arbitrary.prototype.noShrink`

Similarly, the `Arbitrary.prototype.noShrink` method is deprecated. Users should now use:

```ts
fc.noShrink(anyArbitrary);
```

Instead of:

```ts
anyArbitrary.noShrink();
```

## Better control of shrinking depth

Version 3.20.0 introduces a new arbitrary that provides better control over the shrinking capabilities of an arbitrary. Previously, users could either do nothing or disable shrinking altogether. The new `fc.limitShrink` arbitrary allows users to limit the number of shrink values for a given arbitrary.

Users can now easily restrict the shrinking capabilities of an existing arbitrary by calling:

```ts
fc.limitShrink(anyArbitrary, 4); // here we limit the shrinker of anyArbitrary to produce at most 4 values
```

:::warning Avoid limiting shrinking capabilities
Although limiting the shrinking capabilities can speed up your CI when failures occur, we do not recommend this approach to be the default. Instead, if you want to reduce the shrinking time for automated jobs or local runs, consider using `endOnFailure` or `interruptAfterTimeLimit`.

The only potentially legitimate use of limiting shrinking is when creating new complex arbitraries. In such cases, limiting some less relevant parts may help preserve shrinking capabilities without requiring exhaustive coverage of the shrinker.
:::

## Changelog since 3.19.0

The version 3.20.0 is based on version 3.19.0.

### Features

- ([PR#5047](https://github.com/dubzzz/fast-check/pull/5047)) Introduce new `fc.noShrink` arbitrary
- ([PR#5050](https://github.com/dubzzz/fast-check/pull/5050)) Introduce new `fc.noBias` arbitrary
- ([PR#5006](https://github.com/dubzzz/fast-check/pull/5006)) Add ability to limit shrink path
- ([PR#5112](https://github.com/dubzzz/fast-check/pull/5112)) Simplify `limitShrink` before releasing

### Fixes

- ([PR#5013](https://github.com/dubzzz/fast-check/pull/5013)) CI: Drop verbosity flag at unpack step in CI
- ([PR#5074](https://github.com/dubzzz/fast-check/pull/5074)) CI: Check types with multiple TypeScript
- ([PR#5015](https://github.com/dubzzz/fast-check/pull/5015)) Doc: Release note for 3.19.0
- ([PR#5016](https://github.com/dubzzz/fast-check/pull/5016)) Doc: Fix typo in the PR template
- ([PR#4858](https://github.com/dubzzz/fast-check/pull/4858)) Doc: Update Getting Started section in docs
- ([PR#5035](https://github.com/dubzzz/fast-check/pull/5035)) Doc: Remove duplicate paragraph in `your-first-race-condition-test.mdx`
- ([PR#5048](https://github.com/dubzzz/fast-check/pull/5048)) Doc: Add new contributors cindywu and nmay231
- ([PR#5097](https://github.com/dubzzz/fast-check/pull/5097)) Doc: Add warning on `noShrink`
- ([PR#5121](https://github.com/dubzzz/fast-check/pull/5121)) Doc: Document integration with other test runners
