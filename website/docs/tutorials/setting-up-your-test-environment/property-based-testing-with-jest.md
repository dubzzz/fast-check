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
2. **Manual Integration:** Connect fast-check with Jest without any connector. This option provides ultimate flexibility and control over your testing setup and is covered on our [Manual setup](/docs/tutorials/setting-up-your-test-environment/property-based-testing-manual-setup/) page.

Both options have their unique benefits and strengths. This guide walks you through the connector-based approach; the manual path is documented in its own page.

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

The only difference is that the predicate function is now asynchronous. Compared to the [Manual setup](/docs/tutorials/setting-up-your-test-environment/property-based-testing-manual-setup/) approach, we don't have to use another set of helpers to run asynchronous checks.

```diff
- test.prop({ s: fc.scheduler() })('should resolve in call order', ({ s }) => {
+ test.prop({ s: fc.scheduler() })('should resolve in call order', async ({ s }) => {
```

:::

### Going further

For more advanced options and configurations of the connector, explore the [Advanced section of its README](https://github.com/dubzzz/fast-check/tree/main/packages/jest#advanced).

## Manual setup

Prefer full control and do not want to rely on `@fast-check/jest`? fast-check is test runner agnostic and plugs into Jest without any connector.

The generic sync and async patterns, along with the recommended usage of `fc.configureGlobal`, are documented in a single runner-agnostic page: [Manual setup](/docs/tutorials/setting-up-your-test-environment/property-based-testing-manual-setup/). When writing tests the Jest way, you can import `test` and `expect` from [`@jest/globals`](https://jestjs.io/docs/api) (or rely on Jest's global injection).

### Sharing `fc.configureGlobal` with Jest

The most common reason to call `fc.configureGlobal` is to align property-based tests with [Jest's default 5-second timeout](https://jestjs.io/docs/cli#--testtimeoutnumber) via `interruptAfterTimeLimit`. Jest exposes `setupFiles` for this use case — the exact snippet (`jest.config.js` + `jest.setup.js`) is documented in the [Jest section of Global settings](/docs/configuration/global-settings/#jest).

:::warning Multiple time limits
Unlike `@fast-check/jest`, this manual setup does not automatically adapt to command-line or test-level time limits. It will ignore any customized time limit passed via `--testTimeout=<number>` or at test level via `test(label, fn, timeout)`.
:::
