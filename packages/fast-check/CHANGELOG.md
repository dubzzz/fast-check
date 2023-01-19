# 3.6.2

_Still work in fake timer contexts_
[[Code](https://github.com/dubzzz/fast-check/tree/v3.6.2)][[Diff](https://github.com/dubzzz/fast-check/compare/v3.6.1...v3.6.2)]

## Fixes

- ([PR#3571](https://github.com/dubzzz/fast-check/pull/3571)) Bug: Resist to fake timers in interruptAfterTimeLimit
- ([PR#3572](https://github.com/dubzzz/fast-check/pull/3572)) Bug: Resist to fake timers in timeout
- ([PR#3564](https://github.com/dubzzz/fast-check/pull/3564)) Performance: Drop bailout linked to toss

# 3.6.1

_Some more performance improvements_
[[Code](https://github.com/dubzzz/fast-check/tree/v3.6.1)][[Diff](https://github.com/dubzzz/fast-check/compare/v3.6.0...v3.6.1)]

## Fixes

- ([PR#3563](https://github.com/dubzzz/fast-check/pull/3563)) Performance: Mutate rng inplace in tosser

# 3.6.0

_Slightly faster execution of properties_
[[Code](https://github.com/dubzzz/fast-check/tree/v3.6.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v3.5.0...v3.6.0)]

## Features

- ([PR#3547](https://github.com/dubzzz/fast-check/pull/3547)) Slightly faster thanks to pure-rand v6
- ([PR#3552](https://github.com/dubzzz/fast-check/pull/3552)) Do not wrap stream when dropping 0 items
- ([PR#3551](https://github.com/dubzzz/fast-check/pull/3551)) Faster implementation of internal function `runIdToFrequency`
- ([PR#3553](https://github.com/dubzzz/fast-check/pull/3553)) Drop useless internal stream conversions
- ([PR#3554](https://github.com/dubzzz/fast-check/pull/3554)) Tosser must immediately produce values

## Fixes

- ([PR#3556](https://github.com/dubzzz/fast-check/pull/3556)) CI: Enable sourceMap in unpublished for coverage
- ([PR#3512](https://github.com/dubzzz/fast-check/pull/3512)) Script: Add `--cache` option to Prettier
- ([PR#3523](https://github.com/dubzzz/fast-check/pull/3523)) Script: Initialize default devcontainer
- ([PR#3524](https://github.com/dubzzz/fast-check/pull/3524)) Script: Install and setup nvs inside Dockerfile

---

# 3.5.0

_Interrupt running tasks when `interruptAfterTimeLimit` exceeded_
[[Code](https://github.com/dubzzz/fast-check/tree/v3.5.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v3.4.0...v3.5.0)]

## Features

- ([PR#3507](https://github.com/dubzzz/fast-check/pull/3507)) Interrupt predicates when `interruptAfterTimeLimit`
- ([PR#3508](https://github.com/dubzzz/fast-check/pull/3508)) Mark interrupted runs without any success as failures

---

# 3.4.0

_Better handling of timeout with beforeEach and afterEach_
[[Code](https://github.com/dubzzz/fast-check/tree/v3.4.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v3.3.0...v3.4.0)]

## Features

- ([PR#3464](https://github.com/dubzzz/fast-check/pull/3464)) No timeout for beforeEach or afterEach

## Fixes

- ([PR#3428](https://github.com/dubzzz/fast-check/pull/3428)) Bug: Avoid stack overflow during shrinking of tuples
- ([PR#3432](https://github.com/dubzzz/fast-check/pull/3432)) Bug: Avoid stack overflow during shrinking of arrays
- ([PR#3354](https://github.com/dubzzz/fast-check/pull/3354)) CI: Ignore version bump checks on publish
- ([PR#3379](https://github.com/dubzzz/fast-check/pull/3379)) CI: Fix configuration for rollup esm tests
- ([PR#3394](https://github.com/dubzzz/fast-check/pull/3394)) CI: Limit scope of "All ...bump declared"
- ([PR#3393](https://github.com/dubzzz/fast-check/pull/3393)) CI: Run tests against Node 18.x
- ([PR#3446](https://github.com/dubzzz/fast-check/pull/3446)) CI: Drop circular deps for dev topo builds
- ([PR#3417](https://github.com/dubzzz/fast-check/pull/3417)) Clean: Drop v2 to v3 codemods from the repository
- ([PR#3351](https://github.com/dubzzz/fast-check/pull/3351)) Doc: Update changelogs following backports
- ([PR#3458](https://github.com/dubzzz/fast-check/pull/3458)) Doc: Document how to use `context` in `examples`
- ([PR#3476](https://github.com/dubzzz/fast-check/pull/3476)) Doc: Revamp sponsoring section to show GitHub Sponsors
- ([PR#3473](https://github.com/dubzzz/fast-check/pull/3473)) Funding: Re-order links in funding section
- ([PR#3427](https://github.com/dubzzz/fast-check/pull/3427)) Refactor: Expose shrinker of tuples internally
- ([PR#3468](https://github.com/dubzzz/fast-check/pull/3468)) Script: Ensure we don't release workspace-based packages

---

# 3.3.0

_Expose `webPath` arbitrary_
[[Code](https://github.com/dubzzz/fast-check/tree/v3.3.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v3.2.0...v3.3.0)]

## Features

- ([PR#3299](https://github.com/dubzzz/fast-check/pull/3299)) Explicitly declare typings for constraints on `date`
- ([PR#3300](https://github.com/dubzzz/fast-check/pull/3300)) Expose an url path builder called `webPath`

## Fixes

- ([PR#3328](https://github.com/dubzzz/fast-check/pull/3328)) CI: Drop netlify related code and "please <stuff>" actions
- ([PR#3298](https://github.com/dubzzz/fast-check/pull/3298)) Doc: Document default values in the JSDoc
- ([PR#3316](https://github.com/dubzzz/fast-check/pull/3316)) Funding: Add link to GitHub sponsors in funding
- ([PR#3301](https://github.com/dubzzz/fast-check/pull/3301)) Test: Poisoning checks compatible with watch mode
- ([PR#3330](https://github.com/dubzzz/fast-check/pull/3330)) Test: Make sure poisoning spec never forget one global

---

# 3.2.0

_Stop copying the Error into the thrown one but use cause when asked too_
[[Code](https://github.com/dubzzz/fast-check/tree/v3.2.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v3.1.4...v3.2.0)]

## Features

- ([PR#2965](https://github.com/dubzzz/fast-check/pull/2965)) Attach the original `Error` as a cause of thrown one
- ([PR#3224](https://github.com/dubzzz/fast-check/pull/3224)) Attach real errors to internal failures

## Fixes

- ([PR#3225](https://github.com/dubzzz/fast-check/pull/3225)) CI: Publish `@fast-check/poisoning` on CodeSandbox's builds
- ([PR#3260](https://github.com/dubzzz/fast-check/pull/3260)) Doc: Sync with current path
- ([PR#3264](https://github.com/dubzzz/fast-check/pull/3264)) Doc: Improve grammar in HowItWorks
- ([PR#3292](https://github.com/dubzzz/fast-check/pull/3292)) Test: Stabilize tests of `SlicedBasedGenerator`

---

# 3.1.4

_Increased resiliency to poisoned globals_
[[Code](https://github.com/dubzzz/fast-check/tree/v3.1.4)][[Diff](https://github.com/dubzzz/fast-check/compare/v3.1.3...v3.1.4)]

## Fixes

- ([PR#3172](https://github.com/dubzzz/fast-check/pull/3172)) Bug: Fix some remaining accesses to global properties
- ([PR#3165](https://github.com/dubzzz/fast-check/pull/3165)) Bug: Resist to poisoning of top-level types
- ([PR#3184](https://github.com/dubzzz/fast-check/pull/3184)) CI: Require renovate to always try to dedupe
- ([PR#3186](https://github.com/dubzzz/fast-check/pull/3186)) CI: Adapt configuration for new ts-jest
- ([PR#3194](https://github.com/dubzzz/fast-check/pull/3194)) CI: Attempt to fix "please deploy"
- ([PR#3196](https://github.com/dubzzz/fast-check/pull/3196)) CI: Build every package for "please deploy"
- ([PR#3208](https://github.com/dubzzz/fast-check/pull/3208)) CI: Better PRs for changelogs cross packages
- ([PR#3156](https://github.com/dubzzz/fast-check/pull/3156)) Doc: Add missing changesets in changelog of 2.21.0
- ([PR#3185](https://github.com/dubzzz/fast-check/pull/3185)) Refactor: Attach a `depth` onto globals internally
- ([PR#3157](https://github.com/dubzzz/fast-check/pull/3157)) Script: Less verbose description for PRs of CHANGELOG
- ([PR#3174](https://github.com/dubzzz/fast-check/pull/3174)) Test: Add tests dropping all globals
- ([PR#3183](https://github.com/dubzzz/fast-check/pull/3183)) Test: Add some more type related tests for oneof
- ([PR#3076](https://github.com/dubzzz/fast-check/pull/3076)) Test: Check arbitraries do not cause any poisoning
- ([PR#3205](https://github.com/dubzzz/fast-check/pull/3205)) Test: Add missing "typecheck" scripts on packages

# 3.1.3

_More resilient to external poisoning on all arbitraries_
[[Code](https://github.com/dubzzz/fast-check/tree/v3.1.3)][[Diff](https://github.com/dubzzz/fast-check/compare/v3.1.2...v3.1.3)]

## Fixes

- ([PR#3094](https://github.com/dubzzz/fast-check/pull/3094)) Bug: Make numeric arbitraries resistant to poisoning
- ([PR#3096](https://github.com/dubzzz/fast-check/pull/3096)) Bug: Make single char arbitraries resistant to poisoning
- ([PR#3097](https://github.com/dubzzz/fast-check/pull/3097)) Bug: Make simple combinators arbitraries resistant to poisoning
- ([PR#3098](https://github.com/dubzzz/fast-check/pull/3098)) Bug: Make array combinators arbitraries resistant to poisoning
- ([PR#3099](https://github.com/dubzzz/fast-check/pull/3099)) Bug: Make multi chars arbitraries resistant to poisoning
- ([PR#3102](https://github.com/dubzzz/fast-check/pull/3102)) Bug: Fix `safeApply` never calling original `apply`
- ([PR#3103](https://github.com/dubzzz/fast-check/pull/3103)) Bug: Make object arbitraries resistant to poisoning
- ([PR#3104](https://github.com/dubzzz/fast-check/pull/3104)) Bug: Make typed arrays arbitraries resistant to poisoning
- ([PR#3106](https://github.com/dubzzz/fast-check/pull/3106)) Bug: Make recursive arbitraries resistant to poisoning
- ([PR#3107](https://github.com/dubzzz/fast-check/pull/3107)) Bug: Make function arbitraries resistant to poisoning
- ([PR#3108](https://github.com/dubzzz/fast-check/pull/3108)) Bug: Make complex strings arbitraries resistant to poisoning
- ([PR#3143](https://github.com/dubzzz/fast-check/pull/3143)) Bug: Make `webFragments/Segment/QueryParameters` resistant to poisoning
- ([PR#3152](https://github.com/dubzzz/fast-check/pull/3152)) Bug: Protect string generators against poisoning
- ([PR#3101](https://github.com/dubzzz/fast-check/pull/3101)) CI: Do not suggest private packages during version bumps
- ([PR#3113](https://github.com/dubzzz/fast-check/pull/3113)) CI: Consider ⚡️ aka zap PRs as fixes for changelog
- ([PR#3111](https://github.com/dubzzz/fast-check/pull/3111)) CI: Try to configure renovate to open more PRs
- ([PR#3150](https://github.com/dubzzz/fast-check/pull/3150)) CI: Change update strategy for renovate
- ([PR#3151](https://github.com/dubzzz/fast-check/pull/3151)) CI: Update bump strategy of renovate
- ([PR#3141](https://github.com/dubzzz/fast-check/pull/3141)) Clean: Drop unused dependencies
- ([PR#3100](https://github.com/dubzzz/fast-check/pull/3100)) Performance: Drop unneeded copy for full custom `uniqueArray`
- ([PR#3105](https://github.com/dubzzz/fast-check/pull/3105)) Performance: Faster implementation for `safeApply`
- ([PR#3112](https://github.com/dubzzz/fast-check/pull/3112)) Performance: Speed-up all safe versions built-in methods
- ([PR#3109](https://github.com/dubzzz/fast-check/pull/3109)) Refactor: Extract and share code computing safe versions for built-ins
- ([PR#3154](https://github.com/dubzzz/fast-check/pull/3154)) Script: More verbose CHANGELOG script and continue on failure

# 3.1.2

_More resilient to external poisoning on `assert` and `property`_
[[Code](https://github.com/dubzzz/fast-check/tree/v3.1.2)][[Diff](https://github.com/dubzzz/fast-check/compare/v3.1.1...v3.1.2)]

## Fixes

- ([PR#3082](https://github.com/dubzzz/fast-check/pull/3082)) Bug: Protect `assert` from poisoned `Math` or `Date`
- ([PR#3086](https://github.com/dubzzz/fast-check/pull/3086)) Bug: Resist to poisoning of `Object`
- ([PR#3087](https://github.com/dubzzz/fast-check/pull/3087)) Bug: Resist to poisoning of `Function`/`Array`/`String`
- ([PR#3089](https://github.com/dubzzz/fast-check/pull/3089)) Bug: Clear poisoning instability in `filter`, `map`, `chain`
- ([PR#3079](https://github.com/dubzzz/fast-check/pull/3079)) CI: Auto-cancel previous runs on new commits
- ([PR#3088](https://github.com/dubzzz/fast-check/pull/3088)) Script: Add script to run e2e tests in debug mode
- ([PR#3092](https://github.com/dubzzz/fast-check/pull/3092)) Script: Better handle new projects in changelog generator
- ([PR#3081](https://github.com/dubzzz/fast-check/pull/3081)) Test: Add some poisoning e2e for fast-check
- ([PR#3085](https://github.com/dubzzz/fast-check/pull/3085)) Test: Check poisoning against noop arbitrary (for now)

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
