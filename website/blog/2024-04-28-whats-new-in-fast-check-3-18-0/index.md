---
title: What's new in fast-check 3.18.0?
authors: [dubzzz]
tags: [what's new, arbitrary]
---

This release introduces some new opt-in options on floating point number arbitraries such as `float` and `double`. They offer simpler ways to only produce non-integer numerical values.

Continue reading to explore the detailed updates it brings.

<!--truncate-->

## The new `noInteger` option

Floating point number arbitraries are responsible to generate any possible floating value. It goes from normal integers, to decimals but also includes special values like: -0, NaN, -∞ and +∞. Until now we offered our users built-in ways not to produce some specific values with options like `noNaN` and `noDefaultInfinity` but nothing for wider sets of values.

With this release we go further and allow users to choose not to generate a wider range of values. We introduced the flag `noInteger` to allow users to drop any integer value from the set of possible values. Before this release, it used to be done in a more manual way on the user's side:

```ts
fc.double().filter((value) => !Number.isInteger(value)); // Before version 3.18.0
```

Since version 3.18.0, users can rely on the shorter and more optimized construct:

```ts
fc.double({ noInteger: true }); // Starting at version 3.18.0
```

## Better web-paths by default

According to the [RFC-3986](https://www.ietf.org/rfc/rfc3986.txt) a web-path could possibly start by `//`. Unfortunately with default options, it used to never be produced by `webPath`:

```ts
fc.statistics(fc.webPath(), (p) => (p.startsWith('//') ? 'with //' : 'without //'), { numRuns: 100_000 });
// without //..100.00%
```

The issue came from the fact that internally our generator for paths was configured in a way that prevented such paths from being built when using the default size. With the default setup, generating too many segments for a path was not feasible, thus we never obtained enough consecutive segments to construct a `//`.

```ts
fc.statistics(fc.webPath({ size: '+1' }), (p) => (p.startsWith('//') ? 'with //' : 'without //'), { numRuns: 100_000 });
// without //..92.67%
// with //......7.33%
```

Starting at 3.18.0, the default configuration for paths will be able to produce paths starting by `//` without having to tweak the size:

```ts
fc.statistics(fc.webPath(), (p) => (p.startsWith('//') ? 'with //' : 'without //'), { numRuns: 100_000 });
// without //..79.75%
// with //.....20.25%
```

## Changelog since 3.17.0

The version 3.18.0 is based on version 3.17.2, but let see what's changed since 3.17.0 itself.

### Features

- ([PR#4917](https://github.com/dubzzz/fast-check/pull/4917)) Add option to produce non-integer on `double`
- ([PR#4923](https://github.com/dubzzz/fast-check/pull/4923)) Add option to produce non-integer on `float`
- ([PR#4935](https://github.com/dubzzz/fast-check/pull/4935)) Produce "//" in web paths

### Fixes

- ([PR#4842](https://github.com/dubzzz/fast-check/pull/4842)) Bug: Fix dual-packages hazard and types incompatibility
- ([PR#4853](https://github.com/dubzzz/fast-check/pull/4853)) CI: Build doc with full git history
- ([PR#4872](https://github.com/dubzzz/fast-check/pull/4872)) CI: Stop caching Jest on CI
- ([PR#4924](https://github.com/dubzzz/fast-check/pull/4924)) CI: Enable more advanced TS flags
- ([PR#4925](https://github.com/dubzzz/fast-check/pull/4925)) CI: Explicitly test against Node 22
- ([PR#4926](https://github.com/dubzzz/fast-check/pull/4926)) CI: Stabilize tests of `double` on small ranges
- ([PR#4836](https://github.com/dubzzz/fast-check/pull/4836)) Doc: Release note for 3.17.0
- ([PR#4844](https://github.com/dubzzz/fast-check/pull/4844)) Doc: Add new contributor patroza
- ([PR#4852](https://github.com/dubzzz/fast-check/pull/4852)) Doc: Show last update time on doc
- ([PR#4851](https://github.com/dubzzz/fast-check/pull/4851)) Doc: Add last modified date to sitemap
- ([PR#4868](https://github.com/dubzzz/fast-check/pull/4868)) Doc: Enhance SEO for homepage
- ([PR#4888](https://github.com/dubzzz/fast-check/pull/4888)) Doc: Add tutorial for PBT with Jest
- ([PR#4901](https://github.com/dubzzz/fast-check/pull/4901)) Doc: Use official doc for npm homepage
- ([PR#4921](https://github.com/dubzzz/fast-check/pull/4921)) Performance: More optimal `noInteger` on `double`
- ([PR#4933](https://github.com/dubzzz/fast-check/pull/4933)) Script: Switch on more eslint rules
- ([PR#4866](https://github.com/dubzzz/fast-check/pull/4866)) Test: Safer rewrite of Poisoning E2E
- ([PR#4871](https://github.com/dubzzz/fast-check/pull/4871)) Test: Move tests to Vitest
- ([PR#4863](https://github.com/dubzzz/fast-check/pull/4863)) Test: Explicitely import from Vitest
- ([PR#4873](https://github.com/dubzzz/fast-check/pull/4873)) Test: Move to v8 for coverage
- ([PR#4875](https://github.com/dubzzz/fast-check/pull/4875)) Test: Better mock/spy cleaning
- ([PR#4922](https://github.com/dubzzz/fast-check/pull/4922)) Test: Cover `noInteger` on `double` via integration layers
