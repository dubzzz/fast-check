---
slug: /core-blocks/plugins/life-cycle/
---

# Life-cycle

Life-cycle plugins provide hooks to prepare or clean up things for your predicates. They wrap every execution of the predicate including the ones linked to shrinking.

## `beforeEach`

The `beforeEach` plugin lets you run code right before the execution of your predicate.

It expects to receive a function returning either `void`, `Promise<void>`, `TeardownFunction` or `Promise<TeardownFunction>` with `TeardownFunction` being a function returning either `void` or `Promise<void>`. Any other returned value may lead to unexpected behavior and is subject to change between versions.

A teardown function acts as a clean-up for the `beforeEach`. It will be invoked once the `predicate` status is known either success or failure.

The hooks will execute in the order they get declared. Teardown functions will interleave with `afterEach` functions and will be called in reverse order. As such if you declare:

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
    fc.beforeEach(() => {
      probes.push('beforeEach #1');
      return () => {
        probes.push('teardown for beforeEach #1');
      };
    }),
    fc.beforeEach(() => {
      probes.push('beforeEach #2');
      return () => {
        probes.push('teardown for beforeEach #2');
      };
    }),
    fc.afterEach(() => {
      probes.push('afterEach #3');
    }),
    fc.afterEach(() => {
      probes.push('afterEach #4');
    }),
    fc.beforeEach(() => {
      probes.push('beforeEach #5');
      return () => {
        probes.push('teardown for beforeEach #5');
      };
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
teardown for beforeEach #5
afterEach #4
afterEach #3
teardown for beforeEach #2
teardown for beforeEach #1
```

Like any built-in plugin, life-cycle plugins compose with the plugins declared next to them. As such, in the hypothesis of a plugin named `retryOnFailure(count)`, declaring plugins as follows:

```ts
{
  plugins: [
    beforeEach(() => {
      console.log('beforeEach #1');
      return () => {
        probes.push('teardown for beforeEach #1');
      };
    }),
    retryOnFailure(2),
    beforeEach(() => {
      console.log('beforeEach #2');
      return () => {
        probes.push('teardown for beforeEach #2');
      };
    }),
  ];
}
```

May result in the following logs at execution time:

```txt
beforeEach #1 <-- runs once, it wraps all the attempts
beforeEach #2 <-- the first attempt
predicate     <-- considering it fails at first attempt...
teardown for beforeEach #2
beforeEach #2 <-- ...`retryOnFailure` launches a second attempt
predicate
teardown for beforeEach #2
teardown for beforeEach #1
```
