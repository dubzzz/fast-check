---
sidebar_position: 1
slug: /tutorials/setting-up-your-test-environment/property-based-testing-with-jest/
description: Discover how to configure the integration of Property-Based Testing capabilities within Jest. Learn best practices to setup fast-check for it
sidebar_label: With Jest
image: /img/socials/fast-check-jest.png
---

# Property Based Testing with Jest

Integrating Property Based Testing capabilities within [Jest](https://jestjs.io/) can be easily achieved using fast-check.

We recommend two distinct approaches for integrating fast-check with Jest:

1. **Using our Connector Library:** Simplify your integration process with our dedicated connector library: [@fast-check/jest](https://www.npmjs.com/package/@fast-check/jest). Designed to streamline the setup, this option offers a quick and simple way to leverage fast-check with Jest.
2. **Manual Integration:** Learn how to connect fast-check with Jest from scratch. This option provides ultimate flexibility and control over your testing setup.

Both options have their unique benefits and strengths. In this guide, we'll walk you through each method in detail.

:::info You don't have Jest yet?

If you don't have Jest yet, we recommend you to have a look at their official [Getting Started Guide](https://jestjs.io/docs/getting-started) first.
:::

## Setup with our connector

Using our connector is the simplest option to leverage the core strengths of fast-check and Jest together. From an end-user perspective, our connector enriches the existing capabilities provided by Jest with tailored primitives for property-based testing.

Benefits of our Connector:

- Seamlessly integrates fast-check with Jest, eliminating the need for manual setup.
- Provides syntactic sugars for concise and readable test cases.
- Handles configurations, such as timeout settings, automatically, reducing setup overhead.

### Basic setup

Start by installing the necessary libraries for your project with the following command:

```bash npm2yarn
npm install --save-dev fast-check @fast-check/jest
```

Congratulations, everything is ready to start plugging some Property-Based Tests within Jest 🚀

### Your first test

Now that everything is ready to start plugging our first Property-Based Tests, let's write a simple one to ensure everything works properly. First, let's create a new test file that includes both the code and the test for the sake of clarity and conciseness. Here is an example of such a test:

```js title="isSubstring.spec.js"
const { test, fc } = require('@fast-check/jest');

test.prop({ a: fc.string(), b: fc.string(), c: fc.string() })('should detect the substring', ({ a, b, c }) => {
  const text = a + b + c;
  expect(isSubtring(text, b)).toBe(true);
});

// Code under test: should rather be imported from another file
function isSubtring(text, pattern) {
  return text.includes(pattern);
}
```

You can now run your test with your usual test command.

You've connected your first Property-Based Test within Jest 🚀

:::info Changes compared to a usual test

In the above specification file, note that we didn't rely on the `it` or `test` functions from `@jest/globals` or those provided automatically by Jest. Instead, we imported them from `@fast-check/jest`. These imported functions handle everything supported by Jest's `it` and `test`, while also extending them with Property-Based Testing capabilities via `.prop`.
:::

### Your first asynchronous test

Let's now extend our usage of Property-Based Testing to asynchronous properties. While many code snippets can be assessed synchronously, not all can. Let's explore how to work with asynchronous predicates using Jest and fast-check with our connector.

To accomplish this, we can create a new test file containing the code below:

```js title="queue.spec.js"
const { test, fc } = require('@fast-check/jest');

test.prop({ s: fc.scheduler() })('should resolve in call order', async ({ s }) => {
  // Arrange
  const pendingQueries = [];
  const seenAnswers = [];
  const call = jest.fn().mockImplementation((v) => Promise.resolve(v));

  // Act
  const queued = queue(s.scheduleFunction(call));
  pendingQueries.push(queued(1).then((v) => seenAnswers.push(v)));
  pendingQueries.push(queued(2).then((v) => seenAnswers.push(v)));
  await s.waitFor(Promise.all(pendingQueries));

  // Assert
  expect(seenAnswers).toEqual([1, 2]);
});

// Code under test: should rather be imported from another file
function queue(fun) {
  let lastQuery = Promise.resolve();
  return (...args) => {
    const currentQuery = fun(...args);
    const returnedQuery = lastQuery.then(() => currentQuery);
    lastQuery = currentQuery;
    return returnedQuery;
  };
}
```

You can now run your test with your usual test command.

You've connected your first asynchronous Property-Based Test within Jest 🚀

:::info Difference with synchronous predicate

The only difference is that the predicate function is now asynchronous. Compared to the **Manual Integration** (see below), we don't have to use another set of helpers to run asynchronous checks.

```diff
- test.prop({ s: fc.scheduler() })('should resolve in call order', ({ s }) => {
+ test.prop({ s: fc.scheduler() })('should resolve in call order', async ({ s }) => {
```

:::

### Going further

For more advanced options and configurations of the connector, explore the [Advanced section of its README](https://github.com/dubzzz/fast-check/tree/main/packages/jest#advanced).

## Manual setup

Leveraging fast-check within an existing Jest project doesn't require the use of a connector. In fact, fast-check is designed to be test runner agnostic, making the connector a convenient option for users seeking seamless integration within their existing tooling.

In this section, we'll explore how to set up fast-check directly in your Jest projects.

### Basic setup

Start by installing the necessary libraries for your project with the following command:

```bash npm2yarn
npm install --save-dev fast-check
```

Congratulations! You're now ready to start exploring Property-Based Testing within Jest 🚀

While you could begin writing property-based tests now, we recommend some additional setup to enhance integration and maximize the benefits of fast-check within Jest.

### Recommended setup

As Property-Based Tests can take longer to run compared to other tests, it's recommended to adjust their time allocation appropriately. In this section, we'll focus on ensuring that property-based tests stay within the time constraints set for all your other tests. While it might be tempting to specify separate time limits for them, we recommend letting them run with the same time limit as any other tests, especially in Continuous Integration environments.

To globally apply our setup across all tests, Jest provides a mechanism for executing setup files before tests start running. If you haven't already created a setup file, you can do so as follows:

```js title="jest.config.js"
module.exports = {
  setupFiles: ['./jest.setup.js'],
};
```

Now that we have the setup file in place, let's configure fast-check:

```js title="jest.setup.js"
const fc = require('fast-check');
fc.configureGlobal({ interruptAfterTimeLimit: 5_000 });
```

With this setup, we ensure that fast-check stops any running property-based tests that exceed the 5-second limit, which is [the default time limit in Jest](https://jestjs.io/docs/cli#--testtimeoutnumber).

:::tip Checking the setup

You can confirm that the setup has been properly applied to your test files by using the following temporary test and running the tests:

```js
test('fast-check properly configured', () => {
  expect(fc.readConfigureGlobal()).toEqual({ interruptAfterTimeLimit: 5_000 });
});
```

:::

:::warning Multiple time limits

Unlike the implementation provided by `@fast-check/jest`, the global setup documented above does not automatically adapt itself to command-line dependent time limits or test-dependent ones. In other words, our documented setup will ignore any customized time limit passed via `--testTimeout=<number>` or directly defined at test level via `test(label, fn, timeout)`.
:::

You can even customize this setup further by instructing fast-check to run tests until they reach a specified time limit. While this approach might not be suitable for general Continuous Integration, environments, it can be valuable in fuzzing-like CI pipelines. In such cases, you'll want to increase the number of runs passed to fast-check to an arbitrarily high value, such as `numRuns: Number.POSITIVE_INFINITY`.

### Your first test

Since we're not using a specific connector, there's no direct integration of fast-check within Jest. Instead, writing a property-based test will largely follow your usual Jest practices, with the test's content calling fast-check to generate inputs and expectations.

```js title="isSubstring.spec.js"
const { test } = require('@jest/globals');
const fc = require('fast-check');

test('should detect the substring', () => {
  fc.assert(
    fc.property(fc.string(), fc.string(), fc.string(), (a, b, c) => {
      const text = a + b + c;
      expect(isSubtring(text, b)).toBe(true);
    }),
  );
});

// Code under test: should rather be imported from another file
function isSubtring(text, pattern) {
  return text.includes(pattern);
}
```

You can now run your test with your usual test command.

You've connected your first Property-Based Test within Jest 🚀

### Your first asynchronous test

Now that we've covered synchronous tests, let's explore how to integrate an asynchronous one. The key difference here is that `fc.property` does not handle asynchronous predicates, so we'll use its asynchronous counterpart, `fc.asyncProperty`.

```js title="queue.spec.js"
const { test } = require('@jest/globals');
const fc = require('fast-check');
const { queue } = require('./queue.js'); // refer to the section "connector" for the code

test('should resolve in call order', async () => {
  await fc.assert(
    fc.asyncProperty(fc.scheduler(), async (s) => {
      // Arrange
      const pendingQueries = [];
      const seenAnswers = [];
      const call = jest.fn().mockImplementation((v) => Promise.resolve(v));

      // Act
      const queued = queue(s.scheduleFunction(call));
      pendingQueries.push(queued(1).then((v) => seenAnswers.push(v)));
      pendingQueries.push(queued(2).then((v) => seenAnswers.push(v)));
      await s.waitFor(Promise.all(pendingQueries));

      // Assert
      expect(seenAnswers).toEqual([1, 2]);
    }),
  );
});

// Code under test: should rather be imported from another file
function queue(fun) {
  let lastQuery = Promise.resolve();
  return (...args) => {
    const currentQuery = fun(...args);
    const returnedQuery = lastQuery.then(() => currentQuery);
    lastQuery = currentQuery;
    return returnedQuery;
  };
}
```

You can now run your test with your usual test command.

You've connected your first asynchronous Property-Based Test within Jest 🚀

### Going further

Now that you have a solid foundation, it's time to delve deeper into the world of property-based testing. Our official documentation covers a range of advanced topics, from [generating custom values](/docs/core-blocks/arbitraries/) tailored to your specific needs to exploring [advanced patterns](/docs/advanced/).

By diving into these resources, you'll gain a deeper understanding of fast-check's capabilities and unlock new possibilities for enhancing your testing workflow. Continue your exploration and elevate your property-based testing skills to new heights.
