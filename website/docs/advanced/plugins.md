---
slug: /advanced/plugins/
---

# Plugins

Extend execution flow to meet your needs

## Overview

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
