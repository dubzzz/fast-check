# 3.0.0

_Make fast-check easier with the full support of size and a new easily extensible API for custom arbitraries_
[[Code](https://github.com/dubzzz/fast-check/tree/v3.0.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v2.25.0...v3.0.0)]

This new major of fast-check is:

- **extensible**: extending the framework with custom arbitraries made easy
- **expressive properties**: write properties corresponding to specs without dealing with internals of the library ([more](https://github.com/dubzzz/fast-check/issues/2648))
- **recursive structures**: better native handling of recursive structures without any tweaks around internals
- **unified signatures**: unify signatures cross-arbitraries ([more](https://github.com/dubzzz/fast-check/pull/992))

## Breaking changes

- ([PR#2927](https://github.com/dubzzz/fast-check/pull/2927)) Remove deprecated signatures of `fc.array`
- ([PR#2929](https://github.com/dubzzz/fast-check/pull/2929)) Remove deprecated signatures of `fc.string`
- ([PR#2930](https://github.com/dubzzz/fast-check/pull/2930)) Remove deprecated signatures of `fc.*subarray`
- ([PR#2931](https://github.com/dubzzz/fast-check/pull/2931)) Remove deprecated signatures of `fc.commands`
- ([PR#2932](https://github.com/dubzzz/fast-check/pull/2932)) Remove deprecated signatures of `fc.option`
- ([PR#2933](https://github.com/dubzzz/fast-check/pull/2933)) Remove deprecated signatures of `fc.json`
- ([PR#2934](https://github.com/dubzzz/fast-check/pull/2934)) Remove deprecated signatures of `fc.lorem`
- ([PR#2935](https://github.com/dubzzz/fast-check/pull/2935)) Drop support for TypeScript 3.2 (min ≥4.1)
- ([PR#2928](https://github.com/dubzzz/fast-check/pull/2928)) Rely on new implementations and APIs for `fc.float`/`fc.double`
- ([PR#2938](https://github.com/dubzzz/fast-check/pull/2938)) Remove fully deprecated arbitraries
- ([PR#2939](https://github.com/dubzzz/fast-check/pull/2939)) Remove deprecated signatures of `fc.integer`
- ([PR#2940](https://github.com/dubzzz/fast-check/pull/2940)) Get rid off genericTuple (replaced by tuple)
- ([PR#2941](https://github.com/dubzzz/fast-check/pull/2941)) Remove forked typings for `pure-rand`
- ([PR#2942](https://github.com/dubzzz/fast-check/pull/2942)) Change the API of a property to rely on the modern one
- ([PR#2944](https://github.com/dubzzz/fast-check/pull/2944)) Switch to the new API of `Arbitrary` and remove old variants
- ([PR#2945](https://github.com/dubzzz/fast-check/pull/2945)) Rename `NextValue` into `Value`
- ([PR#2949](https://github.com/dubzzz/fast-check/pull/2949)) No `depthFactor` specified means: use defaulted configuration
- ([PR#2951](https://github.com/dubzzz/fast-check/pull/2951)) Stop defaulting `maxKeys` and `maxDepth` on `object` arbitraries
- ([PR#2952](https://github.com/dubzzz/fast-check/pull/2952)) Stop defaulting `maxCount` on `lorem`
- ([PR#2954](https://github.com/dubzzz/fast-check/pull/2954)) Stop defaulting `defaultSizeToMaxWhenMaxSpecified` to true
- ([PR#2959](https://github.com/dubzzz/fast-check/pull/2959)) Change the output of `Property::run` to return the original error
- ([PR#2960](https://github.com/dubzzz/fast-check/pull/2960)) Remove `frequency` now replaced by `oneof`
- ([PR#2970](https://github.com/dubzzz/fast-check/pull/2970)) Rename `depthFactor` into `depthSize` and invert numeric

_You may refer to our migration guide in case of issue: https://github.com/dubzzz/fast-check/blob/main/MIGRATION_2.X_TO_3.X.md_

## Features

- ([PR#2937](https://github.com/dubzzz/fast-check/pull/2937)) Adopt variadic tuples for signatures of clone
- ([PR#2936](https://github.com/dubzzz/fast-check/pull/2936)) Adopt variadic tuples for signatures of property
- ([PR#2950](https://github.com/dubzzz/fast-check/pull/2950)) Add the ability to define use max as depth factor
- ([PR#2953](https://github.com/dubzzz/fast-check/pull/2953)) Extend usage of `defaultSizeToMaxWhenMaxSpecified` to depth
- ([PR#2955](https://github.com/dubzzz/fast-check/pull/2955)) Add support for weighted arbitraries in `oneof`
- ([PR#2962](https://github.com/dubzzz/fast-check/pull/2962)) Forward the original `Error` into `RunDetails`
- ([PR#2956](https://github.com/dubzzz/fast-check/pull/2956)) Add big int typed arrays arbitraries
- ([PR#2968](https://github.com/dubzzz/fast-check/pull/2968)) Better typings for `letrec`

## Fixes

- ([PR#2963](https://github.com/dubzzz/fast-check/pull/2963)) Bug: Allow property to intercept thrown symbols
- ([PR#2925](https://github.com/dubzzz/fast-check/pull/2925)) CI: Add type-checking only step and script
- ([PR#2923](https://github.com/dubzzz/fast-check/pull/2923)) CI: Format all the files not only TS ones
- ([PR#2964](https://github.com/dubzzz/fast-check/pull/2964)) CI: Check the generated lib against ES standard
- ([PR#2918](https://github.com/dubzzz/fast-check/pull/2918)) Doc: Update "Question" template to request users to prefer "Discussions"
- ([PR#2920](https://github.com/dubzzz/fast-check/pull/2920)) Doc: Add some statistics for `jsonValue` in the documentation
- ([PR#2966](https://github.com/dubzzz/fast-check/pull/2966)) Doc: Fix link to timeout section in tips doc
- ([PR#2919](https://github.com/dubzzz/fast-check/pull/2919)) Refactor: Replace usages of `set` by `uniqueArray`
- ([PR#2921](https://github.com/dubzzz/fast-check/pull/2921)) Refactor: Replace deprecated usages of `integer` by constraint-based ones
- ([PR#2924](https://github.com/dubzzz/fast-check/pull/2924)) Refactor: Move `ts-jest` types related helpers internally
- ([PR#2946](https://github.com/dubzzz/fast-check/pull/2946)) Refactor: Clean src thanks to `NextArbitrary`
- ([PR#2948](https://github.com/dubzzz/fast-check/pull/2948)) Refactor: Adapting some code in `anything` thanks to TODO
- ([PR#2971](https://github.com/dubzzz/fast-check/pull/2971)) Script: Support breaking changes in generated CHANGELOG
- ([PR#2973](https://github.com/dubzzz/fast-check/pull/2973)) Script: Support typing related PRs in CHANGELOG
- ([PR#2943](https://github.com/dubzzz/fast-check/pull/2943)) Test: Rewrite tests on `commands` based on `NextArbitrary`
- ([PR#2947](https://github.com/dubzzz/fast-check/pull/2947)) Test: Remove "Next" from test helpers
- ([PR#2961](https://github.com/dubzzz/fast-check/pull/2961)) Test: Ensure `fc.sample` can run against properties and arbitraries
