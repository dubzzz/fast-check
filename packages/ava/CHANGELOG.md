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
