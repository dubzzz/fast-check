# 4.5.2

_Attach tarballs to GitHub releases_
[[Code](https://github.com/dubzzz/fast-check/tree/v4.5.2)][[Diff](https://github.com/dubzzz/fast-check/compare/v4.5.1...v4.5.2)]

## Fixes

- ([PR#6416](https://github.com/dubzzz/fast-check/pull/6416)) CI: Extract package version from tarball
- ([PR#6417](https://github.com/dubzzz/fast-check/pull/6417)) CI: Update GitHub releases at publish time

# 4.5.1

_Rename tarballs before publishing_
[[Code](https://github.com/dubzzz/fast-check/tree/v4.5.1)][[Diff](https://github.com/dubzzz/fast-check/compare/v4.5.0...v4.5.1)]

## Fixes

- ([PR#6413](https://github.com/dubzzz/fast-check/pull/6413)) CI: Rename tarballs before publishing

# 4.5.0

_Add an arbitrary based on a schema definition_
[[Code](https://github.com/dubzzz/fast-check/tree/v4.5.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v4.4.0...v4.5.0)]

## Features

- ([PR#6333](https://github.com/dubzzz/fast-check/pull/6333)) Add `entityGraph` for schema-based structures
- ([PR#6336](https://github.com/dubzzz/fast-check/pull/6336)) Take into account the depth in `entityGraph`
- ([PR#6340](https://github.com/dubzzz/fast-check/pull/6340)) Add initial pool constraints to `entityGraph`
- ([PR#6341](https://github.com/dubzzz/fast-check/pull/6341)) Add strategies to `entityGraph`
- ([PR#6342](https://github.com/dubzzz/fast-check/pull/6342)) Allow recursions on many rels for `entityGraph`
- ([PR#6343](https://github.com/dubzzz/fast-check/pull/6343)) Tweak unicity of entities produced by `entityGraph`
- ([PR#6400](https://github.com/dubzzz/fast-check/pull/6400)) Support inverse relations in `entityGraph`

## Fixes

- ([PR#6375](https://github.com/dubzzz/fast-check/pull/6375)) Bug: Fix workflow authentication by enabling credential persistence
- ([PR#6369](https://github.com/dubzzz/fast-check/pull/6369)) CI: Fix vulnerabilities in our GitHub workflows
- ([PR#6370](https://github.com/dubzzz/fast-check/pull/6370)) CI: Add workflow security audit with zizmor
- ([PR#6374](https://github.com/dubzzz/fast-check/pull/6374)) CI: Fix vulnerabilities in build-status workflow
- ([PR#6397](https://github.com/dubzzz/fast-check/pull/6397)) CI: Ignore trusted publishing for pkg-pr-new
- ([PR#6410](https://github.com/dubzzz/fast-check/pull/6410)) CI: Fix generate-changelog script
- ([PR#6365](https://github.com/dubzzz/fast-check/pull/6365)) Doc: Release note for version 4.4.0
- ([PR#6379](https://github.com/dubzzz/fast-check/pull/6379)) Doc: Fix dead links in the documentation
- ([PR#6378](https://github.com/dubzzz/fast-check/pull/6378)) Doc: Connect AskAI in docsearch from Algolia
- ([PR#6380](https://github.com/dubzzz/fast-check/pull/6380)) Doc: Update Content-Security-Policy for AskAI
- ([PR#6367](https://github.com/dubzzz/fast-check/pull/6367)) Doc: Rework JSDoc for entityGraph and related types
- ([PR#6383](https://github.com/dubzzz/fast-check/pull/6383)) Doc: Enhance `entityGraph` documentation
- ([PR#6337](https://github.com/dubzzz/fast-check/pull/6337)) Refactor: Allocate unlinked versions earlier in `entityGraph`
- ([PR#6339](https://github.com/dubzzz/fast-check/pull/6339)) Refactor: Split code of `entityGraph` into sub-helpers
- ([PR#6345](https://github.com/dubzzz/fast-check/pull/6345)) Refactor: Import all files with an extension
- ([PR#6398](https://github.com/dubzzz/fast-check/pull/6398)) Script: Ask AIs to be concise when naming PRs
- ([PR#6389](https://github.com/dubzzz/fast-check/pull/6389)) Test: Replace @ts-ignore with @ts-expect-error

---

# 4.4.0

_Expose hidden arbitraries and widen capabilities of existing ones from a typing point of view_
[[Code](https://github.com/dubzzz/fast-check/tree/v4.4.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v4.3.0...v4.4.0)]

## Features

- ([PR#6232](https://github.com/dubzzz/fast-check/pull/6232)) Support full `PropertyKey` in `fc.dictionary(...)`
- ([PR#6267](https://github.com/dubzzz/fast-check/pull/6267)) Add `fc.map` arbitrary
- ([PR#6040](https://github.com/dubzzz/fast-check/pull/6040)) Add `circular` option to `fc.letrec`
- ([PR#6270](https://github.com/dubzzz/fast-check/pull/6270)) Add `fc.set` arbitrary
- ([PR#6334](https://github.com/dubzzz/fast-check/pull/6334)) REVERT-6040: Self-referencing capabilities from `letrec`

## Fixes

- ([PR#6138](https://github.com/dubzzz/fast-check/pull/6138)) CI: Force OTP at publication time
- ([PR#6170](https://github.com/dubzzz/fast-check/pull/6170)) CI: Stop running tests against Windows
- ([PR#6178](https://github.com/dubzzz/fast-check/pull/6178)) CI: Add GH Action to reformat code in PRs or branches
- ([PR#6205](https://github.com/dubzzz/fast-check/pull/6205)) CI: Add GH Action to add contributors to the project
- ([PR#6246](https://github.com/dubzzz/fast-check/pull/6246)) CI: Fix PR mode in format-pr workflow
- ([PR#6184](https://github.com/dubzzz/fast-check/pull/6184)) CI: Add provenance attestation to npm package publishing
- ([PR#6248](https://github.com/dubzzz/fast-check/pull/6248)) CI: Add workflow to resolve pnpm lock file merge conflicts on PRs
- ([PR#6251](https://github.com/dubzzz/fast-check/pull/6251)) CI: Restrict Format workflow to PRs
- ([PR#6253](https://github.com/dubzzz/fast-check/pull/6253)) CI: Fix PR number type in workflows
- ([PR#6254](https://github.com/dubzzz/fast-check/pull/6254)) CI: Fix PR workflows
- ([PR#6255](https://github.com/dubzzz/fast-check/pull/6255)) CI: Fix PNPM conflicts workflow
- ([PR#6256](https://github.com/dubzzz/fast-check/pull/6256)) CI: Scope permissions of PR Format to job
- ([PR#6257](https://github.com/dubzzz/fast-check/pull/6257)) CI: Scope permissions of PR PNPM to job
- ([PR#6258](https://github.com/dubzzz/fast-check/pull/6258)) CI: Job level permissions for add contributor
- ([PR#6269](https://github.com/dubzzz/fast-check/pull/6269)) CI: Add GitHub Action to validate PR titles
- ([PR#6281](https://github.com/dubzzz/fast-check/pull/6281)) CI: Add back Windows runners for tests
- ([PR#6280](https://github.com/dubzzz/fast-check/pull/6280)) CI: Add back latest node for tests
- ([PR#6282](https://github.com/dubzzz/fast-check/pull/6282)) CI: Bump test matrix to Node 24
- ([PR#6283](https://github.com/dubzzz/fast-check/pull/6283)) CI: Shard tests producing coverage
- ([PR#6301](https://github.com/dubzzz/fast-check/pull/6301)) CI: Downgrade node in tests
- ([PR#6300](https://github.com/dubzzz/fast-check/pull/6300)) CI: Enforce trust-policy for pnpm
- ([PR#6307](https://github.com/dubzzz/fast-check/pull/6307)) CI: Add back latest Node in test matrix
- ([PR#6136](https://github.com/dubzzz/fast-check/pull/6136)) Doc: Release note for version 4.3.0
- ([PR#6169](https://github.com/dubzzz/fast-check/pull/6169)) Doc: Preserve links on Sponsors for the website
- ([PR#6172](https://github.com/dubzzz/fast-check/pull/6172)) Doc: Update CSP to properly display sponsors.svg
- ([PR#6173](https://github.com/dubzzz/fast-check/pull/6173)) Doc: Update CSP to properly display sponsors.svg
- ([PR#6174](https://github.com/dubzzz/fast-check/pull/6174)) Doc: Better support of mobile display for sponsors
- ([PR#6175](https://github.com/dubzzz/fast-check/pull/6175)) Doc: Better accessibility on website
- ([PR#6192](https://github.com/dubzzz/fast-check/pull/6192)) Doc: Add `@traversable/zod-test` to ecosystem
- ([PR#6204](https://github.com/dubzzz/fast-check/pull/6204)) Doc: Add ahrjarrett as doc contributor
- ([PR#6238](https://github.com/dubzzz/fast-check/pull/6238)) Doc: Add jamesbvaughan as code contributor
- ([PR#6250](https://github.com/dubzzz/fast-check/pull/6250)) Doc: Add GitHub Copilot instructions for gitmoji PR naming convention
- ([PR#6180](https://github.com/dubzzz/fast-check/pull/6180)) Doc: Generate llms.txt and related for AI crawlers
- ([PR#6279](https://github.com/dubzzz/fast-check/pull/6279)) Doc: Add emilianbold as code contributor
- ([PR#6287](https://github.com/dubzzz/fast-check/pull/6287)) Doc: Fix example in quick start guide
- ([PR#6288](https://github.com/dubzzz/fast-check/pull/6288)) Doc: Add russbiggs as doc contributor
- ([PR#6278](https://github.com/dubzzz/fast-check/pull/6278)) Performance: Use Math.imul and shifts in perf-critical paths
- ([PR#6275](https://github.com/dubzzz/fast-check/pull/6275)) Refactor: Remove unnecessary npm install steps from publish workflows
- ([PR#6311](https://github.com/dubzzz/fast-check/pull/6311)) Refactor: Factorize `letrec` implementations
- ([PR#6318](https://github.com/dubzzz/fast-check/pull/6318)) Refactor: Extract logic building lazy arbs
- ([PR#6320](https://github.com/dubzzz/fast-check/pull/6320)) Refactor: Iterate on own props array in `letrec`
- ([PR#6321](https://github.com/dubzzz/fast-check/pull/6321)) Refactor: Explicit null check in `LazyArbitrary`
- ([PR#6277](https://github.com/dubzzz/fast-check/pull/6277)) Script: Fix script updating the documentation for fast-check

---

# 4.3.0

_Add memory flag on `infiniteStream`_
[[Code](https://github.com/dubzzz/fast-check/tree/v4.3.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v4.2.0...v4.3.0)]

## Features

- ([PR#6107](https://github.com/dubzzz/fast-check/pull/6107)) Add 'history' parameter to infiniteStream

## Fixes

- ([PR#6118](https://github.com/dubzzz/fast-check/pull/6118)) Bug: Fix `fc.option` nil frequency
- ([PR#6046](https://github.com/dubzzz/fast-check/pull/6046)) CI: Skip expensive CI checks on Windows runner
- ([PR#6120](https://github.com/dubzzz/fast-check/pull/6120)) CI: Avoid specs to run against Node >=24.6.0
- ([PR#6128](https://github.com/dubzzz/fast-check/pull/6128)) CI: Toggle ON experimental-cli on Prettier
- ([PR#6127](https://github.com/dubzzz/fast-check/pull/6127)) CI: Move to trusted publishing to NPM
- ([PR#6129](https://github.com/dubzzz/fast-check/pull/6129)) CI: Toggle ON concurrency on ESLint
- ([PR#6060](https://github.com/dubzzz/fast-check/pull/6060)) CI: Rework configuration of Vitest
- ([PR#6058](https://github.com/dubzzz/fast-check/pull/6058)) Doc: Release note for version 4.2.0
- ([PR#6131](https://github.com/dubzzz/fast-check/pull/6131)) Doc: Add new contributor dmurvihill
- ([PR#6038](https://github.com/dubzzz/fast-check/pull/6038)) Script: Update `ignoredBuiltDependencies`
- ([PR#6059](https://github.com/dubzzz/fast-check/pull/6059)) Test: Drop unneeded retries for Node 23
- ([PR#6119](https://github.com/dubzzz/fast-check/pull/6119)) Typings: Add union type overloads for nat() and bigInt()

---

# 4.2.0

_New primitives for race condition detection_
[[Code](https://github.com/dubzzz/fast-check/tree/v4.2.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v4.1.1...v4.2.0)]

## Features

- ([PR#5953](https://github.com/dubzzz/fast-check/pull/5953)) Do not silent errors popping in `act`
- ([PR#5890](https://github.com/dubzzz/fast-check/pull/5890)) Introduce new awaiter on our `scheduler`
- ([PR#6016](https://github.com/dubzzz/fast-check/pull/6016)) Introduce `waitIdle`, a revamped `waitAll` for `scheduler`
- ([PR#6026](https://github.com/dubzzz/fast-check/pull/6026)) Deprecate `waitOne` and `waitAll`

## Fixes

- ([PR#5903](https://github.com/dubzzz/fast-check/pull/5903)) CI: Only run coverage for ubuntu on node 22
- ([PR#5904](https://github.com/dubzzz/fast-check/pull/5904)) CI: Shard Vitest execution on Windows runners
- ([PR#5907](https://github.com/dubzzz/fast-check/pull/5907)) CI: Always publish on pkg-pr-new
- ([PR#5935](https://github.com/dubzzz/fast-check/pull/5935)) CI: Get rid of LFS storage
- ([PR#5936](https://github.com/dubzzz/fast-check/pull/5936)) CI: Safer and faster static assets with hash checks
- ([PR#5943](https://github.com/dubzzz/fast-check/pull/5943)) CI: Stop stale from closing validated ideas
- ([PR#5954](https://github.com/dubzzz/fast-check/pull/5954)) CI: Make poisoning test compatible with Node 24
- ([PR#5969](https://github.com/dubzzz/fast-check/pull/5969)) CI: Measure coverage on Mac OS
- ([PR#5971](https://github.com/dubzzz/fast-check/pull/5971)) CI: Better exclusion list for Vitest
- ([PR#5989](https://github.com/dubzzz/fast-check/pull/5989)) CI: Attempt to stabilize tests
- ([PR#5937](https://github.com/dubzzz/fast-check/pull/5937)) Doc: Reference social media links on blog authors
- ([PR#5938](https://github.com/dubzzz/fast-check/pull/5938)) Doc: Fix social images on /docs and /blog
- ([PR#5965](https://github.com/dubzzz/fast-check/pull/5965)) Doc: update stringMatching docs
- ([PR#5966](https://github.com/dubzzz/fast-check/pull/5966)) Doc: Fix typo in model-based-testing.md
- ([PR#6015](https://github.com/dubzzz/fast-check/pull/6015)) Doc: Add new contributor matthyk
- ([PR#5973](https://github.com/dubzzz/fast-check/pull/5973)) Test: Drop unused checks in tests
- ([PR#6019](https://github.com/dubzzz/fast-check/pull/6019)) Test: Stop testing against Node 18

---

# 4.1.1

_Avoid overlapping tasks_
[[Code](https://github.com/dubzzz/fast-check/tree/v4.1.1)][[Diff](https://github.com/dubzzz/fast-check/compare/v4.1.0...v4.1.1)]

## Fixes

- ([PR#5900](https://github.com/dubzzz/fast-check/pull/5900)) Bug: Avoid overlapping tasks during `scheduler` execution
- ([PR#5894](https://github.com/dubzzz/fast-check/pull/5894)) Doc: Release note for 4.1.0
- ([PR#5901](https://github.com/dubzzz/fast-check/pull/5901)) Performance: Slightly faster `scheduler` with explicit `undefined` check

# 4.1.0

_More effective `waitFor` on `fc.scheduler`_
[[Code](https://github.com/dubzzz/fast-check/tree/v4.1.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v4.0.1...v4.1.0)]

## Features

- ([PR#5889](https://github.com/dubzzz/fast-check/pull/5889)) Wait longer before scheduling anything with `waitFor`
- ([PR#5892](https://github.com/dubzzz/fast-check/pull/5892)) Better capture scheduled tasks before running scheduling

## Fixes

- ([PR#5868](https://github.com/dubzzz/fast-check/pull/5868)) Doc: Adapt article on Vitest following feedback
- ([PR#5891](https://github.com/dubzzz/fast-check/pull/5891)) Performance: Move back to better tick management of `waitFor`
- ([PR#5888](https://github.com/dubzzz/fast-check/pull/5888)) Test: Closely test `waitFor` on interactions with micro-tasks

---

# 4.0.1

_Change location of the logo on the README for LFS quotas reasons_
[[Code](https://github.com/dubzzz/fast-check/tree/v4.0.1)][[Diff](https://github.com/dubzzz/fast-check/compare/v4.0.0...v4.0.1)]

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
