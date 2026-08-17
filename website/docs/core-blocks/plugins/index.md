---
sidebar_position: 4
slug: /core-blocks/plugins/
description: Extend the default execution flow provided by runners to meet your needs.
---

# Plugins

Plugins provide a way to extend and refine the runtime and execution behavior of your properties. The same way building custom arbitraries gives you the flexibility to tweak the generation flows, the plugins will give you ways to customize the way your properties will run.

Plugins have been designed in a way to be capable of supporting things such as:

- Executing something before the predicate
- Cutting predicate running for too long
- Capturing key insights about the execution flows including timings for observability

## Using plugins

Plugins can just be passed as part of the customizations accepted by the `fc.assert` runner.

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

## The plugins

We come up with a set of plugins to extend the library using built-ins plugins. The following pages provide extended details and deep dive into each of them.

```mdx-code-block
import DocCardList from '@theme/DocCardList';

<DocCardList />
```
