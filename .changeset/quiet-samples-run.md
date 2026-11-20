---
"fast-check": major
---

Run property predicates when sampling, exclude skipped inputs, and interrupt on predicate failures without shrinking. Remove the sample-specific `numRuns` cap for shrink-path replay. Export `SampleParameters` with `noPredicateExecution` as an opt-out available only to `sample` with a property input.
