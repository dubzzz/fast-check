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

As predicates cannot be stopped, whenever a timeout occurs the underlying execution keeps running in the background but its outcome gets ignored. Note also that the plugin can only be useful for asynchronous properties: a synchronous predicate can never be observed timing out as it already came to an end when the runner gets its outcome back.

Resources: [API reference](/docs/api/functions/timeoutPlugin).
