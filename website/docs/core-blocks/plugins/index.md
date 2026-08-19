---
sidebar_position: 4
slug: /core-blocks/plugins/
description: Extend the default execution flow provided by runners to meet your needs.
---

# Plugins

Plugins provide a way to extend and refine the runtime and execution behavior of your properties. In the same way building custom arbitraries gives you the flexibility to tweak the generation flows, plugins gives you ways to customize how your properties run.

Plugins are designed to support things such as:

- Executing something before the predicate
- Stopping a predicate running for too long
- Capturing key insights about the execution flows including timings for observability

## Using plugins

Plugins can be passed as part of the customizations accepted by the `fc.assert` runner.

```ts
await fc.assert(fc.asyncProperty(...arbs, predicate), {
  plugins: [pluginA(...paramsForPluginA), pluginB(...paramsForPluginB)],
});
```

## Installing plugins globally

Plugins needed by all your properties can be installed once, typically in a [setup file](/docs/configuration/global-settings/#integration-with-test-frameworks), with `installGlobalPlugin`.

```ts
fc.installGlobalPlugin(pluginA());
```

Installed plugins run before the ones passed to the runner, so the snippet above followed by `fc.assert(myProp, { plugins: [pluginB()] })` is equivalent to `plugins: [pluginA(), pluginB()]`.

## Combining plugins

Plugins wrap every execution of the predicate and the declaration order defines the nesting: the first declared plugin is the outermost wrapper, each subsequent one sits a bit closer to the predicate.

Let's illustrate it on a property checking a search endpoint, with the database brought back to a clean state before each run:

```ts
await fc.assert(
  fc.asyncProperty(fc.string(), async (query) => {
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

For each execution of the predicate:

1. the 10-second `timeout` starts first: it wraps everything declared after it — the database reset, the 5-second `timeout` and the predicate,
2. the `beforeEach` hook then resets the database,
3. the 5-second `timeout` starts last, right before the predicate: it only wraps the predicate.

As a consequence, a run fails as soon as a single call to the search endpoint takes more than 5 seconds, or when the database reset and the call together take more than 10 seconds. Order matters: moving `timeout(5_000)` before the `beforeEach` would make the reset count against the 5-second budget too, and the 10-second limit could then never fire.

## The plugins

We come up with a set of plugins to extend the library using built-in plugins. The following pages provide extended details and deep dive into each of them.

```mdx-code-block
import DocCardList from '@theme/DocCardList';

<DocCardList />
```
