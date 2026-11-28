---
sidebar_position: 1
slug: /migration-guide/from-4.x-to-5.x/
---

# From 4.x to 5.x

Simple migration guide to fast-check v5 starting from fast-check v4

:::note[Upcoming release]

This guide describes the upcoming version 5 based on the changes currently merged into `main`. It may evolve before the release.

:::

## Changes in minimal requirements

| Name                     | New requirement | Previous requirement |
| ------------------------ | --------------- | -------------------- |
| Node                     | ≥22.12.0        | ≥12.17.0             |
| ECMAScript specification | ES2025          | ES2020               |
| TypeScript _(optional)_  | ≥5.8            | ≥5.0                 |

Version 5 relies on native iterator helpers, such as `Iterator.from` and `.map` on iterators. Other JavaScript runtimes must provide these features too.

The package is now distributed as ESM only. CommonJS applications can still load it with `require('fast-check')` on Node versions supporting `require(esm)`, including Node 22.12.0. If your test runner or bundler previously selected the CommonJS bundle, make sure it can load the ESM entry point.

For TypeScript projects running on Node, use a module configuration that understands package exports, such as `"module": "NodeNext"` and `"moduleResolution": "NodeNext"`. Bundled applications can use the corresponding bundler resolution mode. If your `lib` is explicitly configured, include the iterator helper declarations, for example via `ESNext.Iterator` in TypeScript 5.8. Adding declarations alone does not provide the corresponding runtime features.

