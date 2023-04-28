---
slug: /advanced/fuzzing/
---

# Fuzzing

Turn fast-check into a fuzzer

## From Property-Based to Fuzzing

Although fast-check is not specifically designed as a fuzzer, it has several features that make it well-suited for this purpose. One such feature is its ability to repeatedly run a predicate against randomized data, which is a fundamental requirement for fuzzing. Additionally, fast-check is capable of identifying and reporting errors, which is crucial in fuzzing scenarios.

Due to its sophisticated random generators, fast-check can be a valuable tool for detecting critical bugs in your code and can be leveraged in a fuzzing mode.

If you want to use fast-check as a fuzzer, here's how to get started.

## Basic setup

To use fast-check as a fuzzer, the primary requirement is to execute the predicate against a large number of runs. One straightforward method of achieving this is to customize the `numRuns` value passed to the runner.

For instance, if you intend to run the tests an infinite number of times, you can use the following code snippet:

```js
fc.configureGlobal({ numRuns: Number.POSITIVE_INFINITY });
```

:::warning Multi-process
Please note that if you intend to run multiple properties an infinite number of times, it may be necessary to run them via multiple processes. JavaScript being a single-threaded language, running multiple infinite loops in a single thread may result in only one property being executed.

Therefore, to avoid this limitation and ensure that all properties are executed as intended, you should consider running them in separate processes.
:::

## Advanced setup

While the setup above will continue to run until fast-check uncovers a bug, you may want to consider more advanced patterns if your goal is to continuously fuzz the code without stopping even in the event of an error.

The following code snippets offer an approach to run fast-check continuously without stopping on failure.

### Never failing predicates

The code snippet presented below consists of a function designed to wrap any predicate into a function that will not fail but will report into a file when a failure is detected.

```js
import fc from 'fast-check';
import fs from 'fs';
import process from 'process';

let failureId = 0;
function reportFailure(inputs, error) {
  const fileName = `failure-pid${process.pid}-${++failureId}.log`;
  const fileContent = `Counterexample: ${fc.stringify(inputs)}\n\nError: ${error}`;
  fs.writeFile(fileName, fileContent);
}

function neverFailingPredicate(predicate) {
  return (...inputs) => {
    try {
      const out = predicate(...inputs);
      if (out === false) {
        reportFailure(inputs, undefined);
      }
    } catch (err) {
      reportFailure(inputs, err);
    }
  };
}
```

The `neverFailingPredicate` function takes in a predicate and returns a new function that wraps it. This new function will catch any error thrown by the predicate and report it as a failure, without actually failing. Additionally, it will generate a log file containing the counterexample that caused the failure and the error message.

This function can be used to run fast-check indefinitely without stopping on errors.

### Fuzzing usage

The above helpers can be utilized directly to define properties and execute them in a fuzzer fashion as shown below:

```js
import fc from 'fast-check';

fc.configureGlobal({ numRuns: 1_000_000 });

test('fuzz predicate against arbitraries', () => {
  fc.assert(fc.property(...arbitraries, neverFailingPredicate(predicate)));
});
```

Here, the `assert` function is used to execute a property that is generated from a set of arbitraries. The `neverFailingPredicate` function is used to wrap the predicate of the property, which ensures that the property will never fail but will report any detected failures.

Finally, the `configureGlobal` function is used to set the number of runs for the property to `1_000_000`, enabling it to run longer than the default setup.

### Replay usage

In contrast to normal runs, when using the `neverFailingPredicate` function, the inputs provided to the predicate will never be shrunk. However, if you want to shrink them or just replay the failure, you can do it on a case-by-case basis as demonstrated below:

```js
test('replay reported error and shrink it', () => {
  fc.assert(fc.property(...arbitraries, predicate), {
    numRuns: 1,
    examples: [
      [
        /* reported error */
      ],
    ],
  });
});
```

Here, the `examples` option is used to provide the input that resulted in the reported error. By setting `numRuns` to 1, we ensure that the property is only executed once with the provided example. In case of failure, fast-check will then attempt to shrink the input, leading to a simpler failing input if feasible.
