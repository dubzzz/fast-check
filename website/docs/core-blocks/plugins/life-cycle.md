---
slug: /core-blocks/plugins/life-cycle/
---

# Life-cycle

Life-cycle plugins provide hooks to prepare or clean up things for your predicates.

## `beforeEach`

The `beforeEach` plugin lets you run code right before the execution of your predicate.

It expects to receive a function returning either `void` or `Promise<void>`. Any other returned value may lead to unexpected behavior and is subject to change between versions.

The hooks will execute in the order they get declared. As such if you declare:

```ts
{
  plugins: [
    beforeEach(() => {
      // beforeEach hook #1
    }),
    beforeEach(() => {
      // beforeEach hook #2
    }),
  ];
}
```

We will first run #1 then #2. If #1 fails, #2 will never get executed and neither will the predicate.

Also note that `beforeEach` hooks integrate themselves with other plugins. As such, in the hypothesis of a plugin named `retryOnFailure(count)`, declaring plugins as follows:

```ts
{
  plugins: [
    beforeEach(() => {
      // beforeEach hook #1
    }),
    retryOnFailure(2),
    beforeEach(() => {
      // beforeEach hook #2
    }),
  ];
}
```

May result in hook #2 being executed more often than #1. Hook #2 will be re-executed for every retry, while #1 will wrap all the retries.

Resources: [API reference](/docs/api/functions/beforeEachPlugin).
