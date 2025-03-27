# 4.0.1

_TODO Description_
[[Code](https://github.com/dubzzz/fast-check/tree/v4.0.1)][[Diff](https://github.com/dubzzz/fast-check/compare/v4.0.0...v4.0.1)]

## Features



## Fixes

- ([PR#5862](https://github.com/dubzzz/fast-check/pull/5862)) CI: Cache LFS files cross builds
- ([PR#5864](https://github.com/dubzzz/fast-check/pull/5864)) CI: Do not pull logo of README from LFS
- ([PR#5849](https://github.com/dubzzz/fast-check/pull/5849)) Doc: Drop link to rescript-fast-check
- ([PR#5865](https://github.com/dubzzz/fast-check/pull/5865)) Doc: Document our new Vitest proposal
- ([PR#5735](https://github.com/dubzzz/fast-check/pull/5735)) Test: Run tests in workspace mode

# 4.0.0

_Reducing the API surface to ease ramp-up on fast-check_
[[Code](https://github.com/dubzzz/fast-check/tree/v4.0.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v3.23.2...v4.0.0)]

The simplest migration guide to v4 is probably [here](https://fast-check.dev/docs/migration-guide/from-3.x-to-4.x/).

## Breaking changes

- ([PR#5589](https://github.com/dubzzz/fast-check/pull/5589)) Include invalid dates by default
- ([PR#5590](https://github.com/dubzzz/fast-check/pull/5590)) Error with cause by default
- ([PR#5597](https://github.com/dubzzz/fast-check/pull/5597)) Include null-prototype by default in record
- ([PR#5603](https://github.com/dubzzz/fast-check/pull/5603)) Shorter stringified values for null-prototype
- ([PR#5609](https://github.com/dubzzz/fast-check/pull/5609)) Include null-prototype by default in dictionary
- ([PR#5610](https://github.com/dubzzz/fast-check/pull/5610)) Drop deprecated `.noBias`
- ([PR#5611](https://github.com/dubzzz/fast-check/pull/5611)) Drop deprecated `uuidV` arbitrary
- ([PR#5613](https://github.com/dubzzz/fast-check/pull/5613)) Drop deprecated `unicodeJson*` arbitraries
- ([PR#5633](https://github.com/dubzzz/fast-check/pull/5633)) Extend `uuid` to build any know version
- ([PR#5636](https://github.com/dubzzz/fast-check/pull/5636)) Drop deprecated `ascii*`
- ([PR#5644](https://github.com/dubzzz/fast-check/pull/5644)) Drop deprecated `hexa*`
- ([PR#5664](https://github.com/dubzzz/fast-check/pull/5664)) Drop deprecated `base64`
- ([PR#5665](https://github.com/dubzzz/fast-check/pull/5665)) Drop deprecated `stringOf`
- ([PR#5666](https://github.com/dubzzz/fast-check/pull/5666)) Drop deprecated `char16bits` and `string16bits`
- ([PR#5667](https://github.com/dubzzz/fast-check/pull/5667)) Drop deprecated `fullUnicode*`
- ([PR#5669](https://github.com/dubzzz/fast-check/pull/5669)) Drop deprecated `unicode*`
- ([PR#5671](https://github.com/dubzzz/fast-check/pull/5671)) Drop deprecated `char`
- ([PR#5674](https://github.com/dubzzz/fast-check/pull/5674)) Drop deprecated `big{U|}int{N|}`
- ([PR#5679](https://github.com/dubzzz/fast-check/pull/5679)) Drop method `nextArrayInt` from `Random`
- ([PR#5694](https://github.com/dubzzz/fast-check/pull/5694)) Drop deprecated `.noShrink`
- ([PR#5821](https://github.com/dubzzz/fast-check/pull/5821)) Force usage of Node >=12.17.0

## Features

- ([PR#5577](https://github.com/dubzzz/fast-check/pull/5577)) Better typings for `constantFrom`
- ([PR#5605](https://github.com/dubzzz/fast-check/pull/5605)) Better typings for `constant`
- ([PR#5773](https://github.com/dubzzz/fast-check/pull/5773)) `Arbitrary<XxxArray>` => `Arbitrary<XxxArray<ArrayBuffer>>`
- ([PR#5783](https://github.com/dubzzz/fast-check/pull/5783)) Simplify types for `fc.record`

## Fixes

- ([PR#5604](https://github.com/dubzzz/fast-check/pull/5604)) Bug: Better rejection handling in `scheduleSequence`
- ([PR#5672](https://github.com/dubzzz/fast-check/pull/5672)) Bug: Resist to external poisoning for `json`
- ([PR#5696](https://github.com/dubzzz/fast-check/pull/5696)) Bug: Stricter checks for consecutive `noBias`
- ([PR#5608](https://github.com/dubzzz/fast-check/pull/5608)) CI: Clean unhandled rejections in tests for scheduler
- ([PR#5670](https://github.com/dubzzz/fast-check/pull/5670)) CI: Move build chain to ESM
- ([PR#5136](https://github.com/dubzzz/fast-check/pull/5136)) CI: Toggle on `isolatedDeclarations` flag on the project
- ([PR#5685](https://github.com/dubzzz/fast-check/pull/5685)) CI: Stabilize e2e on bigint and duplicates
- ([PR#5695](https://github.com/dubzzz/fast-check/pull/5695)) CI: Move CI jobs to Node 22
- ([PR#5719](https://github.com/dubzzz/fast-check/pull/5719)) CI: Toggle ON faster documentation build
- ([PR#5742](https://github.com/dubzzz/fast-check/pull/5742)) CI: Fix lock file breakeage
- ([PR#5770](https://github.com/dubzzz/fast-check/pull/5770)) CI: Switch CI commands to `node --run`
- ([PR#5578](https://github.com/dubzzz/fast-check/pull/5578)) Clean: Remove `withDeletedKeys` from `record`
- ([PR#5581](https://github.com/dubzzz/fast-check/pull/5581)) Clean: Enforce `run{Before/After}Each` on property
- ([PR#5634](https://github.com/dubzzz/fast-check/pull/5634)) Clean: Drop unneeded catch param
- ([PR#5763](https://github.com/dubzzz/fast-check/pull/5763)) Clean: Abide by lint rule no-empty-object-type
- ([PR#5767](https://github.com/dubzzz/fast-check/pull/5767)) Clean: Abide by lint rule no-unused-vars
- ([PR#5803](https://github.com/dubzzz/fast-check/pull/5803)) Clean: Fix lint error in ConstantArbitrary class
- ([PR#5522](https://github.com/dubzzz/fast-check/pull/5522)) Doc: Advent of PBT Day 14
- ([PR#5531](https://github.com/dubzzz/fast-check/pull/5531)) Doc: Do not display success count
- ([PR#5524](https://github.com/dubzzz/fast-check/pull/5524)) Doc: Advent of PBT Day 15
- ([PR#5532](https://github.com/dubzzz/fast-check/pull/5532)) Doc: Stop trimming user inputs for the Advent of PBT
- ([PR#5526](https://github.com/dubzzz/fast-check/pull/5526)) Doc: Advent of PBT Day 16
- ([PR#5527](https://github.com/dubzzz/fast-check/pull/5527)) Doc: Advent of PBT Day 17
- ([PR#5539](https://github.com/dubzzz/fast-check/pull/5539)) Doc: Advent of PBT, Day 18
- ([PR#5542](https://github.com/dubzzz/fast-check/pull/5542)) Doc: Add missing comment sections on Advents
- ([PR#5543](https://github.com/dubzzz/fast-check/pull/5543)) Doc: Add socials illustrations on some Advents
- ([PR#5540](https://github.com/dubzzz/fast-check/pull/5540)) Doc: Advent of PBT, Day 19
- ([PR#5547](https://github.com/dubzzz/fast-check/pull/5547)) Doc: Add comments section on Day 19
- ([PR#5550](https://github.com/dubzzz/fast-check/pull/5550)) Doc: Advent of PBT, Day 20
- ([PR#5551](https://github.com/dubzzz/fast-check/pull/5551)) Doc: Comments section for Day 20
- ([PR#5554](https://github.com/dubzzz/fast-check/pull/5554)) Doc: Make Day 15 compliant to its own spec
- ([PR#5555](https://github.com/dubzzz/fast-check/pull/5555)) Doc: Fix validation of Advent of PBT Day 20
- ([PR#5549](https://github.com/dubzzz/fast-check/pull/5549)) Doc: Advent of PBT, Day 21
- ([PR#5552](https://github.com/dubzzz/fast-check/pull/5552)) Doc: Advent of PBT, Day 22
- ([PR#5557](https://github.com/dubzzz/fast-check/pull/5557)) Doc: Drop useless Advent's calls to counter API
- ([PR#5553](https://github.com/dubzzz/fast-check/pull/5553)) Doc: Advent of PBT, Day 23
- ([PR#5558](https://github.com/dubzzz/fast-check/pull/5558)) Doc: Advent of PBT, Day 24
- ([PR#5564](https://github.com/dubzzz/fast-check/pull/5564)) Doc: Add `typespec-fast-check` to ecosystem page
- ([PR#5684](https://github.com/dubzzz/fast-check/pull/5684)) Doc: Flag migration guide with WIP
- ([PR#5768](https://github.com/dubzzz/fast-check/pull/5768)) Doc: Document the Unicode version
- ([PR#5774](https://github.com/dubzzz/fast-check/pull/5774)) Doc: Update CONTRIBUTING.md after switch to pnpm
- ([PR#5788](https://github.com/dubzzz/fast-check/pull/5788)) Doc: Add new contributor AlexErrant
- ([PR#5789](https://github.com/dubzzz/fast-check/pull/5789)) Doc: Add "Answering Questions" to gruhn
- ([PR#5795](https://github.com/dubzzz/fast-check/pull/5795)) Doc: Enrich minimal support section
- ([PR#5806](https://github.com/dubzzz/fast-check/pull/5806)) Doc: Fix GitHub workflow badge on README
- ([PR#5805](https://github.com/dubzzz/fast-check/pull/5805)) Doc: Add new contributor ahrjarrett
- ([PR#5814](https://github.com/dubzzz/fast-check/pull/5814)) Doc: Drop direct link to the Advent Of PBT
- ([PR#5583](https://github.com/dubzzz/fast-check/pull/5583)) Performance: Faster property::run with strict equality checks
- ([PR#5584](https://github.com/dubzzz/fast-check/pull/5584)) Performance: Delay computation of Error stack when no cause
- ([PR#5612](https://github.com/dubzzz/fast-check/pull/5612)) Performance: Drop unneeded `BigInt` check in `mixedCase`
- ([PR#5614](https://github.com/dubzzz/fast-check/pull/5614)) Performance: Faster scheduling of `scheduleSequence`
- ([PR#5615](https://github.com/dubzzz/fast-check/pull/5615)) Performance: Speed-up race-condition schedulers
- ([PR#5617](https://github.com/dubzzz/fast-check/pull/5617)) Performance: Faster initialization of globals by dropping `typeof` checks
- ([PR#5676](https://github.com/dubzzz/fast-check/pull/5676)) Performance: Faster read of parameters passed to runners
- ([PR#5677](https://github.com/dubzzz/fast-check/pull/5677)) Performance: Faster read of constraints on `object` and related
- ([PR#5618](https://github.com/dubzzz/fast-check/pull/5618)) Performance: Faster rewrite of `double`
- ([PR#5678](https://github.com/dubzzz/fast-check/pull/5678)) Performance: Faster ipV6 generation with cached string builders
- ([PR#5771](https://github.com/dubzzz/fast-check/pull/5771)) Performance: Mark all arbitraries as side-effect free
- ([PR#5786](https://github.com/dubzzz/fast-check/pull/5786)) Performance: Mark all arbitraries as side-effect free
- ([PR#5787](https://github.com/dubzzz/fast-check/pull/5787)) Performance: Target ES2020 in produced bundle
- ([PR#5600](https://github.com/dubzzz/fast-check/pull/5600)) Refactor: Rewrite of `scheduleSequence`
- ([PR#5635](https://github.com/dubzzz/fast-check/pull/5635)) Refactor: Switch to object spreading rather than `Object.assign`
- ([PR#5710](https://github.com/dubzzz/fast-check/pull/5710)) Script: Moving from yarn to pnpm
- ([PR#5815](https://github.com/dubzzz/fast-check/pull/5815)) Script: Add support for pnpm scripts in generate-changelog
- ([PR#5816](https://github.com/dubzzz/fast-check/pull/5816)) Script: Take into account bumps on one part of monorepo for changelogs
- ([PR#5817](https://github.com/dubzzz/fast-check/pull/5817)) Script: Fix call to changesets to generate changelog for v4
- ([PR#5616](https://github.com/dubzzz/fast-check/pull/5616)) Test: Stop checking for `BigInt` in tests
- ([PR#5673](https://github.com/dubzzz/fast-check/pull/5673)) Test: Cover even more arbitraries within Poisoning
- ([PR#5734](https://github.com/dubzzz/fast-check/pull/5734)) Test: Move website tests to Vitest
- ([PR#5736](https://github.com/dubzzz/fast-check/pull/5736)) Test: Do not scan useless directories for tests on website
- ([PR#5743](https://github.com/dubzzz/fast-check/pull/5743)) Test: Drop useless snapshots results
- ([PR#5756](https://github.com/dubzzz/fast-check/pull/5756)) Test: Fix test in double.spec
- ([PR#5790](https://github.com/dubzzz/fast-check/pull/5790)) Test: Check TypeScript 5.7 to assess it never breaks