Related pull requests: [#7320](https://github.com/dubzzz/fast-check/pull/7320), [#7321](https://github.com/dubzzz/fast-check/pull/7321), [#7325](https://github.com/dubzzz/fast-check/pull/7325)

## Update to latest v4.x

Version 5 of fast-check introduces significant changes as part of its major release, including breaking changes. However, many of these changes can be addressed while still using the latest minor release of version 4.

To ensure a smoother migration to version 5, we recommend first upgrading to the latest version of v4. In particular, version 4.10.0 introduced plugins and deprecation notices to help prepare for this migration. Then, review and address the following changes before upgrading to version 5.

The [`@fast-check/codemod` documentation](https://github.com/dubzzz/fast-check/tree/main/packages/codemod#readme) lists transforms that automate parts of this migration and the minimum fast-check version required for each. In the commands below, replace `path/to/code` with the file or directory to migrate. Add `--dry --print` to preview changes, then review the diff and any warnings about patterns requiring manual migration.

The available transforms cover the following steps. Minimum versions refer to fast-check, not to the codemod package:

| Codemod                      | Minimum fast-check version | Migration                                                           |
| ---------------------------- | -------------------------- | ------------------------------------------------------------------- |
| `v5/defaultImport`           | 1.0.0                      | Default imports to namespace imports                                |
| `v5/randomMethods`           | 1.0.0                      | Removed `Random` methods to bounded `nextInt` calls                 |
| `v5/stringUnit`              | 3.23.0                     | Unicode string flags to `stringUnit`                                |
| `v5/randomTypeFactory`       | 4.6.0                      | Random generator names to factory functions                         |
| `v5/lifecyclePlugins`        | 4.10.0                     | Local property hooks and one-time global hooks to plugins           |
| `v5/propertyToAsyncProperty` | 4.11.0                     | Synchronous properties and assertions to asynchronous ones          |
| `v5/runnerPlugins`           | 4.11.0                     | Runner options and custom reporters to plugins                      |
| `v5/checkToAssert`           | 5.0.0                      | Asynchronous `check` calls to `assert` while preserving run details |
| `v5/sample`                  | 5.0.0                      | Await sampling and preserve generation without predicate execution  |
| `v5/statistics`              | 5.0.0                      | Await statistics, adapt property classifiers, and log the result    |
| `v6/asyncPropertyToProperty` | 5.0.0                      | Deprecated `asyncProperty` to `property`                            |

For properties with chained hooks, apply `v5/lifecyclePlugins` before `v5/propertyToAsyncProperty`. Apply transforms requiring v5 only after the major-version upgrade.

Renaming `asyncProperty` with `v6/asyncPropertyToProperty` is optional cleanup, described at the end of this guide. It is not required to use v5.

The published `@fast-check/codemod@0.0.0` only includes `v5/defaultImport`; use a release containing the other transforms before applying them.

### Prepare asynchronous assertions

```bash npm2yarn
npx @fast-check/codemod@latest v5/propertyToAsyncProperty path/to/code
```

:::tip[Use ESLint during and after migration]

For TypeScript projects, we recommend enabling the type-aware ESLint rules [`@typescript-eslint/no-floating-promises`](https://typescript-eslint.io/rules/no-floating-promises/) and [`@typescript-eslint/await-thenable`](https://typescript-eslint.io/rules/await-thenable/). They help catch assertions that are not awaited or returned, and `await` expressions applied to synchronous results. Keep them enabled after the upgrade to catch these mistakes in future tests too.

:::

In v4, `fc.assert(fc.property(...))` returns `void`. Adding `await` is valid JavaScript, but can trigger the ESLint rule [`@typescript-eslint/await-thenable`](https://typescript-eslint.io/rules/await-thenable/).

To prepare without triggering this rule, first upgrade to v4.11.0, where `asyncProperty` accepts synchronous predicates too. Make the surrounding test asynchronous and switch to `asyncProperty`:

```diff
-it('checks the property', () => {
-  fc.assert(fc.property(fc.integer(), predicate));
+it('checks the property', async () => {
+  await fc.assert(fc.asyncProperty(fc.integer(), predicate));
 });
```

The assertion now returns a `Promise<void>`, even if `predicate` is synchronous. You can also return that promise to your test runner. The `v5/propertyToAsyncProperty` codemod automates this step for supported patterns. If you test assertion failures, update synchronous throw expectations to promise rejection expectations at this stage, as described in [Always await `assert`](#always-await-assert).

After upgrading to v5, keep `await fc.assert(fc.asyncProperty(arb, predicate))` temporarily: `asyncProperty` remains available as a deprecated alias of `property`. Then, when ready, switch to `await fc.assert(fc.property(arb, predicate))`. This separates the migration to asynchronous assertions from the major-version upgrade.

### Replace default imports

```bash npm2yarn
npx @fast-check/codemod@latest v5/defaultImport path/to/code
```

The default export has been removed in version 5. Replace default imports with namespace imports:

```diff
-import fc from 'fast-check';
+import * as fc from 'fast-check';
```

Named imports, such as `import { integer } from 'fast-check'`, remain supported.

Related pull requests: [#7261](https://github.com/dubzzz/fast-check/pull/7261), [#7307](https://github.com/dubzzz/fast-check/pull/7307)

### Replace property hooks with plugins

```bash npm2yarn
npx @fast-check/codemod@latest v5/lifecyclePlugins path/to/code
```

The `.beforeEach` and `.afterEach` methods on properties have been removed. Since version 4.10.0, the corresponding plugins can be passed to the runner instead:

```diff
 await fc.assert(
-  fc.asyncProperty(fc.integer(), predicate).beforeEach(setUp).afterEach(tearDown),
+  fc.asyncProperty(fc.integer(), predicate),
+  { plugins: [fc.beforeEach(setUp), fc.afterEach(tearDown)] },
 );
```

Both plugins support synchronous and asynchronous callbacks. While still using v4, keep using `fc.asyncProperty` when your predicate or hooks are asynchronous. The change from `asyncProperty` to `property` is described in [One `property` for synchronous and asynchronous predicates](#one-property-for-synchronous-and-asynchronous-predicates).

Callbacks should return nothing or a promise resolving to nothing. A `beforeEach` callback can also return a teardown function, which runs after the predicate. Remove any other accidental return values from your existing hooks.

Plugin callbacks do not receive the previous hook as an argument. If your existing callback calls `previousBeforeEach` or `previousAfterEach`, register the hooks as separate plugins instead. Before hooks execute in array order, while after hooks and teardown functions execute in reverse order.

The global parameters `beforeEach`, `afterEach`, `asyncBeforeEach`, and `asyncAfterEach` have also been removed. Use globally installed plugins instead:

```diff
-fc.configureGlobal({ beforeEach: setUp, afterEach: tearDown });
+fc.installGlobalPlugin(fc.beforeEach(setUp));
+fc.installGlobalPlugin(fc.afterEach(tearDown));
```

The same plugins replace `asyncBeforeEach` and `asyncAfterEach`; pass your asynchronous callbacks to them. Keep other global settings, such as `numRuns`, in `fc.configureGlobal`.

The `v5/lifecyclePlugins` codemod handles supported local hooks and one-time global setup. Review its warnings and global hooks installed in other files: global before plugins run first, even when the old local hook called `previous()` last or skipped it. Global after plugins run last, so also review local after hooks that called `previous()` first or skipped it.

Related pull requests: [#7224](https://github.com/dubzzz/fast-check/pull/7224), [#7227](https://github.com/dubzzz/fast-check/pull/7227), [#7232](https://github.com/dubzzz/fast-check/pull/7232), [#7315](https://github.com/dubzzz/fast-check/pull/7315), [#7386](https://github.com/dubzzz/fast-check/pull/7386), [#7620](https://github.com/dubzzz/fast-check/pull/7620)

### Replace runner parameters with plugins

```bash npm2yarn
npx @fast-check/codemod@latest v5/runnerPlugins path/to/code
```

Several runner parameters have been removed in favor of plugins introduced in version 4.10.0.

The `v5/runnerPlugins` codemod requires v4.11.0 and migrates supported runner options and custom reporters together, including one-time global setup. Review warnings about conflicting global and local settings.

| Previous parameter                                              | Replacement plugin                                              |
| --------------------------------------------------------------- | --------------------------------------------------------------- |
| `timeout: timeMs`                                               | `fc.timeout(timeMs)`                                            |
| `interruptAfterTimeLimit: timeMs`                               | `fc.interruptAfterTimeLimit(timeMs)`                            |
| `interruptAfterTimeLimit: timeMs, markInterruptAsFailure: true` | `fc.interruptAfterTimeLimit(timeMs, { failOnInterrupt: true })` |
| `skipEqualValues: true`                                         | `fc.skipEqualValues()`                                          |
| `ignoreEqualValues: true`                                       | `fc.ignoreEqualValues()`                                        |
| `unbiased: true`                                                | `fc.unbiased()`                                                 |

For instance, the following change moves a timeout and duplicate-value handling into plugins:

```diff
 await fc.assert(property, {
-  timeout: 1000,
-  skipEqualValues: true,
+  plugins: [fc.timeout(1000), fc.skipEqualValues()],
 });
```

When a boolean parameter was `false`, omit its plugin. If you already have a `plugins` array, add the replacements to it.

While still using v4, `sample` and `statistics` do not apply plugins. To replace `unbiased: true` there, wrap the arbitrary with `fc.noBias`, for example `await fc.sample(fc.noBias(arbitrary), { numRuns: 10 })`. In v5, both runners apply plugins too, so `plugins: [fc.unbiased()]` becomes available.

Plugin order matters: the first plugin wraps the ones that follow it. To preserve the previous timeout behavior and keep setup and teardown outside the timeout, place lifecycle plugins before it:

```ts
await fc.assert(property, {
  plugins: [fc.beforeEach(setUp), fc.afterEach(tearDown), fc.timeout(1000)],
});
```

The `skipAllAfterTimeLimit` parameter has also been removed. There is no equivalent built-in plugin that keeps skipping all subsequent runs. If your goal is to stop a long assessment or shrinking process, use `fc.interruptAfterTimeLimit(timeMs)` instead. This is a change in behavior: interruption stops the assessment, while the previous option could fail with too many skipped runs. Use `{ failOnInterrupt: true }` when interruption should make the assertion fail.

For shared settings, replace `fc.configureGlobal({ timeout: timeMs })` with `fc.installGlobalPlugin(fc.timeout(timeMs))`, and apply the same pattern to the other plugins.

:::warning[Global and local plugins both apply]

A local plugin does not replace a globally installed one. For example, adding `fc.timeout(5000)` locally does not override a globally installed `fc.timeout(1000)`.

Install global plugins once during test setup. `fc.resetConfigureGlobal()` resets parameters, but it does not uninstall plugins. In v5, `noGlobalPlugins: true` lets a particular runner call skip all globally installed plugins; register any plugins you still need locally.

:::

Related pull requests: [#7222](https://github.com/dubzzz/fast-check/pull/7222), [#7237](https://github.com/dubzzz/fast-check/pull/7237), [#7260](https://github.com/dubzzz/fast-check/pull/7260), [#7332](https://github.com/dubzzz/fast-check/pull/7332), [#7340](https://github.com/dubzzz/fast-check/pull/7340), [#7358](https://github.com/dubzzz/fast-check/pull/7358), [#7377](https://github.com/dubzzz/fast-check/pull/7377), [#7533](https://github.com/dubzzz/fast-check/pull/7533), [#7617](https://github.com/dubzzz/fast-check/pull/7617)

### Changes on Unicode string options

```bash npm2yarn
npx @fast-check/codemod@latest v5/stringUnit path/to/code
```

The deprecated `noUnicodeString` and `withUnicodeString` constraints have been removed. Replace them with `stringUnit`:

```diff
-fc.json({ noUnicodeString: false });
+fc.json({ stringUnit: 'binary' });

-fc.jsonValue({ noUnicodeString: false });
+fc.jsonValue({ stringUnit: 'binary' });

-fc.anything({ withUnicodeString: true });
+fc.anything({ stringUnit: 'binary' });

-fc.object({ withUnicodeString: true });
+fc.object({ stringUnit: 'binary' });
```

For the opposite boolean values, remove the deprecated option to keep the existing default, or explicitly use `stringUnit: 'grapheme-ascii'`. Existing `stringUnit` settings, including custom string-unit arbitraries, remain supported. Explicit `key` and `values` arbitraries still take precedence for `anything` and `object`.

Related pull requests: [#7501](https://github.com/dubzzz/fast-check/pull/7501)

### Changes on `randomType`

```bash npm2yarn
npx @fast-check/codemod@latest v5/randomTypeFactory path/to/code
```

The `randomType` parameter no longer accepts a string. If you explicitly selected the default generator, you can remove the option:

```diff
 await fc.assert(property, {
-  randomType: 'xorshift128plus',
 });
```

To select a different generator, pass its factory function instead. Add `pure-rand` as a direct dependency of your project if you import it:

```diff
+import { xoroshiro128plus } from 'pure-rand/generator/xoroshiro128plus';

 await fc.assert(property, {
-  randomType: 'xoroshiro128plus',
+  randomType: xoroshiro128plus,
 });
```

The same approach applies to `mersenne`, `xorshift128plus`, and `congruential32`, using their respective `pure-rand/generator/...` imports. The former `'congruential'` string was an alias for `congruential32`.

Factory functions are already supported in v4. In TypeScript, replace references to the removed `fc.RandomType` with the factory type, for example `NonNullable<fc.Parameters['randomType']>` after upgrading to v5.

Related pull requests: [#7309](https://github.com/dubzzz/fast-check/pull/7309)

## Update to v5.x

After applying the recommendations for migrating to the latest v4.x, there are still a few changes to apply when upgrading to version 5. These changes simplify property execution and make plugins the common way to customize it.

### Review predicate arguments

In v5, predicates passed to either `property` or `asyncProperty` receive a `PredicateExecutionContext` after the generated values. Ordinary callbacks declaring only the generated arguments do not need to change. If your predicate forwards `arguments` or collects all arguments with a rest parameter, make sure it does not treat this final context as another generated value.

The context can contain a `signal` supplied by plugins such as `timeout` and `interruptAfterTimeLimit`, allowing asynchronous work to cooperate with cancellation.

Related pull requests: [#7412](https://github.com/dubzzz/fast-check/pull/7412), [#7422](https://github.com/dubzzz/fast-check/pull/7422), [#7426](https://github.com/dubzzz/fast-check/pull/7426), [#7427](https://github.com/dubzzz/fast-check/pull/7427)

### Always await `assert`

The `assert` runner now returns a `Promise<void>` for all properties, including those with synchronous predicates. Make the surrounding test asynchronous and await the assertion, or return its promise to your test runner:

```diff
-it('checks the property', () => {
-  fc.assert(fc.property(fc.integer(), predicate));
+it('checks the property', async () => {
+  await fc.assert(fc.property(fc.integer(), predicate));
 });
```

If you test failures of `assert` itself, update synchronous throw expectations to handle promise rejections. Apply this change when switching to `asyncProperty` in v4.11.0 or when upgrading to v5:

```diff
-expect(() => fc.assert(property)).toThrow();
+await expect(async () => await fc.assert(property)).rejects.toThrow();
```

Awaiting the assertion is also required to wait for asynchronous reporting and cleanup. Internally, fast-check may execute synchronous predicates and hooks without yielding between them, so do not rely on incidental microtasks between runs to flush unrelated work. Await that work explicitly in the predicate or a hook.

Related pull requests: [#7296](https://github.com/dubzzz/fast-check/pull/7296), [#7303](https://github.com/dubzzz/fast-check/pull/7303), [#7388](https://github.com/dubzzz/fast-check/pull/7388), [#7489](https://github.com/dubzzz/fast-check/pull/7489)

### Changes on `sample`

```bash npm2yarn
npx @fast-check/codemod@latest v5/sample path/to/code
```

The `sample` runner now returns a promise, even when sampling an arbitrary. Await its result and replace the numeric shorthand for the number of runs with a parameters object:

```diff
-const values = fc.sample(fc.integer(), 10);
+const values = await fc.sample(fc.integer(), { numRuns: 10 });
```

Sampling now uses the same runner as `assert`. Local and globally installed plugins apply, including lifecycle hooks, time limits, and generation decorators. Review global plugins that were previously intended only for assertions; use `noGlobalPlugins: true` for a sampling call that should not run them.

When passing a property, `sample` now executes its predicate, including asynchronous predicates. Inputs rejected by `fc.pre` are excluded. The first failing input is included, then sampling stops without shrinking or reporting that predicate failure as an assertion error. Consequently, the result can contain fewer than `numRuns` values. Setup errors, too many skipped runs, or errors reported by plugins can still reject the promise.

If you only want to generate the property's inputs without running its predicate, pass `noPredicateExecution: true`:

```diff
-const values = fc.sample(property, { numRuns: 10 });
+const values = await fc.sample(property, { numRuns: 10, noPredicateExecution: true });
```

This option skips the predicate, but plugins still apply. The result shape is unchanged: an arbitrary yields its values directly, while a property yields tuples of its generated arguments.

When replaying a shrink `path`, `numRuns` no longer limits the number of collected shrink candidates. Do not rely on it to cap the size of that result.

The `v5/sample` codemod awaits supported calls and adds `noPredicateExecution: true` for known property inputs. If it cannot identify the input, it reports the call for review; add this option manually when the input is a property whose predicate should not run.

Related pull requests: [#7580](https://github.com/dubzzz/fast-check/pull/7580), [#7588](https://github.com/dubzzz/fast-check/pull/7588), [#7627](https://github.com/dubzzz/fast-check/pull/7627)

### Changes on `statistics`

```bash npm2yarn
npx @fast-check/codemod@latest v5/statistics path/to/code
```

The `statistics` runner is also asynchronous. It returns a `StatisticsResult` instead of printing output. Await it, then use `fc.logStatistics` to keep the previous formatted output:

```diff
-fc.statistics(fc.integer(), (value) => (value < 0 ? 'negative' : 'non-negative'), {
+const stats = await fc.statistics(fc.integer(), (value) => (value < 0 ? 'negative' : 'non-negative'), {
   numRuns: 1000,
-  logger: myLogger,
 });
+fc.logStatistics(stats, myLogger);
```

Without a custom logger, use `fc.logStatistics(stats)` to print to `console.log`. The `logger` runner parameter has been removed, including from `fc.configureGlobal`; pass it directly to `logStatistics` instead. The numeric shorthand for the number of runs has also been removed: replace a final `1000` argument with `{ numRuns: 1000 }`.

For programmatic access, the result contains:

- `counts`, a `Map<string, number>` containing category counts in order of first appearance.
- `numValues`, the number of classified inputs, including those assigned to no categories by returning `[]`.

`logStatistics` sorts categories by count and computes percentages using `numValues`, rather than the requested `numRuns`. If each input belongs to several categories, the percentages can still add up to more than 100%.

The same execution changes as for `sample` apply: plugins and property predicates run, skipped inputs are excluded, and the first failing input is classified before collection stops without shrinking. Use `noPredicateExecution: true` when passing a property whose predicate should not run. The classifier must remain synchronous and should never throw.

For property inputs, the classifier now receives the generated arguments separately, instead of a tuple:

```diff
 const property = fc.property(fc.integer(), fc.string(), (_count, _text) => true);
-fc.statistics(property, ([count, text]) => (count > text.length ? 'larger' : 'smaller or equal'));
+const stats = await fc.statistics(property, (count, text) => (count > text.length ? 'larger' : 'smaller or equal'));
+fc.logStatistics(stats);
```

A single arbitrary still passes its generated value as one argument. In particular, keep destructuring the classifier argument when passing `fc.tuple(...)` directly. You can also pass several arbitraries directly to `statistics`, without wrapping them in a property:

```ts
const stats = await fc.statistics(
  fc.integer(),
  fc.string(),
  (count, text) => (count > text.length ? 'larger' : 'smaller or equal'),
  { numRuns: 1000 },
);
fc.logStatistics(stats);
```

Parameters for `statistics` now describe a tuple of generated arguments, even with a single arbitrary. Wrap each explicit example accordingly:

```diff
-fc.statistics(fc.integer(), String, { examples: [1, 2] });
+const stats = await fc.statistics(fc.integer(), String, { examples: [[1], [2]] });
+fc.logStatistics(stats);
```

For typed wrappers, use `SampleParameters<T, 'arbitrary'>` or `SampleParameters<Ts, 'property'>` for `sample`, and `StatisticsParameters<Ts, 'arbitrary'>` or `StatisticsParameters<Ts, 'property'>` for `statistics`. Here `Ts` is the tuple of generated arguments; for statistics on a single integer arbitrary, it is `[number]`. Only the property variants expose `noPredicateExecution`.

The `v5/statistics` codemod awaits supported calls and logs the result, preserving a supported custom logger. For known property inputs, it adds `noPredicateExecution: true` and adapts supported classifiers to receive separate arguments. Review warnings about unknown inputs, classifiers, or options; these cases need manual changes.

Related pull requests: [#7587](https://github.com/dubzzz/fast-check/pull/7587), [#7588](https://github.com/dubzzz/fast-check/pull/7588), [#7592](https://github.com/dubzzz/fast-check/pull/7592), [#7594](https://github.com/dubzzz/fast-check/pull/7594), [#7638](https://github.com/dubzzz/fast-check/pull/7638)

### Replace `check` with `assert` and a plugin

```bash npm2yarn
npx @fast-check/codemod@latest v5/checkToAssert path/to/code
```

The `check` runner has been removed. If you only used it to detect and throw on a failure, use `await fc.assert(property, parameters)` instead.

If you need access to `RunDetails`, handle them in a plugin's `onAllRunsComplete` callback:

```diff
-const out = await fc.check(property);
-handleResult(out);
+await fc.assert(property, {
+  noDefaultPlugins: true,
+  plugins: [
+    () => ({
+      onAllRunsComplete(out) {
+        return handleResult(out);
+      },
+    }),
+  ],
+});
```

Here, `handleResult` can return nothing or a `Promise<void>`, and can throw to report a failure. The assertion itself does not return the run details.

Setting `noDefaultPlugins: true` disables the default failure reporter, allowing your callback to decide whether an outcome is acceptable. Omit this option when your callback only observes results and you still want the usual assertion failures. Locally configured and globally installed plugins still run and may throw; use `noGlobalPlugins: true` as well if this particular assessment must exclude globally installed plugins.

Related pull requests: [#7523](https://github.com/dubzzz/fast-check/pull/7523), [#7526](https://github.com/dubzzz/fast-check/pull/7526), [#7533](https://github.com/dubzzz/fast-check/pull/7533)

### Replace `reporter` and `asyncReporter`

```bash npm2yarn
npx @fast-check/codemod@latest v5/runnerPlugins path/to/code
```

The `reporter` and `asyncReporter` parameters have been removed. Both are replaced by a plugin's `onAllRunsComplete` callback, which can be synchronous or asynchronous:

```diff
 await fc.assert(property, {
-  asyncReporter: myReporter,
+  noDefaultPlugins: true,
+  plugins: [() => ({ onAllRunsComplete: myReporter })],
 });
```

The same replacement applies to `reporter`. Keep `noDefaultPlugins: true` when your reporter replaces the default reporting policy, including when it intentionally accepts certain failures. Without this option, the default reporter still runs, even if your reporter returns without throwing.

The plugin hook is available starting in v4.10.0, and `noDefaultPlugins` is available starting in v4.11.0. The `v5/runnerPlugins` codemod can therefore migrate supported reporters while still on v4.11.0, including reporters that accept failures.

All completion callbacks run, even if one throws or rejects. If several callbacks fail, only the first error is reported. Use `afterAll` for cleanup that must run after reporting.

Related pull requests: [#7240](https://github.com/dubzzz/fast-check/pull/7240), [#7324](https://github.com/dubzzz/fast-check/pull/7324), [#7421](https://github.com/dubzzz/fast-check/pull/7421), [#7430](https://github.com/dubzzz/fast-check/pull/7430), [#7523](https://github.com/dubzzz/fast-check/pull/7523)

### Configure default error reporting through its plugin

The `includeErrorInReport` parameter has been removed from runner parameters and global settings. To include the original error in the report message instead of exposing it as the error's cause, configure the `defaultReporter` plugin:

```diff
 await fc.assert(property, {
-  includeErrorInReport: true,
+  noDefaultPlugins: true,
+  plugins: [fc.defaultReporter({ includeErrorInReport: true })],
 });
```

For a global setting, install the configured reporter with `fc.installGlobalPlugin(fc.defaultReporter({ includeErrorInReport: true }))`. The reporter defaults to `false` when the option is omitted.

The exported helpers `defaultReportMessage` and `asyncDefaultReportMessage` have also been removed. If you called them to reproduce fast-check's failure reporting, use `fc.defaultReporter()` instead. If you need a report as a string, format it from the `RunDetails` passed to your own plugin; the built-in message formatter is no longer public.

Related pull requests: [#7328](https://github.com/dubzzz/fast-check/pull/7328), [#7524](https://github.com/dubzzz/fast-check/pull/7524), [#7532](https://github.com/dubzzz/fast-check/pull/7532), [#7539](https://github.com/dubzzz/fast-check/pull/7539), [#7540](https://github.com/dubzzz/fast-check/pull/7540)

### Replace `infiniteStream` with `iterator`

The `infiniteStream` arbitrary has been renamed to `iterator`, and it now produces native iterators. Its default behavior has also changed: it can generate finite iterators, including empty ones, as well as infinite iterators.

To preserve the previous guarantee that generated iterators never end, set `minLength` to `Number.POSITIVE_INFINITY`:

```diff
-fc.infiniteStream(fc.integer());
+fc.iterator(fc.integer(), { minLength: Number.POSITIVE_INFINITY });
```

If your code supports both finite and infinite iterators, use `fc.iterator(fc.integer())`. To generate only finite iterators, use `noDefaultInfinity: true` or an explicit finite `maxLength`:

```ts
fc.iterator(fc.integer(), { maxLength: 100 });
```

The `noHistory` constraint is still available. Generated values expose native iterator helpers, so code relying on fast-check's former `Stream` methods may also need changes; see the advanced usages below.

Related pull requests: [#7323](https://github.com/dubzzz/fast-check/pull/7323), [#7326](https://github.com/dubzzz/fast-check/pull/7326)

### Review time limits on synchronous predicates

In version 5, the `timeout` plugin also reports synchronous predicates as failed when they return after exceeding the limit. Previously, a long synchronous execution could pass despite its timeout.

This does not make synchronous JavaScript interruptible: a timeout cannot stop a blocked event loop or an infinite loop. For asynchronous work, cancellation remains cooperative; use the execution context's `signal` with APIs that support it when you need to cancel the underlying operation.

The `interruptAfterTimeLimit` timer now starts in the plugin's `beforeAll` hook, instead of when its instance is created. Time spent in `beforeAll` hooks registered before it no longer consumes its time budget. Place the interruption plugin before setup hooks if that setup should count toward the limit.

Related pull requests: [#7426](https://github.com/dubzzz/fast-check/pull/7426), [#7571](https://github.com/dubzzz/fast-check/pull/7571), [#7573](https://github.com/dubzzz/fast-check/pull/7573)

## Advanced usages

### Changes on `RunDetails`

If you have implemented a custom reporter, review how you interpret the `failed` and `interrupted` flags:

- An interruption without a property failure is represented by `RunDetailsSuccess`, with `failed: false` and `interrupted: true`. The `RunDetailsFailureInterrupted` type has been removed.
- The `interruptAfterTimeLimit` plugin can still reject the assertion when `failOnInterrupt` is enabled, or when its time limit prevents any successful run. That reporting decision does not change `RunDetails.failed`.
- Too many skipped values now set both `failed` and `interrupted` to `true`, with no counterexample.
- A plugin setup failure, such as a throwing or rejecting `beforeAll`, produces `RunDetailsFailurePluginSetup`. It has `failed: true`, `interrupted: false`, no counterexample, and zero runs, skips, and shrinks. Its `errorInstance` contains the thrown value.

In particular, do not assume that `failed: true` together with `interrupted: false` guarantees a counterexample. Check `counterexamplePath` before handling a result as a predicate failure.

Related pull requests: [#7519](https://github.com/dubzzz/fast-check/pull/7519), [#7521](https://github.com/dubzzz/fast-check/pull/7521), [#7544](https://github.com/dubzzz/fast-check/pull/7544)

### Native iterators instead of `Stream`

The `Stream` class and `stream` helper are no longer exported. In particular, custom implementations of `Arbitrary.shrink` must now return an `IteratorObject<fc.Value<T>>`, backed by a native iterator with iterator helpers.

Common replacements are:

| Previous expression       | Replacement                   |
| ------------------------- | ----------------------------- |
| `fc.Stream.nil<T>()`      | `Iterator.from<T>([])`        |
| `fc.Stream.of(a, b)`      | `Iterator.from([a, b])`       |
| `fc.stream(iterable)`     | `Iterator.from(iterable)`     |
| `new fc.Stream(iterator)` | `Iterator.from(iterator)`     |
| `fc.Stream<fc.Value<T>>`  | `IteratorObject<fc.Value<T>>` |

For example, a shrinker that does not produce any smaller values can be updated as follows:

```diff
-shrink(value: T, context: unknown): fc.Stream<fc.Value<T>> {
-  return fc.Stream.nil();
+shrink(value: T, context: unknown): IteratorObject<fc.Value<T>> {
+  return Iterator.from<fc.Value<T>>([]);
 }
```

Generator functions are another way to produce native iterators. They are useful when replacing operations such as `Stream.join`:

```ts
function* join<T>(...iterators: IteratorObject<T>[]): IteratorObject<T, void> {
  for (const iterator of iterators) {
    yield* iterator;
  }
}
```

Native iterators support helpers such as `map`, `filter`, `flatMap`, `take`, `drop`, and `every`. However, fast-check-specific methods such as `takeWhile`, `dropWhile`, `has`, and `getNthOrLast` are not native iterator helpers. Rewrite those usages with generators or explicit iteration, preserving the behavior your code requires. Native helpers also follow iterator-closing rules, so do not assume a partially consumed iterator can always be resumed after using a helper such as `take`.

Related pull requests: [#7320](https://github.com/dubzzz/fast-check/pull/7320), [#7323](https://github.com/dubzzz/fast-check/pull/7323)

### Fewer methods on `Random`

```bash npm2yarn
npx @fast-check/codemod@latest v5/randomMethods path/to/code
```

If you implement custom arbitraries, the `Random` instance passed to `generate` no longer exposes `next(bits)`, `nextBoolean()`, `nextDouble()`, or the no-argument overload of `nextInt()`.

Use explicit integer bounds instead:

```diff
-mrng.nextBoolean();
+mrng.nextInt(0, 1) === 1;

-mrng.nextInt();
+mrng.nextInt(-2147483648, 2147483647);

-mrng.next(8);
+mrng.nextInt(0, 255);
```

For a fractional value in `[0, 1)`, one possible replacement is `mrng.nextInt(0, 0x1fffffffffffff) / 0x20000000000000`. It need not consume the random generator in the same way as `nextDouble`, so do not expect identical generated sequences.

These replacements are already available in v4. The `nextBigInt(min, max)` method remains available for larger integer ranges.

Related pull requests: [#7305](https://github.com/dubzzz/fast-check/pull/7305), [#7310](https://github.com/dubzzz/fast-check/pull/7310)

### Custom properties and plugins

The previous property interfaces, including `IRawProperty`, `IProperty`, `IAsyncProperty`, `IPropertyWithHooks`, and `IAsyncPropertyWithHooks`, have been replaced by `Property<Ts>`.

Custom properties now expose three methods:

```ts
interface Property<Ts> {
  generate(mrng: fc.Random, runId?: number): fc.Value<Ts>;
  shrink(value: fc.Value<Ts>): IteratorObject<fc.Value<Ts>>;
  run(
    value: Ts,
    executionContext: fc.PredicateExecutionContext,
  ): Promise<fc.PreconditionFailure | fc.PropertyFailure | null> | fc.PreconditionFailure | fc.PropertyFailure | null;
}
```

The `isAsync`, `runBeforeEach`, and `runAfterEach` methods are no longer part of the interface. Move lifecycle behavior into plugins. Hook-specific types, such as `PropertyHookFunction`, `AsyncPropertyHookFunction`, `GlobalPropertyHookFunction`, and `GlobalAsyncPropertyHookFunction`, have also been removed.

For plugins introduced in v4.10.0, update `decorateRun` wrappers to forward both the generated value and the new execution context:

```ts
const passThrough: fc.Plugin<unknown> = () => ({
  decorateRun: (nestedRun) => (value, executionContext) => nestedRun(value, executionContext),
});
```

The `decorateGenerate` hook remains available for generation changes. Completion hooks can now return a promise even when the predicate is synchronous; the v4 restriction requiring synchronous completion for synchronous properties no longer applies.

A property's `run` method may return a result directly or a promise, so custom runners and decorators must handle both. Decorators must preserve the contract that `run` reports failures as results rather than throwing or rejecting. If a plugin adds information to the execution context, pass a modified copy to the nested runner instead of mutating the original context.

Custom runners must also call plugin `beforeAll` hooks and await their completion before executing the property. In particular, `interruptAfterTimeLimit` now requires this initialization; invoking its decorated runner or completion hook without it reports an initialization error. The built-in `assert`, `sample`, and `statistics` runners handle this lifecycle automatically.

Related pull requests: [#7296](https://github.com/dubzzz/fast-check/pull/7296), [#7312](https://github.com/dubzzz/fast-check/pull/7312), [#7315](https://github.com/dubzzz/fast-check/pull/7315), [#7386](https://github.com/dubzzz/fast-check/pull/7386), [#7422](https://github.com/dubzzz/fast-check/pull/7422), [#7571](https://github.com/dubzzz/fast-check/pull/7571)

### Changes on `scheduler`

The `done` and `faulty` fields returned by `scheduleSequence` are now read-only. Read them to observe progress, or await the returned `task`; do not assign to them.

Scheduler clones have also been corrected to run tasks in the same order. Tests that depended on different ordering between clones may produce different results after the upgrade.

Related pull requests: [#7401](https://github.com/dubzzz/fast-check/pull/7401), [#7431](https://github.com/dubzzz/fast-check/pull/7431)

### Changes on global built-ins and invalid inputs

Version 5 removes many of the captured references that previously protected fast-check from changes to JavaScript built-ins. If your tests replace built-ins or their prototype methods while fast-check is running, restore them or isolate those tests. This change does not remove every captured reference: time-limit plugins still capture the timer functions they need for compatibility with fake timers.

Several defensive checks for unsupported inputs have also been removed. Pass valid arbitraries and constraints instead of relying on the exact error produced by an invalid call. The legacy `num_runs` spelling is no longer read; use `numRuns`.

Related pull requests: [#7284](https://github.com/dubzzz/fast-check/pull/7284), [#7285](https://github.com/dubzzz/fast-check/pull/7285), [#7287](https://github.com/dubzzz/fast-check/pull/7287), [#7290](https://github.com/dubzzz/fast-check/pull/7290), [#7291](https://github.com/dubzzz/fast-check/pull/7291), [#7308](https://github.com/dubzzz/fast-check/pull/7308), [#7316](https://github.com/dubzzz/fast-check/pull/7316), [#7318](https://github.com/dubzzz/fast-check/pull/7318), [#7319](https://github.com/dubzzz/fast-check/pull/7319)

### Replaying failures across the upgrade

Generation and shrinking can change across a major release. In particular, arrays and arbitraries derived from them now participate in depth constraints, and fixes to `stringMatching` and scheduler cloning can change generated cases or their execution order.

Do not rely on an old seed and counterexample path producing the same case after upgrading. Reproduce outstanding failures on the original version, and preserve useful counterexamples as explicit regression cases before migrating.

Related pull requests: [#7184](https://github.com/dubzzz/fast-check/pull/7184), [#7397](https://github.com/dubzzz/fast-check/pull/7397), [#7398](https://github.com/dubzzz/fast-check/pull/7398), [#7431](https://github.com/dubzzz/fast-check/pull/7431)

## Optional cleanup after upgrading to v5

The following cleanup is not required to adopt v5. You can complete it later, independently of the major-version upgrade.

### One `property` for synchronous and asynchronous predicates

```bash npm2yarn
npx @fast-check/codemod@latest v6/asyncPropertyToProperty path/to/code
```

Version 5 unifies synchronous and asynchronous properties. The `asyncProperty` builder remains available as a deprecated alias of `property`, which now accepts either kind of predicate. You can keep `asyncProperty` during the upgrade and rename it afterwards:

```diff
 await fc.assert(
-  fc.asyncProperty(fc.string(), async (value) => {
+  fc.property(fc.string(), async (value) => {
     await checkValue(value);
   }),
 );
```

Existing synchronous predicates can continue to use `fc.property`. The `v6/asyncPropertyToProperty` codemod performs this rename and can be applied as soon as you use v5, despite its `v6` prefix.

Related pull requests: [#7303](https://github.com/dubzzz/fast-check/pull/7303), [#7643](https://github.com/dubzzz/fast-check/pull/7643)
