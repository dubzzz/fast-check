---
sidebar_position: 0
slug: /migration/from-4.x-to-5.x/
---

# From 4.x to 5.x

:::info[Version 5 is under development]
This guide describes the v5 API on `main`. Use the [v4 documentation](https://v4.fast-check.dev/) when working with a released v4 package. To try `main`, see [experimental versions](/docs/introduction/getting-started/#install-the-package).
:::

Version 5 uses one property API for synchronous and asynchronous predicates, and plugins for execution hooks, time limits and reporting. Start by updating to v4.10 or later and replacing deprecated options with plugins. If you use a fast-check test-runner integration, update it to a version supporting v5 before updating fast-check itself.

## Requirements and imports

The minimum requirements without polyfills are:

| Requirement           | v4      | v5      |
| --------------------- | ------- | ------- |
| Node.js               | 12.17.0 | 22.12.0 |
| ECMAScript            | ES2020  | ES2025  |
| TypeScript, when used | 5.0     | 5.8     |

The package now ships only an ESM bundle, and no longer exports a default value. Replace default imports with namespace or named imports:

```js
import * as fc from 'fast-check';
// Or: import { assert, property, integer } from 'fast-check';
```

CommonJS consumers can still use `require('fast-check')` on supported Node.js versions that can load ESM synchronously. There is no longer a separate CommonJS build.

## One property API, asynchronous runners

Replace `fc.asyncProperty` with `fc.property`. Both synchronous and asynchronous predicates use the same API. Always await or return the promise from `fc.assert`, including when the predicate is synchronous:

```js
test('keeps values in order', async () => {
  await fc.assert(
    fc.property(fc.array(fc.integer()), (values) => {
      const sorted = [...values].sort((a, b) => a - b);
      return sorted.every((value, index) => index === 0 || sorted[index - 1] <= value);
    }),
  );
});
```

The predicate receives an additional final execution-context argument. Fixed-arity predicates can ignore it. If you forward a rest-parameter array to another function, remove the final argument first. The context is not part of the generated values or `examples`. See [execution context](/docs/core-blocks/properties/#execution-context), including cancellation signals.

Custom property implementations now implement `Property<Ts>` instead of the former synchronous/asynchronous interfaces. There is no `isAsync()` distinction: `run(value, executionContext)` can return a result directly or a promise.

## Replace removed options with plugins

The following options and methods have been removed, not just deprecated:

| v4 API                                                                         | v5 replacement                                                           |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| Property `.beforeEach` and `.afterEach`                                        | `fc.beforeEach(fn)` and `fc.afterEach(fn)` in `plugins`                  |
| Global `beforeEach`, `afterEach`, `asyncBeforeEach`, `asyncAfterEach` settings | Install the corresponding lifecycle plugin with `fc.installGlobalPlugin` |
| `timeout: ms`                                                                  | `plugins: [fc.timeout(ms)]`                                              |
| `interruptAfterTimeLimit: ms`                                                  | `plugins: [fc.interruptAfterTimeLimit(ms)]`                              |
| `markInterruptAsFailure: true`                                                 | `{ failOnInterrupt: true }` on `fc.interruptAfterTimeLimit`              |
| `unbiased: true`                                                               | `plugins: [fc.unbiased()]`                                               |
| `skipEqualValues: true`                                                        | `plugins: [fc.skipEqualValues()]`                                        |
| `ignoreEqualValues: true`                                                      | `plugins: [fc.ignoreEqualValues()]`                                      |
| `reporter`, `asyncReporter`                                                    | A plugin's `onAllRunsComplete` callback                                  |
| `includeErrorInReport`                                                         | The option on `fc.defaultReporter({ includeErrorInReport: true })`       |
| `logger`                                                                       | The second argument of `fc.logStatistics(stats, logger)`                 |
| Legacy `num_runs`                                                              | `numRuns`                                                                |

`skipAllAfterTimeLimit` is also removed. The `interruptAfterTimeLimit` plugin can bound the entire assessment, but also interrupts an asynchronous execution still in progress from the runner's perspective. It is not an exact replacement for waiting for the current execution before skipping the remaining ones. See [time limits](/docs/core-blocks/plugins/time-limits/) for cancellation and reporting behavior.

Lifecycle plugins accept both synchronous and asynchronous callbacks. Their position determines which work a time-limit plugin wraps. For example, put setup and teardown before `fc.timeout(ms)` to keep them outside that timeout:

```js
await fc.assert(property, {
  plugins: [fc.beforeEach(setup), fc.afterEach(teardown), fc.timeout(1_000)],
});
```

For shared limits, replace `fc.configureGlobal({ timeout: 1_000 })` with `fc.installGlobalPlugin(fc.timeout(1_000))`.

Local plugins do not override global ones. Both apply, even when they are instances of the same plugin. Use `noGlobalPlugins: true` to skip all global plugins for a run, then explicitly include those still needed. Global plugins can be installed before local ones (the default `'pre'`) or after them (`'post'`). See [plugin ordering](/docs/core-blocks/plugins/#installing-plugins-globally).

## Replace `check` and reporting helpers

`fc.check`, `fc.defaultReportMessage` and `fc.asyncDefaultReportMessage` are no longer exported. Use `fc.assert` and access `RunDetails` in a completion plugin. To replace the old `check` pattern without default failure reporting:

```js
let details;
await fc.assert(property, {
  noDefaultPlugins: true,
  plugins: [
    () => ({
      onAllRunsComplete(out) {
        details = out;
      },
    }),
  ],
});
// Inspect details here; this example intentionally does not report property failures.
```

Other plugins may still report errors. `noDefaultPlugins` does not disable them or global plugins. For normal tests, keep the default reporter enabled, or make your completion plugin throw for the outcomes you consider failures.

Use `fc.defaultReporter()` when you need the built-in reporting behavior at an explicit position. Error formatting is no longer exposed as a standalone report-message function. See [custom reports](/docs/configuration/custom-reports/).

Interruption and failure are separate flags in `RunDetails`. An interrupted run can have `failed: false`, while the plugin requesting interruption can still report an error. The removed `RunDetailsFailureInterrupted` variant is no longer needed. A failure during a plugin's `beforeAll` is represented by `RunDetailsFailurePluginSetup`. Use the [run-details table](/docs/core-blocks/runners/#run-details) when updating custom reporters.

## Sampling and statistics

Both `sample` and `statistics` are asynchronous and accept an options object. Replace a numeric run-count argument with `{ numRuns }`:

```js
const values = await fc.sample(fc.integer(), { numRuns: 10 });

const stats = await fc.statistics(fc.integer(), (value) => (value < 0 ? 'negative' : 'non-negative'), {
  numRuns: 1_000,
});
fc.logStatistics(stats);
```

`statistics` returns `{ counts, numValues }`, where `counts` is a `Map`, instead of logging. Pass the result to `logStatistics` to print percentages, or format the counts yourself. With a property, the classifier receives generated values as separate arguments, instead of one array. Multiple arbitraries can also be passed directly before the classifier.

When given a property, both runners execute and await its predicate. They exclude skipped and interrupted inputs, collect a failing input and then stop without shrinking or reporting the predicate error. Use `noPredicateExecution: true` to generate inputs without executing the predicate. The classifier passed to `statistics` must not throw.

Both runners now use the plugin-enabled execution flow, so global plugins also apply. When replaying a shrink `path`, `numRuns` no longer caps the candidates visited. See [runners](/docs/core-blocks/runners/) for details.

## Arbitraries and custom generators

| v4 API                                                   | v5 replacement or behavior                                                                                                                          |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fc.infiniteStream(arb)`                                 | `fc.iterator(arb)`; it generates mostly finite iterators by default. Use `{ minLength: Number.POSITIVE_INFINITY }` to require an infinite iterator. |
| `Stream` and shrink methods returning `Stream`           | Standard `Iterator` / `IteratorObject`; use `Iterator.from(...)` when adapting an iterable.                                                         |
| `json` / `jsonValue` with `{ noUnicodeString: false }`   | `{ stringUnit: 'binary' }`                                                                                                                          |
| `anything` / `object` with `{ withUnicodeString: true }` | `{ stringUnit: 'binary' }`                                                                                                                          |
| The opposite Unicode-option boolean values               | Omit the option, or use `{ stringUnit: 'grapheme-ascii' }` explicitly.                                                                              |
| String-valued `randomType`, such as `'xorshift128plus'`  | Pass a generator factory from `pure-rand`, for example `import { xorshift128plus } from 'pure-rand/generator/xorshift128plus'`.                     |
| `Random.nextInt()` without arguments                     | `Random.nextInt(-2147483648, 2147483647)`                                                                                                           |
| `Random.next(bits)`                                      | `Random.nextInt(0, 2 ** bits - 1)`                                                                                                                  |
| `Random.nextBoolean()`                                   | `Random.nextInt(0, 1) === 1`                                                                                                                        |
| `Random.nextDouble()`                                    | `(mrng.nextInt(0, 0x3ffffff) * 2 ** 27 + mrng.nextInt(0, 0x7ffffff)) / 2 ** 53`                                                                     |

The `RandomType` string union is no longer exported. Existing `stringUnit` settings remain supported, including custom string-unit arbitraries. Explicit `key` and `values` arbitraries still take precedence for `anything` and `object`.

Arrays and derived arbitraries now accept `depthIdentifier` to coordinate recursive generation; see [arrays](/docs/core-blocks/arbitraries/composites/array/). The `done` and `faulty` flags returned by `scheduleSequence` are read-only live views: read them to monitor progress instead of assigning them.

## Tests that modify globals

fast-check no longer captures most global functions and prototype methods defensively. If the code under test can modify them, use [`@fast-check/poisoning`](/docs/ecosystem/#fast-checkpoisoning-) to detect changes and restore globals between executions. Do not rely on the core library being insulated from modified built-ins.
