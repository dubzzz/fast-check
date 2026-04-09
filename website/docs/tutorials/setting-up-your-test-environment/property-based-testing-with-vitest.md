---
sidebar_position: 2
slug: /tutorials/setting-up-your-test-environment/property-based-testing-with-vitest/
description: Discover how to configure the integration of Property-Based Testing capabilities within Vitest. Learn best practices to setup fast-check for it
sidebar_label: With Vitest
---

# Property Based Testing with Vitest

Integrating Property Based Testing capabilities within [Vitest](https://vitest.dev/) can be easily achieved using fast-check.

We recommend two distinct approaches for integrating fast-check with Vitest:

1. **Using our Connector Library:** Simplify your integration process with our dedicated connector library: [@fast-check/vitest](https://www.npmjs.com/package/@fast-check/vitest). Designed to streamline the setup, this option offers a quick and simple way to leverage fast-check with Vitest.
2. **Manual Integration:** Learn how to connect fast-check with Vitest from scratch. This option provides ultimate flexibility and control over your testing setup.

Both options have their unique benefits and strengths. In this guide, we'll walk you through each method in detail.

:::info You don't have Vitest yet?

If you don't have Vitest yet, we recommend you to have a look at their official [Getting Started Guide](https://vitest.dev/guide/) first.
:::

## Setup with our connector

Using our connector is the simplest option to leverage the core strengths of fast-check and Vitest together. From an end-user perspective, our connector enriches the existing capabilities provided by Vitest with tailored primitives for property-based testing.

Benefits of our Connector:

- Seamlessly integrates fast-check with Vitest, eliminating the need for manual setup.
- Provides syntactic sugars for concise and readable test cases.
- Handles configurations, such as timeout settings, automatically, reducing setup overhead.
- Offers two modes: **one-time random mode** for controlled randomness and **full property-based testing mode** for exhaustive input generation.
- Natively integrates with Vitest's `beforeEach` and `afterEach` hooks.

### Basic setup

Start by installing the necessary libraries for your project with the following command:

```bash npm2yarn
npm install --save-dev fast-check @fast-check/vitest
```

Congratulations, everything is ready to start plugging some Property-Based Tests within Vitest 🚀

### Your first test

Now that everything is ready to start plugging our first Property-Based Tests, let's write a simple one to ensure everything works properly. First, let's create a new test file that includes both the code and the test for the sake of clarity and conciseness.

The connector supports two syntaxes for defining property inputs — **tuple** and **record** notations:

```ts title="isSubstring.spec.ts"
import { test, fc } from '@fast-check/vitest';

// Record notation — inputs are passed as a named object
test.prop({ a: fc.string(), b: fc.string(), c: fc.string() })('should detect the substring', ({ a, b, c }) => {
  const text = a + b + c;
  expect(isSubstring(text, b)).toBe(true);
});

// Tuple notation — inputs are passed as positional arguments
test.prop([fc.string(), fc.string(), fc.string()])('should detect the substring', (a, b, c) => {
  const text = a + b + c;
  expect(isSubstring(text, b)).toBe(true);
});

// Code under test: should rather be imported from another file
function isSubstring(text, pattern) {
  return text.includes(pattern);
}
```

You can now run your test with your usual test command.

You've connected your first Property-Based Test within Vitest 🚀

:::info Changes compared to a usual test

In the above specification file, note that we didn't rely on the `it` or `test` functions from `vitest`. Instead, we imported them from `@fast-check/vitest`. These imported functions handle everything supported by Vitest's `it` and `test`, while also extending them with Property-Based Testing capabilities via `.prop`.
:::

### Your first asynchronous test

Let's now extend our usage of Property-Based Testing to asynchronous properties. While many code snippets can be assessed synchronously, not all can. Let's explore how to work with asynchronous predicates using Vitest and fast-check with our connector.

To accomplish this, we can create a new test file containing the code below:

```ts title="queue.spec.ts"
import { test, fc } from '@fast-check/vitest';
import { vi } from 'vitest';

test.prop({ s: fc.scheduler() })('should resolve in call order', async ({ s }) => {
  // Arrange
  const pendingQueries = [];
  const seenAnswers = [];
  const call = vi.fn().mockImplementation((v) => Promise.resolve(v));

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

You've connected your first asynchronous Property-Based Test within Vitest 🚀

:::info Difference with synchronous predicate

The only difference is that the predicate function is now asynchronous. Compared to the **Manual Integration** (see below), we don't have to use another set of helpers to run asynchronous checks.

```diff
- test.prop({ s: fc.scheduler() })('should resolve in call order', ({ s }) => {
+ test.prop({ s: fc.scheduler() })('should resolve in call order', async ({ s }) => {
```

:::

### One-time random mode

Beyond full property-based testing, our connector provides a lightweight mode for introducing controlled randomness into your tests — without running them multiple times or shrinking on failure. This is particularly useful when you need random values but want failures to remain deterministic and reproducible.

Instead of using `.prop`, you access a generator function `g` from the test context:

```ts title="displayName.spec.ts"
import { test, fc } from '@fast-check/vitest';

test('should include first name in display name', ({ g }) => {
  // Arrange
  const user = {
    firstName: g(fc.string),
    lastName: g(fc.string),
  };

  // Act
  const displayName = computeDisplayName(user);

  // Assert
  expect(displayName).toContain(user.firstName);
});

// Code under test: should rather be imported from another file
function computeDisplayName(user) {
  return `${user.firstName} ${user.lastName}`;
}
```

The `g` function accepts an arbitrary builder (note: passed without calling it) and returns a generated value. Everything stays deterministic — any failure can be traced back to its exact seed. You can replay a failure by configuring the seed globally:

```ts
fc.configureGlobal({ seed: <the-seed-from-the-error> });
```

:::tip Integrating with Faker

You can combine `g` with libraries like [Faker](https://fakerjs.dev/) to produce realistic test data while maintaining full control over randomness:

```ts
import { Faker, base } from '@faker-js/faker';
import { test, fc } from '@fast-check/vitest';

test('the name of your test', ({ g }) => {
  const faker = new Faker({
    locale: base,
    randomizer: {
      next: () => g(fc.nat, { max: 0xffffffff }) / 0x100000000,
      seed: () => {},
    },
  });
  // Use faker to generate values...
});
```

:::

### Using test modifiers

The connector supports all Vitest test modifiers — `.only`, `.skip`, `.todo`, `.concurrent`, and `.fails` — as well as combinations of them:

```ts title="modifiers.spec.ts"
import { it, test, fc } from '@fast-check/vitest';

test.prop([fc.nat(), fc.nat()], { seed: 4242 })('should replay the test for the seed 4242', (a, b) => {
  return a + b === b + a;
});

test.skip.prop([fc.string()])('should be skipped', (text) => {
  return text.length === [...text].length;
});

describe('with it', () => {
  it.prop([fc.nat(), fc.nat()])('should run too', (a, b) => {
    return a + b === b + a;
  });
});
```

### Hook integration

Vitest's `beforeEach` and `afterEach` hooks are natively integrated with the connector. They are called before and after each execution of the predicate. If a property runs _n_ times, `beforeEach` will be invoked _n_ times before it and `afterEach` _n_ times after it.

:::note

Cleanup functions returned by `beforeEach` on the first predicate execution are deferred until the end of the test, as they are handled by Vitest's own teardown mechanism. All other cleanups run between predicate executions as expected.
:::

### Going further

For more advanced options and configurations of the connector, explore the [Advanced section of its README](https://github.com/dubzzz/fast-check/tree/main/packages/vitest#advanced).

## Manual setup

Leveraging fast-check within an existing Vitest project doesn't require the use of a connector. In fact, fast-check is designed to be test runner agnostic, making the connector a convenient option for users seeking seamless integration within their existing tooling.

In this section, we'll explore how to set up fast-check directly in your Vitest projects.

### Basic setup

Start by installing the necessary libraries for your project with the following command:

```bash npm2yarn
npm install --save-dev fast-check
```

Congratulations! You're now ready to start exploring Property-Based Testing within Vitest 🚀

While you could begin writing property-based tests now, we recommend some additional setup to enhance integration and maximize the benefits of fast-check within Vitest.

### Recommended setup

As Property-Based Tests can take longer to run compared to other tests, it's recommended to adjust their time allocation appropriately. In this section, we'll focus on ensuring that property-based tests stay within the time constraints set for all your other tests. While it might be tempting to specify separate time limits for them, we recommend letting them run with the same time limit as any other tests, especially in Continuous Integration environments.

To globally apply our setup across all tests, Vitest provides a mechanism for executing setup files before tests start running. If you haven't already created a setup file, you can do so as follows:

```ts title="vitest.config.ts"
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./vitest.setup.ts'],
  },
});
```

Now that we have the setup file in place, let's configure fast-check:

```ts title="vitest.setup.ts"
import fc from 'fast-check';
fc.configureGlobal({ interruptAfterTimeLimit: 5_000 });
```

With this setup, we ensure that fast-check stops any running property-based tests that exceed the 5-second limit, which is [the default time limit in Vitest](https://vitest.dev/config/#testtimeout).

:::tip Checking the setup

You can confirm that the setup has been properly applied to your test files by using the following temporary test and running the tests:

```ts
import { test, expect } from 'vitest';
import fc from 'fast-check';

test('fast-check properly configured', () => {
  expect(fc.readConfigureGlobal()).toEqual({ interruptAfterTimeLimit: 5_000 });
});
```

:::

:::warning Multiple time limits

Unlike the implementation provided by `@fast-check/vitest`, the global setup documented above does not automatically adapt itself to test-dependent time limits. In other words, our documented setup will ignore any customized time limit directly defined at test level via `test(label, fn, timeout)`.
:::

You can even customize this setup further by instructing fast-check to run tests until they reach a specified time limit. While this approach might not be suitable for general Continuous Integration environments, it can be valuable in fuzzing-like CI pipelines. In such cases, you'll want to increase the number of runs passed to fast-check to an arbitrarily high value, such as `numRuns: Number.POSITIVE_INFINITY`.

### Your first test

Since we're not using a specific connector, there's no direct integration of fast-check within Vitest. Instead, writing a property-based test will largely follow your usual Vitest practices, with the test's content calling fast-check to generate inputs and expectations.

```ts title="isSubstring.spec.ts"
import { test, expect } from 'vitest';
import fc from 'fast-check';

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

You've connected your first Property-Based Test within Vitest 🚀

### Your first asynchronous test

Now that we've covered synchronous tests, let's explore how to integrate an asynchronous one. The key difference here is that `fc.property` does not handle asynchronous predicates, so we'll use its asynchronous counterpart, `fc.asyncProperty`.

```ts title="queue.spec.ts"
import { test, expect } from 'vitest';
import { vi } from 'vitest';
import fc from 'fast-check';

test('should resolve in call order', async () => {
  await fc.assert(
    fc.asyncProperty(fc.scheduler(), async (s) => {
      // Arrange
      const pendingQueries = [];
      const seenAnswers = [];
      const call = vi.fn().mockImplementation((v) => Promise.resolve(v));

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

You've connected your first asynchronous Property-Based Test within Vitest 🚀

### Going further

Now that you have a solid foundation, it's time to delve deeper into the world of property-based testing. Our official documentation covers a range of advanced topics, from [generating custom values](/docs/core-blocks/arbitraries/) tailored to your specific needs to exploring [advanced patterns](/docs/advanced/).

By diving into these resources, you'll gain a deeper understanding of fast-check's capabilities and unlock new possibilities for enhancing your testing workflow. Continue your exploration and elevate your property-based testing skills to new heights.
