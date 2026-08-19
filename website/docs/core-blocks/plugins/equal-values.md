---
slug: /core-blocks/plugins/equal-values/
---

# Equal values

Equal-values plugins avoid executing your predicates twice on the same value.

Both plugins keep track of the values already covered during the run and replay the outcome of the first execution whenever a value gets generated again. Values are compared based on their stringified representation.

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

Resources: [API reference for `ignoreEqualValues`](/docs/api/functions/ignoreEqualValues), [API reference for `skipEqualValues`](/docs/api/functions/skipEqualValues).
