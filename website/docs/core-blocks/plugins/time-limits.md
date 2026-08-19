---
slug: /core-blocks/plugins/time-limits/
---

# Time limits

Time-limit plugins bound the total time spent assessing your properties.

For both plugins, the clock starts when the property begins to be assessed and the limit applies to the whole run, shrinking phase included.

## `skipAllAfterTimeLimit`

The `skipAllAfterTimeLimit` plugin skips any execution of the predicate starting after the requested delay expressed in milliseconds.

```ts
{
  plugins: [
    skipAllAfterTimeLimit(1000), // skip any execution starting after 1 second
  ];
}
```

Executions already started when the limit gets reached are left running. Skipped executions count as skips: passed the maximal number of allowed skips the run will be marked as failed.

## `interruptAfterTimeLimit`

The `interruptAfterTimeLimit` plugin interrupts the run after the requested delay expressed in milliseconds: no more execution of the predicate will be started and any execution still running at that time will be interrupted.

```ts
{
  plugins: [
    interruptAfterTimeLimit(1000), // interrupt the run after 1 second
  ];
}
```

As predicates cannot be stopped, interrupted executions keep running in the background but their outcome gets ignored. Note also that only asynchronous executions can be interrupted while running: a synchronous predicate can never be observed running for too long as it already came to an end when the runner gets its outcome back.

Resources: [API reference for `skipAllAfterTimeLimit`](/docs/api/functions/skipAllAfterTimeLimit), [API reference for `interruptAfterTimeLimit`](/docs/api/functions/interruptAfterTimeLimit).
