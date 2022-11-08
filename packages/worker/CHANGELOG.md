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
