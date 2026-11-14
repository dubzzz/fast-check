---
"fast-check": major
---

💥 Make `statistics` asynchronous and run it through the same plugin-enabled runner as `sample` and `assert`.

`statistics` now returns a `Map<string, number>` of category percentages instead of logging them. Await the result and pass it to `defaultStatisticsLogger(stats)` to retain the previous output format, or to `defaultStatisticsLogger(stats, logger)` to use a custom logger. Pass `{ numRuns }` instead of a number, and remove `logger` from local and global runner parameters.
