# 1.0.0

_TODO Description_
[[Code](https://github.com/dubzzz/fast-check/tree/jest%2Fv1.0.0)][[Diff](https://github.com/dubzzz/fast-check/compare/jest%2Fv0.0.1...jest%2Fv1.0.0)]

## Features

- ([PR#2975](https://github.com/dubzzz/fast-check/pull/2975)) Sanitize constraints used internally by "oneof" as much as possible
- ([PR#3048](https://github.com/dubzzz/fast-check/pull/3048)) Add experimental "custom slices" constraint on array
- ([PR#3043](https://github.com/dubzzz/fast-check/pull/3043)) Generate dangerous strings by default

## Fixes

- ([PR#3049](https://github.com/dubzzz/fast-check/pull/3049)) Bug: Fix out-of-range in `SlicedBasedGenerator`
- ([PR#3050](https://github.com/dubzzz/fast-check/pull/3050)) Bug: Allow strange keys as keys of dictionary
- ([PR#3051](https://github.com/dubzzz/fast-check/pull/3051)) Bug: Better rounding in `statistics`
- ([PR#3052](https://github.com/dubzzz/fast-check/pull/3052)) CI: Add missing Ubuntu env for e2e
- ([PR#3058](https://github.com/dubzzz/fast-check/pull/3058)) CI: Prepare 1.x for `@fast-check/{ava,jest}`
- ([PR#3047](https://github.com/dubzzz/fast-check/pull/3047)) Refactor: Implement sliced based generator for arrays
- ([PR#3059](https://github.com/dubzzz/fast-check/pull/3059)) Script: Add links to buggy PRs in changelog PR
- ([PR#3060](https://github.com/dubzzz/fast-check/pull/3060)) Script: Only commit `package.json` corresponding to impacted CHANGELOGs

---

# 1.0.0

_First stable release of `@fast-check/jest`_
[[Code](https://github.com/dubzzz/fast-check/tree/jest%2Fv1.0.0)]

`@fast-check/jest` is replacing `jest-fast-check`. The code moved from [dubzzz/jest-fast-check](https://github.com/dubzzz/jest-fast-check/) to [dubzzz/fast-check](https://github.com/dubzzz/fast-check/) for simpler maintenance.
