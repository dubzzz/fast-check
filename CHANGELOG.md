# 1.0.3

## Fixes

* ([55ff3ff](/commit/55ff3ff)) Clean: Switch to the latest ES standard to use its implementations
* ([ce75e4e](/commit/ce75e4e)) Fix: Safer polyfill for older version of node - rely on core-js

# 1.0.2

## Fixes

* ([309a00b](/commit/309a00b)) Doc: Update README.md
* ([e13df27](/commit/e13df27)) Clean: Clean depreciated dependencies

# 1.0.1

## Fixes

* ([d6468dc](/commit/d6468dc)) Fix: shrink an array with minimal length lead to infinite loop

# 1.0.0

## Features

- ([7dd6fdb](/commit/7dd6fdb)) Add min/max parameters on fc.float and fc.double
- ([e294eed](/commit/e294eed)) Naming: lower camel case for settings keys
- ([6f35cdd](/commit/6f35cdd)) Check inputs provided to fc.property for easier troubleshoot
- ([b960938](/commit/b960938)) Naming: rename generic_tuple into genericTuple
- ([d1dde51](/commit/d1dde51)) Faster shrink of arrays (and must of others because built on top of arrays x integers)
- ([fc57174](/commit/fc57174)) Faster shrink of integers
- ([be038f0](/commit/be038f0)) Replay a failure by setting seed and path
- ([d25d233](/commit/d25d233)) Feature counterexamplePath in case of failure
- ([c7a1508](/commit/c7a1508)) Update error message content in case of failure in fc.assert
- ([eb0d3c2](/commit/eb0d3c2)) Better rendering of strings
- ([1e0a73d](/commit/1e0a73d)) Switch to pure-rand library to handle the random number generation

## Fixes

- ([56f1e03](/commit/56f1e03)) Clean: Bump versions of dependencies
- ([d0027d7](/commit/d0027d7)) Clean: Do not throw raw strings but Error
- ([6af9e6b](/commit/6af9e6b)) Clean: Remove power-assert from devDependencies
- ([fe44db5](/commit/fe44db5)) Fix: Avoid recursion during shrinking
- ([e3ecc3c](/commit/e3ecc3c)) Fix: Bad number of shrinks in case of failure (offset by one)
- ([79c08f7](/commit/79c08f7)) Fix: Export dictionary arbitrary
