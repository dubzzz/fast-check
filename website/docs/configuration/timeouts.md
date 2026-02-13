---
slug: /configuration/timeouts/
---

# Timeouts

Learn about the various timeout options available in the fast-check.

## How and where to stop?

When dealing with timeouts in property-based testing, there are several levels and options to consider. Timeouts can be applied to the entire test suite, limiting the total execution time of all tests. Alternatively, timeouts can be set for individual predicate executions, allowing for finer-grained control over the test time. Additionally, timeouts can be used to prevent excessively long test runs or to report on runs that have taken too long.

Let's dig into the multiple timeout options provided by fast-check.

## At predicate level

### timeout

You can use the `timeout` option with the `assert` function in fast-check to limit the amount of time allocated to run each instance of the predicate defined by your property. If the predicate takes longer than the specified time, the execution will be reported as a failure. fast-check will then attempt to shrink the inputs so that you can more easily identify the cause of the timeout.

:::warning Need asynchronous properties
It's important to note that the `timeout` option only works with asynchronous properties as it needs a way to interrupt another running script. If you want to use it with synchronous code, you can check out the `@fast-check/worker` package.
:::

Let's explore how the `timeout` option works by looking at the following code snippet:

```ts
await fc.assert(
  fc.asyncProperty(packagesArb, fc.nat(), async (packages, selectedSeed) => {
    // Arrange
    const allPackagesNames = Array.from(packages.keys());
    const selectedPackage = allPackagesNames[allPackagesNames.length % selectedSeed];

    // Act
    const registry = new FakeRegistry(packages);
    const dependencies = await extractAllDependenciesFor(selectedPackage, registry);

    // Assert
    for (const dependency of dependencies) {
      expect(allPackagesNames).toContain(dependency.name);
    }
  }),
  { timeout: 1000 },
);
```

In the provided example, the `timeout` will only be triggered if one execution of `async (packages, selectedSeed) => {...}` takes more than 1 second. It's also important to highlight the fact that the timeout option can only intervene for asynchronous tasks taking too long. In other words, in the predicate above, only the code executed asynchronously during the execution of `extractAllDependenciesFor` could be bypassed and raise a timeout issue.

:::info Cannot stop the async code
It's important to note that fast-check cannot stop the execution of a running `Promise` as there is no way to cancel it in JavaScript. As a result, if a run takes too long to execute and exceeds the specified timeout limit, fast-check will simply ignore the follow-up results. This means that the code will continue to run until it completes, even if fast-check reported a timeout failure.

If you want to stop asynchronous code abruptly when it takes too long, you can check out the `@fast-check/worker` package. It provides a way to run code in a separate worker thread and stop the worker thread if it takes too long, effectively interrupting the execution of the code.
:::

In case of failure linked to a timeout, the report might look like:

```txt
Uncaught Error: Property failed after 1 tests
{ seed: 1234070620, path: "0:0", endOnFailure: true }
Counterexample: [new Map([["my-package",{}]]),0]
Shrunk 1 time(s)
Got Property timeout: exceeded limit of 1000 milliseconds

Hint: Enable verbose mode in order to have the list of all failing values encountered during the run
    at buildError (/workspaces/fast-check/packages/fast-check/lib/check/runner/utils/RunDetailsFormatter.js:131:15)
    at asyncThrowIfFailed (/workspaces/fast-check/packages/fast-check/lib/check/runner/utils/RunDetailsFormatter.js:148:11)
    at runNextTicks (node:internal/process/task_queues:60:5)
    at process.processTimers (node:internal/timers:509:9)
```

:::info Interaction with `beforeEach` and `afterEach`
Note that the function provided to `beforeEach` and `afterEach` are not included in the measured time for the timeout. If the execution is interrupted due to a timeout, `afterEach` will be called immediately without waiting for the predicate to finish.
:::

Resources: [API reference](https://fast-check.dev/api-reference/interfaces/Parameters.html#timeout).  
Available since 0.0.11.

## At runner level

### interruptAfterTimeLimit

The `interruptAfterTimeLimit` option can be used to customize the maximum amount of time that the runner is allowed to execute a property. It works on both synchronous and asynchronous properties.

By default, interrupting a runner after the deadline is not considered an error unless no predicate succeeded. However, this behavior can be overridden by setting `markInterruptAsFailure: true` in which case any interruption of the execution will be considered a failure.

Here is a summary:

| Interrupted...            | Resulting status with `markInterruptAsFailure: false` | Resulting status with `markInterruptAsFailure: true` |
| ------------------------- | ----------------------------------------------------- | ---------------------------------------------------- |
| without any success       | Failure                                               | Failure                                              |
| with at least one success | Success                                               | Failure                                              |
| during shrink phase       | Failure (shrink only happens on failures)             | Failure                                              |

:::tip Companion for Fuzzing
`interruptAfterTimeLimit` is particularly useful for fuzzing. For instance, setting it to `interruptAfterTimeLimit: 600_000` and adding `numRuns: Number.POSITIVE_INFINITY` would allow the runner to loop for 10 minutes, regardless of the number of predicates executed during that time.
:::

Resources: [API reference](https://fast-check.dev/api-reference/interfaces/Parameters.html#interruptAfterTimeLimit).  
Available since 1.19.0.

### skipAllAfterTimeLimit

Interrupting the execution of predicates is one way to handle deadlines, but another option is skipping. `skipAllAfterTimeLimit` allows skipping the execution of predicates after the deadline has been reached.

Skipping predicates while there were no reported failures will result in a failure:

```txt
Failed to run property, too many pre-condition failures encountered
{ seed: 1119647454 }

Ran 0 time(s)
Skipped 10001 time(s)

Hint (1): Try to reduce the number of rejected values by combining map, chain and built-in arbitraries
Hint (2): Increase failure tolerance by setting maxSkipsPerRun to an higher value
Hint (3): Enable verbose mode at level VeryVerbose in order to check all generated values and their associated status
    at buildError (/workspaces/fast-check/packages/fast-check/lib/check/runner/utils/RunDetailsFormatter.js:131:15)
    at asyncThrowIfFailed (/workspaces/fast-check/packages/fast-check/lib/check/runner/utils/RunDetailsFormatter.js:148:11)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
```

During the shrinking process, skipping predicates will result in one-by-one skipping of all the executions required by the shrinker.

:::info Interrupting is more efficient
When we skip a predicate due to the `skipAllAfterTimeLimit` option, we still pass on it, which may take time. This is because each subsequent run needs to be marked as "will not be executed" one by one. On the other hand, with the `interruptAfterTimeLimit` option, the runner is stopped immediately when the deadline is reached, resulting in a faster stop.
:::

Resources: [API reference](https://fast-check.dev/api-reference/interfaces/Parameters.html#timeout).  
Available since 1.15.0.

## All timeout options

| Option                    | Level     | Property kind  | `beforeEach`/`afterEach` included in the measured time | Mark run as failed                                         |
| ------------------------- | --------- | -------------- | ------------------------------------------------------ | ---------------------------------------------------------- |
| `timeout`                 | predicate | async          | no                                                     | yes                                                        |
| `interruptAfterTimeLimit` | runner    | sync and async | yes                                                    | no except when first run or `markInterruptAsFailure:true`  |
| `skipAllAfterTimeLimit`   | runner    | sync and async | yes                                                    | no except when timeout occured outside of the shrink phase |

:::info Always run `beforeEach` and `afterEach`
`beforeEach` and `afterEach` functions will always be executed, regardless of whether they are included in the measured time for the timeout or not
:::
