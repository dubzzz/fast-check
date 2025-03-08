# 0.2.3

_TODO Description_
[[Code](https://github.com/dubzzz/fast-check/tree/poisoning%2Fv0.2.3)][[Diff](https://github.com/dubzzz/fast-check/compare/poisoning%2Fv0.2.2...poisoning%2Fv0.2.3)]

## Features



## Fixes

- ([PR#5809](https://github.com/dubzzz/fast-check/pull/5809)) CI: Update tsconfig to ES2020

# 0.2.2

_Rework our testing stack_
[[Code](https://github.com/dubzzz/fast-check/tree/poisoning%2Fv0.2.2)][[Diff](https://github.com/dubzzz/fast-check/compare/poisoning%2Fv0.2.1...poisoning%2Fv0.2.2)]

## Fixes

- ([PR#5353](https://github.com/dubzzz/fast-check/pull/5353)) CI: Move to Vitest

# 0.2.1

_Export missing types_
[[Code](https://github.com/dubzzz/fast-check/tree/poisoning%2Fv0.2.1)][[Diff](https://github.com/dubzzz/fast-check/compare/poisoning%2Fv0.2.0...poisoning%2Fv0.2.1)]

## Fixes

- ([PR#5202](https://github.com/dubzzz/fast-check/pull/5202)) Refactor: Add missing types on exported

# 0.2.0

_Declare root of the package as ESM_
[[Code](https://github.com/dubzzz/fast-check/tree/poisoning%2Fv0.2.0)][[Diff](https://github.com/dubzzz/fast-check/compare/poisoning%2Fv0.1.0...poisoning%2Fv0.2.0)]

## Breaking changes

- ([PR#4584](https://github.com/dubzzz/fast-check/pull/4584)) CI: Move build chain to ESM

## Fixes

- ([PR#4602](https://github.com/dubzzz/fast-check/pull/4602)) CI: Migrate jest to esm

---

# 0.1.0

_Lighter import with less internals to load_
[[Code](https://github.com/dubzzz/fast-check/tree/poisoning%2Fv0.1.0)][[Diff](https://github.com/dubzzz/fast-check/compare/poisoning%2Fv0.0.8...poisoning%2Fv0.1.0)]

## Features

- ([PR#4421](https://github.com/dubzzz/fast-check/pull/4421)) Prefer "import type" over raw "import"

## Fixes

- ([PR#4286](https://github.com/dubzzz/fast-check/pull/4286)) Test: Confirm basic typings work well

---

# 0.0.8

_Better support for types on ESM targets_
[[Code](https://github.com/dubzzz/fast-check/tree/poisoning%2Fv0.0.8)][[Diff](https://github.com/dubzzz/fast-check/compare/poisoning%2Fv0.0.7...poisoning%2Fv0.0.8)]

## Fixes

- ([PR#4176](https://github.com/dubzzz/fast-check/pull/4176)) Bug: Better declare ESM's types
- ([PR#4033](https://github.com/dubzzz/fast-check/pull/4033)) Tooling: Update formatting

# 0.0.7

_Add logo on the README_
[[Code](https://github.com/dubzzz/fast-check/tree/poisoning%2Fv0.0.7)][[Diff](https://github.com/dubzzz/fast-check/compare/poisoning%2Fv0.0.6...poisoning%2Fv0.0.7)]

## Fixes

- ([PR#3873](https://github.com/dubzzz/fast-check/pull/3873)) Doc: Add poisoning logo url

# 0.0.6

_Attach provenance to the packages_
[[Code](https://github.com/dubzzz/fast-check/tree/poisoning%2Fv0.0.6)][[Diff](https://github.com/dubzzz/fast-check/compare/poisoning%2Fv0.0.5...poisoning%2Fv0.0.6)]

## Fixes

- ([PR#3774](https://github.com/dubzzz/fast-check/pull/3774)) Security: Attach provenance to the packages

# 0.0.5

_Add support for Node 18_
[[Code](https://github.com/dubzzz/fast-check/tree/poisoning%2Fv0.0.5)][[Diff](https://github.com/dubzzz/fast-check/compare/poisoning%2Fv0.0.4...poisoning%2Fv0.0.5)]

## Fixes

- ([PR#3421](https://github.com/dubzzz/fast-check/pull/3421)) Bug: Switch from descriptors to descriptor for Node 18
- ([PR#3473](https://github.com/dubzzz/fast-check/pull/3473)) Funding: Re-order links in funding section

# 0.0.4

_Properly define types for TypeScript_
[[Code](https://github.com/dubzzz/fast-check/tree/poisoning%2Fv0.0.4)][[Diff](https://github.com/dubzzz/fast-check/compare/poisoning%2Fv0.0.3...poisoning%2Fv0.0.4)]

## Fixes

- ([PR#3387](https://github.com/dubzzz/fast-check/pull/3387)) Bug: Fix types not being properly exported for ESM

# 0.0.3

_Faster computation of diffs when filters apply_
[[Code](https://github.com/dubzzz/fast-check/tree/poisoning%2Fv0.0.3)][[Diff](https://github.com/dubzzz/fast-check/compare/poisoning%2Fv0.0.2...poisoning%2Fv0.0.3)]

## Features

- ([PR#3318](https://github.com/dubzzz/fast-check/pull/3318)) Do not recompute ignore globals for attributes

## Fixes

- ([PR#3316](https://github.com/dubzzz/fast-check/pull/3316)) Funding: Add link to GitHub sponsors in funding
- ([PR#3317](https://github.com/dubzzz/fast-check/pull/3317)) Performance: Faster diff tracking with pre-filtering of uneligible

# 0.0.2

_Add ability to omit some instances when checking for poisoning_
[[Code](https://github.com/dubzzz/fast-check/tree/poisoning%2Fv0.0.2)][[Diff](https://github.com/dubzzz/fast-check/compare/poisoning%2Fv0.0.1...poisoning%2Fv0.0.2)]

## Features

- ([PR#3160](https://github.com/dubzzz/fast-check/pull/3160)) Adopt shorter names for labels of globals
- ([PR#3176](https://github.com/dubzzz/fast-check/pull/3176)) Do not track private globals
- ([PR#3198](https://github.com/dubzzz/fast-check/pull/3198)) Add ability to ignore some roots
- ([PR#3199](https://github.com/dubzzz/fast-check/pull/3199)) Also track roots starting by "\_"

## Fixes

- ([PR#3188](https://github.com/dubzzz/fast-check/pull/3188)) Bug: Compute smallest depth for each global
- ([PR#3193](https://github.com/dubzzz/fast-check/pull/3193)) Bug: Even more resiliency against poisoning
- ([PR#3195](https://github.com/dubzzz/fast-check/pull/3195)) Refactor: Keep track of root ancestors
- ([PR#3213](https://github.com/dubzzz/fast-check/pull/3213)) Script: Factorize production `tsconfig.json`
- ([PR#3095](https://github.com/dubzzz/fast-check/pull/3095)) Test: Test against direct updates of globals
- ([PR#3159](https://github.com/dubzzz/fast-check/pull/3159)) Test: Check captured name for globals

# 0.0.1

_First experimental release of `@fast-check/poisoning`_
[[Code](https://github.com/dubzzz/fast-check/tree/poisoning%2Fv0.0.1)]
