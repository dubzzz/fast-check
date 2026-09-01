---
slug: /core-blocks/plugins/timeout/
---

# Timeout

The timeout plugin stops predicates running for too long.

## `timeout`

The `timeout` plugin marks the current execution of your predicate as failed if it did not complete within the requested delay expressed in milliseconds.

```ts
{
  plugins: [
    timeout(1000), // fail any execution of the predicate taking more than 1 second
  ];
}
```

:::warning[Predicates can't be stopped]
As predicates cannot be stopped, whenever a timeout occurs the underlying execution keeps running in the background but its outcome gets ignored.
:::

:::warning[Synchronous predicates can't be interrupted]
The plugin has no impact on purely synchronous predicates. It cannot stop them, so timeout cannot interrupt them.
:::

Resources: [API reference](/docs/api/functions/timeout).
