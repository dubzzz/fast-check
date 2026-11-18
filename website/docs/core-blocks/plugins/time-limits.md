---
slug: /core-blocks/plugins/time-limits/
---

# Time limits

Time-limit plugins bound the time spent assessing your properties. They can come into play at various levels, from an isolated execution of a predicate to the full run of the assertion.

They let the runner move on after a time limit is reached, as soon as JavaScript gives them control. They cannot forcibly stop the code they wrap.

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

An interruption is recorded separately from a property failure: `RunDetails.interrupted` can be `true` while `failed` is `false`. By default, this plugin does not report an error if at least one execution succeeded before its interruption and no failure was reported. It reports an error if it interrupted the run before any execution completed, or if `failOnInterrupt: true` is set. This reporting does not change the `failed` flag in `RunDetails`.

```ts
{
  plugins: [
    interruptAfterTimeLimit(1000, { failOnInterrupt: true }), // mark an interrupted property as a failed one
  ];
}
```

Resources: [API reference](/docs/api/functions/interruptAfterTimeLimit).

## Cooperative cancellation

Both plugins pass an `AbortSignal` to the predicate through its final [execution context](/docs/core-blocks/properties/#execution-context) argument. When their timer fires, they abort that signal. APIs that accept a signal can use it to stop outstanding work:

```js
await fc.assert(
  fc.property(fc.string(), async (query, { signal }) => {
    // The application's search API must support AbortSignal cancellation.
    await searchService.search(query, { signal });
  }),
  { plugins: [fc.timeout(1_000)] },
);
```

The signal is optional: a property run without a plugin supplying one may receive `undefined`. When time-limit plugins are combined, their signals are combined too, so an outer cancellation can reach the inner predicate. Plugin authors must forward the execution context when wrapping a run.

## Limitations

Both plugins share the same limitations.

### Synchronous code can't be cut

There is no way to pause or kill a running synchronous script in JavaScript. A synchronous predicate will always run to its end before any of these plugins get the flow back.

Once a synchronous predicate returns, `timeout` checks its elapsed time and reports a failure if it exceeded the limit. It cannot report that failure while the synchronous code is still running.

The `interruptAfterTimeLimit` plugin can only prevent new executions from starting once the limit gets reached.

### Asynchronous cancellation requires cooperation

Whenever the limit gets reached during an asynchronous execution, the plugins give control back to the runner without waiting for the predicate. They request cancellation through the signal, but code that ignores it can keep running in the background and its outcome gets ignored. Aborting a signal does not guarantee that cleanup has completed before the runner continues.

Plugins declared before the time-limit one may thus run while the predicate is still under way.

### Stopping the code

If you need the code under test to be really stopped, have a look at [`@fast-check/worker`](https://www.npmx.dev/package/@fast-check/worker). It runs predicates in dedicated worker threads that can be terminated, synchronous ones included.
