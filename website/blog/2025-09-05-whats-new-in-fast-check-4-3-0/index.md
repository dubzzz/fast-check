---
title: What's new in fast-check 4.3.0?
authors: [dubzzz]
tags: [release, infiniteStream, memory, performance]
---

Dealing with potentially infinite data structures can quickly lead to memory issues. Up until now, the arbitrary responsible for generating infinite streams was keeping every generated element in memory for debugging and reporting purposes. While helpful, this behavior could cause unwanted memory growth when users pulled from these streams for a long time. This release introduces a way to avoid that intentional leak.

Continue reading to explore the detailed updates it brings.

<!--truncate-->

## Reduced memory footprint of `infiniteStream`

When generating an instance via the arbitrary `infiniteStream`, used to cache all pulled values until the end of the test. This caching made it able to report the full sequence of values generated during a failing run.

In practice, some of our users don't need this detailed reporting and are fine with simply knowing that an error occurred. Indeed, even without the cached values, failures remain fully reproducible thanks to fast-check’s built-in replay capabilities. Users just have to run the test again with the provided seed and path disclosed on the error.

To opt into the more memory-efficient mode, enable the `noHistory` flag when creating an `infiniteStream`:

```js
fc.infiniteStream({ noHistory: true });
```

## Fix incorrect frequency handling in `fc.option`

This release also solves a long-standing bug in `fc.option`.

When a custom frequency was provided, the behavior did not match the documentation. According to it, the probability of generating a nil value should be `1 / freq`. However, the past implementation used `1 / (freq + 1)`.

With this release, `fc.option` now correctly follows the documented behavior.

## Changelog since 4.2.0

The version 4.3.0 is based on version 4.2.0.

### Features

- ([PR#6107](https://github.com/dubzzz/fast-check/pull/6107)) Add 'history' parameter to infiniteStream

### Fixes

- ([PR#6118](https://github.com/dubzzz/fast-check/pull/6118)) Bug: Fix `fc.option` nil frequency
- ([PR#6046](https://github.com/dubzzz/fast-check/pull/6046)) CI: Skip expensive CI checks on Windows runner
- ([PR#6120](https://github.com/dubzzz/fast-check/pull/6120)) CI: Avoid specs to run against Node >=24.6.0
- ([PR#6128](https://github.com/dubzzz/fast-check/pull/6128)) CI: Toggle ON experimental-cli on Prettier
- ([PR#6127](https://github.com/dubzzz/fast-check/pull/6127)) CI: Move to trusted publishing to NPM
- ([PR#6129](https://github.com/dubzzz/fast-check/pull/6129)) CI: Toggle ON concurrency on ESLint
- ([PR#6060](https://github.com/dubzzz/fast-check/pull/6060)) CI: Rework configuration of Vitest
- ([PR#6058](https://github.com/dubzzz/fast-check/pull/6058)) Doc: Release note for version 4.2.0
- ([PR#6131](https://github.com/dubzzz/fast-check/pull/6131)) Doc: Add new contributor dmurvihill
- ([PR#6038](https://github.com/dubzzz/fast-check/pull/6038)) Script: Update `ignoredBuiltDependencies`
- ([PR#6059](https://github.com/dubzzz/fast-check/pull/6059)) Test: Drop unneeded retries for Node 23
- ([PR#6119](https://github.com/dubzzz/fast-check/pull/6119)) Typings: Add union type overloads for nat() and bigInt()
