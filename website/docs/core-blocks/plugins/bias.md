---
slug: /core-blocks/plugins/bias/
---

# Bias

Bias plugins customize how generation targets values.

## `unbiased`

The `unbiased` plugin generates the values feeding your predicates without any bias.

```ts
{
  plugins: [
    unbiased(), // draw all values from the full range of the arbitraries
  ];
}
```

By default, generation is biased: some runs target smaller or more extreme values to uncover common issues earlier. With the plugin declared, all the runs draw from the full range of the arbitraries with no special treatment.

For plugin authors: the plugin relies on the `decorateGenerate` hook offered to plugins to drop the run identifier normally responsible for the bias.

Resources: [API reference](/docs/api/functions/unbiasedPlugin).
