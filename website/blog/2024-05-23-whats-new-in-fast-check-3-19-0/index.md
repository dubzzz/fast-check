---
title: What's new in fast-check 3.19.0?
authors: [dubzzz]
tags: [what's new, arbitrary]
---

This release introduces new opt-in options for objects arbitraries such as `anything`, `object`, `json` and `jsonValue`. These options provide more elegant and shorter ways to produce objects with non-ASCII keys and values.

Continue reading to explore the detailed updates it brings.

<!--truncate-->

## The new `withUnicodeString` and `noUnicodeString` options

Handling Unicode strings properly is a challenging task. It is often overlooked when writing code, even when the code deals with strings.

Recently, fast-check uncovered a bug related to Unicode in [Vitest](https://vitest.dev/). During our migration to Vitest, we encountered an issue with one of our snapshot tests. The generated snapshot always required regeneration, as if the name of the snapshot changed from one run to another. After some investigations, iwe discovered that the issue was related to Unicode strings being improperly truncated when generating the snapshot name. Although this bug was not directly uncovered by fast-check, it could have been detected with its help. Unfortunately, writing such tests in version 3.18.0 required users to manipulate advanced options on `fc.anything` and made it uneasy.

This release makes Unicode strings a first-class citizen for objects-related arbitraries. As a result, it should be easier for users to generate objects with Unicode strings.

## Why `withUnicodeString` and `noUnicodeString`?

Our long-term plan is to activate all options by default, adopting a `noOptionName` naming convention for options rather than `withOptionName`. Unfortunately this change is challenging for `object` and `anything`, and we are still uncertain regarding how we would handle them.

Therefore, we used the `withOptionName` convention on `object` and `anything`, as it aligns with their existing naming convention. For `json` and `jsonValue`, we decided to follow our long-term target and opted for a `noOptionName` approach. Currently, the boolean flag defaults to `true` as we did not want to introduce a behavior change for our clients. However, this default will be changed to `false` in the next major release of fast-check.

## Changelog since 3.18.0

The version 3.19.0 is based on version 3.18.0.

### Features

- ([PR#5010](https://github.com/dubzzz/fast-check/pull/5010)) Add option to generate unicode values in `object`
- ([PR#5011](https://github.com/dubzzz/fast-check/pull/5011)) Add option to generate unicode values in `json`

### Fixes

- ([PR#4981](https://github.com/dubzzz/fast-check/pull/4981)) Bug: Better interrupt between multiple versions
- ([PR#4984](https://github.com/dubzzz/fast-check/pull/4984)) CI: Rework issue template
- ([PR#4941](https://github.com/dubzzz/fast-check/pull/4941)) Doc: Publish release note for 3.18.0
- ([PR#4982](https://github.com/dubzzz/fast-check/pull/4982)) Script: Shorter bump command
