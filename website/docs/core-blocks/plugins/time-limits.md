---
slug: /core-blocks/plugins/time-limits/
---

# Time limits

Time-limit plugins bound the time spent assessing your properties. They can enter into action at various places from an isolated execution of a predicate to the full run of the assertion.

They make the runner stop its on-going task when the limit gets reached. As such they cannot really stop the code they wrap but mostly ignore its results.

## `timeout`

The `timeout` plugin marks the current execution of your predicate as failed if it did not complete within the requested delay expressed in milliseconds.

```ts
{
  plugins: [
    timeout(1000), // fail any execution of the predicate taking more than 1 second
  ];
}
```

The countdown restarts for every execution of the predicate, shrinking phase included. A timeout-ed execution gets reported as any other failure, it's just a failure.

Resources: [API reference](/docs/api/functions/timeout).

## `interruptAfterTimeLimit`

The `interruptAfterTimeLimit` plugin interrupts all runs once the requested delay expires. Passing this delay, no more execution of the predicate will be started and any execution still running at that time will be interrupted.

```ts
{
  plugins: [
    interruptAfterTimeLimit(1000), // interrupt the execution of the property after 1 second
  ];
}
```

The countdown starts when the runner starts executing the property.

An interrupted property is not necessarily considered to be a failure. By default, it gets marked as successful as long as at least one execution succeeded before the interruption and if no failure got reported. To change that default and report interrupted proerties as failure, one can set `markInterruptAsFailure: true` on the runner.

Resources: [API reference](/docs/api/functions/interruptAfterTimeLimit).
