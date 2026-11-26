# 5.0.0

_TODO Description_
[[Code](https://github.com/dubzzz/fast-check/tree/v5.0.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v4.11.0...v5.0.0)]

## Breaking changes

- ([PR#7296](https://github.com/dubzzz/fast-check/pull/7296)) Allow async properties to behave sync
- ([PR#7303](https://github.com/dubzzz/fast-check/pull/7303)) Drop `property`, replace it by `asyncProperty`
- ([PR#7305](https://github.com/dubzzz/fast-check/pull/7305)) Drop methods from `Random`
- ([PR#7308](https://github.com/dubzzz/fast-check/pull/7308)) Drop global capture of functions
- ([PR#7307](https://github.com/dubzzz/fast-check/pull/7307)) Drop ability to default import from fast-check
- ([PR#7309](https://github.com/dubzzz/fast-check/pull/7309)) Drop string-based PRNG in runner parameters
- ([PR#7310](https://github.com/dubzzz/fast-check/pull/7310)) Drop `Random#nextDouble()`
- ([PR#7312](https://github.com/dubzzz/fast-check/pull/7312)) Rename interfaces for properties
- ([PR#7315](https://github.com/dubzzz/fast-check/pull/7315)) Make `async{Before,After}Each` the defaults
- ([PR#7316](https://github.com/dubzzz/fast-check/pull/7316)) Drop global capture of methods [Batch 2]
- ([PR#7319](https://github.com/dubzzz/fast-check/pull/7319)) Drop global capture of methods [Batch 1]
- ([PR#7320](https://github.com/dubzzz/fast-check/pull/7320)) Return instances of `Iterator` from `shrink`
- ([PR#7321](https://github.com/dubzzz/fast-check/pull/7321)) Drop support for TypeScript <5.7
- ([PR#7318](https://github.com/dubzzz/fast-check/pull/7318)) Drop global capture of methods [Batch 3]
- ([PR#7323](https://github.com/dubzzz/fast-check/pull/7323)) Rename `infiniteStream` into `iterator`
- ([PR#7324](https://github.com/dubzzz/fast-check/pull/7324)) Drop support for `asyncReporter`
- ([PR#7325](https://github.com/dubzzz/fast-check/pull/7325)) Drop CommonJS bundle
- ([PR#7326](https://github.com/dubzzz/fast-check/pull/7326)) Support finite iterators on `iterator`
- ([PR#7328](https://github.com/dubzzz/fast-check/pull/7328)) Merge `defaultReportMessage` and its async version
- ([PR#7332](https://github.com/dubzzz/fast-check/pull/7332)) Drop `xxxEqualValues` parameters
- ([PR#7340](https://github.com/dubzzz/fast-check/pull/7340)) Drop `unbiased` from `Parameters`
- ([PR#7358](https://github.com/dubzzz/fast-check/pull/7358)) Drop `xxxAfterTimeLimit` from `Parameters`
- ([PR#7377](https://github.com/dubzzz/fast-check/pull/7377)) Drop `timeout` from `Parameters`
- ([PR#7386](https://github.com/dubzzz/fast-check/pull/7386)) Drop `beforeEach`/`afterEach` methods
- ([PR#7412](https://github.com/dubzzz/fast-check/pull/7412)) Rename `asyncProperty` into `property`
- ([PR#7430](https://github.com/dubzzz/fast-check/pull/7430)) Drop `reporter` from Parameters
- ([PR#7519](https://github.com/dubzzz/fast-check/pull/7519)) Stop reporting interrupted as failed
- ([PR#7524](https://github.com/dubzzz/fast-check/pull/7524)) Stop exposing the default error report
- ([PR#7526](https://github.com/dubzzz/fast-check/pull/7526)) Remove the check runner
- ([PR#7540](https://github.com/dubzzz/fast-check/pull/7540)) Keep includeErrorInReport only on defaultReporter
- ([PR#7501](https://github.com/dubzzz/fast-check/pull/7501)) Remove deprecated Unicode string options
- ([PR#7580](https://github.com/dubzzz/fast-check/pull/7580)) Make `sample` closer to `assert` and asynchronous
- ([PR#7588](https://github.com/dubzzz/fast-check/pull/7588)) Run predicates when sampling properties
- ([PR#7587](https://github.com/dubzzz/fast-check/pull/7587)) Make statistics asynchronous and return category counts
- ([PR#7592](https://github.com/dubzzz/fast-check/pull/7592)) Spread property values in `statistics`

## Features

- ([PR#7288](https://github.com/dubzzz/fast-check/pull/7288)) Allow sync predicate on `asyncProperty`
- ([PR#7422](https://github.com/dubzzz/fast-check/pull/7422)) Pass contextualized details to predicates
- ([PR#7426](https://github.com/dubzzz/fast-check/pull/7426)) Support signal in `timeout`
- ([PR#7427](https://github.com/dubzzz/fast-check/pull/7427)) Support signal in `interruptAfterTimeLimit`
- ([PR#7184](https://github.com/dubzzz/fast-check/pull/7184)) Support depth on `array` and derived arbitraries
- ([PR#7523](https://github.com/dubzzz/fast-check/pull/7523)) Add `noDefaultPlugins` to `assert`
- ([PR#7532](https://github.com/dubzzz/fast-check/pull/7532)) Expose defaultReporter as a public plugin
- ([PR#7533](https://github.com/dubzzz/fast-check/pull/7533)) Add `noGlobalPlugins` to opt out of globally installed plugins
- ([PR#7539](https://github.com/dubzzz/fast-check/pull/7539)) Add includeErrorInReport option to defaultReporter
- ([PR#7538](https://github.com/dubzzz/fast-check/pull/7538)) Support post installation of global plugins
- ([PR#7544](https://github.com/dubzzz/fast-check/pull/7544)) Add `beforeAll` hook on our plugin system
- ([PR#7573](https://github.com/dubzzz/fast-check/pull/7573)) Mark long sync runs failed with `timeout`
- ([PR#7594](https://github.com/dubzzz/fast-check/pull/7594)) Support multiple arbitraries in `statistics`
- ([PR#7604](https://github.com/dubzzz/fast-check/pull/7604)) Accept readonly arrays in public inputs and constraints
- ([PR#7606](https://github.com/dubzzz/fast-check/pull/7606)) Make built-in arbitrary constraint inputs readonly
- ([PR#7643](https://github.com/dubzzz/fast-check/pull/7643)) Add back `asyncProperty`, but deprecated

## Fixes

- ([PR#7333](https://github.com/dubzzz/fast-check/pull/7333)) Bug: Plugin `interruptAfterTimeLimit` crashes
- ([PR#7376](https://github.com/dubzzz/fast-check/pull/7376)) Bug: Better type definition on built-in plugins
- ([PR#7421](https://github.com/dubzzz/fast-check/pull/7421)) Bug: Fix swallowed errors at plugin completion
- ([PR#7397](https://github.com/dubzzz/fast-check/pull/7397)) Bug: Preserve NUL code points in regex character ranges
- ([PR#7399](https://github.com/dubzzz/fast-check/pull/7399)) Bug: Parse NUL escapes as characters instead of backreferences
- ([PR#7404](https://github.com/dubzzz/fast-check/pull/7404)) Bug: Support full Unicode code-point escapes in regexes
- ([PR#7405](https://github.com/dubzzz/fast-check/pull/7405)) Bug: Handle escaped surrogate pairs in Unicode regexes
- ([PR#7406](https://github.com/dubzzz/fast-check/pull/7406)) Bug: Support non-Unicode x and u identity escapes
- ([PR#7398](https://github.com/dubzzz/fast-check/pull/7398)) Bug: Shrink Unicode regex ranges using full code points
- ([PR#7431](https://github.com/dubzzz/fast-check/pull/7431)) Bug: Make clones of a scheduler run tasks in the same order
- ([PR#7477](https://github.com/dubzzz/fast-check/pull/7477)) Bug: Fix equal-values caching for lazy and asynchronous values
- ([PR#7283](https://github.com/dubzzz/fast-check/pull/7283)) CI: Run independent CI steps concurrently
- ([PR#7295](https://github.com/dubzzz/fast-check/pull/7295)) CI: Run cache restores in the background too
- ([PR#7337](https://github.com/dubzzz/fast-check/pull/7337)) CI: Increase #shards for Linux
- ([PR#7347](https://github.com/dubzzz/fast-check/pull/7347)) CI: Group sanity checks in one job
- ([PR#7348](https://github.com/dubzzz/fast-check/pull/7348)) CI: Separate windows/macos flows
- ([PR#7349](https://github.com/dubzzz/fast-check/pull/7349)) CI: Run type checks cross-tsc within one job
- ([PR#7354](https://github.com/dubzzz/fast-check/pull/7354)) CI: Typecheck against sources
- ([PR#7366](https://github.com/dubzzz/fast-check/pull/7366)) CI: Stricter Renovate config for the 24H rule
- ([PR#7365](https://github.com/dubzzz/fast-check/pull/7365)) CI: Make `changeset` ignore private packages
- ([PR#7371](https://github.com/dubzzz/fast-check/pull/7371)) CI: Faster CI installs with `--trust-lockfile`
- ([PR#7378](https://github.com/dubzzz/fast-check/pull/7378)) CI: Change default VSCode plugins (oxc)
- ([PR#7379](https://github.com/dubzzz/fast-check/pull/7379)) CI: Setup default formatter in VSCode
- ([PR#7384](https://github.com/dubzzz/fast-check/pull/7384)) CI: Drop intermediary check job
- ([PR#7387](https://github.com/dubzzz/fast-check/pull/7387)) CI: Drop unneeded pnpm overrides
- ([PR#7455](https://github.com/dubzzz/fast-check/pull/7455)) CI: Stop labels from triggering CI
- ([PR#7496](https://github.com/dubzzz/fast-check/pull/7496)) CI: Lock GitHub Actions dependencies
- ([PR#7500](https://github.com/dubzzz/fast-check/pull/7500)) CI: Repair stale Node type peers breaking main
- ([PR#7503](https://github.com/dubzzz/fast-check/pull/7503)) CI: Drop useless workspace locations from `package.json`
- ([PR#7504](https://github.com/dubzzz/fast-check/pull/7504)) CI: Explicit node version for dev in `package.json`
- ([PR#7507](https://github.com/dubzzz/fast-check/pull/7507)) CI: Disable Renovate bumps for Node devEngines
- ([PR#7509](https://github.com/dubzzz/fast-check/pull/7509)) CI: Typecheck the Bluesky release script in CI
- ([PR#7510](https://github.com/dubzzz/fast-check/pull/7510)) CI: Automerge routine development dependency and lockfile updates
- ([PR#7514](https://github.com/dubzzz/fast-check/pull/7514)) CI: Preserve setup-node runtime in tests and benchmarks
- ([PR#7515](https://github.com/dubzzz/fast-check/pull/7515)) CI: Refresh Codespaces setup and VS Code presets
- ([PR#7652](https://github.com/dubzzz/fast-check/pull/7652)) CI: Drop MacOS and Windows from the required CI jobs
- ([PR#7343](https://github.com/dubzzz/fast-check/pull/7343)) Clean: Drop useless fallback to `Date` in interrupt plugin
- ([PR#7351](https://github.com/dubzzz/fast-check/pull/7351)) Clean: Drop useless `@internal` comments
- ([PR#7391](https://github.com/dubzzz/fast-check/pull/7391)) Clean: Remove legacy symbol description fallback
- ([PR#7402](https://github.com/dubzzz/fast-check/pull/7402)) Clean: Remove the legacy Error.cause fallback
- ([PR#7499](https://github.com/dubzzz/fast-check/pull/7499)) Clean: Remove legacy TSLint suppression comments
- ([PR#7338](https://github.com/dubzzz/fast-check/pull/7338)) Doc: Updade and fix changelog
- ([PR#7362](https://github.com/dubzzz/fast-check/pull/7362)) Doc: Create `AI_POLICY.md`
- ([PR#7394](https://github.com/dubzzz/fast-check/pull/7394)) Doc: Explain the detached buffer casts for shared buffers
- ([PR#7393](https://github.com/dubzzz/fast-check/pull/7393)) Doc: Correct the supported regex flags in stringMatching
- ([PR#7396](https://github.com/dubzzz/fast-check/pull/7396)) Doc: Explain undefined upper bounds in regex quantifiers
- ([PR#7411](https://github.com/dubzzz/fast-check/pull/7411)) Doc: Correct API versions
- ([PR#7395](https://github.com/dubzzz/fast-check/pull/7395)) Doc: Complete the RFC reference for digit-leading hostnames
- ([PR#7413](https://github.com/dubzzz/fast-check/pull/7413)) Doc: Document property setup and teardown with plugins
- ([PR#7418](https://github.com/dubzzz/fast-check/pull/7418)) Doc: Fix jsdoc of plugins
- ([PR#7465](https://github.com/dubzzz/fast-check/pull/7465)) Doc: Add zek as code contributor
- ([PR#7469](https://github.com/dubzzz/fast-check/pull/7469)) Doc: Add zek as test contributor
- ([PR#7534](https://github.com/dubzzz/fast-check/pull/7534)) Doc: Add a StackBlitz playground at fast-check.dev/new
- ([PR#7598](https://github.com/dubzzz/fast-check/pull/7598)) Doc: Add JacobLey as code,test contributor
- ([PR#7615](https://github.com/dubzzz/fast-check/pull/7615)) Doc: Add changelog for 4.10.3
- ([PR#7635](https://github.com/dubzzz/fast-check/pull/7635)) Doc: Changelog for 4.11.0
- ([PR#7636](https://github.com/dubzzz/fast-check/pull/7636)) Doc: Mark backported options as available since 4.11.0
- ([PR#7647](https://github.com/dubzzz/fast-check/pull/7647)) Doc: Add a v5 preview banner and resume docs publishing
- ([PR#7329](https://github.com/dubzzz/fast-check/pull/7329)) Move: Restructure tests
- ([PR#7284](https://github.com/dubzzz/fast-check/pull/7284)) Performance: Drop defensive checks from `tuple`
- ([PR#7285](https://github.com/dubzzz/fast-check/pull/7285)) Performance: Drop defensive checks from `oneof`
- ([PR#7287](https://github.com/dubzzz/fast-check/pull/7287)) Performance: Drop legacy `num_runs` fallback from parameters
- ([PR#7290](https://github.com/dubzzz/fast-check/pull/7290)) Performance: Drop defensive clamping of `verbose`
- ([PR#7291](https://github.com/dubzzz/fast-check/pull/7291)) Performance: Drop defensive checks from `uuid`
- ([PR#7299](https://github.com/dubzzz/fast-check/pull/7299)) Performance: Avoid async when doable in `asyncProperty`
- ([PR#7300](https://github.com/dubzzz/fast-check/pull/7300)) Performance: Avoid async code path when doable in runner
- ([PR#7306](https://github.com/dubzzz/fast-check/pull/7306)) Performance: Drop defensive checks from `FrequencyArbitrary`
- ([PR#7313](https://github.com/dubzzz/fast-check/pull/7313)) Performance: Drop defensive checks from `check`
- ([PR#7317](https://github.com/dubzzz/fast-check/pull/7317)) Performance: Drop defensive checks from `asyncProperty`
- ([PR#7322](https://github.com/dubzzz/fast-check/pull/7322)) Performance: Faster `stringify` on deep instances
- ([PR#7327](https://github.com/dubzzz/fast-check/pull/7327)) Performance: Faster `stringify` when async toString is provided
- ([PR#7330](https://github.com/dubzzz/fast-check/pull/7330)) Performance: Faster and memory-optim of `asyncStringify`
- ([PR#7388](https://github.com/dubzzz/fast-check/pull/7388)) Performance: Faster execution of synchronous predicates without intermediary `await`s
- ([PR#7400](https://github.com/dubzzz/fast-check/pull/7400)) Performance: Avoid repeated string tokenization states
- ([PR#7389](https://github.com/dubzzz/fast-check/pull/7389)) Performance: Drop unwanted micro-tasks linked to clean-up plugins' hooks
- ([PR#7417](https://github.com/dubzzz/fast-check/pull/7417)) Performance: Reduce allocations in plugin integration
- ([PR#7489](https://github.com/dubzzz/fast-check/pull/7489)) Performance: Reduce microtask overhead in the property runner
- ([PR#7528](https://github.com/dubzzz/fast-check/pull/7528)) Performance: Reduce ticks when running asynchronous completion callbacks
- ([PR#7566](https://github.com/dubzzz/fast-check/pull/7566)) Performance: Improve initialization/memory performance of binary string
- ([PR#7286](https://github.com/dubzzz/fast-check/pull/7286)) Refactor: Simplify `requiredKeys` handling in `record`
- ([PR#7314](https://github.com/dubzzz/fast-check/pull/7314)) Refactor: Prefer `0n` notation over `BigInt(0)`
- ([PR#7392](https://github.com/dubzzz/fast-check/pull/7392)) Refactor: Remove the Node 10 negative-zero workaround
- ([PR#7390](https://github.com/dubzzz/fast-check/pull/7390)) Refactor: Use nullish coalescing in lifecycle failure fallbacks
- ([PR#7401](https://github.com/dubzzz/fast-check/pull/7401)) Refactor: Make scheduler sequence status read-only
- ([PR#7416](https://github.com/dubzzz/fast-check/pull/7416)) Refactor: Extracting code outside of `Runner.ts`
- ([PR#7428](https://github.com/dubzzz/fast-check/pull/7428)) Refactor: Refactor worker lifecycle management
- ([PR#7498](https://github.com/dubzzz/fast-check/pull/7498)) Refactor: Refactor error message formatting
- ([PR#7521](https://github.com/dubzzz/fast-check/pull/7521)) Refactor: Rework skipped runs handling
- ([PR#7525](https://github.com/dubzzz/fast-check/pull/7525)) Refactor: Convert default error reporting into a plugin
- ([PR#7571](https://github.com/dubzzz/fast-check/pull/7571)) Refactor: Rely on modern plugins' APIs for `interruptAfterTimeLimit`
- ([PR#7331](https://github.com/dubzzz/fast-check/pull/7331)) Script: Drop `:all` suffix from scripts
- ([PR#7339](https://github.com/dubzzz/fast-check/pull/7339)) Script: Switch to `oxfmt`
- ([PR#7352](https://github.com/dubzzz/fast-check/pull/7352)) Script: Bundle comparison script
- ([PR#7353](https://github.com/dubzzz/fast-check/pull/7353)) Script: One `tsconfig.json` for all
- ([PR#7304](https://github.com/dubzzz/fast-check/pull/7304)) Test: Fix mock blowup in FrequencyArbitrary specs
- ([PR#7311](https://github.com/dubzzz/fast-check/pull/7311)) Test: Merge back `frequency` specs in one file
- ([PR#7461](https://github.com/dubzzz/fast-check/pull/7461)) Test: Categorize regexes for tests of `stringMatching`
- ([PR#7462](https://github.com/dubzzz/fast-check/pull/7462)) Test: Add a few extra regex test-cases
- ([PR#7474](https://github.com/dubzzz/fast-check/pull/7474)) Test: Refine scheduler cloning and replay regression tests
- ([PR#7488](https://github.com/dubzzz/fast-check/pull/7488)) Test: Assess microtask overhead of usual flows
- ([PR#7537](https://github.com/dubzzz/fast-check/pull/7537)) Test: Use noGlobalPlugins in tick-count tests

---

# 4.11.0

_Plugin controls and flexible `asyncProperty` to ease v5 migration_
[[Code](https://github.com/dubzzz/fast-check/tree/v4.10.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v4.10.3...v4.11.0)]

## Features

- ([PR#7523](https://github.com/dubzzz/fast-check/pull/7523)) Add `noDefaultPlugins` to `assert`
- ([PR#7533](https://github.com/dubzzz/fast-check/pull/7533)) Add `noGlobalPlugins` to opt out of globally installed plugins
- ([PR#7538](https://github.com/dubzzz/fast-check/pull/7538)) Support post installation of global plugins
- ([PR#7288](https://github.com/dubzzz/fast-check/pull/7288)) Allow sync predicate on `asyncProperty`

---

# 4.10.3

_Regex and scheduler fixes, faster strings_
[[Code](https://github.com/dubzzz/fast-check/tree/v4.10.3)][[Diff](https://github.com/dubzzz/fast-check/compare/v4.10.2...v4.10.3)]

## Fixes

- ([PR#7514](https://github.com/dubzzz/fast-check/pull/7514)) CI: Preserve the setup-node runtime in tests and benchmarks
- ([PR#7431](https://github.com/dubzzz/fast-check/pull/7431)) Bug: Make clones of a scheduler run tasks in the same order
- ([PR#7397](https://github.com/dubzzz/fast-check/pull/7397)) Bug: Preserve NUL code points in regex character ranges
- ([PR#7399](https://github.com/dubzzz/fast-check/pull/7399)) Bug: Parse NUL escapes as characters instead of backreferences
- ([PR#7404](https://github.com/dubzzz/fast-check/pull/7404)) Bug: Support full Unicode code-point escapes in regexes
- ([PR#7405](https://github.com/dubzzz/fast-check/pull/7405)) Bug: Handle escaped surrogate pairs in Unicode regexes
- ([PR#7406](https://github.com/dubzzz/fast-check/pull/7406)) Bug: Support non-Unicode x and u identity escapes
- ([PR#7398](https://github.com/dubzzz/fast-check/pull/7398)) Bug: Shrink Unicode regex ranges using full code points
- ([PR#7376](https://github.com/dubzzz/fast-check/pull/7376)) Bug: Better type definition on built-in plugins
- ([PR#7400](https://github.com/dubzzz/fast-check/pull/7400)) Performance: Avoid repeated string tokenization states
- ([PR#7566](https://github.com/dubzzz/fast-check/pull/7566)) Performance: Improve initialization/memory performance of binary string

# 4.10.2

_Fix interrupt plugin (throwing)_
[[Code](https://github.com/dubzzz/fast-check/tree/v4.10.2)][[Diff](https://github.com/dubzzz/fast-check/compare/v4.10.1...v4.10.2)]

## Fixes

- ([PR#7333](https://github.com/dubzzz/fast-check/pull/7333)) Bug: Plugin `interruptAfterTimeLimit` crashes

# 4.10.1

_Fix fake-timer compatibility in timeout and interrupt plugins_
[[Code](https://github.com/dubzzz/fast-check/tree/v4.10.1)][[Diff](https://github.com/dubzzz/fast-check/compare/v4.10.0...v4.10.1)]

## Fixes

- ([PR#7292](https://github.com/dubzzz/fast-check/pull/7292)) Bug: Capture timer globals for `timeout` plugin
- ([PR#7293](https://github.com/dubzzz/fast-check/pull/7293)) Bug: Capture timers for `interruptAfterTimeLimit` plugin
- ([PR#7282](https://github.com/dubzzz/fast-check/pull/7282)) CI: Temporarily disable documentation updates until v5
- ([PR#7279](https://github.com/dubzzz/fast-check/pull/7279)) Doc: Release note for 4.10.0

# 4.10.0

_New plugin API and deprecations ahead of v5_
[[Code](https://github.com/dubzzz/fast-check/tree/v4.10.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v4.9.0...v4.10.0)]

## Features

- ([PR#7216](https://github.com/dubzzz/fast-check/pull/7216)) Introduce a plugin API
- ([PR#7221](https://github.com/dubzzz/fast-check/pull/7221)) Refine plugin API
- ([PR#7222](https://github.com/dubzzz/fast-check/pull/7222)) Add ability to configure plugins globally
- ([PR#7224](https://github.com/dubzzz/fast-check/pull/7224)) Add the `beforeEach` plugin to hook in life-cycle
- ([PR#7227](https://github.com/dubzzz/fast-check/pull/7227)) Create an `afterEach` plugin
- ([PR#7232](https://github.com/dubzzz/fast-check/pull/7232)) Deprecate life-cycle methods
- ([PR#7235](https://github.com/dubzzz/fast-check/pull/7235)) Support teardown of `beforeEach` plugin
- ([PR#7228](https://github.com/dubzzz/fast-check/pull/7228)) Add `timeout` plugin to stop long running predicates
- ([PR#7237](https://github.com/dubzzz/fast-check/pull/7237)) Deprecate timeout from parameters
- ([PR#7238](https://github.com/dubzzz/fast-check/pull/7238)) Pass a store to plugins
- ([PR#7239](https://github.com/dubzzz/fast-check/pull/7239)) Add extra plugin's method called `onAllRunsComplete`
- ([PR#7240](https://github.com/dubzzz/fast-check/pull/7240)) Deprecate `reporter` and `asyncReporter` from parameters
- ([PR#7229](https://github.com/dubzzz/fast-check/pull/7229)) Add plugin to interrupt after time limit
- ([PR#7245](https://github.com/dubzzz/fast-check/pull/7245)) Support `failOnInterrupt` on the plugin
- ([PR#7230](https://github.com/dubzzz/fast-check/pull/7230)) Add plugins to drop runs on already covered cases
- ([PR#7259](https://github.com/dubzzz/fast-check/pull/7259)) Add ability to decorate `generate` via Plugins
- ([PR#7231](https://github.com/dubzzz/fast-check/pull/7231)) Add the `unbiased` plugin to generate without bias
- ([PR#7260](https://github.com/dubzzz/fast-check/pull/7260)) Deprecate parameters superseded by plugins
- ([PR#7261](https://github.com/dubzzz/fast-check/pull/7261)) Deprecate v5 removals

## Fixes

- ([PR#7225](https://github.com/dubzzz/fast-check/pull/7225)) Bug: Proper ordering between plugins
- ([PR#7127](https://github.com/dubzzz/fast-check/pull/7127)) CI: Announce on Bluesky when drafting the release
- ([PR#7217](https://github.com/dubzzz/fast-check/pull/7217)) CI: Dedupe packages for pnpm
- ([PR#7137](https://github.com/dubzzz/fast-check/pull/7137)) Doc: Release note for 4.9.0
- ([PR#7226](https://github.com/dubzzz/fast-check/pull/7226)) Doc: Fix admonition titles on the website
- ([PR#7246](https://github.com/dubzzz/fast-check/pull/7246)) Doc: Add jkomyno as code contributor
- ([PR#7251](https://github.com/dubzzz/fast-check/pull/7251)) Performance: Single timer for `interruptAfterTimeLimit`

---

# 4.9.0

_Shrinkable `entityGraph` and few performance chips_
[[Code](https://github.com/dubzzz/fast-check/tree/v4.9.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v4.8.0...v4.9.0)]

## Features

- ([PR#7008](https://github.com/dubzzz/fast-check/pull/7008)) Towards shrinkable `entityGraph` thanks to `chainUntil`

## Fixes

- ([PR#7010](https://github.com/dubzzz/fast-check/pull/7010)) Bug: Fix latent state-sharing bug in entityGraph
- ([PR#7063](https://github.com/dubzzz/fast-check/pull/7063)) Bug: Equiprobable alternatives in `stringMatching`
- ([PR#6973](https://github.com/dubzzz/fast-check/pull/6973)) CI: Drop caches on push for build package flow
- ([PR#6971](https://github.com/dubzzz/fast-check/pull/6971)) CI: Only mark fast-check's releases as latest
- ([PR#6974](https://github.com/dubzzz/fast-check/pull/6974)) CI: Drop pull_request_target flows
- ([PR#6975](https://github.com/dubzzz/fast-check/pull/6975)) CI: Drop discussion creation on release publish
- ([PR#6976](https://github.com/dubzzz/fast-check/pull/6976)) CI: Drop caches from publication steps
- ([PR#6977](https://github.com/dubzzz/fast-check/pull/6977)) CI: Revert "Drop caches from publication steps"
- ([PR#6978](https://github.com/dubzzz/fast-check/pull/6978)) CI: Make zizmor audit a required status check
- ([PR#6991](https://github.com/dubzzz/fast-check/pull/6991)) CI: Remove Claude Code workflow
- ([PR#6994](https://github.com/dubzzz/fast-check/pull/6994)) CI: Replace `pnpm dlx` with `pnpm exec` for `pkg-pr-new`
- ([PR#6995](https://github.com/dubzzz/fast-check/pull/6995)) CI: Inline zizmor ignores in workflow
- ([PR#6996](https://github.com/dubzzz/fast-check/pull/6996)) CI: Move to `devEngines.packageManager`
- ([PR#7005](https://github.com/dubzzz/fast-check/pull/7005)) CI: Update PULL_REQUEST_TEMPLATE.md
- ([PR#7011](https://github.com/dubzzz/fast-check/pull/7011)) CI: Drop OTP prompt from npm publish
- ([PR#7013](https://github.com/dubzzz/fast-check/pull/7013)) CI: Switch release jobs to npm stage publish
- ([PR#7027](https://github.com/dubzzz/fast-check/pull/7027)) CI: Run benchmarks against `main`
- ([PR#7037](https://github.com/dubzzz/fast-check/pull/7037)) CI: Use comparison mode for `bench`
- ([PR#7069](https://github.com/dubzzz/fast-check/pull/7069)) CI: Run pnpm dedupe to deduplicate lockfile
- ([PR#6959](https://github.com/dubzzz/fast-check/pull/6959)) CI: Announce releases on Bluesky
- ([PR#7105](https://github.com/dubzzz/fast-check/pull/7105)) CI: Switch to actions/attest for attestations
- ([PR#7117](https://github.com/dubzzz/fast-check/pull/7117)) CI: Use pnpm version in changelog script
- ([PR#7120](https://github.com/dubzzz/fast-check/pull/7120)) CI: Allow unclean tree in changelog generation
- ([PR#7125](https://github.com/dubzzz/fast-check/pull/7125)) CI: Stage publish using `pnpm` in publish jobs
- ([PR#7065](https://github.com/dubzzz/fast-check/pull/7065)) Clean: Delete skills directory
- ([PR#6983](https://github.com/dubzzz/fast-check/pull/6983)) Doc: Tweak PR Template to hint AI agents into revealing themselves
- ([PR#7092](https://github.com/dubzzz/fast-check/pull/7092)) Doc: Add back skills directory
- ([PR#7095](https://github.com/dubzzz/fast-check/pull/7095)) Doc: Add release notes for fast-check 4.8.0
- ([PR#7104](https://github.com/dubzzz/fast-check/pull/7104)) Doc: Add makeeno as doc contributor
- ([PR#7103](https://github.com/dubzzz/fast-check/pull/7103)) Doc: Fix info box in docs
- ([PR#7108](https://github.com/dubzzz/fast-check/pull/7108)) Doc: Add jneidel as doc contributor
- ([PR#7035](https://github.com/dubzzz/fast-check/pull/7035)) Performance: Faster `fc.integer` on `generate`
- ([PR#7046](https://github.com/dubzzz/fast-check/pull/7046)) Performance: Faster fc.record on generate
- ([PR#7047](https://github.com/dubzzz/fast-check/pull/7047)) Performance: Faster fc.dictionary on generate
- ([PR#7048](https://github.com/dubzzz/fast-check/pull/7048)) Performance: Faster `fc.webPath`/`fc.webUrl` on `generate`
- ([PR#7050](https://github.com/dubzzz/fast-check/pull/7050)) Performance: Faster `fc.stringMatching` for `\W` `\D` `\S` `.`
- ([PR#7054](https://github.com/dubzzz/fast-check/pull/7054)) Performance: Faster `fc.stringMatching` on `generate`
- ([PR#7049](https://github.com/dubzzz/fast-check/pull/7049)) Performance: Drop nested `tuple` on `generate` for `fc.record`
- ([PR#7045](https://github.com/dubzzz/fast-check/pull/7045)) Performance: Faster `fc.entityGraph` on `generate`
- ([PR#7071](https://github.com/dubzzz/fast-check/pull/7071)) Performance: Early exit on empty tuple in `fc.entityGraph`
- ([PR#7004](https://github.com/dubzzz/fast-check/pull/7004)) Refactor: Extract code from `onTheFlyLinksForEntityGraph`
- ([PR#7006](https://github.com/dubzzz/fast-check/pull/7006)) Refactor: Move `generate` logic to the `Arbitrary` for `entityGraph`
- ([PR#7007](https://github.com/dubzzz/fast-check/pull/7007)) Refactor: Introduce `ProductionState` for `onTheFlyLinks...`
- ([PR#6990](https://github.com/dubzzz/fast-check/pull/6990)) Script: Skip scripts during `pnpm i` in changelog generation
- ([PR#7039](https://github.com/dubzzz/fast-check/pull/7039)) Script: More benchmark commands
- ([PR#6972](https://github.com/dubzzz/fast-check/pull/6972)) Security: Pass `--ignore-scripts` to `pnpm i` calls
- ([PR#7028](https://github.com/dubzzz/fast-check/pull/7028)) Test: Add benchmarks for key arbitraries
- ([PR#7034](https://github.com/dubzzz/fast-check/pull/7034)) Test: Expand benchmark coverage across arbitrary families
- ([PR#7041](https://github.com/dubzzz/fast-check/pull/7041)) Test: Add runners related benchs
- ([PR#7064](https://github.com/dubzzz/fast-check/pull/7064)) Test: Clarify arbitrary benchmark names
- ([PR#7068](https://github.com/dubzzz/fast-check/pull/7068)) Test: More reliable arbitraries.bench.ts
- ([PR#7088](https://github.com/dubzzz/fast-check/pull/7088)) Typo: Typo in type `EntityGraphContraints`

---

# 4.8.0

_New arbitrary to chain in a loop fashion_
[[Code](https://github.com/dubzzz/fast-check/tree/v4.8.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v4.7.0...v4.8.0)]

## Features

- ([PR#6678](https://github.com/dubzzz/fast-check/pull/6678)) Add `chainUntil` arbitrary for iterative chaining

## Fixes

- ([PR#6965](https://github.com/dubzzz/fast-check/pull/6965)) Bug: Restore ability not to use `skipLibCheck`
- ([PR#6877](https://github.com/dubzzz/fast-check/pull/6877)) CI: Lowercase discussion_category_name to "announcements"
- ([PR#6878](https://github.com/dubzzz/fast-check/pull/6878)) CI: Scope permissions of clean-caches
- ([PR#6880](https://github.com/dubzzz/fast-check/pull/6880)) CI: Add PR-authoring guidance for Claude
- ([PR#6887](https://github.com/dubzzz/fast-check/pull/6887)) CI: Delete CLAUDE.md
- ([PR#6888](https://github.com/dubzzz/fast-check/pull/6888)) CI: Use tilde ranges for security dependency overrides
- ([PR#6891](https://github.com/dubzzz/fast-check/pull/6891)) CI: Disable Renovate updates on pnpm overrides
- ([PR#6899](https://github.com/dubzzz/fast-check/pull/6899)) CI: Scope Claude hooks to `$CLAUDE_PROJECT_DIR`
- ([PR#6905](https://github.com/dubzzz/fast-check/pull/6905)) CI: Enable pnpm global virtual store
- ([PR#6933](https://github.com/dubzzz/fast-check/pull/6933)) CI: Pin pnpm in npm install commands
- ([PR#6932](https://github.com/dubzzz/fast-check/pull/6932)) CI: Grant `discussions: write` to release jobs
- ([PR#6935](https://github.com/dubzzz/fast-check/pull/6935)) CI: Skip PR template check for dubzzz
- ([PR#6937](https://github.com/dubzzz/fast-check/pull/6937)) CI: Mirror the repo to tangled
- ([PR#6938](https://github.com/dubzzz/fast-check/pull/6938)) CI: Add missing runs-on for tangled
- ([PR#6889](https://github.com/dubzzz/fast-check/pull/6889)) Doc: Add release notes for fast-check 4.7.0
- ([PR#6900](https://github.com/dubzzz/fast-check/pull/6900)) Doc: Fix broken API reference links
- ([PR#6844](https://github.com/dubzzz/fast-check/pull/6844)) Doc: Extract manual setup guide into dedicated page
- ([PR#6845](https://github.com/dubzzz/fast-check/pull/6845)) Doc: Add index pages for documentation sections
- ([PR#6918](https://github.com/dubzzz/fast-check/pull/6918)) Doc: Fix Documentation link to point to first doc page
- ([PR#6939](https://github.com/dubzzz/fast-check/pull/6939)) Doc: Link to Tangled mirror of fast-check
- ([PR#6934](https://github.com/dubzzz/fast-check/pull/6934)) Test: Tolerate `\p{...}` value drift in docs tests
- ([PR#6951](https://github.com/dubzzz/fast-check/pull/6951)) Test: Fix poisoning tests for latest Node

---

# 4.7.0

_Unicode property support in `stringMatching`_
[[Code](https://github.com/dubzzz/fast-check/tree/v4.7.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v4.6.0...v4.7.0)]

## Features

- ([PR#6866](https://github.com/dubzzz/fast-check/pull/6866)) Reversible `json` arbitrary
- ([PR#6868](https://github.com/dubzzz/fast-check/pull/6868)) Parse `\p{}` and `\P{}` in `stringMatching`
- ([PR#6870](https://github.com/dubzzz/fast-check/pull/6870)) Support for `\p{UnicodeProperty}` in `stringMatching`
- ([PR#6871](https://github.com/dubzzz/fast-check/pull/6871)) Support negated unicode properties in `stringMatching`

## Fixes

- ([PR#6710](https://github.com/dubzzz/fast-check/pull/6710)) CI: Pass explicit string to `make_latest`
- ([PR#6714](https://github.com/dubzzz/fast-check/pull/6714)) CI: Remove unused vite dependency from multiple packages
- ([PR#6780](https://github.com/dubzzz/fast-check/pull/6780)) CI: Silent zizmor issues (as they used to be)
- ([PR#6786](https://github.com/dubzzz/fast-check/pull/6786)) CI: Configure release workflow settings for announcements
- ([PR#6787](https://github.com/dubzzz/fast-check/pull/6787)) CI: Add force-build-status-execution label trigger to CI workflow
- ([PR#6818](https://github.com/dubzzz/fast-check/pull/6818)) CI: Push tag after creating draft release
- ([PR#6827](https://github.com/dubzzz/fast-check/pull/6827)) CI: Update CSP for our playgrounds backed by stackblitz
- ([PR#6832](https://github.com/dubzzz/fast-check/pull/6832)) CI: Add format/lint/typecheck hooks for Claude Code
- ([PR#6834](https://github.com/dubzzz/fast-check/pull/6834)) CI: Fix Claude's session start hook
- ([PR#6852](https://github.com/dubzzz/fast-check/pull/6852)) CI: Skip website prebuild remote fetches on cloud Claude Code
- ([PR#6869](https://github.com/dubzzz/fast-check/pull/6869)) CI: Add workflow to clean up GitHub Actions caches
- ([PR#6789](https://github.com/dubzzz/fast-check/pull/6789)) Clean: Remove unused code identified by knip
- ([PR#6711](https://github.com/dubzzz/fast-check/pull/6711)) Doc: Release note for version 4.6.0
- ([PR#6756](https://github.com/dubzzz/fast-check/pull/6756)) Doc: Fix typo in the documentation
- ([PR#6758](https://github.com/dubzzz/fast-check/pull/6758)) Doc: Add rugk as doc contributor
- ([PR#6764](https://github.com/dubzzz/fast-check/pull/6764)) Doc: Document gitmoji PR naming
- ([PR#6776](https://github.com/dubzzz/fast-check/pull/6776)) Doc: Add nielk as code contributor
- ([PR#6753](https://github.com/dubzzz/fast-check/pull/6753)) Doc: Migrate playgrounds in documentation to StackBlitz
- ([PR#6830](https://github.com/dubzzz/fast-check/pull/6830)) Doc: Switch to `?raw` imports for advents
- ([PR#6836](https://github.com/dubzzz/fast-check/pull/6836)) Doc: Add Vitest documentation guide for setting up property-based testing
- ([PR#6833](https://github.com/dubzzz/fast-check/pull/6833)) Doc: Remove dead doc hub pages
- ([PR#6855](https://github.com/dubzzz/fast-check/pull/6855)) Doc: Integrate API reference natively into our doc
- ([PR#6867](https://github.com/dubzzz/fast-check/pull/6867)) Doc: Simplify examples
- ([PR#6835](https://github.com/dubzzz/fast-check/pull/6835)) Script: Migrate from ESLint to oxlint
- ([PR#6872](https://github.com/dubzzz/fast-check/pull/6872)) Script: Rework hooks for Claude Code
- ([PR#6754](https://github.com/dubzzz/fast-check/pull/6754)) Test: Migrate race condition tests to Vitest
- ([PR#6859](https://github.com/dubzzz/fast-check/pull/6859)) Test: Stabilize flaky timeout tests on Windows

---

# 4.6.0

_Better `stringMatching` with `maxLength`_
[[Code](https://github.com/dubzzz/fast-check/tree/v4.6.0)][[Diff](https://github.com/dubzzz/fast-check/compare/v4.5.3...v4.6.0)]

## Features

- ([PR#6599](https://github.com/dubzzz/fast-check/pull/6599)) Add basic `maxLength` support to `stringMatching`
- ([PR#6600](https://github.com/dubzzz/fast-check/pull/6600)) Better clamp on regexes when `maxLength` on `stringMatching`
- ([PR#6687](https://github.com/dubzzz/fast-check/pull/6687)) Deprecate `Random::next(n)` and `Random::nextInt()`

## Fixes

- ([PR#6502](https://github.com/dubzzz/fast-check/pull/6502)) Bug: Bad d.ts import in BuildInversedRelationsMapping
- ([PR#6578](https://github.com/dubzzz/fast-check/pull/6578)) Bug: Don't crash when stringifying detached ArrayBuffers
- ([PR#6700](https://github.com/dubzzz/fast-check/pull/6700)) Bug: Fix object unmapper and depth computation for special keys
- ([PR#6432](https://github.com/dubzzz/fast-check/pull/6432)) CI: Move all dependencies to dev on examples/
- ([PR#6443](https://github.com/dubzzz/fast-check/pull/6443)) CI: Migrate to Docusaurus v4 configuration format
- ([PR#6456](https://github.com/dubzzz/fast-check/pull/6456)) CI: Enable persist-credentials in add-contributor workflow
- ([PR#6501](https://github.com/dubzzz/fast-check/pull/6501)) CI: Bump module in tsconfig to node18
- ([PR#6548](https://github.com/dubzzz/fast-check/pull/6548)) CI: Fix zizmor ignore config line numbers
- ([PR#6554](https://github.com/dubzzz/fast-check/pull/6554)) CI: Drop tests against Node 20
- ([PR#6563](https://github.com/dubzzz/fast-check/pull/6563)) CI: Fix check_publish status to be success on no error
- ([PR#6565](https://github.com/dubzzz/fast-check/pull/6565)) CI: Add create release workflow
- ([PR#6610](https://github.com/dubzzz/fast-check/pull/6610)) CI: Rework pnpm configuration
- ([PR#6619](https://github.com/dubzzz/fast-check/pull/6619)) CI: Add PR template enforcement workflow
- ([PR#6622](https://github.com/dubzzz/fast-check/pull/6622)) CI: Skip Netlify doc publish on PRs
- ([PR#6625](https://github.com/dubzzz/fast-check/pull/6625)) CI: Run PR template check without approval
- ([PR#6623](https://github.com/dubzzz/fast-check/pull/6623)) CI: Skip PR template check for Renovate bot
- ([PR#6638](https://github.com/dubzzz/fast-check/pull/6638)) CI: Bundle `fast-check` using `rolldown`
- ([PR#6662](https://github.com/dubzzz/fast-check/pull/6662)) CI: Rework configuration of examples
- ([PR#6683](https://github.com/dubzzz/fast-check/pull/6683)) CI: Add Claude Code GitHub Action workflow
- ([PR#6684](https://github.com/dubzzz/fast-check/pull/6684)) CI: Add configuration for pre and post tool Claude hooks
- ([PR#6690](https://github.com/dubzzz/fast-check/pull/6690)) CI: Refine GH Action triggering CLAUDE
- ([PR#6693](https://github.com/dubzzz/fast-check/pull/6693)) CI: Configure another Claude model
- ([PR#6703](https://github.com/dubzzz/fast-check/pull/6703)) CI: Add top-level `permissions: {}` to workflows missing it
- ([PR#6704](https://github.com/dubzzz/fast-check/pull/6704)) CI: Refactor Claude workflow custom instructions configuration
- ([PR#6705](https://github.com/dubzzz/fast-check/pull/6705)) CI: Add SessionStart hook to ensure dependencies are installed
- ([PR#6597](https://github.com/dubzzz/fast-check/pull/6597)) Clean: Drop runkit file
- ([PR#6640](https://github.com/dubzzz/fast-check/pull/6640)) Clean: Drop unused "tsd" in package.json
- ([PR#6441](https://github.com/dubzzz/fast-check/pull/6441)) Doc: Release note for 4.5.0
- ([PR#6442](https://github.com/dubzzz/fast-check/pull/6442)) Doc: Replace generic blog tags with feature-specific taxonomy
- ([PR#6458](https://github.com/dubzzz/fast-check/pull/6458)) Doc: Add adamni21 as doc contributor
- ([PR#6496](https://github.com/dubzzz/fast-check/pull/6496)) Doc: Refine npm keywords
- ([PR#6514](https://github.com/dubzzz/fast-check/pull/6514)) Doc: Skill for JavaScript testing expert
- ([PR#6516](https://github.com/dubzzz/fast-check/pull/6516)) Doc: Add note to avoid overusing filter and fc.pre
- ([PR#6517](https://github.com/dubzzz/fast-check/pull/6517)) Doc: Update testing skill to recommend mimicking existing test structure
- ([PR#6523](https://github.com/dubzzz/fast-check/pull/6523)) Doc: Add PR template requirement to Copilot instructions
- ([PR#6522](https://github.com/dubzzz/fast-check/pull/6522)) Doc: Add note on complementary testing approaches
- ([PR#6524](https://github.com/dubzzz/fast-check/pull/6524)) Doc: Add snapshot vs screenshot guidance
- ([PR#6527](https://github.com/dubzzz/fast-check/pull/6527)) Doc: Push to install missing tooling
- ([PR#6530](https://github.com/dubzzz/fast-check/pull/6530)) Doc: Clearer guidelines for constraints of arbs in skill
- ([PR#6526](https://github.com/dubzzz/fast-check/pull/6526)) Doc: Add AI-powered testing documentation
- ([PR#6529](https://github.com/dubzzz/fast-check/pull/6529)) Doc: Add testing-library and browser testing part in skill
- ([PR#6528](https://github.com/dubzzz/fast-check/pull/6528)) Doc: Add bigint type preference for integer computations in skill
- ([PR#6531](https://github.com/dubzzz/fast-check/pull/6531)) Doc: Add TDD fashion thinking in skill
- ([PR#6553](https://github.com/dubzzz/fast-check/pull/6553)) Doc: Add josephjunker as doc contributor
- ([PR#6561](https://github.com/dubzzz/fast-check/pull/6561)) Doc: Add page on "What is property-based testing" and modify "Why property-based testing"
- ([PR#6605](https://github.com/dubzzz/fast-check/pull/6605)) Doc: Drop Snyk link on Readme
- ([PR#6603](https://github.com/dubzzz/fast-check/pull/6603)) Doc: Update CONTRIBUTING.md for AI
- ([PR#6572](https://github.com/dubzzz/fast-check/pull/6572)) Doc: Rework issue templates
- ([PR#6613](https://github.com/dubzzz/fast-check/pull/6613)) Doc: Update PR template
- ([PR#6634](https://github.com/dubzzz/fast-check/pull/6634)) Doc: Rework bug-report template
- ([PR#6635](https://github.com/dubzzz/fast-check/pull/6635)) Doc: Rework regression-report template
- ([PR#6652](https://github.com/dubzzz/fast-check/pull/6652)) Doc: Update Readme to point to npmx
- ([PR#6659](https://github.com/dubzzz/fast-check/pull/6659)) Doc: Update home to link to npmx
- ([PR#6696](https://github.com/dubzzz/fast-check/pull/6696)) Doc: Add rushelex as code contributor
- ([PR#6448](https://github.com/dubzzz/fast-check/pull/6448)) Performance: Optimize RunDetailsFormatter array allocations
- ([PR#5718](https://github.com/dubzzz/fast-check/pull/5718)) Performance: Import less from pure-rand
- ([PR#6679](https://github.com/dubzzz/fast-check/pull/6679)) Performance: Bump pure-rand to v8
- ([PR#6446](https://github.com/dubzzz/fast-check/pull/6446)) Performance: Replace loose equality by strict one
- ([PR#6444](https://github.com/dubzzz/fast-check/pull/6444)) Performance: Slightly faster code for RunExecution
- ([PR#6437](https://github.com/dubzzz/fast-check/pull/6437)) Refactor: Replace fileURLToPath patterns with import.meta.\*
- ([PR#6567](https://github.com/dubzzz/fast-check/pull/6567)) Refactor: Remove ErrorWithCause, use Error directly
- ([PR#6621](https://github.com/dubzzz/fast-check/pull/6621)) Refactor: Replace glob package with native Node.js fs.glob
- ([PR#6675](https://github.com/dubzzz/fast-check/pull/6675)) Refactor: Drop @rollup/plugin-replace for rolldown builtin
- ([PR#6550](https://github.com/dubzzz/fast-check/pull/6550)) Security: Fix zizmor template-injection findings
- ([PR#6472](https://github.com/dubzzz/fast-check/pull/6472)) Test: Provide cause when doc generation fails
- ([PR#6381](https://github.com/dubzzz/fast-check/pull/6381)) Test: Migrate test-types to vitest
- ([PR#6507](https://github.com/dubzzz/fast-check/pull/6507)) Test: Filter ESM-only packages from CommonJS mode checks
- ([PR#6453](https://github.com/dubzzz/fast-check/pull/6453)) Typo: Fix typo for dictionary arbitrary constraint maxKeys
- ([PR#6552](https://github.com/dubzzz/fast-check/pull/6552)) Typo: Replace `flatMap` with `chain` in error message

---

# 4.5.3

_Proper attestation file naming_
[[Code](https://github.com/dubzzz/fast-check/tree/v4.5.3)][[Diff](https://github.com/dubzzz/fast-check/compare/v4.5.2...v4.5.3)]

## Fixes

- ([PR#6421](https://github.com/dubzzz/fast-check/pull/6421)) CI: Rename attestation bundles to \*.sigstore.json

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
