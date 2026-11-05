---
sidebar_position: 4
slug: /core-blocks/plugins/
description: Extend the default execution flow provided by runners to meet your needs.
---

# Plugins

Plugins provide a way to extend and refine the runtime and execution behavior of your properties. In the same way building custom arbitraries gives you the flexibility to tweak generation flows, plugins give you ways to customize how your properties run.

Plugins are designed to support things such as:

- Executing something before the predicate
- Stopping a predicate running for too long
- Capturing key insights about the execution flows including timings for observability

## Using plugins

Plugins can be passed as part of the customizations accepted by the `fc.assert` runner.

```ts
await fc.assert(fc.property(...arbs, predicate), {
  plugins: [pluginA(...paramsForPluginA), pluginB(...paramsForPluginB)],
});
```

## Installing plugins globally

Plugins needed by all your properties can be installed once, typically in a [setup file](/docs/configuration/global-settings/#integration-with-test-frameworks), with `installGlobalPlugin`.

```ts
fc.installGlobalPlugin(pluginA());
```

Installed plugins run before the ones passed to the runner, so the snippet above followed by `fc.assert(myProp, { plugins: [pluginB()] })` is equivalent to `plugins: [pluginA(), pluginB()]`.

To skip globally installed plugins for one assertion, set `noGlobalPlugins: true`:

```ts
await fc.assert(myProp, {
  noGlobalPlugins: true,
  plugins: [pluginB()],
});
```

Global plugins are not instantiated for this assertion. Plugins passed through `plugins` and default ones still apply. The installed plugins remain available to other assertions.

`noGlobalPlugins` and `noDefaultPlugins` are independent. Set both to `true` to run only the plugins explicitly passed through `plugins`. Passing `plugins: []` alone does not disable globally installed plugins or default plugins.

## Combining plugins

Plugins have been designed to be combined together. When multiple plugins get defined for the same assertion, they execute in declaration order. The first plugin runs first and wraps the execution of the second one until we reach the main operation. Plugins can wrap various stages of the flow, including the execution of the predicate function.

Let's illustrate how plugins get combined on a property checking a search endpoint. In this example, the database is brought back to a clean state before each run:

```ts
await fc.assert(
  fc.property(fc.string(), async (query) => {
    const results = await searchService.search(query);
    // ...assertions on the results...
  }),
  {
    plugins: [
      timeout(10_000),
      beforeEach(async () => {
        await database.reset(); // bring back a clean state, possibly slow
      }),
      timeout(5_000),
    ],
  },
);
```

The plugin setup above makes use of two instances of the `timeout` plugin. The first instance is responsible for making sure that the time taken by the `beforeEach` cleanup plus the one taken by the predicate never exceeds 10 seconds. The second one only wraps the predicate and makes sure that it won't take more than 5 seconds.

This short example clearly highlights why the declaration order of plugins is crucial. Two different orders may result in totally different expectations. Correctly ordering them will make you capable of finely configuring your flows to fit your needs.

## Setting up and cleaning up custom plugins

A custom plugin can define `beforeAll` to prepare resources once per assertion and `afterAll` to release them after the full assessment, including shrinking:

```ts
const databasePlugin: fc.UniversalPlugin = () => ({
  beforeAll: async () => {
    await database.connect();
  },
  afterAll: async () => {
    await database.disconnect();
  },
});

await fc.assert(myProp, { plugins: [databasePlugin] });
```

All plugins are instantiated first. Their `beforeAll` hooks then run in declaration order, before generator or predicate decorators are applied. Each hook finishes before the next starts, including when synchronous and asynchronous hooks are mixed. Setup runs even when `numRuns` is zero.

If a `beforeAll` throws or rejects, the remaining setup hooks, property assessment and `onAllRunsComplete` hooks are skipped. All `afterAll` hooks still run in reverse declaration order, including those belonging to plugins whose setup was skipped. Cleanup should therefore tolerate incomplete setup. The assertion rejects with the original setup error, even if cleanup also fails.

## The plugins

We come up with a set of plugins to extend the library using built-in plugins. The following pages provide extended details and deep dive into each of them.

```mdx-code-block
import DocCardList from '@theme/DocCardList';

<DocCardList />
```
