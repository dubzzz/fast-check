# 1.26.0

_New arbitrary to generate falsy values_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.26.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.25.1...v1.26.0)]

## Features

- ([PR#627](https://github.com/dubzzz/fast-check/pull/627)) New arbitrary to generate falsy values
- ([PR#719](https://github.com/dubzzz/fast-check/pull/719)) Add `withBigInt` flag for `fc.falsy`
- ([PR#718](https://github.com/dubzzz/fast-check/pull/718)) Add `withBigInt` flag for `fc.anything`

## Fixes

- ([PR#632](https://github.com/dubzzz/fast-check/pull/632)) Doc: Script generating the documentation compatible with Windows
- ([PR#652](https://github.com/dubzzz/fast-check/pull/652)) Doc: Add note on chain shrink issues
- ([PR#658](https://github.com/dubzzz/fast-check/pull/658)) Doc: Document how fast-check works under-the-hood
- ([PR#664](https://github.com/dubzzz/fast-check/pull/664)) Doc: Add a compatibility section into the README
- ([PR#665](https://github.com/dubzzz/fast-check/pull/665)) Doc: Fix some typos
- ([PR#700](https://github.com/dubzzz/fast-check/pull/700)) Doc: Remove warnings related to badly set `@param` for ts-docs
- ([PR#729](https://github.com/dubzzz/fast-check/pull/729)) Doc: Add links to commit diff into the CHANGELOG
- ([PR#630](https://github.com/dubzzz/fast-check/pull/630)) Test: Enhance stability of e2e test for AsyncScheduler
- ([PR#636](https://github.com/dubzzz/fast-check/pull/636)) Test: Ensure we can generate the documentation for each PR
- ([PR#637](https://github.com/dubzzz/fast-check/pull/637)) Test: Add missing parameters in QualifiedParameters tests
- ([PR#661](https://github.com/dubzzz/fast-check/pull/661)) Test: Compilation against old releases of TypeScript
- ([PR#720](https://github.com/dubzzz/fast-check/pull/720)) Test: Remove useless CI stage (HEAD)

---

# 1.25.1

_Scheduler was not putting the metadata into the generated report_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.25.1)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.25.0...v1.25.1)]

## Fixes

- ([PR#625](https://github.com/dubzzz/fast-check/pull/625)) Bug: Scheduler forgets to pass the metadata when calling report

# 1.25.0

_Add ability to customize reported errors_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.25.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.24.2...v1.25.0)]

## Features

- ([PR#622](https://github.com/dubzzz/fast-check/pull/622)) Add the ability to provide a custom reporter
- ([PR#623](https://github.com/dubzzz/fast-check/pull/623)) Report the configuration, that has been used, in `RunDetails`
- ([PR#621](https://github.com/dubzzz/fast-check/pull/621)) Expose `fc.defaultReportMessage`
- ([PR#607](https://github.com/dubzzz/fast-check/pull/607)) Better typings for `fc.object` and `fc.dictionnary` :warning:
- ([PR#600](https://github.com/dubzzz/fast-check/pull/600)) Better typings for `RunDetails` :warning:
- ([PR#604](https://github.com/dubzzz/fast-check/pull/604)) Introduce a report method on the scheduler
- ([PR#588](https://github.com/dubzzz/fast-check/pull/588)) Easier replay of failing scheduler

## Fixes

- ([PR#609](https://github.com/dubzzz/fast-check/pull/609)) Clean: Generated typings where causing the doc generation to crash
- ([PR#608](https://github.com/dubzzz/fast-check/pull/608)) Doc: Fix markdown section
- ([PR#602](https://github.com/dubzzz/fast-check/pull/602)) Test: Check compatibility with node 12.x and >= 12.18
- ([PR#599](https://github.com/dubzzz/fast-check/pull/599)) Doc: Document how to use fast-check in web using pika
- ([PR#596](https://github.com/dubzzz/fast-check/pull/596)) Clean: Clean examples based on getByRole
- ([PR#585](https://github.com/dubzzz/fast-check/pull/585)) Doc: Update README with Credits section
- ([PR#594](https://github.com/dubzzz/fast-check/pull/594)) Clean: Add missing `"private": true` on package.json used for tests
- ([PR#592](https://github.com/dubzzz/fast-check/pull/592)) Clean: Update travis configuration to use Node 14
- ([PR#587](https://github.com/dubzzz/fast-check/pull/587)) Test: Check package can be properly imported
- ([PR#586](https://github.com/dubzzz/fast-check/pull/586)) Clean: Rename build scripts to cjs

---

# 1.24.2

_Fix `constantFrom` not compatible with older versions of node_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.24.2)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.24.1...v1.24.2)]

## Fixes

- ([PR#583](https://github.com/dubzzz/fast-check/pull/583)) Bug: `constantFrom` not compatible with old browsers
- ([PR#569](https://github.com/dubzzz/fast-check/pull/569)) Clean: Prebuild to cjs extension 
- ([PR#568](https://github.com/dubzzz/fast-check/pull/568)) Doc: Broken links
- ([PR#575](https://github.com/dubzzz/fast-check/pull/575)) Doc: Invalid code in example of the README 
- ([PR#578](https://github.com/dubzzz/fast-check/pull/578)) Doc: Schedule native timers
- ([PR#576](https://github.com/dubzzz/fast-check/pull/576)) Example: Fibonacci example
- ([PR#577](https://github.com/dubzzz/fast-check/pull/577)) Example: Fix decompPrime example for CodeSandbox
- ([PR#581](https://github.com/dubzzz/fast-check/pull/581)) Example: Fix wrong usages of userEvent.type
- ([PR#579](https://github.com/dubzzz/fast-check/pull/579)) Example: Race conditions with timers

# 1.24.1

_Fixes a code issue detected in `fc.object()` when using `withNullPrototype`_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.24.1)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.24.0...v1.24.1)]

## Fixes

- ([PR#567](https://github.com/dubzzz/fast-check/pull/567)) Bug: Error in the code of `fc.object()` when using `withNullPrototype`

# 1.24.0

_Model based testing and race condition detection_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.24.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.23.0...v1.24.0)]

## Features

- ([PR#491](https://github.com/dubzzz/fast-check/pull/491)) Add ability to run commands in a scheduled context

## Fixes

- ([PR#565](https://github.com/dubzzz/fast-check/pull/565)) Doc: Broken documentation build
- ([PR#566](https://github.com/dubzzz/fast-check/pull/566)) Doc: Document how race conditions can be detected

---

# 1.23.0

_Better typings for `filter` and `oneof` plus support for null prototypes_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.23.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.22.2...v1.23.0)]

## Features

- ([PR#548](https://github.com/dubzzz/fast-check/pull/548)) Stringify should distinguish `{}` from `Object.create(null)` 
- ([PR#552](https://github.com/dubzzz/fast-check/pull/552)) Add ability to generate objects without prototype
- ([PR#555](https://github.com/dubzzz/fast-check/pull/555)) Support type guards while filtering :warning:
- ([PR#556](https://github.com/dubzzz/fast-check/pull/556)) Better typings for oneof and frequency :warning:

## Fixes

- ([PR#554](https://github.com/dubzzz/fast-check/pull/554)) Doc: Add an example on atomic Counter for race conditions feature
- ([PR#557](https://github.com/dubzzz/fast-check/pull/557)) Doc: Add example based on decomposition in prime numbers

---

# 1.22.2

_Remove unused files from the final bundle_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.22.2)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.22.1...v1.22.2)]

## Fixes

- ([PR#550](https://github.com/dubzzz/fast-check/pull/550)) Clean: Switch from npmignore to files to whitelist bundled files instead of blacklisting them
- ([PR#549](https://github.com/dubzzz/fast-check/pull/549)) Clean: Various typos in letrec unit-test
- ([PR#551](https://github.com/dubzzz/fast-check/pull/551)) Clean: CI was not considered as failed when examples failed

# 1.22.1

_Fix broken bundle_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.22.1)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.22.0...v1.22.1)]

# 1.22.0

_Better random values and ability to shrink very large data-structures_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.22.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.21.0...v1.22.0)]

## Features

- ([PR#534](https://github.com/dubzzz/fast-check/pull/534)) Better independance between generated values during a test suite :warning:
- ([PR#536](https://github.com/dubzzz/fast-check/pull/536)) Exclude internationalized-like domains :warning: - ([PR#538](https://github.com/dubzzz/fast-check/pull/538))
- ([PR#537](https://github.com/dubzzz/fast-check/pull/537)) Add xoroshiro128plsu in the list of random generators
- ([PR#539](https://github.com/dubzzz/fast-check/pull/539)) Add js extension onto esm files
- ([PR#540](https://github.com/dubzzz/fast-check/pull/540)) Add metadata on the generated sources (see `fc.__version`)

## Fixes

- ([PR#505](https://github.com/dubzzz/fast-check/pull/505)) Bug: Fix stack overflow when shrinking large arrays
- ([PR#541](https://github.com/dubzzz/fast-check/pull/541)) Bug: Fix stack overflow when shrinking large arrays of commands
- ([PR#511](https://github.com/dubzzz/fast-check/pull/511)) Doc: Add Jest example in the README
- ([PR#542](https://github.com/dubzzz/fast-check/pull/542)) Doc: Example with function arbitrary
- ([PR#518](https://github.com/dubzzz/fast-check/pull/518)) Doc: Fix typos in Arbitraries.md
- ([PR#523](https://github.com/dubzzz/fast-check/pull/523)) Doc: Fix typos in Arbitraries.md
- ([PR#533](https://github.com/dubzzz/fast-check/pull/533)) Doc: Fix typos in Arbitraries.md
- ([PR#529](https://github.com/dubzzz/fast-check/pull/529)) Doc: Tip explaining how to avoid timeouts
- ([PR#519](https://github.com/dubzzz/fast-check/pull/519)) Clean: Add missing files in \*ignore
- ([PR#535](https://github.com/dubzzz/fast-check/pull/535)) Clean: Better logs for GenericArbitraryHelper

---

# 1.21.0

_Better typings for `beforeEach` and `afterEach` and more options on `fc.scheduler`_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.21.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.20.1...v1.21.0)]

## Features

- ([PR#493](https://github.com/dubzzz/fast-check/pull/493)) Automatically wrap tasks using an `act` function in `fc.scheduler` if provided
- ([PR#492](https://github.com/dubzzz/fast-check/pull/492)) Also return the sequence task in `fc.scheduleSequence`
- ([PR#489](https://github.com/dubzzz/fast-check/pull/489)) Allow looser types for beforeEach and afterEach, more accurate and stricter types :warning:

## Fixes

- ([PR#509](https://github.com/dubzzz/fast-check/pull/509)) Bug: `letrec` crashed when asking to generate `__proto__`
- ([PR#510](https://github.com/dubzzz/fast-check/pull/510)) Bug: `letrec` crashed when builder instantiates an object having `__proto__` set to `null`
- ([PR#503](https://github.com/dubzzz/fast-check/pull/503)) Doc: Note on `expect` or `assert`

---

# 1.20.1

_Reduce bundle size_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.20.1)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.20.0...v1.20.1)]

## Fixes

- ([PR#494](https://github.com/dubzzz/fast-check/pull/494)) Clean: Remove tsbuildinfo files from the bundle
- ([PR#495](https://github.com/dubzzz/fast-check/pull/495)) Clean: Remove unneeded `@param` in JSDoc of `property` and `tuple`

# 1.20.0

_Built-in support for race condition detection_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.20.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.19.0...v1.20.0)]

## Features

- ([PR#479](https://github.com/dubzzz/fast-check/pull/479)) Add `fc.scheduler` arbitrary

## Fixes

- ([PR#487](https://github.com/dubzzz/fast-check/pull/487)) Doc: Clean autocomplete example

---

# 1.19.0

_Interrupt test-suites after a given delay while the number of runs have not been reached_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.19.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.18.1...v1.19.0)]

## Features

- ([PR#428](https://github.com/dubzzz/fast-check/pull/428)) Implement `interruptAfterTimeLimit`
- ([PR#463](https://github.com/dubzzz/fast-check/pull/463)) Adapt and expose `IRawProperty`, `IProperty` and `IAsyncProperty` types

## Fixes

- ([PR#455](https://github.com/dubzzz/fast-check/pull/455)) Clean: Add watch mode test and build scripts
- ([PR#456](https://github.com/dubzzz/fast-check/pull/456)) Clean: Bump all dev dependencies
- ([PR#457](https://github.com/dubzzz/fast-check/pull/457)) Clean: Use `ts-jest/utils` `mocked` instead of our own `mockModule`
- ([PR#449](https://github.com/dubzzz/fast-check/pull/449)) Clean: Moving away from npm, switching to yarn
- ([PR#471](https://github.com/dubzzz/fast-check/pull/471)) Clean: Minor fixes related to internal typings
- ([PR#473](https://github.com/dubzzz/fast-check/pull/473)) Clean: Remove unused variables in units
- ([PR#474](https://github.com/dubzzz/fast-check/pull/474)) Clean: Enable no-unused-vars eslint rule
- ([PR#465](https://github.com/dubzzz/fast-check/pull/465)) Doc: Examples served by CodeSandbox and improvement of the examples - ([PR#466](https://github.com/dubzzz/fast-check/pull/466)), ([PR#467](https://github.com/dubzzz/fast-check/pull/467)), ([PR#469](https://github.com/dubzzz/fast-check/pull/469)), ([PR#470](https://github.com/dubzzz/fast-check/pull/470)), ([PR#472](https://github.com/dubzzz/fast-check/pull/472)), ([PR#476](https://github.com/dubzzz/fast-check/pull/476))
- ([PR#475](https://github.com/dubzzz/fast-check/pull/475)) Test: Do not run travis outside of master and PRs for master
- ([PR#464](https://github.com/dubzzz/fast-check/pull/464)) Test: Add tests for typings based on tsd
- ([PR#481](https://github.com/dubzzz/fast-check/pull/481)) Test: Configure CodeSandbox CI

---

# 1.18.1

_Typings regression for `fc.object`_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.18.1)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.18.0...v1.18.1)]

## Fixes

- Bug: Typing regression on `fc.object`

# 1.18.0

_Support for global parameters with `fc.configureGlobal(parameters)`_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.18.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.17.0...v1.18.0)]

## Features

- ([PR#439](https://github.com/dubzzz/fast-check/pull/439)) Support for global parameters

## Fixes

- ([PR#438](https://github.com/dubzzz/fast-check/pull/438)) Clean: Add sideEffects flag into package.json
- ([PR#440](https://github.com/dubzzz/fast-check/pull/440)) Clean: Migrate from tslint to eslint - ([PR#447](https://github.com/dubzzz/fast-check/pull/447)), ([PR#451](https://github.com/dubzzz/fast-check/pull/451))
- ([PR#443](https://github.com/dubzzz/fast-check/pull/443)) Doc: Export missing `WeightedArbitrary`
- ([PR#444](https://github.com/dubzzz/fast-check/pull/444)) Doc: Add missing documentation for `fc.frequency`
- ([PR#446](https://github.com/dubzzz/fast-check/pull/446)) Doc: Add code contributors widget directly in README.md
- ([PR#436](https://github.com/dubzzz/fast-check/pull/436)) Typings: Better typings for `fc.anything`-like arbitraries

---

# 1.17.0

_Multiple new arbitraries: date, ipv4 extended, uuid, mixed case and many settings_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.17.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.16.3...v1.17.0)]

## Features

- ([PR#420](https://github.com/dubzzz/fast-check/pull/420)) Add `fc.date` arbitrary
- ([PR#427](https://github.com/dubzzz/fast-check/pull/427)) Add `fc.mixedCase` arbitrary
- ([PR#393](https://github.com/dubzzz/fast-check/pull/393)) Support all the range of valid ipV4 with `fc.ipV4Extended` arbitrary
- ([PR#401](https://github.com/dubzzz/fast-check/pull/401)) Add ability to customize the null value of `fc.option`
- ([PR#411](https://github.com/dubzzz/fast-check/pull/411)) Add `fc.uuid` arbitrary
- ([PR#433](https://github.com/dubzzz/fast-check/pull/433)) Add `fc.uuidV` to tackle specific version of uuid
- ([PR#400](https://github.com/dubzzz/fast-check/pull/400)) Add `withObjectString` flag in `fc.object`/`fc.anything`

## Fixes

- ([PR#425](https://github.com/dubzzz/fast-check/pull/425)) Bug: skipAllAfterTimeLimit throws when it passes time limit
- ([PR#409](https://github.com/dubzzz/fast-check/pull/409)) Bug: Web authority should not produce port outside 0-65535
- ([PR#418](https://github.com/dubzzz/fast-check/pull/418)) Bug: Infinite loop when path is one level deep and all runs succeed
- ([PR#430](https://github.com/dubzzz/fast-check/pull/430)) Bug: No timeout expiration on node blocks exit
- ([PR#396](https://github.com/dubzzz/fast-check/pull/396)) Clean: Update dependencies and dev dependencies
- ([PR#432](https://github.com/dubzzz/fast-check/pull/432)) Clean: Prepare code for ts3.7-pr33401
- ([PR#410](https://github.com/dubzzz/fast-check/pull/410)) Contrib: Document how to add new arbitraries in fast-check
- ([PR#408](https://github.com/dubzzz/fast-check/pull/408)) Doc: Usage in conjonction with faker
- ([PR#412](https://github.com/dubzzz/fast-check/pull/412)) Doc: Diff format in shrinking example
- ([PR#414](https://github.com/dubzzz/fast-check/pull/414)) Doc: Update ts-jest config (tsConfigFile -> tsConfig)
- ([PR#417](https://github.com/dubzzz/fast-check/pull/417)) Doc: Add section "Migrate from jsverify to fast-check"
- ([PR#434](https://github.com/dubzzz/fast-check/pull/434)) Doc: Add table of contents on top of the documentation
- ([PR#397](https://github.com/dubzzz/fast-check/pull/397)) Test: Reduce flakyness of tests on letrec
- ([PR#422](https://github.com/dubzzz/fast-check/pull/422)) Test: Rework unit tests of DateArbitrary

---

# 1.16.3

_skipAllAfterTimeLimit throws when it passes time limit_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.16.3)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.16.2...v1.16.3)]

## Fixes

- ([PR#425](https://github.com/dubzzz/fast-check/pull/425)) skipAllAfterTimeLimit throws when it passes time limit

# 1.16.2

_Web authority ports should be within 0-65535_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.16.2)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.16.1...v1.16.2)]

## Fixes

- ([PR#409](https://github.com/dubzzz/fast-check/pull/409)) Web authority should not produce port outside 0-65535

# 1.16.1

_Infinite loop on replays with one-level-deep path_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.16.1)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.16.0...v1.16.1)]

## Fixes

- ([PR#418](https://github.com/dubzzz/fast-check/pull/418)) Infinite loop when path is one level deep and all runs succeed

# 1.16.0

_Easier recursive data-structures_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.16.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.15.4...v1.16.0)]

## Features

- ([PR#377](https://github.com/dubzzz/fast-check/pull/377)) Add `fc.letrec` arbitrary
- ([PR#378](https://github.com/dubzzz/fast-check/pull/378)) Add `fc.memo` arbitrary
- ([PR#385](https://github.com/dubzzz/fast-check/pull/385)) Add caching for `withBias` of `fc.letrec` arbitrary
- ([PR#370](https://github.com/dubzzz/fast-check/pull/370)) Add minimum and maximum validation to integer and nat
- ([PR#382](https://github.com/dubzzz/fast-check/pull/382)) Take `fc.cloneMethod` into account for commands
- ([PR#372](https://github.com/dubzzz/fast-check/pull/372)) Stringify Date as valid JavaScript
- ([PR#371](https://github.com/dubzzz/fast-check/pull/371)) Stringify Symbol as valid JavaScript

## Fixes

- ([PR#375](https://github.com/dubzzz/fast-check/pull/375)) Clean: Bump TypeScript to 3.5
- ([PR#384](https://github.com/dubzzz/fast-check/pull/384)) Clean: Remove circular dependency in WebArbitrary file
- ([PR#389](https://github.com/dubzzz/fast-check/pull/389)) Test: Check that `fc.memo` and `fc.letrec` are compatible with node 0.12
- ([PR#376](https://github.com/dubzzz/fast-check/pull/376)) Test: Fix broken e2e tests
- ([PR#385](https://github.com/dubzzz/fast-check/pull/385)) Test: Mark warnings as errors in rollup config
- ([PR#388](https://github.com/dubzzz/fast-check/pull/388)) Type: Fix type inferrence bug in `modelRun`
- ([PR#379](https://github.com/dubzzz/fast-check/pull/379)) Refactoring: Re-implement `fc.object` with `fc.memo`

---

# 1.15.4

_skipAllAfterTimeLimit throws when it passes time limit_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.15.4)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.15.3...v1.15.4)]

## Fixes

- ([PR#425](https://github.com/dubzzz/fast-check/pull/425)) skipAllAfterTimeLimit throws when it passes time limit

# 1.15.3

_Web authority ports should be within 0-65535_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.15.3)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.15.2...v1.15.3)]

## Fixes

- ([PR#409](https://github.com/dubzzz/fast-check/pull/409)) Web authority should not produce port outside 0-65535

# 1.15.2

_Infinite loop on replays with one-level-deep path_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.15.2)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.15.1...v1.15.2)]

## Fixes

- ([PR#418](https://github.com/dubzzz/fast-check/pull/418)) Infinite loop when path is one level deep and all runs succeed

# 1.15.1

_Documentation updates_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.15.1)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.15.0...v1.15.1)]

## Fixes

- ([PR#363](https://github.com/dubzzz/fast-check/pull/363)) Clean: Bump dev dependencies
- ([PR#366](https://github.com/dubzzz/fast-check/pull/366)) Clean: Incremental build
- ([PR#362](https://github.com/dubzzz/fast-check/pull/362)) Clean: Test against node 12
- ([PR#361](https://github.com/dubzzz/fast-check/pull/361)) Doc: Clarify replay of commands
- ([PR#368](https://github.com/dubzzz/fast-check/pull/368)) Doc: Direct link to genrated documentation
- ([PR#364](https://github.com/dubzzz/fast-check/pull/364)) Doc: Extra badges in README
- ([PR#358](https://github.com/dubzzz/fast-check/pull/358)) Doc: Fix various typos
- ([PR#355](https://github.com/dubzzz/fast-check/pull/355)) Test: Add no regression snapshot tests

# 1.15.0

_Add auto-skip after time limit option for runners_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.15.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.14.2...v1.15.0)]

## Features

- ([PR#352](https://github.com/dubzzz/fast-check/pull/352)) Ability to auto skip runs after time limit
- ([PR#348](https://github.com/dubzzz/fast-check/pull/348)) Expose `fc.stringify` in the API

## Fixes

- ([PR#354](https://github.com/dubzzz/fast-check/pull/354)) Doc: Add examples of issues discovered using fast-check
- ([PR#353](https://github.com/dubzzz/fast-check/pull/353)) Doc: Better logo
- ([PR#351](https://github.com/dubzzz/fast-check/pull/351)) Size: Add dependency to tslib - *should reduce size of the bundle*
- ([PR#349](https://github.com/dubzzz/fast-check/pull/349)) Test: No regression snapshot tests

---

# 1.14.2

_Web authority ports should be within 0-65535_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.14.2)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.14.1...v1.14.2)]

## Fixes

- ([PR#409](https://github.com/dubzzz/fast-check/pull/409)) Web authority should not produce port outside 0-65535

# 1.14.1

_Infinite loop on replays with one-level-deep path_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.14.1)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.14.0...v1.14.1)]

## Fixes

- ([PR#418](https://github.com/dubzzz/fast-check/pull/418)) Infinite loop when path is one level deep and all runs succeed

# 1.14.0

_New generated documentation and new arbitraries_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.14.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.13.1...v1.14.0)]

## Features

- ([PR#339](https://github.com/dubzzz/fast-check/pull/339)) Add `fc.ipV4()` and `fc.ipV6()` arbitraries
- ([PR#340](https://github.com/dubzzz/fast-check/pull/340)) Add `fc.mapToConstant()` arbitrary
- ([PR#344](https://github.com/dubzzz/fast-check/pull/344)) Add `fc.webUrl()` and other web urls related arbitraries
- ([PR#345](https://github.com/dubzzz/fast-check/pull/345)) Add `fc.emailAddress()` arbitrary

## Fixes

- ([PR#343](https://github.com/dubzzz/fast-check/pull/343)) Doc: Generate the API documentation with docsify

---

# 1.13.1

_Infinite loop on replays with one-level-deep path_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.13.1)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.13.0...v1.13.1)]

## Fixes

- ([PR#418](https://github.com/dubzzz/fast-check/pull/418)) Infinite loop when path is one level deep and all runs succeed

# 1.13.0

_Remove dependency to lorem-ipsum and more control over `fc.anything` and `fc.object`_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.13.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.12.2...v1.13.0)]

## Features

- ([PR#336](https://github.com/dubzzz/fast-check/pull/336)) Remove dependency to lorem-ipsum
- ([PR#337](https://github.com/dubzzz/fast-check/pull/337)) `fc.frequency()` should be compatible with legacy node
- ([PR#338](https://github.com/dubzzz/fast-check/pull/338)) Add parameter to customize size of `fc.object()` and `fc.anything()`

---

# 1.12.2

_Infinite loop on replays with one-level-deep path_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.12.2)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.12.1...v1.12.2)]

## Fixes

- ([PR#418](https://github.com/dubzzz/fast-check/pull/418)) Infinite loop when path is one level deep and all runs succeed

# 1.12.1

_Lighter bundle_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.12.1)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.12.0...v1.12.1)]

## Fixes

- ([PR#327](https://github.com/dubzzz/fast-check/pull/327)) Doc: Ability to copy-paste snippets in HandsOnPropertyBased.md
- ([PR#334](https://github.com/dubzzz/fast-check/pull/334)) Size: Reduce the size of the bundle - *Potential issue if your code directly references TupleArbitrary<T1...>, it should be replaced by Arbitrary<[T1,...]>*

# 1.12.0

_Better balance between values produced by `fc.anything()`_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.12.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.11.1...v1.12.0)]

## Features

- ([PR#325](https://github.com/dubzzz/fast-check/pull/325)) Better balance between values produced by `fc.anything()`

---

# 1.11.1

_Infinite loop on replays with one-level-deep path_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.11.1)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.11.0...v1.11.1)]

## Fixes

- ([PR#418](https://github.com/dubzzz/fast-check/pull/418)) Infinite loop when path is one level deep and all runs succeed

# 1.11.0

_Replay ability for commands and new arbitraries_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.11.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.10.2...v1.11.0)]

## Features

- ([PR#321](https://github.com/dubzzz/fast-check/pull/321)) Add new flags for `fc.anything` and `fc.object`: `withBoxedValues`, `withSet`, `withMap`
- ([PR#320](https://github.com/dubzzz/fast-check/pull/320)) Better string representation of failing values
- ([PR#317](https://github.com/dubzzz/fast-check/pull/317)) Add `fc.dedup` arbitrary
- ([PR#294](https://github.com/dubzzz/fast-check/pull/294)) Replay ability for commands
- ([PR#292](https://github.com/dubzzz/fast-check/pull/292)) Flag to stop the test as soon as it fails
- ([PR#288](https://github.com/dubzzz/fast-check/pull/288)) Add `fc.maxSafeInteger` and `fc.maxSafeNat` arbitraries

## Fixes

- ([PR#295](https://github.com/dubzzz/fast-check/pull/295)) Bug: Not shrinking commands themselves
- ([PR#290](https://github.com/dubzzz/fast-check/pull/290)) Bug: ExecutionStatus defined as const enum
- ([PR#298](https://github.com/dubzzz/fast-check/pull/298)) Clean: Factorize code of Runner
- ([PR#297](https://github.com/dubzzz/fast-check/pull/297)) Clean: Takkle issues reported by codeclimate
- ([PR#306](https://github.com/dubzzz/fast-check/pull/306)) Doc: Add issues discovered by fast-check
- ([PR#287](https://github.com/dubzzz/fast-check/pull/287)) Doc: Add issues discovered by fast-check
- ([PR#322](https://github.com/dubzzz/fast-check/pull/322)) Doc: Links next to features described in Readme
- ([PR#309](https://github.com/dubzzz/fast-check/pull/309)) Test: Factorize Jest configurations
- ([PR#307](https://github.com/dubzzz/fast-check/pull/307)) Test: Ensure web-build is correct
- ([PR#300](https://github.com/dubzzz/fast-check/pull/300)) Perf: No more holey array in `fc.array`

---

# 1.10.2

_Infinite loop on replays with one-level-deep path_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.10.2)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.10.1...v1.10.2)]

## Fixes

- ([PR#418](https://github.com/dubzzz/fast-check/pull/418)) Infinite loop when path is one level deep and all runs succeed

# 1.10.1

_Fix browser bundle_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.10.1)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.10.0...v1.10.1)]

## Fixes

- ([ISSUE#304](https://github.com/dubzzz/fast-check/issues/304)) Fix browser bundle

# 1.10.0

_Better shrinking of commands_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.10.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.9.4...v1.10.0)]

## Features

- ([PR#280](https://github.com/dubzzz/fast-check/pull/280)) Better shrinking of commands

---

# 1.9.4

_Infinite loop on replays with one-level-deep path_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.9.4)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.9.3...v1.9.4)]

## Fixes

- ([PR#418](https://github.com/dubzzz/fast-check/pull/418)) Infinite loop when path is one level deep and all runs succeed

# 1.9.3

_Fix browser bundle_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.9.3)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.9.2...v1.9.3)]

## Fixes

- ([ISSUE#304](https://github.com/dubzzz/fast-check/issues/304)) Fix browser bundle

# 1.9.2

_Adapt typings for older versions of TypeScript_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.9.2)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.9.1...v1.9.2)]

## Fixes

- ([PR#282](https://github.com/dubzzz/fast-check/pull/282)) Bug: Cannot find name 'bigint'
- ([PR#282](https://github.com/dubzzz/fast-check/pull/282)) Declare umd build in package.json

# 1.9.1

_VerbosityLevel enum is accessible through fc.VerbosityLevel_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.9.1)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.9.0...v1.9.1)]

## Fixes

- ([PR#278](https://github.com/dubzzz/fast-check/pull/278)) Bug: VerbosityLevel values not accessible

# 1.9.0

_BigInt support and new verbosity level_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.9.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.8.3...v1.9.0)]

## Features

- ([PR#274](https://github.com/dubzzz/fast-check/pull/274)) Add support for asynchronous check method in AsyncCommand
- ([PR#271](https://github.com/dubzzz/fast-check/pull/271)) More verbose option
- ([PR#268](https://github.com/dubzzz/fast-check/pull/268)) Add `bigInt`, `bigIntN`, `bigUint`, `bigUintN` arbitraries
- ([PR#263](https://github.com/dubzzz/fast-check/pull/263)) Default seed based on random in addition of timestamp

## Fixes

- ([PR#272](https://github.com/dubzzz/fast-check/pull/272)) Bug: Commands partially cloned during the shrinking process
- ([PR#264](https://github.com/dubzzz/fast-check/pull/264)) Bug: Non-integer seeds not using the full range of integers
- ([PR#269](https://github.com/dubzzz/fast-check/pull/269)) Clean: Migrate tests to Jest
- ([PR#276](https://github.com/dubzzz/fast-check/pull/276)) Clean: Unecessary try catch removed for `modelRun`

---

# 1.8.3

_Infinite loop on replays with one-level-deep path_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.8.3)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.8.2...v1.8.3)]

## Fixes

- ([PR#418](https://github.com/dubzzz/fast-check/pull/418)) Infinite loop when path is one level deep and all runs succeed

# 1.8.2

_Fix regression introduced in the shrinking of cloneable_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.8.2)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.8.1...v1.8.2)]

## Fixes

- ([PR#262](https://github.com/dubzzz/fast-check/pull/262)) Bug: Too many shrinks for `commands`
- ([PR#261](https://github.com/dubzzz/fast-check/pull/261)) Bug: Unability to shrink mapped `commands`
- ([PR#259](https://github.com/dubzzz/fast-check/pull/259)) Bug: Move cloning responsability at a single place in the code
- ([PR#258](https://github.com/dubzzz/fast-check/pull/258)) Bug: Shrinker of commands failed to shrink twice (in depth)

# 1.8.1

_Support asynchronous model setup_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.8.1)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.8.0...v1.8.1)]

## Fixes

- ([PR#249](https://github.com/dubzzz/fast-check/pull/249)) Bug: `asyncModelRun` must accept asynchonous setup function

# 1.8.0

_Native handling of stateful generated values_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.8.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.7.2...v1.8.0)]

## Features

- ([PR#245](https://github.com/dubzzz/fast-check/pull/245)) `seed` can be any possible `double` value
- ([PR#229](https://github.com/dubzzz/fast-check/pull/229)) Add `context` arbitrary
- ([PR#237](https://github.com/dubzzz/fast-check/pull/237)) Add `infiniteStream` arbitrary
- ([PR#229](https://github.com/dubzzz/fast-check/pull/229)) Add cloneable capabilities for stateful generated values

## Fixes

- ([PR#241](https://github.com/dubzzz/fast-check/pull/241)) Doc: Add an example for `asyncProperty`
- ([PR#238](https://github.com/dubzzz/fast-check/pull/238)) Better logs for `fc.func`, `fc.compareFunc` and `fc.compareBooleanFunc`
- ([PR#235](https://github.com/dubzzz/fast-check/pull/235)) Better handling of `fc.commands`

---

# 1.7.2

_Infinite loop on replays with one-level-deep path_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.7.2)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.7.1...v1.7.2)]

## Fixes

- ([PR#418](https://github.com/dubzzz/fast-check/pull/418)) Infinite loop when path is one level deep and all runs succeed

# 1.7.1

_Fix import of loremIpsum library_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.7.1)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.7.0...v1.7.1)]

## Fixes

- ([PR#226](https://github.com/dubzzz/fast-check/pull/226)) Fix import of loremIpsum library

# 1.7.0

_Switch to another PRNG for better performances, better fc.commands_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.7.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.6.3...v1.7.0)]

## Features

- ([PR#221](https://github.com/dubzzz/fast-check/pull/221)) Better shrink capabilities for `fc.commands`

## Fixes

- ([PR#220](https://github.com/dubzzz/fast-check/pull/220)) Switch to another PRNG as default random - *more performances*
- ([PR#217](https://github.com/dubzzz/fast-check/pull/217)) Better typings for `fc.record`

---

# 1.6.3

_Infinite loop on replays with one-level-deep path_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.6.3)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.6.2...v1.6.3)]

## Fixes

- ([PR#418](https://github.com/dubzzz/fast-check/pull/418)) Infinite loop when path is one level deep and all runs succeed

# 1.6.2

_Performance improvements_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.6.2)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.6.1...v1.6.2)]

## Fixes

- ([PR#215](https://github.com/dubzzz/fast-check/pull/215)) Fix deopt in Stream.join and Random.uniformIn
- ([PR#211](https://github.com/dubzzz/fast-check/pull/211)) Remove costly spread operator in ArrayArbitrary
- ([PR#210](https://github.com/dubzzz/fast-check/pull/210)) Reduce the number of closures in Stream
- ([PR#209](https://github.com/dubzzz/fast-check/pull/209)) Bump to `pure-rand@1.4.2`: improvements on mersenne twister
- ([PR#208](https://github.com/dubzzz/fast-check/pull/208)) Bump to `pure-rand@1.4.1`: destructuring was too costly

# 1.6.1

_Performance improvements_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.6.1)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.6.0...v1.6.1)]

## Fixes

- ([PR#207](https://github.com/dubzzz/fast-check/pull/207)) Performance improvements done on `pure-rand` side

# 1.6.0

_ESM version of the package published to npm, arbitraries to generate functions and more settings to be able to tweak the execution_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.6.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.5.1...v1.6.0)]

## Features

- ([PR#201](https://github.com/dubzzz/fast-check/pull/201)) Add `compareBooleanFunc`, `compareFunc` and `func` arbitraries
- ([PR#200](https://github.com/dubzzz/fast-check/pull/200)) Parameter `randomType` to choose the random generator
- ([PR#202](https://github.com/dubzzz/fast-check/pull/202)) Property hooks for `beforeEach` and `afterEach`
- ([PR#196](https://github.com/dubzzz/fast-check/pull/196)) Publish both cjs and esm versions of the package

## Fixes

- ([PR#175](https://github.com/dubzzz/fast-check/pull/175)) Characters must be biased by default
- ([PR#184](https://github.com/dubzzz/fast-check/pull/184)) Update to latest lorem-ipsum

---

# 1.5.1

_Infinite loop on replays with one-level-deep path_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.5.1)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.5.0...v1.5.1)]

## Fixes

- ([PR#418](https://github.com/dubzzz/fast-check/pull/418)) Infinite loop when path is one level deep and all runs succeed

# 1.5.0

_Property based test state machine: UI, automata._
[[Code](https://github.com/dubzzz/fast-check/tree/v1.5.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.4.1...v1.5.0)]
_Addition of `subarray` and `shuffledSubarray` arbitraries_

## Features

- ([PR#177](https://github.com/dubzzz/fast-check/pull/177)) Add `subarray` and `shuffledSubarray` arbitraries
- ([PR#157](https://github.com/dubzzz/fast-check/pull/157)) Model based testing and commands
- ([PR#158](https://github.com/dubzzz/fast-check/pull/158)) Characters shrink towards printable ascii


## Fixes

- ([PR#170](https://github.com/dubzzz/fast-check/pull/170)) Fix: `fullUnicode` and `fullUnicodeString` were failing on old releases of node
- ([PR#178](https://github.com/dubzzz/fast-check/pull/178)) Doc: Update typedoc
- ([PR#161](https://github.com/dubzzz/fast-check/pull/161)) Doc: Suggest bundle.run instead of jsdelivr

---

# 1.4.1

_Infinite loop on replays with one-level-deep path_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.4.1)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.4.0...v1.4.1)]

## Fixes

- ([PR#418](https://github.com/dubzzz/fast-check/pull/418)) Infinite loop when path is one level deep and all runs succeed

# 1.4.0

_Suggest custom test values with `examples`_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.4.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.3.0...v1.4.0)]

## Features

- ([PR#148](https://github.com/dubzzz/fast-check/pull/148)) Manually add concrete examples to test

## Fixes

- ([PR#153](https://github.com/dubzzz/fast-check/pull/153)) Edit npm project description
- ([PR#152](https://github.com/dubzzz/fast-check/pull/152)) Add minimal supported node engine version in package.json
- ([PR#149](https://github.com/dubzzz/fast-check/pull/149)) Bump npm dependencies

---

# 1.3.0

_Filter invalid values directly in predicates using `fc.pre`_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.3.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.2.3...v1.3.0)]

## Features

- ([PR#140](https://github.com/dubzzz/fast-check/pull/140)) Make seed and path copy pasteable
- ([PR#138](https://github.com/dubzzz/fast-check/pull/138)) Remove core-js, no more global namespace pollution
- ([PR#118](https://github.com/dubzzz/fast-check/pull/118)) Enable preconditions in predicate

---

# 1.2.3

_Reduce package footprint and less restrictive API for `oneof`/`frequency`_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.2.3)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.2.2...v1.2.3)]

## Fixes

- ([PR#135](https://github.com/dubzzz/fast-check/pull/135)) Do not force explicitly one parameter in `oneof`/`frequency` 
- ([PR#134](https://github.com/dubzzz/fast-check/pull/134)) Doc: Typos in README
- ([PR#132](https://github.com/dubzzz/fast-check/pull/132)) Add missing exports for `jsonObject` and `unicodeJsonObject`
- ([PR#131](https://github.com/dubzzz/fast-check/pull/131)) Reduce package size
- ([PR#130](https://github.com/dubzzz/fast-check/pull/130)) Doc: Examples for generation of recursive structures

# 1.2.2

_Less restrictive API for `constantFrom`_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.2.2)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.2.1...v1.2.2)]

## Fixes

- ([PR#123](https://github.com/dubzzz/fast-check/pull/123)) Do not force explicitly one parameter in `constantFrom`

# 1.2.1

_Readme update_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.2.1)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.2.0...v1.2.1)]

## Fixes

- ([b80b4f92](https://github.com/dubzzz/fast-check/commit/b80b4f92)) Doc: Model based testing example
- ([cc4f4f4f](https://github.com/dubzzz/fast-check/commit/cc4f4f4f)) Doc: Getting started tutorial

# 1.2.0

_Built-in chaining of arbitraries_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.2.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.1.4...v1.2.0)]

## Features

- ([PR#103](https://github.com/dubzzz/fast-check/pull/103)) Use the output of arbitraries to produce other ones with `.chain(...)`
- ([PR#114](https://github.com/dubzzz/fast-check/pull/114)) Add shrink for `fc.lorem`
- ([PR#116](https://github.com/dubzzz/fast-check/pull/116)) Throw exception in case of bad path when trying to replay a failure

## Fixes:

- ([PR#117](https://github.com/dubzzz/fast-check/pull/117)) Doc: Fully revamp the documentation
- ([a5dcd71c](https://github.com/dubzzz/fast-check/commit/a5dcd71c)) Doc: New logo

---

# 1.1.4

_Better performance for biased arbitraries (=default)_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.1.4)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.1.3...v1.1.4)]

## Fixes

- ([PR#107](https://github.com/dubzzz/fast-check/pull/107)) Fix: Performance issue when using biased arbitraries
- ([743d7619](https://github.com/dubzzz/fast-check/commit/743d7619)) Fix: Bump to the latest version of `pure-rand`

# 1.1.3

_Export missing `fc.stringOf`_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.1.3)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.1.2...v1.1.3)]

## Fixes

- ([63915033](https://github.com/dubzzz/fast-check/commit/63915033)) Fix: Export missing `fc.stringOf`

# 1.1.2

_Readme update_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.1.2)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.1.1...v1.1.2)]

## Fixes

- ([68893e99](https://github.com/dubzzz/fast-check/commit/68893e99)) Doc: Why should I migrate section? in README.md
- ([d779aa9e](https://github.com/dubzzz/fast-check/commit/d779aa9e)) Doc: Verbose mode explained in README.md
- ([eacc7f0e](https://github.com/dubzzz/fast-check/commit/eacc7f0e)) Doc: Bug detected using property based testing and fast-check

# 1.1.1

_Ability to use min and max boundaries outside of 32 bits integers for `fc.integer`_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.1.1)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.1.0...v1.1.1)]

## Fixes

- ([b45b90eb](https://github.com/dubzzz/fast-check/commit/b45b90eb)) Ability to use min and max boundaries outside of 32 bits integers: `fc.integer(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER)`

# 1.1.0

_Straight to corner cases and verbose mode_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.1.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.0.4...v1.1.0)]

## Features

- ([PR#91](https://github.com/dubzzz/fast-check/pull/91)) Straight to corner cases by default, see `unbiased` option of `assert` to disable it
- ([PR#93](https://github.com/dubzzz/fast-check/pull/93)) Verbose mode on failure to have the list of all failing values encountered, see `verbose` option of `assert` to enable it
- ([PR#94](https://github.com/dubzzz/fast-check/pull/94)) Better typings for `fc.record`

---

# 1.0.4

_TypeScript and JavaScript documentation of the code using TypeDoc_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.0.4)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.0.3...v1.0.4)]

## Features

- ([cc73ab33](https://github.com/dubzzz/fast-check/commit/cc73ab33)) Add stringOf arbitrary

## Fixes

- ([959fb52b](https://github.com/dubzzz/fast-check/commit/959fb52b)) Doc: Add a Tips section in the Readme
- ([0dd1e66a](https://github.com/dubzzz/fast-check/commit/0dd1e66a)) Doc: Link towards the generated documentation in the Readme

# 1.0.3

_Reduce risk of using an unimplemented method of Node (older releases <6)_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.0.3)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.0.2...v1.0.3)]

## Fixes

- ([55ff3ff](https://github.com/dubzzz/fast-check/commit/55ff3ff)) Clean: Switch to the latest ES standard to use its implementations
- ([ce75e4e](https://github.com/dubzzz/fast-check/commit/ce75e4e)) Fix: Safer polyfill for older version of node - rely on core-js

# 1.0.2

_Readme update following removal of depreciated devDependencies_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.0.2)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.0.1...v1.0.2)]

## Fixes

- ([309a00b](https://github.com/dubzzz/fast-check/commit/309a00b)) Doc: Update README.md
- ([e13df27](https://github.com/dubzzz/fast-check/commit/e13df27)) Clean: Clean depreciated dependencies

# 1.0.1

_Fix infinite loop when shrinking array having a minimal length defined_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.0.1)][[Diff](https://github.com/dubzzz/fast-check/compare/v1.0.0...v1.0.1)]

## Fixes

- ([d6468dc](https://github.com/dubzzz/fast-check/commit/d6468dc)) Fix: shrink an array with minimal length lead to infinite loop

# 1.0.0

_Easier replay of failures_
[[Code](https://github.com/dubzzz/fast-check/tree/v1.0.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v0.0.13...v1.0.0)]

_Faster shrinks_

_No recursion when shrinking_

## Features

- ([7dd6fdb](https://github.com/dubzzz/fast-check/commit/7dd6fdb)) Add min/max parameters on fc.float and fc.double
- ([e294eed](https://github.com/dubzzz/fast-check/commit/e294eed)) Naming: lower camel case for settings keys
- ([6f35cdd](https://github.com/dubzzz/fast-check/commit/6f35cdd)) Check inputs provided to fc.property for easier troubleshoot
- ([b960938](https://github.com/dubzzz/fast-check/commit/b960938)) Naming: rename generic_tuple into genericTuple
- ([d1dde51](https://github.com/dubzzz/fast-check/commit/d1dde51)) Faster shrink of arrays (and must of others because built on top of arrays x integers)
- ([fc57174](https://github.com/dubzzz/fast-check/commit/fc57174)) Faster shrink of integers
- ([be038f0](https://github.com/dubzzz/fast-check/commit/be038f0)) Replay a failure by setting seed and path
- ([d25d233](https://github.com/dubzzz/fast-check/commit/d25d233)) Feature counterexamplePath in case of failure
- ([c7a1508](https://github.com/dubzzz/fast-check/commit/c7a1508)) Update error message content in case of failure in fc.assert
- ([eb0d3c2](https://github.com/dubzzz/fast-check/commit/eb0d3c2)) Better rendering of strings
- ([1e0a73d](https://github.com/dubzzz/fast-check/commit/1e0a73d)) Switch to pure-rand library to handle the random number generation

## Fixes

- ([56f1e03](https://github.com/dubzzz/fast-check/commit/56f1e03)) Clean: Bump versions of dependencies
- ([d0027d7](https://github.com/dubzzz/fast-check/commit/d0027d7)) Clean: Do not throw raw strings but Error
- ([6af9e6b](https://github.com/dubzzz/fast-check/commit/6af9e6b)) Clean: Remove power-assert from devDependencies
- ([fe44db5](https://github.com/dubzzz/fast-check/commit/fe44db5)) Fix: Avoid recursion during shrinking
- ([e3ecc3c](https://github.com/dubzzz/fast-check/commit/e3ecc3c)) Fix: Bad number of shrinks in case of failure (offset by one)
- ([79c08f7](https://github.com/dubzzz/fast-check/commit/79c08f7)) Fix: Export dictionary arbitrary
