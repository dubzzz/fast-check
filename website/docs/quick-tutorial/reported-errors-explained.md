---
sidebar_position: 3
---

# Reported errors explained

Read and troubleshoot reported errors.

## Understand reports

Re-run the tests locally by running:

```bash npm2yarn
npm test
```

Tests should not pass.

:::info What about the unit tests?

The unit tests we wrote in the previous section are fully green. They were not able to detect any issue. The values that have been hardcoded into them all contains the same number of digits and thus do not fall into all the corner cases.

In JavaScript, `sort` orders elements based on their string representation: `sort([1, 10, 2])` is `[1, 10, 2]`. In the past, `sort` suffered from other strange edges cases: it was stable when receiving less than 10 elements, unstable above 10.

:::

You should see errors such as:

```txt
**FAIL**  sort.test.mjs > should sort numeric elements from the smallest to the largest one
Error: Property failed after 1 tests
{ seed: -1819918769, path: "0:...:3", endOnFailure: true }
Counterexample: [[2,1000000000]]
Shrunk 66 time(s)
Got error: AssertionError: expected 1000000000 to be less than or equal to 2
```
