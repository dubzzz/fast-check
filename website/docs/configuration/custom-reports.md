---
slug: /configuration/custom-reports
---

# Custom Reports

Customize how to report failures.

## Default Report

When failing `assert` automatically format the errors for you, with something like:

```txt
**FAIL**  sort.test.mjs > should sort numeric elements from the smallest to the largest one
Error: Property failed after 1 tests
{ seed: -1819918769, path: "0:...:3", endOnFailure: true }
Counterexample: [[2,1000000000]]
Shrunk 66 time(s)
Got error: AssertionError: expected 1000000000 to be less than or equal to 2
```

While easily redeable, you may want to format it differently. Explaining how you can do that is the aim of this page.

:::info How to read such reports?
If you want to know more concerning how to read such reports, you may refer to the [Read Test Reports](/tutorials/quick-start/read-test-reports) section of our [Quick Start](/docs/category/quick-start) tutorial.
:::

## Verbosity

The simplest and built-in way to change how to format the errors in a different way is verbosity. Verbosity can be either 0, 1 or 2 and is defaulted to 1. It can be changed at `assert`'s level, by passing the option `verbose: <your-value>` to it.

You may refer to [Read Test Reports](/docs/tutorials/quick-start/read-test-reports#how-to-increase-verbosity) for more details on it.

## New Reporter

## CodeSandbox Reporter
