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
// equivalent to: fc.installGlobalPlugin(pluginA(), 'pre');
```

By default, any installed plugin is flagged as pre-installed. As such, it runs before the ones passed to the runner and the default ones, so the snippet above followed by `fc.assert(myProp, { plugins: [pluginB()] })` results in the plugin order `[pluginA(), pluginB(), ...defaults]`. You can also pass `'pre'` explicitly as the second argument to make the position clearer.

But globally installed plugins can also be post-installed by passing `'post'`:

```ts
fc.installGlobalPlugin(pluginC(), 'post');
```

With both installations above, `fc.assert(myProp, { plugins: [pluginB()] })` results in the plugin order `[pluginA(), pluginB(), pluginC(), ...defaults]`.

The resulting order is:

1. Global plugins installed with `'pre'` (the default)
2. Plugins passed to the runner through `plugins`
3. Global plugins installed with `'post'`
4. Default plugins

Within each global position, plugins keep their installation order, even when calls installing `'pre'` and `'post'` plugins are interleaved.

To skip globally installed plugins for one assertion, set `noGlobalPlugins: true`:

```ts
await fc.assert(myProp, {
  noGlobalPlugins: true,
  plugins: [pluginB()],
});
```

Global plugins at both positions are not instantiated for this assertion. Plugins passed through `plugins` and default ones still apply. The installed plugins remain available to other assertions.

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

## The plugins

We come up with a set of plugins to extend the library using built-in plugins. The following pages provide extended details and deep dive into each of them.

```mdx-code-block
import DocCardList from '@theme/DocCardList';

<DocCardList />
```
