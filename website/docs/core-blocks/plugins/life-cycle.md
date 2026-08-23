---
slug: /core-blocks/plugins/life-cycle/
---

# Life-cycle

Life-cycle plugins provide hooks to prepare or clean up things for your predicates. They wrap every execution of the predicate including the ones linked to shrinking.

## `beforeEach`

The `beforeEach` plugin lets you run code right before the execution of your predicate.

It expects to receive a function returning either nothing or a teardown function in a synchronous or asynchronous fashion. Any other returned value may lead to unexpected behavior and is subject to change between versions.

When returning a teardown function, it will be used as a clean-up function running right after the execution of the predicate, no matter its status.

Simple example involving two synchronous `beforeEach` without any teardown function being declared:

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

Example featuring all the possible variants with teardown or not and synchronous or not:

```ts
{
  plugins: [
    // synchronous beforeEach
    beforeEach(() => {
      // ...
    }),
    // synchronous beforeEach with synchronous teardown
    beforeEach(() => {
      // ...
      return () => {
        // ...
      };
    }),
    // synchronous beforeEach with asynchronous teardown
    beforeEach(() => {
      // ...
      return async () => {
        // ...
      };
    }),
    // asynchronous beforeEach
    beforeEach(async () => {
      // ...
    }),
    // asynchronous beforeEach with synchronous teardown
    beforeEach(async () => {
      // ...
      return () => {
        // ...
      };
    }),
    // asynchronous beforeEach with asynchronous teardown
    beforeEach(async () => {
      // ...
      return async () => {
        // ...
      };
    }),
  ];
}
```

All these variants could be used together. They have the same ordering priorities.

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

They run in an exclusive fashion. As such a beforeEach, a teardown or an afterEach will wait for the currently running one to end before starting. Same they don't run while the predicate is under way. They wait for it to come back with an execution status.

:::warn[Predicate may run longer]
While they are waiting for the predicate to come back with a status, note that whenever the predicate's execution gets stopped or interrupted due to timeout for example there is no certainty that the code of the predicate has really been stopped. In Node and more geenrally in JavaScript their is no way to stop a running script, such plugins will mostly return before the script ends but in many case will keep it running in background (as they can't stop it).
:::

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
