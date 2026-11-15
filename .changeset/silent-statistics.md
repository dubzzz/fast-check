---
"fast-check": major
---

💥 Make `statistics` asynchronous and run it through the same plugin-enabled runner as `sample` and `assert`.

`statistics` now returns a `Map<string, number>` of category percentages instead of logging them. Await the result and pass it to `defaultStatisticsLogger(stats)` to retain the previous output format, or to `defaultStatisticsLogger(stats, logger)` to use a custom logger. Pass `{ numRuns }` instead of a number, and remove `logger` from local and global runner parameters.

When passed a property, `statistics` executes and awaits its predicate before classifying each input. Skipped and interrupted inputs are excluded; failing inputs are included and stop collection without shrinking or reporting the predicate error. Pass `noPredicateExecution: true` to disable predicate execution. Like `sample`, `numRuns` does not cap shrink-path replay.
