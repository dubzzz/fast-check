# 3.1.1

_Better package.json definition and `__proto__` related fixes_
[[Code](https://github.com/dubzzz/fast-check/tree/v3.1.1)][[Diff](https://github.com/dubzzz/fast-check/compare/v3.1.0...v3.1.1)]

## Fixes

- ([PR#3066](https://github.com/dubzzz/fast-check/pull/3066)) Bug: Export package.json
- ([PR#3070](https://github.com/dubzzz/fast-check/pull/3070)) Bug: Support `__proto__` as key in `record`
- ([PR#3068](https://github.com/dubzzz/fast-check/pull/3068)) Test: Fix test comparing `stringify` and `JSON.stringify`
- ([PR#3069](https://github.com/dubzzz/fast-check/pull/3069)) Test: Fix tests on `record` wrongly manipulating `__proto__`

# 3.1.0

_Generate more dangerous strings by default_
[[Code](https://github.com/dubzzz/fast-check/tree/v3.1.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v3.0.1...v3.1.0)]

## Features

- ([PR#2975](https://github.com/dubzzz/fast-check/pull/2975)) Sanitize constraints used internally by "oneof" as much as possible
- ([PR#3048](https://github.com/dubzzz/fast-check/pull/3048)) Add experimental "custom slices" constraint on array
- ([PR#3043](https://github.com/dubzzz/fast-check/pull/3043)) Generate dangerous strings by default

## Fixes

- ([PR#3049](https://github.com/dubzzz/fast-check/pull/3049)) Bug: Fix out-of-range in `SlicedBasedGenerator`
- ([PR#3050](https://github.com/dubzzz/fast-check/pull/3050)) Bug: Allow strange keys as keys of dictionary
- ([PR#3051](https://github.com/dubzzz/fast-check/pull/3051)) Bug: Better rounding in `statistics`
- ([PR#3052](https://github.com/dubzzz/fast-check/pull/3052)) CI: Add missing Ubuntu env for e2e
- ([PR#3047](https://github.com/dubzzz/fast-check/pull/3047)) Refactor: Implement sliced based generator for arrays
- ([PR#3059](https://github.com/dubzzz/fast-check/pull/3059)) Script: Add links to buggy PRs in changelog PR
- ([PR#3060](https://github.com/dubzzz/fast-check/pull/3060)) Script: Only commit `package.json` corresponding to impacted CHANGELOGs

---

# 3.0.1

_Basic setup for monorepo_
[[Code](https://github.com/dubzzz/fast-check/tree/v3.0.1)][[Diff](https://github.com/dubzzz/fast-check/compare/v3.0.0...v3.0.1)]

## Fixes

- ([PR#2986](https://github.com/dubzzz/fast-check/pull/2986)) CI: Switch to Yarn 3 and simple monorepo
- ([PR#2987](https://github.com/dubzzz/fast-check/pull/2987)) CI: Simplify test-bundle script following merge of Yarn 3
- ([PR#2988](https://github.com/dubzzz/fast-check/pull/2988)) CI: Switch to `yarn workspace *` instead of `cd packages/*`
- ([PR#2990](https://github.com/dubzzz/fast-check/pull/2990)) CI: Replace `npx` by `yarn dlx`
- ([PR#2991](https://github.com/dubzzz/fast-check/pull/2991)) CI: Setup prettier at the root of the project
- ([PR#2992](https://github.com/dubzzz/fast-check/pull/2992)) CI: Drop unneeded benchmarks
- ([PR#2993](https://github.com/dubzzz/fast-check/pull/2993)) CI: Fix script not using the right path
- ([PR#2994](https://github.com/dubzzz/fast-check/pull/2994)) CI: Fix gh-pages publication follwoing move to monorepo
- ([PR#2995](https://github.com/dubzzz/fast-check/pull/2995)) CI: Clean-up `.gitignore`
- ([PR#2996](https://github.com/dubzzz/fast-check/pull/2996)) CI: Move eslint at top level
- ([PR#2989](https://github.com/dubzzz/fast-check/pull/2989)) CI: Make `fast-check` self reference itself as a dev dependency
- ([PR#2997](https://github.com/dubzzz/fast-check/pull/2997)) CI: Define top-level script to simplify build and test
- ([PR#2999](https://github.com/dubzzz/fast-check/pull/2999)) CI: Setup for `yarn version check`
- ([PR#3001](https://github.com/dubzzz/fast-check/pull/3001)) CI: Make use of `yarn version` for generate changelog
- ([PR#3003](https://github.com/dubzzz/fast-check/pull/3003)) CI: Fix usages of `yarn version` when generating changelog
- ([PR#3005](https://github.com/dubzzz/fast-check/pull/3005)) CI: Move anything package related next to its package
- ([PR#3008](https://github.com/dubzzz/fast-check/pull/3008)) CI: Check the need for `dedupe` for each run
- ([PR#3010](https://github.com/dubzzz/fast-check/pull/3010)) CI: Cross-jobs caching for yarn
- ([PR#3011](https://github.com/dubzzz/fast-check/pull/3011)) CI: Enhance and document version related rules for PRs
- ([PR#3014](https://github.com/dubzzz/fast-check/pull/3014)) CI: Run tests against trimmed versions of the packages
- ([PR#3015](https://github.com/dubzzz/fast-check/pull/3015)) CI: Make fast-check's tests rely on its own build
- ([PR#3017](https://github.com/dubzzz/fast-check/pull/3017)) CI: Faster workflow of GH Actions
- ([PR#3023](https://github.com/dubzzz/fast-check/pull/3023)) CI: Factorize test jobs via matrix of GH Actions
- ([PR#3024](https://github.com/dubzzz/fast-check/pull/3024)) CI: Drop es-check related jobs
- ([PR#3032](https://github.com/dubzzz/fast-check/pull/3032)) CI: Handle monorepo in generate changelog
- ([PR#3034](https://github.com/dubzzz/fast-check/pull/3034)) CI: Better links in PR generating changelog
- ([PR#3037](https://github.com/dubzzz/fast-check/pull/3037)) CI: Adapt build script to publish any package
- ([PR#3039](https://github.com/dubzzz/fast-check/pull/3039)) CI: Also commit `.yarn/versions` with changelogs
- ([PR#3000](https://github.com/dubzzz/fast-check/pull/3000)) Doc: Default to readme from `packages/fast-check`
- ([PR#3006](https://github.com/dubzzz/fast-check/pull/3006)) Doc: Start following all-contributors specification
- ([PR#3007](https://github.com/dubzzz/fast-check/pull/3007)) Doc: Rework the "bug discovered with fast-check" section of the README
- ([PR#3031](https://github.com/dubzzz/fast-check/pull/3031)) Doc: Add missing README files on bundle related tests
- ([PR#2982](https://github.com/dubzzz/fast-check/pull/2982)) Move: Move `example/` to `examples/`
- ([PR#2983](https://github.com/dubzzz/fast-check/pull/2983)) Move: Move part of `test/` into `packages/test-bundle-*`
- ([PR#2984](https://github.com/dubzzz/fast-check/pull/2984)) Move: Move part of source code into `packages/fast-check`
- ([PR#2977](https://github.com/dubzzz/fast-check/pull/2977)) Refactor: Simplify logic to read constraints for `commands`
- ([PR#3016](https://github.com/dubzzz/fast-check/pull/3016)) Test: Check SHA1 of produced bundle in E2E tests

# 3.0.0

_Easier and more expressive thanks to the full support of size and a new and extensible API for custom arbitraries_
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
