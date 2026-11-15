---
"fast-check": major
---

💥 Make `statistics` asynchronous and run it through the same plugin-enabled runner as `sample` and `assert`.

`statistics` now returns `{ counts, numValues }` instead of logging: `counts` is a `Map<string, number>` of category occurrences, and `numValues` is the number of values collected, including those assigned to no categories. Await the result and pass it to `logStatistics(stats)` to retain the previous percentage output on `console.log`, or pass a logging function to `logStatistics(stats, logger)`. Build custom formatting from the returned counts and total. Pass `{ numRuns }` instead of a number, and remove `logger` from local and global runner parameters. Statistics options use the dedicated `StatisticsParameters` type.

When passed a property, `statistics` executes and awaits its predicate before classifying each input. Skipped and interrupted inputs are excluded; failing inputs are included and stop collection without shrinking or reporting the predicate error. Pass `noPredicateExecution: true` to disable predicate execution. Like `sample`, `numRuns` does not cap shrink-path replay.

The classifier must not throw.
