---
"fast-check": major
---

Remove `includeErrorInReport` from runner parameters and global settings. Use `defaultReporter({ includeErrorInReport: true })` in `plugins`, or install that reporter with `installGlobalPlugin`, instead. The reporter defaults to `false` and no longer reads the run configuration. Interruption reports now throw a plain error without a cause.
