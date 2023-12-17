# 1.2.1

_Better support for `pre` on AVA 6_
[[Code](https://github.com/dubzzz/fast-check/tree/ava%2Fv1.2.1)][[Diff](https://github.com/dubzzz/fast-check/compare/ava%2Fv1.2.0...ava%2Fv1.2.1)]

## Fixes

- ([PR#4543](https://github.com/dubzzz/fast-check/pull/4543)) Bug: Stricter (peer) range definition for ava
- ([PR#4542](https://github.com/dubzzz/fast-check/pull/4542)) Bug: Add support for `pre` on AVA v6

# 1.2.0

_Support pre-condition failures_
[[Code](https://github.com/dubzzz/fast-check/tree/ava%2Fv1.2.0)][[Diff](https://github.com/dubzzz/fast-check/compare/ava%2Fv1.1.6...ava%2Fv1.2.0)]

## Features

- ([PR#4424](https://github.com/dubzzz/fast-check/pull/4424)) Prefer "import type" over raw "import"

## Fixes

- ([PR#4450](https://github.com/dubzzz/fast-check/pull/4450)) Bug: Properly support `fc.pre`, allow unsuccessful plans on unmatched preconditions
- ([PR#4451](https://github.com/dubzzz/fast-check/pull/4451)) Doc: Document distinctions with raw fast-check
- ([PR#4283](https://github.com/dubzzz/fast-check/pull/4283)) Test: Confirm basic typings work well
- ([PR#4449](https://github.com/dubzzz/fast-check/pull/4449)) Test: Extend test coverage to no-assertions cases and observables

# 1.1.6

_Better support for types on ESM targets_
[[Code](https://github.com/dubzzz/fast-check/tree/ava%2Fv1.1.6)][[Diff](https://github.com/dubzzz/fast-check/compare/ava%2Fv1.1.5...ava%2Fv1.1.6)]

## Fixes

- ([PR#4173](https://github.com/dubzzz/fast-check/pull/4173)) Bug: Better declare ESM's types
- ([PR#4033](https://github.com/dubzzz/fast-check/pull/4033)) Tooling: Update formatting

# 1.1.5

_Update URL of the logo_
[[Code](https://github.com/dubzzz/fast-check/tree/ava%2Fv1.1.5)][[Diff](https://github.com/dubzzz/fast-check/compare/ava%2Fv1.1.4...ava%2Fv1.1.5)]

## Fixes

- ([PR#3866](https://github.com/dubzzz/fast-check/pull/3866)) Doc: Update logo url

# 1.1.4

_Attach provenance to the packages_
[[Code](https://github.com/dubzzz/fast-check/tree/ava%2Fv1.1.4)][[Diff](https://github.com/dubzzz/fast-check/compare/ava%2Fv1.1.3...ava%2Fv1.1.4)]

## Fixes

- ([PR#3774](https://github.com/dubzzz/fast-check/pull/3774)) Security: Attach provenance to the packages

# 1.1.3

_Update funding section in package.json_
[[Code](https://github.com/dubzzz/fast-check/tree/ava%2Fv1.1.3)][[Diff](https://github.com/dubzzz/fast-check/compare/ava%2Fv1.1.2...ava%2Fv1.1.3)]

## Fixes

- ([PR#3473](https://github.com/dubzzz/fast-check/pull/3473)) Funding: Re-order links in funding section

# 1.1.2

_Properly define types for TypeScript_
[[Code](https://github.com/dubzzz/fast-check/tree/ava%2Fv1.1.2)][[Diff](https://github.com/dubzzz/fast-check/compare/ava%2Fv1.1.1...ava%2Fv1.1.2)]

## Fixes

- ([PR#3385](https://github.com/dubzzz/fast-check/pull/3385)) Bug: Fix types not being properly exported for ESM

# 1.1.1

_Add GitHub Sponsors link_
[[Code](https://github.com/dubzzz/fast-check/tree/ava%2Fv1.1.1)][[Diff](https://github.com/dubzzz/fast-check/compare/ava%2Fv1.1.0...ava%2Fv1.1.1)]

## Fixes

- ([PR#3316](https://github.com/dubzzz/fast-check/pull/3316)) Funding: Add link to GitHub sponsors in funding
- ([PR#3319](https://github.com/dubzzz/fast-check/pull/3319)) Test: Internalize bundle checks for ava package

# 1.1.0

_Align seed computation with fast-check's one_
[[Code](https://github.com/dubzzz/fast-check/tree/ava%2Fv1.1.0)][[Diff](https://github.com/dubzzz/fast-check/compare/ava%2Fv1.0.2...ava%2Fv1.1.0)]

## Features

- ([PR#3278](https://github.com/dubzzz/fast-check/pull/3278)) Align seed computation with fast-check's one

## Fixes

- ([PR#3280](https://github.com/dubzzz/fast-check/pull/3280)) Bug: Pass the forged seed to the runner
- ([PR#3283](https://github.com/dubzzz/fast-check/pull/3283)) Bug: Fallback on the seed coming from globals if any

---

# 1.0.4

_Properly define types for TypeScript_
[[Code](https://github.com/dubzzz/fast-check/tree/ava%2Fv1.0.4)][[Diff](https://github.com/dubzzz/fast-check/compare/ava%2Fv1.0.3...ava%2Fv1.0.4)]

## Fixes

- ([PR#3385](https://github.com/dubzzz/fast-check/pull/3385)) Bug: Fix types not being properly exported for ESM

# 1.0.3

_Fixes around seed not being passed correctly_
[[Code](https://github.com/dubzzz/fast-check/tree/ava%2Fv1.0.3)][[Diff](https://github.com/dubzzz/fast-check/compare/ava%2Fv1.0.2...ava%2Fv1.0.3)]

## Fixes

- ([PR#3280](https://github.com/dubzzz/fast-check/pull/3280)) Bug: Pass the forged seed to the runner
- ([PR#3283](https://github.com/dubzzz/fast-check/pull/3283)) Bug: Fallback on the seed coming from globals if any

# 1.0.2

_Only keep comments in published typings not in published code_
[[Code](https://github.com/dubzzz/fast-check/tree/ava%2Fv1.0.2)][[Diff](https://github.com/dubzzz/fast-check/compare/ava%2Fv1.0.1...ava%2Fv1.0.2)]

## Fixes

- ([PR#3212](https://github.com/dubzzz/fast-check/pull/3212)) CI: Share `tsconfig.json` across public packages
- ([PR#3213](https://github.com/dubzzz/fast-check/pull/3213)) Script: Factorize production `tsconfig.json`

# 1.0.1

_Add missing export for package.json_
[[Code](https://github.com/dubzzz/fast-check/tree/ava%2Fv1.0.1)][[Diff](https://github.com/dubzzz/fast-check/compare/ava%2Fv1.0.0...ava%2Fv1.0.1)]

## Fixes

- ([PR#3066](https://github.com/dubzzz/fast-check/pull/3066)) Bug: Export package.json

# 1.0.0

_First stable release of `@fast-check/ava`_
[[Code](https://github.com/dubzzz/fast-check/tree/ava%2Fv1.0.0)]

`@fast-check/ava` is replacing `ava-fast-check`. The code moved from [dubzzz/ava-fast-check](https://github.com/dubzzz/ava-fast-check/) to [dubzzz/fast-check](https://github.com/dubzzz/fast-check/) for simpler maintenance.
