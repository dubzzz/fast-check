---
slug: /core-blocks/plugins/life-cycle/
---

# Life-Cycle hooks

## `beforeEach`

The `beforeEach` plugin is providing users with a way to run code right before the execution of the predicate function.

It expects to receive a function either `void` or `Promise<void>`. Any other returned value may lead to unexpected behavior and is subject to change between versions.

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

We will first run #1 then #2. If #1 fails, #2 will never get executed and the predicate neither.

Also note that `beforeEach` hooks have been designed in a way to properly integrate themselves with other plugins. As such, in the hypothesis of a plugin called `retryOnFailure(count)`, declaring plugins as follow:

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

May result into hook #2 being executed more often than #1. Hook #2 will be re-executed for every retry, while #1 will wrap all the retries.
