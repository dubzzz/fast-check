# 1.3.1

_TODO Description_
[[Code](https://github.com/dubzzz/fast-check/tree/jest%2Fv1.3.1)][[Diff](https://github.com/dubzzz/fast-check/compare/jest%2Fv1.3.0...jest%2Fv1.3.1)]

## Features

- ([PR#3349](https://github.com/dubzzz/fast-check/pull/3349)) Wrongly typed `itProp` when receiving `examples`

## Fixes

- ([PR#3345](https://github.com/dubzzz/fast-check/pull/3345)) Doc: Fix dead link in readme

# 1.3.0

_Support for new `--seed` feature of Jest_
[[Code](https://github.com/dubzzz/fast-check/tree/jest%2Fv1.3.0)][[Diff](https://github.com/dubzzz/fast-check/compare/jest%2Fv1.2.0...jest%2Fv1.3.0)]

## Features

- ([PR#3332](https://github.com/dubzzz/fast-check/pull/3332)) Take seed coming from Jest whenever provided

## Fixes

- ([PR#3316](https://github.com/dubzzz/fast-check/pull/3316)) Funding: Add link to GitHub sponsors in funding
- ([PR#3333](https://github.com/dubzzz/fast-check/pull/3333)) Doc: Add new recommendations around Jest and `--show-seed`
- ([PR#3315](https://github.com/dubzzz/fast-check/pull/3315)) Test: Internalize bundle checks for jest package

---

# 1.2.0

_Align seed computation with fast-check's one_
[[Code](https://github.com/dubzzz/fast-check/tree/jest%2Fv1.2.0)][[Diff](https://github.com/dubzzz/fast-check/compare/jest%2Fv1.1.0...jest%2Fv1.2.0)]

## Features

- ([PR#3277](https://github.com/dubzzz/fast-check/pull/3277)) Align seed computation with fast-check's one

## Fixes

- ([PR#3279](https://github.com/dubzzz/fast-check/pull/3279)) Bug: Pass the forged seed to the runner
- ([PR#3281](https://github.com/dubzzz/fast-check/pull/3281)) Bug: Fallback on the seed coming from globals if any
- ([PR#3282](https://github.com/dubzzz/fast-check/pull/3282)) Test: Rewrite tests of `@fast-check/jest`
- ([PR#3284](https://github.com/dubzzz/fast-check/pull/3284)) Test: Faster tests without `babel-jest`

---

# 1.1.0

_Support more variants of `it`_
[[Code](https://github.com/dubzzz/fast-check/tree/jest%2Fv1.1.0)][[Diff](https://github.com/dubzzz/fast-check/compare/jest%2Fv1.0.1...jest%2Fv1.1.0)]

## Features

- ([PR#3203](https://github.com/dubzzz/fast-check/pull/3203)) Add `it.failing` and `it.concurrent` and combinations

## Fixes

- ([PR#3200](https://github.com/dubzzz/fast-check/pull/3200)) CI: Extract jest config outside of package.json
- ([PR#3212](https://github.com/dubzzz/fast-check/pull/3212)) CI: Share `tsconfig.json` across public packages
- ([PR#3213](https://github.com/dubzzz/fast-check/pull/3213)) Script: Factorize production `tsconfig.json`
- ([PR#3201](https://github.com/dubzzz/fast-check/pull/3201)) Refactor: Rely on `@jest/globals` for `@fast-check/jest`
- ([PR#3213](https://github.com/dubzzz/fast-check/pull/3213)) Script: Factorize production `tsconfig.json`

---

# 1.0.1

_Add missing export for package.json_
[[Code](https://github.com/dubzzz/fast-check/tree/jest%2Fv1.0.1)][[Diff](https://github.com/dubzzz/fast-check/compare/jest%2Fv1.0.0...jest%2Fv1.0.1)]

## Fixes

- ([PR#3066](https://github.com/dubzzz/fast-check/pull/3066)) Bug: Export package.json

# 1.0.0

_First stable release of `@fast-check/jest`_
[[Code](https://github.com/dubzzz/fast-check/tree/jest%2Fv1.0.0)]

`@fast-check/jest` is replacing `jest-fast-check`. The code moved from [dubzzz/jest-fast-check](https://github.com/dubzzz/jest-fast-check/) to [dubzzz/fast-check](https://github.com/dubzzz/fast-check/) for simpler maintenance.
