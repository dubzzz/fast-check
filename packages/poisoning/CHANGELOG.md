# 0.0.2

_Add ability to omit some instances when checking for poisoning_
[[Code](https://github.com/dubzzz/fast-check/tree/poisoning%2Fv0.0.2)][[Diff](https://github.com/dubzzz/fast-check/compare/poisoning%2Fv0.0.1...poisoning%2Fv0.0.2)]

## Features

- ([PR#3160](https://github.com/dubzzz/fast-check/pull/3160)) Adopt shorter names for labels of globals
- ([PR#3176](https://github.com/dubzzz/fast-check/pull/3176)) Do not track private globals
- ([PR#3198](https://github.com/dubzzz/fast-check/pull/3198)) Add ability to ignore some roots
- ([PR#3199](https://github.com/dubzzz/fast-check/pull/3199)) Also track roots starting by "_"

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
