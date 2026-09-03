---
slug: /core-blocks/plugins/time-limits/
---

# Time limits

Time-limit plugins bound the time spent assessing your properties. They can come into play at various levels, from an isolated execution of a predicate to the full run of the assertion.

They make the runner stop its ongoing task when the limit gets reached. As such, they cannot really stop the code they wrap but ignore its results.

## `timeout`

The `timeout` plugin marks the current execution of your predicate as failed if it did not complete within the requested delay expressed in milliseconds.

```ts
{
  plugins: [
    timeout(1000), // fail any execution of the predicate taking more than 1 second
  ];
}
```

The countdown restarts for every execution of the predicate, shrinking phase included. A timed-out execution gets reported like any other failure, it's just a failure.

Resources: [API reference](/docs/api/functions/timeout).

## `interruptAfterTimeLimit`

The `interruptAfterTimeLimit` plugin interrupts all runs once the requested delay expires. Past this delay, no new execution of the predicate will be started and any execution still running at that time will be interrupted.

```ts
{
  plugins: [
    interruptAfterTimeLimit(1000), // interrupt the execution of the property after 1 second
  ];
}
```

The countdown starts when the runner starts executing the property.

An interrupted property is not necessarily considered to be a failure. By default, it gets marked as successful as long as at least one execution succeeded before the interruption and no failure got reported. To change that default and report interrupted properties as failures, one can set `markInterruptAsFailure: true` on the runner.

Resources: [API reference](/docs/api/functions/interruptAfterTimeLimit).

## Limitations

Both plugins share the same limitations.

### Synchronous code can't be cut

There is no way to pause or kill a running synchronous script in JavaScript. A synchronous predicate will always run to its end before any of these plugins get the flow back.

As such, `timeout` has no effect on purely synchronous predicates and `interruptAfterTimeLimit` can only prevent new executions from starting once the limit gets reached.

### Asynchronous code can't be canceled

Whenever the limit gets reached during an asynchronous execution, the plugins give control back to the runner without waiting for the predicate. But the underlying execution keeps running in the background and its outcome gets ignored.

Plugins declared before the time-limit one may thus run while the predicate is still under way.

### Stopping the code

If you need the code under test to be really stopped, have a look at [`@fast-check/worker`](https://www.npmx.dev/package/@fast-check/worker). It runs predicates in dedicated worker threads that can be terminated, synchronous ones included.
