---
slug: /core-blocks/plugins/writing-plugins/
sidebar_position: 10
---

# Writing plugins

A plugin is a factory called once per runner invocation. It returns hooks that can prepare resources, wrap generation or predicate execution, report results and clean up. Keep state inside the factory so separate calls to `assert`, `sample` or `statistics` do not share it accidentally.

## Lifecycle

Plugins are instantiated in [plugin order](/docs/core-blocks/plugins/#installing-plugins-globally), with their index and a shared `PluginStore`. Use symbol keys in the store to exchange values between plugins participating in the same runner invocation.

| Hook                | When it runs                                                              | Ordering                        |
| ------------------- | ------------------------------------------------------------------------- | ------------------------------- |
| `beforeAll`         | Once, before generation or predicate execution                            | Plugin order                    |
| `decorateGenerate`  | Builds a wrapper around generation                                        | Earlier plugins wrap later ones |
| `decorateRun`       | Builds a wrapper called for each predicate execution, including shrinking | Earlier plugins wrap later ones |
| `onAllRunsComplete` | Once, with the final `RunDetails`                                         | Plugin order                    |
| `afterAll`          | Once, after all completion callbacks                                      | Reverse plugin order            |

All hooks are optional. `beforeAll`, `onAllRunsComplete` and `afterAll` may return a promise; the runner waits for them.

If a `beforeAll` callback throws or rejects, the other preparation callbacks still run. The predicate is not executed, and completion callbacks receive a plugin setup failure. Completion and cleanup callbacks still run for the instantiated plugins, including the one whose preparation failed. Make cleanup safe when preparation did not finish.

For example, suppose your application provides `prepareFixture()`, which prepares a test environment and returns an object with a `dispose()` method:

```js
const withFixture = () => {
  let fixture;
  return {
    async beforeAll() {
      fixture = await prepareFixture();
    },
    async afterAll() {
      await fixture?.dispose();
    },
  };
};

await fc.assert(property, { plugins: [withFixture] });
```

This prepares the fixture once for the entire assertion. To reset state before every execution of the predicate, including shrinking, use the [`beforeEach` plugin](/docs/core-blocks/plugins/life-cycle/#beforeeach).

## Wrapping execution

A `decorateRun` wrapper receives both the generated value and the execution context. Forward both to the nested run so cancellation signals and context supplied by other plugins reach the predicate:

```js
const forwardRun = () => ({
  decorateRun: (nestedRun) => (value, executionContext) => nestedRun(value, executionContext),
});
```

The nested run can return a result directly or a promise of a result. Preserve that contract; an `async` wrapper introduces an asynchronous step even for a synchronous predicate. The wrappers returned by `decorateRun` and `decorateGenerate` must not throw. A run reports a predicate failure through its return value, as described by [`Property.run`](/docs/api/interfaces/Property).

To supply extra execution-context fields, forward a modified copy rather than mutating the received object. TypeScript users can declare optional fields with module augmentation; see [`PredicateExecutionContext`](/docs/api/interfaces/PredicateExecutionContext).

## Reporting and cleanup

Throw or reject from `onAllRunsComplete` to report an error. All completion callbacks still run, followed by all cleanup callbacks. If several completion or cleanup callbacks fail, the first error is the one reported to the caller.

The default reporter is a plugin too. Returning normally from a custom reporter leaves default failure reporting enabled. Set `noDefaultPlugins: true` to take responsibility for reporting outcomes yourself; this does not disable errors reported by other plugins. See [custom reports](/docs/configuration/custom-reports/) for complete examples.

Use `afterAll` for resource cleanup so it also runs after a reporter throws. A `beforeAll` setup failure is represented in `RunDetails`; a completion or cleanup error rejects the runner without rewriting those details.

For TypeScript, use `Plugin<Ts>` when the plugin targets a particular generated value type, or `UniversalPlugin` when it works for any property. The full contracts are documented in [`Plugin`](/docs/api/type-aliases/Plugin) and [`PluginInstance`](/docs/api/type-aliases/PluginInstance).
