---
sidebar_position: 3
---

# Reported errors explained

Read and troubleshoot reported errors.

## Run the tests

Re-run the tests locally by running:

```bash npm2yarn
npm test
```

Tests should not pass.

:::info What about the unit tests?

The unit tests we wrote in the previous section are fully green. They were not able to detect any issue. The values that have been hardcoded into them all contains the same number of digits and thus do not fall into all the corner cases.

In JavaScript, `sort` orders elements based on their string representation: `sort([1, 10, 2])` is `[1, 10, 2]`. In the past, `sort` suffered from other strange edges cases: it was stable when receiving less than 10 elements, unstable above 10. For all these reasons, property based testing is a powerful ally.

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

## What failed?

By reading the error reported above, we get that a failure happened for `[data] = [[2,1000000000]]`. We extract this information from the line:

```txt
Counterexample: [[2,1000000000]]
```

We also see that given `data = [2,1000000000]`, the predicate fails with the following error:

```txt
AssertionError: expected 1000000000 to be less than or equal to 2
```

:::info What is the predicate?

In the property we wrote, the predicate is:

```js
(data) => {
  const sortedData = sortNumbersAscending(data);
  for (let i = 1; i < data.length; ++i) {
    expect(sortedData[i - 1]).toBeLessThanOrEqual(sortedData[i]);
  }
};
```

It corresponds to a function receiving the randomly generated values coming from fast-check and checking if the expectations are fulfilled.

:::

## How to re-run?

Whenever it reports a failure, fast-check provides to properly re-run the test. The details are provided by the line:

```js
{ seed: -1819918769, path: "0:...:3", endOnFailure: true }
```

Given that line, the simplest option to re-run your predicate on the reported counterexample is to edit your test as follow:

```js title="sort.test.mjs"
test('should sort numeric elements from the smallest to the largest one', () => {
  fc.assert(
    fc.property(fc.array(fc.integer()), (data) => {
      /* code of the predicate */
    }),
    { seed: -1819918769, path: '0:...:3', endOnFailure: true } // <-- added
  );
});
```

Then you can relaunch the test runner. The test will run the predicate directly on the reported failure without passing by all the intermediate values it initially needed to reach it.

The parameters `path` or `endOnFailure` can be dropped if needed:

- `path` — start the execution directly on the reduced counterexample
- `endOnFailure` — immediately stop the execution on failure and do not attempt to shrink the case

:::info Case reduction _aka. shrink_

By default, property based testing frameworks try to reduce the counterexamples so that users get reported easier to troubleshoot errors. Instead of telling you: "_failed for `stringValue = "abc{...10k more letters}ert"`_", it will come to you with "_failed for `stringValue = "az"`_".

:::

## How to increase verbosity?

By default, the framework limits the reported data to the bare minimal: the case that failed, the error it caused and the seed needed to reproduce.

But in some cases, it might be interesting to have much more details concerning what failed and what did not. To do so you can pass a verbosity flag to `fc.assert` as follow:

```js title="sort.test.mjs"
test('should sort numeric elements from the smallest to the largest one', () => {
  fc.assert(
    fc.property(fc.array(fc.integer()), (data) => {
      /* code of the predicate */
    }),
    { verbose: 2 } // <-- added
  );
});
```

:::info Verbosity values

By default, verbose is set to 0. But you can set it to 1 or 2 to get more details.

:::

When increased to 2, the report is much more verbose:

```txt
**FAIL**  sort.test.mjs > should sort numeric elements from the smallest to the largest one
Error: Property failed after 1 tests
{ seed: -1819918769, path: "0:...:3", endOnFailure: true }
Counterexample: [[2,1000000000]]
Shrunk 66 time(s)
Got error: AssertionError: expected 1000000000 to be less than or equal to 2

Stack trace: AssertionError: expected 1000000000 to be less than or equal to 2
    at C:\dev\fast-check\website\templates\fast-check-tutorial\sort.test.mjs:10:35
    ...
    at runTest (file:///C:/dev/fast-check/node_modules/@vitest/runner/dist/index.js:444:15)

Execution summary:
× [[2147483632,-1868311174,2,-14,-1309756521,948824737,2147483631,1352827217]]
. √ [[]]
. × [[-1309756521,948824737,2147483631,1352827217]]
. . √ [[2147483631,1352827217]]
. . × [[948824737,2147483631,1352827217]]
. . . √ [[2147483631,1352827217]]
. . . √ [[0,2147483631,1352827217]]
. . . × [[474412369,2147483631,1352827217]]
. . . . √ [[2147483631,1352827217]]
. . . . × [[237206185,2147483631,1352827217]]
. . . . . √ [[2147483631,1352827217]]
. . . . . √ [[118603093,2147483631,1352827217]]
. . . . . × [[177904639,2147483631,1352827217]]
...
. . . . . ... . . × [[2,1000000000]]
. . . . . ... . . . √ [[1000000000]]
. . . . . ... . . . √ [[1,1000000000]]
. . . . . ... . . . √ [[2]]
. . . . . ... . . . √ [[2,999999999]]
```
