---
slug: /core-blocks/plugins/values/
---

# Values

Value plugins customize which values get forwarded to your predicates. Bias plugins customize how generation targets values, while equal-values plugins avoid executing your predicates twice on the same value.

Equal-values plugins keep track of the values already covered during the run and replay the outcome of the first execution whenever a value gets generated again. Values are compared based on their stringified representation.

## `unbiased`

The `unbiased` plugin generates the values feeding your predicates without any bias.

```ts
{
  plugins: [
    unbiased(), // draw all values from the full range of the arbitraries
  ];
}
```

Without this plugin, generation is biased by default. Compared with a uniform distribution, smaller or more extreme values are more likely to be generated, helping uncover common issues earlier. For example, with `fc.integer()`, small values such as `1` and `2` are more likely to be generated than `171414468`.

With this plugin enabled, every run draws from the full range of the arbitraries with no special treatment. For `fc.integer()`, `171414468` is then just as likely to be generated as `1` or `2`.

Resources: [API reference](/docs/api/functions/unbiased).

## `ignoreEqualValues`

The `ignoreEqualValues` plugin discards runs on already covered cases.

```ts
{
  plugins: [
    ignoreEqualValues(), // never execute the predicate twice on the same value
  ];
}
```

Discarded runs still count as runs: a run replaying a past success stays a success.

Resources: [API reference](/docs/api/functions/ignoreEqualValues).

## `skipEqualValues`

The `skipEqualValues` plugin skips runs on already covered cases.

```ts
{
  plugins: [
    skipEqualValues(), // never execute the predicate twice on the same value
  ];
}
```

Contrary to `ignoreEqualValues`, a run replaying a past success gets marked as skipped instead of successful: passed the maximal number of allowed skips the run will be marked as failed. It gives stronger guarantees on the number of distinct values covered by the run at the price of potentially failing on arbitraries unable to produce enough distinct values.

Resources: [API reference](/docs/api/functions/skipEqualValues).
