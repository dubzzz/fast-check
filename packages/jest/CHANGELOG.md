# 1.7.3

_Deprecate legacy helpers_
[[Code](https://github.com/dubzzz/fast-check/tree/jest%2Fv1.7.3)][[Diff](https://github.com/dubzzz/fast-check/compare/jest%2Fv1.7.2...jest%2Fv1.7.3)]

## Fixes

- ([PR#4201](https://github.com/dubzzz/fast-check/pull/4201)) Deprecate: Flag `{it,test}Prop` as deprecated

# 1.7.2

_Better support for types on ESM targets_
[[Code](https://github.com/dubzzz/fast-check/tree/jest%2Fv1.7.2)][[Diff](https://github.com/dubzzz/fast-check/compare/jest%2Fv1.7.1...jest%2Fv1.7.2)]

## Fixes

- ([PR#4180](https://github.com/dubzzz/fast-check/pull/4180)) Bug: Better declare ESM's types
- ([PR#4033](https://github.com/dubzzz/fast-check/pull/4033)) Tooling: Update formatting

# 1.7.1

_Clearer definition of compatible node versions_
[[Code](https://github.com/dubzzz/fast-check/tree/jest%2Fv1.7.1)][[Diff](https://github.com/dubzzz/fast-check/compare/jest%2Fv1.7.0...jest%2Fv1.7.1)]

## Fixes

- ([PR#4004](https://github.com/dubzzz/fast-check/pull/4004)) Test: Stop ignoring globals for node18

# 1.7.0

_Supporting passing options to worker_
[[Code](https://github.com/dubzzz/fast-check/tree/jest%2Fv1.7.0)][[Diff](https://github.com/dubzzz/fast-check/compare/jest%2Fv1.6.2...jest%2Fv1.7.0)]

## Features

- ([PR#3964](https://github.com/dubzzz/fast-check/pull/3964)) Support passing options to worker

---

# 1.6.2

_Update URL of the logo_
[[Code](https://github.com/dubzzz/fast-check/tree/jest%2Fv1.6.2)][[Diff](https://github.com/dubzzz/fast-check/compare/jest%2Fv1.6.1...jest%2Fv1.6.2)]

## Fixes

- ([PR#3868](https://github.com/dubzzz/fast-check/pull/3868)) Doc: Update logo url

# 1.6.1

_Attach provenance to the packages_
[[Code](https://github.com/dubzzz/fast-check/tree/jest%2Fv1.6.1)][[Diff](https://github.com/dubzzz/fast-check/compare/jest%2Fv1.6.0...jest%2Fv1.6.1)]

## Fixes

- ([PR#3774](https://github.com/dubzzz/fast-check/pull/3774)) Security: Attach provenance to the packages

# 1.6.0

_Let fast-check guide timeouts_
[[Code](https://github.com/dubzzz/fast-check/tree/jest%2Fv1.6.0)][[Diff](https://github.com/dubzzz/fast-check/compare/jest%2Fv1.5.0...jest%2Fv1.6.0)]

## Features

- ([PR#3511](https://github.com/dubzzz/fast-check/pull/3511)) Let fast-check guide timeouts
- ([PR#3520](https://github.com/dubzzz/fast-check/pull/3520)) Add support for jasmine runner

## Fixes

- ([PR#3519](https://github.com/dubzzz/fast-check/pull/3519)) Bug: Support failure to get timeout out of Jest
- ([PR#3521](https://github.com/dubzzz/fast-check/pull/3521)) Test: Properly categorize timeout tests

---

# 1.5.0

_Add worker-based runner able to stop synchronous code_
[[Code](https://github.com/dubzzz/fast-check/tree/jest%2Fv1.5.0)][[Diff](https://github.com/dubzzz/fast-check/compare/jest%2Fv1.4.0...jest%2Fv1.5.0)]

## Features

- ([PR#3444](https://github.com/dubzzz/fast-check/pull/3444)) Add basic worker based runner

## Fixes

- ([PR#3471](https://github.com/dubzzz/fast-check/pull/3471)) CI: Add missing peerDependency for worker-based
- ([PR#3473](https://github.com/dubzzz/fast-check/pull/3473)) Funding: Re-order links in funding section
- ([PR#3433](https://github.com/dubzzz/fast-check/pull/3433)) Refactor: Divide code into multiple files
- ([PR#3443](https://github.com/dubzzz/fast-check/pull/3443)) Refactor: Take `jest` and `fc` as input for main internals

---

# 1.4.0

_Introduce new `it.prop` and `test.prop` APIs_
[[Code](https://github.com/dubzzz/fast-check/tree/jest%2Fv1.4.0)][[Diff](https://github.com/dubzzz/fast-check/compare/jest%2Fv1.3.1...jest%2Fv1.4.0)]

## Features

- ([PR#3339](https://github.com/dubzzz/fast-check/pull/3339)) Add new `it.prop` and related
- ([PR#3366](https://github.com/dubzzz/fast-check/pull/3366)) Add support for record-based `it.prop`

## Fixes

- ([PR#3383](https://github.com/dubzzz/fast-check/pull/3383)) Bug: Fix types not being properly exported for ESM
- ([PR#3352](https://github.com/dubzzz/fast-check/pull/3352)) Doc: Add missing 'Typing' on PRs in changelog
- ([PR#3389](https://github.com/dubzzz/fast-check/pull/3389)) Doc: Adapt documentation for new API based on `it`/`test`

---

# 1.3.2

_Properly define types for TypeScript_
[[Code](https://github.com/dubzzz/fast-check/tree/jest%2Fv1.3.2)][[Diff](https://github.com/dubzzz/fast-check/compare/jest%2Fv1.3.1...jest%2Fv1.3.2)]

## Fixes

- ([PR#3383](https://github.com/dubzzz/fast-check/pull/3383)) Bug: Fix types not being properly exported for ESM

# 1.3.1

_Better typings for `{it,test}Prop`_
[[Code](https://github.com/dubzzz/fast-check/tree/jest%2Fv1.3.1)][[Diff](https://github.com/dubzzz/fast-check/compare/jest%2Fv1.3.0...jest%2Fv1.3.1)]

## Fixes

- ([PR#3345](https://github.com/dubzzz/fast-check/pull/3345)) Doc: Fix dead link in readme
- ([PR#3349](https://github.com/dubzzz/fast-check/pull/3349)) Typing: Wrongly typed `itProp` when receiving `examples`

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

# 1.2.2

_Properly define types for TypeScript_
[[Code](https://github.com/dubzzz/fast-check/tree/jest%2Fv1.2.2)][[Diff](https://github.com/dubzzz/fast-check/compare/jest%2Fv1.2.1...jest%2Fv1.2.2)]

## Fixes

- ([PR#3383](https://github.com/dubzzz/fast-check/pull/3383)) Bug: Fix types not being properly exported for ESM

# 1.2.1

_Better typings for `{it,test}Prop`_
[[Code](https://github.com/dubzzz/fast-check/tree/jest%2Fv1.2.1)][[Diff](https://github.com/dubzzz/fast-check/compare/jest%2Fv1.2.0...jest%2Fv1.2.1)]

## Fixes

- ([PR#3349](https://github.com/dubzzz/fast-check/pull/3349)) Typing: Wrongly typed `itProp` when receiving `examples`

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

# 1.1.2

_Properly define types for TypeScript_
[[Code](https://github.com/dubzzz/fast-check/tree/jest%2Fv1.1.2)][[Diff](https://github.com/dubzzz/fast-check/compare/jest%2Fv1.1.1...jest%2Fv1.1.2)]

## Fixes

- ([PR#3383](https://github.com/dubzzz/fast-check/pull/3383)) Bug: Fix types not being properly exported for ESM

# 1.1.1

_Various fixes_
[[Code](https://github.com/dubzzz/fast-check/tree/jest%2Fv1.1.1)][[Diff](https://github.com/dubzzz/fast-check/compare/jest%2Fv1.1.0...jest%2Fv1.1.1)]

## Fixes

- ([PR#3279](https://github.com/dubzzz/fast-check/pull/3279)) Bug: Pass the forged seed to the runner
- ([PR#3281](https://github.com/dubzzz/fast-check/pull/3281)) Bug: Fallback on the seed coming from globals if any
- ([PR#3349](https://github.com/dubzzz/fast-check/pull/3349)) Typing: Wrongly typed `itProp` when receiving `examples`

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

# 1.0.3

_Properly define types for TypeScript_
[[Code](https://github.com/dubzzz/fast-check/tree/jest%2Fv1.0.3)][[Diff](https://github.com/dubzzz/fast-check/compare/jest%2Fv1.0.2...jest%2Fv1.0.3)]

## Fixes

- ([PR#3383](https://github.com/dubzzz/fast-check/pull/3383)) Bug: Fix types not being properly exported for ESM

# 1.0.2

_Various fixes_
[[Code](https://github.com/dubzzz/fast-check/tree/jest%2Fv1.0.2)][[Diff](https://github.com/dubzzz/fast-check/compare/jest%2Fv1.0.1...jest%2Fv1.0.2)]

## Fixes

- ([PR#3279](https://github.com/dubzzz/fast-check/pull/3279)) Bug: Pass the forged seed to the runner
- ([PR#3281](https://github.com/dubzzz/fast-check/pull/3281)) Bug: Fallback on the seed coming from globals if any
- ([PR#3349](https://github.com/dubzzz/fast-check/pull/3349)) Typing: Wrongly typed `itProp` when receiving `examples`

# 1.0.1

_Add missing export for package.json_
[[Code](https://github.com/dubzzz/fast-check/tree/jest%2Fv1.0.1)][[Diff](https://github.com/dubzzz/fast-check/compare/jest%2Fv1.0.0...jest%2Fv1.0.1)]

## Fixes

- ([PR#3066](https://github.com/dubzzz/fast-check/pull/3066)) Bug: Export package.json

# 1.0.0

_First stable release of `@fast-check/jest`_
[[Code](https://github.com/dubzzz/fast-check/tree/jest%2Fv1.0.0)]

`@fast-check/jest` is replacing `jest-fast-check`. The code moved from [dubzzz/jest-fast-check](https://github.com/dubzzz/jest-fast-check/) to [dubzzz/fast-check](https://github.com/dubzzz/fast-check/) for simpler maintenance.
