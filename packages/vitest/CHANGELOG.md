# 0.1.4

_Rework our testing stack_
[[Code](https://github.com/dubzzz/fast-check/tree/vitest%2Fv0.1.4)][[Diff](https://github.com/dubzzz/fast-check/compare/vitest%2Fv0.1.3...vitest%2Fv0.1.4)]

## Fixes

- ([PR#5350](https://github.com/dubzzz/fast-check/pull/5350)) CI: Move to Vitest
- ([PR#5352](https://github.com/dubzzz/fast-check/pull/5352)) CI: Drop unneeded configuration files
- ([PR#5380](https://github.com/dubzzz/fast-check/pull/5380)) Test: Make tests run concurrently
- ([PR#5379](https://github.com/dubzzz/fast-check/pull/5379)) Test: Better scoping of tests execution
- ([PR#5384](https://github.com/dubzzz/fast-check/pull/5384)) Test: Add retry for Node 23

# 0.1.3

_Export missing types_
[[Code](https://github.com/dubzzz/fast-check/tree/vitest%2Fv0.1.3)][[Diff](https://github.com/dubzzz/fast-check/compare/vitest%2Fv0.1.2...vitest%2Fv0.1.3)]

## Fixes

- ([PR#5200](https://github.com/dubzzz/fast-check/pull/5200)) Refactor: Add missing types on exported

# 0.1.2

_Allow vitest v2 as a peer dependency_
[[Code](https://github.com/dubzzz/fast-check/tree/vitest%2Fv0.1.2)][[Diff](https://github.com/dubzzz/fast-check/compare/vitest%2Fv0.1.1...vitest%2Fv0.1.2)]

## Fixes

- ([PR#5108](https://github.com/dubzzz/fast-check/pull/5108)) Bump: Update vitest monorepo to v2 (major)

# 0.1.1

_Adapt code to new lint rules_
[[Code](https://github.com/dubzzz/fast-check/tree/vitest%2Fv0.1.1)][[Diff](https://github.com/dubzzz/fast-check/compare/vitest%2Fv0.1.0...vitest%2Fv0.1.1)]

## Fixes

- ([PR#4933](https://github.com/dubzzz/fast-check/pull/4933)) Script: Switch on more eslint rules

# 0.1.0

_Declare root of the package as ESM_
[[Code](https://github.com/dubzzz/fast-check/tree/vitest%2Fv0.1.0)][[Diff](https://github.com/dubzzz/fast-check/compare/vitest%2Fv0.0.9...vitest%2Fv0.1.0)]

## Breaking changes

- ([PR#4586](https://github.com/dubzzz/fast-check/pull/4586)) CI: Move build chain to ESM

## Fixes

- ([PR#4603](https://github.com/dubzzz/fast-check/pull/4603)) CI: Migrate jest to esm

# 0.0.9

_Stricter declaration of peers and better imports_
[[Code](https://github.com/dubzzz/fast-check/tree/vitest%2Fv0.0.9)][[Diff](https://github.com/dubzzz/fast-check/compare/vitest%2Fv0.0.8...vitest%2Fv0.0.9)]

## Features

- ([PR#4423](https://github.com/dubzzz/fast-check/pull/4423)) Prefer "import type" over raw "import"

## Fixes

- ([PR#4544](https://github.com/dubzzz/fast-check/pull/4544)) Bug: Stricter (peer) range definition for vitest
- ([PR#4289](https://github.com/dubzzz/fast-check/pull/4289)) CI: Fix broken typing checks in CI
- ([PR#4282](https://github.com/dubzzz/fast-check/pull/4282)) Test: Confirm typings work well

# 0.0.8

_Fix typings for node native esm_
[[Code](https://github.com/dubzzz/fast-check/tree/vitest%2Fv0.0.8)][[Diff](https://github.com/dubzzz/fast-check/compare/vitest%2Fv0.0.7...vitest%2Fv0.0.8)]

## Fixes

- ([PR#4262](https://github.com/dubzzz/fast-check/pull/4262)) Bug: Fix typings for node native esm

# 0.0.7

_Better support for types on ESM targets_
[[Code](https://github.com/dubzzz/fast-check/tree/vitest%2Fv0.0.7)][[Diff](https://github.com/dubzzz/fast-check/compare/vitest%2Fv0.0.6...vitest%2Fv0.0.7)]

## Fixes

- ([PR#4178](https://github.com/dubzzz/fast-check/pull/4178)) Bug: Better declare ESM's types
- ([PR#4033](https://github.com/dubzzz/fast-check/pull/4033)) Tooling: Update formatting

# 0.0.6

_Update URL of the logo_
[[Code](https://github.com/dubzzz/fast-check/tree/vitest%2Fv0.0.6)][[Diff](https://github.com/dubzzz/fast-check/compare/vitest%2Fv0.0.5...vitest%2Fv0.0.6)]

## Fixes

- ([PR#3869](https://github.com/dubzzz/fast-check/pull/3869)) Doc: Update logo url

# 0.0.5

_Attach provenance to the packages_
[[Code](https://github.com/dubzzz/fast-check/tree/vitest%2Fv0.0.5)][[Diff](https://github.com/dubzzz/fast-check/compare/vitest%2Fv0.0.4...vitest%2Fv0.0.5)]

## Fixes

- ([PR#3774](https://github.com/dubzzz/fast-check/pull/3774)) Security: Attach provenance to the packages

# 0.0.4

_Proper type declaration in package.json_
[[Code](https://github.com/dubzzz/fast-check/tree/vitest%2Fv0.0.4)][[Diff](https://github.com/dubzzz/fast-check/compare/vitest%2Fv0.0.3...vitest%2Fv0.0.4)]

## Fixes

- ([PR#3721](https://github.com/dubzzz/fast-check/pull/3721)) Bug: Proper type declaration

# 0.0.3

_Fix vitest import failing due to TestBuilder_
[[Code](https://github.com/dubzzz/fast-check/tree/vitest%2Fv0.0.3)][[Diff](https://github.com/dubzzz/fast-check/compare/vitest%2Fv0.0.2...vitest%2Fv0.0.3)]

## Fixes

- ([PR#3660](https://github.com/dubzzz/fast-check/pull/3660)) Bug: Fix vitest import failing due to TestBuilder

# 0.0.2

_Support `it.skip`, `it.fails` and others_
[[Code](https://github.com/dubzzz/fast-check/tree/vitest%2Fv0.0.2)][[Diff](https://github.com/dubzzz/fast-check/compare/vitest%2Fv0.0.1...vitest%2Fv0.0.2)]

## Fixes

- ([PR#3591](https://github.com/dubzzz/fast-check/pull/3591)) Bug: Add support for deeper runners
- ([PR#3590](https://github.com/dubzzz/fast-check/pull/3590)) Test: Add basic units on vitest

# 0.0.1

_First stable release of `@fast-check/vitest`_
[[Code](https://github.com/dubzzz/fast-check/tree/vitest%2Fv0.0.1)]

Making integration of fast-check with `vitest` even simpler.
