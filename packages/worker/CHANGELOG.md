# 0.4.2

_TODO Description_
[[Code](https://github.com/dubzzz/fast-check/tree/worker%2Fv0.4.2)][[Diff](https://github.com/dubzzz/fast-check/compare/worker%2Fv0.4.1...worker%2Fv0.4.2)]

## Features



## Fixes

- ([PR#5810](https://github.com/dubzzz/fast-check/pull/5810)) CI: Update tsconfig to common config
- ([PR#5793](https://github.com/dubzzz/fast-check/pull/5793)) Dependencies: Add support for fast-check v4

# 0.4.1

_Rework our testing stack_
[[Code](https://github.com/dubzzz/fast-check/tree/worker%2Fv0.4.1)][[Diff](https://github.com/dubzzz/fast-check/compare/worker%2Fv0.4.0...worker%2Fv0.4.1)]

## Fixes

- ([PR#5347](https://github.com/dubzzz/fast-check/pull/5347)) CI: Move to Vitest
- ([PR#5351](https://github.com/dubzzz/fast-check/pull/5351)) CI: Drop unneeded devDependencies

# 0.4.0

_Respawn only on crash not on failure and support pre_
[[Code](https://github.com/dubzzz/fast-check/tree/worker%2Fv0.4.0)][[Diff](https://github.com/dubzzz/fast-check/compare/worker%2Fv0.3.1...worker%2Fv0.4.0)]

## Breaking changes

- ([PR#4993](https://github.com/dubzzz/fast-check/pull/4993)) Only respawn workers on crash (not failure)

## Features

- ([PR#4988](https://github.com/dubzzz/fast-check/pull/4988)) Add support for `pre` in properties

## Fixes

- ([PR#4987](https://github.com/dubzzz/fast-check/pull/4987)) Test: Confirm we intercept synchronous throws

---

# 0.3.1

_Adapt code to new lint rules_
[[Code](https://github.com/dubzzz/fast-check/tree/worker%2Fv0.3.1)][[Diff](https://github.com/dubzzz/fast-check/compare/worker%2Fv0.3.0...worker%2Fv0.3.1)]

## Fixes

- ([PR#4933](https://github.com/dubzzz/fast-check/pull/4933)) Script: Switch on more eslint rules

# 0.3.0

_Support generating inputs in workers_
[[Code](https://github.com/dubzzz/fast-check/tree/worker%2Fv0.3.0)][[Diff](https://github.com/dubzzz/fast-check/compare/worker%2Fv0.2.0...worker%2Fv0.3.0)]

## Features

- ([PR#4063](https://github.com/dubzzz/fast-check/pull/4063)) Add support for non-serializable data in workers

## Fixes

- ([PR#4837](https://github.com/dubzzz/fast-check/pull/4837)) CI: Stabilize tests on worker

---

# 0.2.0

_Declare root of the package as ESM_
[[Code](https://github.com/dubzzz/fast-check/tree/worker%2Fv0.2.0)][[Diff](https://github.com/dubzzz/fast-check/compare/worker%2Fv0.1.1...worker%2Fv0.2.0)]

## Breaking changes

- ([PR#4585](https://github.com/dubzzz/fast-check/pull/4585)) CI: Move build chain to ESM

## Fixes

- ([PR#4604](https://github.com/dubzzz/fast-check/pull/4604)) CI: Migrate jest to esm

---

# 0.1.1

_Implement missing methods for future v4 of fast-check_
[[Code](https://github.com/dubzzz/fast-check/tree/worker%2Fv0.1.1)][[Diff](https://github.com/dubzzz/fast-check/compare/worker%2Fv0.1.0...worker%2Fv0.1.1)]

## Fixes

- ([PR#4467](https://github.com/dubzzz/fast-check/pull/4467)) Refactor: Prepare worker's internals to Property type of fast-check 4

# 0.1.0

_Lighter import with less internals to load_
[[Code](https://github.com/dubzzz/fast-check/tree/worker%2Fv0.1.0)][[Diff](https://github.com/dubzzz/fast-check/compare/worker%2Fv0.0.9...worker%2Fv0.1.0)]

## Features

- ([PR#4420](https://github.com/dubzzz/fast-check/pull/4420)) Prefer "import type" over raw "import"

## Fixes

- ([PR#4287](https://github.com/dubzzz/fast-check/pull/4287)) Test: Confirm basic typings work well

---

# 0.0.9

_Better support for types on ESM targets_
[[Code](https://github.com/dubzzz/fast-check/tree/worker%2Fv0.0.9)][[Diff](https://github.com/dubzzz/fast-check/compare/worker%2Fv0.0.8...worker%2Fv0.0.9)]

## Fixes

- ([PR#4174](https://github.com/dubzzz/fast-check/pull/4174)) Bug: Better declare ESM's types
- ([PR#4033](https://github.com/dubzzz/fast-check/pull/4033)) Tooling: Update formatting

# 0.0.8

_Typos in README_
[[Code](https://github.com/dubzzz/fast-check/tree/worker%2Fv0.0.8)][[Diff](https://github.com/dubzzz/fast-check/compare/worker%2Fv0.0.7...worker%2Fv0.0.8)]

## Fixes

- ([PR#3977](https://github.com/dubzzz/fast-check/pull/3977)) Doc: Fix API error in README

# 0.0.7

_Introduce isolation levels on workers_
[[Code](https://github.com/dubzzz/fast-check/tree/worker%2Fv0.0.7)][[Diff](https://github.com/dubzzz/fast-check/compare/worker%2Fv0.0.6...worker%2Fv0.0.7)]

## Features

- ([PR#3960](https://github.com/dubzzz/fast-check/pull/3960)) Introduce levels of isolation
- ([PR#3963](https://github.com/dubzzz/fast-check/pull/3963)) Add "file" isolation level

## Fixes

- ([PR#3958](https://github.com/dubzzz/fast-check/pull/3958)) Refactor: Introduce internal `IWorkerPool` interface
- ([PR#3962](https://github.com/dubzzz/fast-check/pull/3962)) Refactor: Allow support for multiple predicates per worker
- ([PR#3971](https://github.com/dubzzz/fast-check/pull/3971)) Test: Restructure E2E tests

# 0.0.6

_Add logo on the README_
[[Code](https://github.com/dubzzz/fast-check/tree/worker%2Fv0.0.6)][[Diff](https://github.com/dubzzz/fast-check/compare/worker%2Fv0.0.5...worker%2Fv0.0.6)]

## Fixes

- ([PR#3870](https://github.com/dubzzz/fast-check/pull/3870)) Doc: Add worker logo url

# 0.0.5

_Attach provenance to the packages_
[[Code](https://github.com/dubzzz/fast-check/tree/worker%2Fv0.0.5)][[Diff](https://github.com/dubzzz/fast-check/compare/worker%2Fv0.0.4...worker%2Fv0.0.5)]

## Fixes

- ([PR#3774](https://github.com/dubzzz/fast-check/pull/3774)) Security: Attach provenance to the packages

# 0.0.4

_Terminate workers earlier if they are not used anymore_
[[Code](https://github.com/dubzzz/fast-check/tree/worker%2Fv0.0.4)][[Diff](https://github.com/dubzzz/fast-check/compare/worker%2Fv0.0.3...worker%2Fv0.0.4)]

## Features

- ([PR#3467](https://github.com/dubzzz/fast-check/pull/3467)) Terminate workers if property timeout-ed

## Fixes

- ([PR#3445](https://github.com/dubzzz/fast-check/pull/3445)) Bug: Unable to import in ESM mode
- ([PR#3473](https://github.com/dubzzz/fast-check/pull/3473)) Funding: Re-order links in funding section

# 0.0.3

_Properly define types for TypeScript_
[[Code](https://github.com/dubzzz/fast-check/tree/worker%2Fv0.0.3)][[Diff](https://github.com/dubzzz/fast-check/compare/worker%2Fv0.0.2...worker%2Fv0.0.3)]

## Fixes

- ([PR#3388](https://github.com/dubzzz/fast-check/pull/3388)) Bug: Fix types not being properly exported for ESM

# 0.0.2

_Add GitHub Sponsors link_
[[Code](https://github.com/dubzzz/fast-check/tree/worker%2Fv0.0.2)][[Diff](https://github.com/dubzzz/fast-check/compare/worker%2Fv0.0.1...worker%2Fv0.0.2)]

## Fixes

- ([PR#3316](https://github.com/dubzzz/fast-check/pull/3316)) Funding: Add link to GitHub sponsors in funding

# 0.0.1

_First stable release of `@fast-check/worker`_
[[Code](https://github.com/dubzzz/fast-check/tree/worker%2Fv0.0.1)]

The bare metal version of fast-check is unable to stop a synchronous code (as most of test runners in JavaScript). This package can be plugged onto fast-check to make it able to stop synchronous code going into infinite loops, shrink the case and report it as any other failure.
