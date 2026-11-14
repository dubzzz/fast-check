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

### Replace default imports

The default export has been removed in version 5. Replace default imports with namespace imports:

```diff
-import fc from 'fast-check';
+import * as fc from 'fast-check';
```

Named imports, such as `import { integer } from 'fast-check'`, remain supported.

Related pull requests: [#7261](https://github.com/dubzzz/fast-check/pull/7261), [#7307](https://github.com/dubzzz/fast-check/pull/7307)

### Replace property hooks with plugins

The `.beforeEach` and `.afterEach` methods on properties have been removed. Since version 4.10.0, the corresponding plugins can be passed to the runner instead:

```diff
 await fc.assert(
-  fc.property(fc.integer(), predicate).beforeEach(setUp).afterEach(tearDown),
+  fc.property(fc.integer(), predicate),
+  { plugins: [fc.beforeEach(setUp), fc.afterEach(tearDown)] },
 );
```

Both plugins support synchronous and asynchronous callbacks. While still using v4, keep using `fc.asyncProperty` when your predicate or hooks are asynchronous. The change from `asyncProperty` to `property` is described in the next section.

Callbacks should return nothing or a promise resolving to nothing. A `beforeEach` callback can also return a teardown function, which runs after the predicate. Remove any other accidental return values from your existing hooks.

Plugin callbacks do not receive the previous hook as an argument. If your existing callback calls `previousBeforeEach` or `previousAfterEach`, register the hooks as separate plugins instead. Before hooks execute in array order, while after hooks and teardown functions execute in reverse order.

The global parameters `beforeEach`, `afterEach`, `asyncBeforeEach`, and `asyncAfterEach` have also been removed. Use globally installed plugins instead:

```diff
-fc.configureGlobal({ beforeEach: setUp, afterEach: tearDown });
+fc.installGlobalPlugin(fc.beforeEach(setUp));
+fc.installGlobalPlugin(fc.afterEach(tearDown));
```

The same plugins replace `asyncBeforeEach` and `asyncAfterEach`; pass your asynchronous callbacks to them. Keep other global settings, such as `numRuns`, in `fc.configureGlobal`.

Related pull requests: [#7224](https://github.com/dubzzz/fast-check/pull/7224), [#7227](https://github.com/dubzzz/fast-check/pull/7227), [#7232](https://github.com/dubzzz/fast-check/pull/7232), [#7315](https://github.com/dubzzz/fast-check/pull/7315), [#7386](https://github.com/dubzzz/fast-check/pull/7386)

### Replace runner parameters with plugins

Several runner parameters have been removed in favor of plugins introduced in version 4.10.0:

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

For `sample` and `statistics`, plugins are not applied. To replace `unbiased: true` there, wrap the arbitrary with `fc.noBias`, for example `fc.sample(fc.noBias(arbitrary), { numRuns: 10 })`.

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

Install global plugins once during test setup. `fc.resetConfigureGlobal()` resets parameters, but it does not uninstall plugins. In v5, `noGlobalPlugins: true` lets a particular assertion skip all globally installed plugins; register any plugins you still need locally.

:::

Related pull requests: [#7222](https://github.com/dubzzz/fast-check/pull/7222), [#7237](https://github.com/dubzzz/fast-check/pull/7237), [#7260](https://github.com/dubzzz/fast-check/pull/7260), [#7332](https://github.com/dubzzz/fast-check/pull/7332), [#7340](https://github.com/dubzzz/fast-check/pull/7340), [#7358](https://github.com/dubzzz/fast-check/pull/7358), [#7377](https://github.com/dubzzz/fast-check/pull/7377), [#7533](https://github.com/dubzzz/fast-check/pull/7533)

### Changes on Unicode string options

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

### One `property` for synchronous and asynchronous predicates

Version 5 unifies synchronous and asynchronous properties. The `asyncProperty` builder has been removed, and `property` now accepts either kind of predicate:

```diff
 await fc.assert(
-  fc.asyncProperty(fc.string(), async (value) => {
+  fc.property(fc.string(), async (value) => {
     await checkValue(value);
   }),
 );
```

Existing synchronous predicates can continue to use `fc.property`.

The predicate now receives a `PredicateExecutionContext` after the generated values. Ordinary callbacks declaring only the generated arguments do not need to change. If your predicate forwards `arguments` or collects all arguments with a rest parameter, make sure it does not treat this final context as another generated value.

The context can contain a `signal` supplied by plugins such as `timeout` and `interruptAfterTimeLimit`, allowing asynchronous work to cooperate with cancellation.

Related pull requests: [#7303](https://github.com/dubzzz/fast-check/pull/7303), [#7412](https://github.com/dubzzz/fast-check/pull/7412), [#7422](https://github.com/dubzzz/fast-check/pull/7422), [#7426](https://github.com/dubzzz/fast-check/pull/7426), [#7427](https://github.com/dubzzz/fast-check/pull/7427)

### Always await `assert`

The `assert` runner now returns a `Promise<void>` for all properties, including those with synchronous predicates. Make the surrounding test asynchronous and await the assertion, or return its promise to your test runner:

```diff
-it('checks the property', () => {
-  fc.assert(fc.property(fc.integer(), predicate));
+it('checks the property', async () => {
+  await fc.assert(fc.property(fc.integer(), predicate));
 });
```

If you test failures of `assert` itself, update synchronous throw expectations to handle asynchronous failures:

```diff
-expect(() => fc.assert(property)).toThrow();
+await expect(async () => await fc.assert(property)).rejects.toThrow();
```

Awaiting the assertion is also required to wait for asynchronous reporting and cleanup. Internally, fast-check may execute synchronous predicates and hooks without yielding between them, so do not rely on incidental microtasks between runs to flush unrelated work. Await that work explicitly in the predicate or a hook.

Related pull requests: [#7296](https://github.com/dubzzz/fast-check/pull/7296), [#7303](https://github.com/dubzzz/fast-check/pull/7303), [#7388](https://github.com/dubzzz/fast-check/pull/7388), [#7489](https://github.com/dubzzz/fast-check/pull/7489)

### Replace `check` with `assert` and a plugin

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

The `reporter` and `asyncReporter` parameters have been removed. Both are replaced by a plugin's `onAllRunsComplete` callback, which can be synchronous or asynchronous:

```diff
 await fc.assert(property, {
-  asyncReporter: myReporter,
+  noDefaultPlugins: true,
+  plugins: [() => ({ onAllRunsComplete: myReporter })],
 });
```

The same replacement applies to `reporter`. Keep `noDefaultPlugins: true` when your reporter replaces the default reporting policy, including when it intentionally accepts certain failures. Without this option, the default reporter still runs, even if your reporter returns without throwing.

The plugin hook is available starting in v4.10.0, so reporters that throw on failure can start using it before the upgrade. The `noDefaultPlugins` option is only available in v5.

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

Related pull requests: [#7426](https://github.com/dubzzz/fast-check/pull/7426), [#7573](https://github.com/dubzzz/fast-check/pull/7573)

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

Related pull requests: [#7296](https://github.com/dubzzz/fast-check/pull/7296), [#7312](https://github.com/dubzzz/fast-check/pull/7312), [#7315](https://github.com/dubzzz/fast-check/pull/7315), [#7386](https://github.com/dubzzz/fast-check/pull/7386), [#7422](https://github.com/dubzzz/fast-check/pull/7422)

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
