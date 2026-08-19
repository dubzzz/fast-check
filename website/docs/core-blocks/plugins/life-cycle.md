---
slug: /core-blocks/plugins/life-cycle/
---

# Life-cycle

Life-cycle plugins provide hooks to prepare or clean up things for your predicates. They wrap every execution of the predicate including the ones linked to shrinking.

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

Resources: [API reference](/docs/api/functions/beforeEach).

## `afterEach`

The `afterEach` plugin is the mirror of `beforeEach`. It lets you run code right after the execution of your predicate.

Similarly to `beforeEach`, it expects to receive a function returning either `void` or `Promise<void>`. Any other returned value may lead to unexpected behavior.

Contrary to `beforeEach`, `afterEach` will always be executed no matter the execution status of other hooks. As such if one `beforeEach` or one `afterEach` rejects other `afterEach` will still be executed.

Resources: [API reference](/docs/api/functions/afterEach).

## Execution flow

Life-cycle plugins run in the same order as they got declared for before tasks and in reverse order for after tasks. As such the following ordering of plugins:

```ts
{
  plugins: [
    beforeEach(() => {
      console.log('beforeEach #1');
    }),
    beforeEach(() => {
      console.log('beforeEach #2');
    }),
    afterEach(() => {
      console.log('afterEach #3');
    }),
    afterEach(() => {
      console.log('afterEach #4');
    }),
    beforeEach(() => {
      console.log('beforeEach #5');
    }),
  ];
}
```

Would result, for each run, into:

```txt
beforeEach #1
beforeEach #2
beforeEach #5
predicate
afterEach #4
afterEach #3
```

Like any built-in plugin, life-cycle plugins compose with the plugins declared next to them. As such, in the hypothesis of a plugin named `retryOnFailure(count)`, declaring plugins as follows:

```ts
{
  plugins: [
    beforeEach(() => {
      console.log('beforeEach #1');
    }),
    retryOnFailure(2),
    beforeEach(() => {
      console.log('beforeEach #2');
    }),
  ];
}
```

May result in the following logs at execution time:

```txt
beforeEach #1 <-- runs once, it wraps all the attempts
beforeEach #2 <-- the first attempt
predicate     <-- considering it fails at first attempt...
beforeEach #2 <-- ...`retryOnFailure` launches a second attempt
predicate
```
