---
title: What's new in fast-check 4.4.0?
authors: [dubzzz]
tags: [what's new, arbitrary, collection]
---

We expand fast-check's collection of arbitraries with two data structures: `Map` and `Set`. These native collections are now first-class citizens in fast-check, making it easier to test code that relies on them. We've also improved the flexibility of `fc.dictionary` to support the full range of property keys.

Continue reading to explore the detailed updates it brings.

<!--truncate-->

## New `fc.map` arbitrary

With this release, fast-check now provides a dedicated `fc.map` arbitrary for generating JavaScript's `Map`.

The new arbitrary works similarly to `fc.dictionary` and `fc.object`, accepting key and value arbitraries:

```js
// Generate a map with string keys and number values
fc.map(fc.string(), fc.nat());

// Generate a map with specific constraints
fc.map(fc.string(), fc.nat(), { minKeys: 1, maxKeys: 10 });
```

Like other arbitraries in fast-check, `fc.map` comes with sensible defaults while allowing you to customize it deeply.

## New `fc.set` arbitrary

Alongside `Map`, we're also introducing `fc.set` for generating instances of JavaScript `Set`.

```js
// Generate a set of strings
fc.set(fc.string());

// Generate a set with size constraints
fc.set(fc.nat(), { minLength: 2, maxLength: 20 });
```

The `fc.set` arbitrary ensures all elements in the generated set are unique according to equality semantics of a `Set`.

## Full `PropertyKey` support in `fc.dictionary`

Prior to this release, `fc.dictionary` only supported string keys. However, JavaScript objects can have properties keyed by strings, numbers, or symbols. With 4.4.0, `fc.dictionary` now accepts the full range of property keys.

## Changelog since 4.3.0

The version 4.4.0 is based on version 4.3.0.

### Features

- ([PR#6232](https://github.com/dubzzz/fast-check/pull/6232)) Support full `PropertyKey` in `fc.dictionary(...)`
- ([PR#6267](https://github.com/dubzzz/fast-check/pull/6267)) Add `fc.map` arbitrary
- ([PR#6040](https://github.com/dubzzz/fast-check/pull/6040)) Add `circular` option to `fc.letrec`
- ([PR#6270](https://github.com/dubzzz/fast-check/pull/6270)) Add `fc.set` arbitrary
- ([PR#6334](https://github.com/dubzzz/fast-check/pull/6334)) REVERT-6040: Self-referencing capabilities from `letrec`

### Fixes

- ([PR#6138](https://github.com/dubzzz/fast-check/pull/6138)) CI: Force OTP at publication time
- ([PR#6170](https://github.com/dubzzz/fast-check/pull/6170)) CI: Stop running tests against Windows
- ([PR#6178](https://github.com/dubzzz/fast-check/pull/6178)) CI: Add GH Action to reformat code in PRs or branches
- ([PR#6205](https://github.com/dubzzz/fast-check/pull/6205)) CI: Add GH Action to add contributors to the project
- ([PR#6246](https://github.com/dubzzz/fast-check/pull/6246)) CI: Fix PR mode in format-pr workflow
- ([PR#6184](https://github.com/dubzzz/fast-check/pull/6184)) CI: Add provenance attestation to npm package publishing
- ([PR#6248](https://github.com/dubzzz/fast-check/pull/6248)) CI: Add workflow to resolve pnpm lock file merge conflicts on PRs
- ([PR#6251](https://github.com/dubzzz/fast-check/pull/6251)) CI: Restrict Format workflow to PRs
- ([PR#6253](https://github.com/dubzzz/fast-check/pull/6253)) CI: Fix PR number type in workflows
- ([PR#6254](https://github.com/dubzzz/fast-check/pull/6254)) CI: Fix PR workflows
- ([PR#6255](https://github.com/dubzzz/fast-check/pull/6255)) CI: Fix PNPM conflicts workflow
- ([PR#6256](https://github.com/dubzzz/fast-check/pull/6256)) CI: Scope permissions of PR Format to job
- ([PR#6257](https://github.com/dubzzz/fast-check/pull/6257)) CI: Scope permissions of PR PNPM to job
- ([PR#6258](https://github.com/dubzzz/fast-check/pull/6258)) CI: Job level permissions for add contributor
- ([PR#6269](https://github.com/dubzzz/fast-check/pull/6269)) CI: Add GitHub Action to validate PR titles
- ([PR#6281](https://github.com/dubzzz/fast-check/pull/6281)) CI: Add back Windows runners for tests
- ([PR#6280](https://github.com/dubzzz/fast-check/pull/6280)) CI: Add back latest node for tests
- ([PR#6282](https://github.com/dubzzz/fast-check/pull/6282)) CI: Bump test matrix to Node 24
- ([PR#6283](https://github.com/dubzzz/fast-check/pull/6283)) CI: Shard tests producing coverage
- ([PR#6301](https://github.com/dubzzz/fast-check/pull/6301)) CI: Downgrade node in tests
- ([PR#6300](https://github.com/dubzzz/fast-check/pull/6300)) CI: Enforce trust-policy for pnpm
- ([PR#6307](https://github.com/dubzzz/fast-check/pull/6307)) CI: Add back latest Node in test matrix
- ([PR#6136](https://github.com/dubzzz/fast-check/pull/6136)) Doc: Release note for version 4.3.0
- ([PR#6169](https://github.com/dubzzz/fast-check/pull/6169)) Doc: Preserve links on Sponsors for the website
- ([PR#6172](https://github.com/dubzzz/fast-check/pull/6172)) Doc: Update CSP to properly display sponsors.svg
- ([PR#6173](https://github.com/dubzzz/fast-check/pull/6173)) Doc: Update CSP to properly display sponsors.svg
- ([PR#6174](https://github.com/dubzzz/fast-check/pull/6174)) Doc: Better support of mobile display for sponsors
- ([PR#6175](https://github.com/dubzzz/fast-check/pull/6175)) Doc: Better accessibility on website
- ([PR#6192](https://github.com/dubzzz/fast-check/pull/6192)) Doc: Add `@traversable/zod-test` to ecosystem
- ([PR#6204](https://github.com/dubzzz/fast-check/pull/6204)) Doc: Add ahrjarrett as doc contributor
- ([PR#6238](https://github.com/dubzzz/fast-check/pull/6238)) Doc: Add jamesbvaughan as code contributor
- ([PR#6250](https://github.com/dubzzz/fast-check/pull/6250)) Doc: Add GitHub Copilot instructions for gitmoji PR naming convention
- ([PR#6180](https://github.com/dubzzz/fast-check/pull/6180)) Doc: Generate llms.txt and related for AI crawlers
- ([PR#6279](https://github.com/dubzzz/fast-check/pull/6279)) Doc: Add emilianbold as code contributor
- ([PR#6287](https://github.com/dubzzz/fast-check/pull/6287)) Doc: Fix example in quick start guide
- ([PR#6288](https://github.com/dubzzz/fast-check/pull/6288)) Doc: Add russbiggs as doc contributor
- ([PR#6278](https://github.com/dubzzz/fast-check/pull/6278)) Performance: Use Math.imul and shifts in perf-critical paths
- ([PR#6275](https://github.com/dubzzz/fast-check/pull/6275)) Refactor: Remove unnecessary npm install steps from publish workflows
- ([PR#6311](https://github.com/dubzzz/fast-check/pull/6311)) Refactor: Factorize `letrec` implementations
- ([PR#6318](https://github.com/dubzzz/fast-check/pull/6318)) Refactor: Extract logic building lazy arbs
- ([PR#6320](https://github.com/dubzzz/fast-check/pull/6320)) Refactor: Iterate on own props array in `letrec`
- ([PR#6321](https://github.com/dubzzz/fast-check/pull/6321)) Refactor: Explicit null check in `LazyArbitrary`
- ([PR#6277](https://github.com/dubzzz/fast-check/pull/6277)) Script: Fix script updating the documentation for fast-check
