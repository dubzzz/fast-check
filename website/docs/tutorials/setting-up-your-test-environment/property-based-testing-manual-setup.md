---
sidebar_position: 0
slug: /tutorials/setting-up-your-test-environment/property-based-testing-manual-setup/
description: Set up fast-check with any JavaScript or TypeScript test runner. Learn the runner-agnostic patterns for writing synchronous and asynchronous property-based tests
sidebar_label: Manual setup
---

# Property Based Testing — Manual setup

fast-check is designed to be test runner agnostic. You can plug it into any existing test runner without needing a dedicated connector. This page walks through the generic setup that applies whatever runner you use — from runners that do not have a dedicated connector (such as the [Node.js test runner](/docs/tutorials/setting-up-your-test-environment/property-based-testing-with-nodejs-test-runner/), [Bun test runner](/docs/tutorials/setting-up-your-test-environment/property-based-testing-with-bun-test-runner/), [Deno test runner](/docs/tutorials/setting-up-your-test-environment/property-based-testing-with-deno-test-runner/), Mocha, AVA, …) to runners where you prefer full control over connectors like [@fast-check/jest](https://www.npmjs.com/package/@fast-check/jest) or [@fast-check/vitest](https://www.npmjs.com/package/@fast-check/vitest).

:::tip Runner has a connector?
If you use [Jest](/docs/tutorials/setting-up-your-test-environment/property-based-testing-with-jest/) or [Vitest](/docs/tutorials/setting-up-your-test-environment/property-based-testing-with-vitest/), we recommend starting with our dedicated connector library — it simplifies integration and handles timeouts and lifecycle for you. The manual setup described here remains a valid alternative whenever you need ultimate flexibility.
:::

## Install

Start by installing fast-check:

```bash npm2yarn
npm install --save-dev fast-check
```

Congratulations! You're now ready to start exploring Property-Based Testing with your favorite runner 🚀

## Your first test

Since we're not relying on any connector, there's no direct integration of fast-check within your runner. Instead, writing a property-based test will largely follow your usual practices, with the test's body calling fast-check to generate inputs and perform assertions.

```js title="isSubstring.spec.js"
// test/expect come from your test runner — adjust the import to match it
const fc = require('fast-check');

test('should detect the substring', () => {
  fc.assert(
    fc.property(fc.string(), fc.string(), fc.string(), (a, b, c) => {
      const text = a + b + c;
      expect(isSubstring(text, b)).toBe(true);
    }),
  );
});

// Code under test: should rather be imported from another file
function isSubstring(text, pattern) {
  return text.includes(pattern);
}
```

You can now run your test with your usual test command.

You've just written your first Property-Based Test 🚀

:::info Where does `fc.property` come from?
`fc.property` is the standard way to declare a synchronous property in fast-check. For a deeper dive into properties, arbitraries, and predicates, refer to the [Properties documentation](/docs/core-blocks/properties/).
:::

## Your first asynchronous test

Now that we've covered synchronous tests, let's explore how to write an asynchronous one. The key difference here is that `fc.property` does not handle asynchronous predicates, so we'll use its asynchronous counterpart, `fc.asyncProperty`.

```js title="queue.spec.js"
// test/expect come from your test runner — adjust the import to match it
const fc = require('fast-check');
const { queue } = require('./queue.js');

test('should resolve in call order', async () => {
  await fc.assert(
    fc.asyncProperty(fc.scheduler(), async (s) => {
      // Arrange
      const pendingQueries = [];
      const seenAnswers = [];
      const call = (v) => Promise.resolve(v);

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

You've just written your first asynchronous Property-Based Test 🚀

:::info Synchronous vs asynchronous predicates
When the predicate is asynchronous, you must use `fc.asyncProperty` instead of `fc.property`, and `await` the call to `fc.assert`. More details are available in the [Asynchronous properties section](/docs/core-blocks/properties/#asynchronous-properties).
:::

## Share configuration across your tests

Property-based tests often benefit from shared configuration: aligning time limits with the runner's default timeout, registering `beforeEach`/`afterEach` hooks, or fixing a seed to reproduce a failure. fast-check exposes `fc.configureGlobal` for this exact purpose:

```js
const fc = require('fast-check');

fc.configureGlobal({ interruptAfterTimeLimit: 5_000 });
```

With this setup, fast-check will interrupt any property-based test that exceeds the configured time limit — a useful knob to make sure property-based tests fit within your runner's default timeout.

How you hook this configuration call so it runs before your tests depends on your runner. The [Global settings documentation](/docs/configuration/global-settings/#integration-with-test-frameworks) covers the most common cases (Jest, Mocha, Vitest). Most other runners offer an equivalent mechanism (for example a `--require`/`--import` flag, or a preload option).

:::warning Multiple time limits
The global setup documented above does not automatically adapt to command-line or test-level time limits. Unlike connector libraries such as `@fast-check/jest` or `@fast-check/vitest`, it will ignore any customized time limit passed via the runner's CLI or at individual test level.
:::

## Pick your runner

Looking for runner-specific integration tips? Head over to the page that matches your setup:

- [With Jest](/docs/tutorials/setting-up-your-test-environment/property-based-testing-with-jest/)
- [With Vitest](/docs/tutorials/setting-up-your-test-environment/property-based-testing-with-vitest/)
- [With the Node.js test runner](/docs/tutorials/setting-up-your-test-environment/property-based-testing-with-nodejs-test-runner/)
- [With the Bun test runner](/docs/tutorials/setting-up-your-test-environment/property-based-testing-with-bun-test-runner/)
- [With the Deno test runner](/docs/tutorials/setting-up-your-test-environment/property-based-testing-with-deno-test-runner/)

## Going further

Now that you have a solid foundation, it's time to delve deeper into the world of property-based testing. Our official documentation covers a range of advanced topics, from [generating custom values](/docs/core-blocks/arbitraries/primitives/number/) tailored to your specific needs to exploring [advanced patterns](/docs/advanced/race-conditions/).

By diving into these resources, you'll gain a deeper understanding of fast-check's capabilities and unlock new possibilities for enhancing your testing workflow.
