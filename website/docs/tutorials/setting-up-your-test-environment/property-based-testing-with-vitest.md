---
sidebar_position: 2
slug: /tutorials/setting-up-your-test-environment/property-based-testing-with-vitest/
description: Discover how to configure the integration of Property-Based Testing capabilities within Vitest. Learn best practices to setup fast-check for it
sidebar_label: With Vitest
---

# Property Based Testing with Vitest

Integrating Property Based Testing capabilities within [Vitest](https://vitest.dev/) can be easily achieved using fast-check.

While fast-check is a standalone library that works with any test runner out of the box, we recommend using our dedicated connector library [@fast-check/vitest](https://npmx.dev/package/@fast-check/vitest) when working with Vitest. The connector provides a bulletproof integration that takes care of timeouts, lifecycle hooks and configuration for you. It makes it the safest and simplest path to run property-based testing in Vitest.

Best of all, the connector simply provides an enriched version of Vitest's `test` and `it` functions. This means you can incrementally plug it into an existing test suite without any need to rewrite anything. You can just swap the import from vitest with the one from @fast-check/vitest and later start playing with adding `.prop` where it matters.

:::info You don't have Vitest yet?

If you don't have Vitest yet, we recommend you to have a look at their official [Getting Started Guide](https://vitest.dev/guide/) first.
:::

## Setup

Start by installing the necessary libraries for your project with the following command:

```bash npm2yarn
npm install --save-dev fast-check @fast-check/vitest
```

Congratulations, everything is ready to start plugging some Property-Based Tests within Vitest 🚀

## Your first test

Now that everything is ready, let's write a simple property-based test to ensure everything works properly. First, let's create a new test file that includes both the code and the test for the sake of clarity and conciseness.

The connector supports two syntaxes for defining property inputs:

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

In the above specification file, note that we didn't rely on the `it` or `test` functions from `vitest`. Instead, we imported them from `@fast-check/vitest`. These imported functions handle everything supported by Vitest's `it` and `test`, while also extending them with Property-Based Testing capabilities via `.prop`. Synchronous and asynchronous predicates are both supported without any extra helpers — just mark your predicate `async` when needed.
:::

## Detecting race conditions

One of the most powerful features of fast-check is its ability to detect race conditions. The connector makes this straightforward — use `fc.scheduler()` as an arbitrary to control the resolution order of asynchronous operations:

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

Learn more about this technique in our dedicated tutorial on [detecting race conditions](/docs/tutorials/detect-race-conditions/).

## One-time random mode

Beyond full property-based testing, the connector provides a lightweight mode for introducing controlled randomness into your tests — without running them multiple times or shrinking on failure. This is particularly useful when you need random values but want failures to remain deterministic and reproducible.

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

## Using test modifiers

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

## Hook integration

Vitest's `beforeEach` and `afterEach` hooks are natively integrated with the connector. They are called before and after each execution of the predicate. If a property runs _n_ times, `beforeEach` will be invoked _n_ times before it and `afterEach` _n_ times after it.

:::note

Cleanup functions returned by `beforeEach` on the first predicate execution are deferred until the end of the test, as they are handled by Vitest's own teardown mechanism. All other cleanups run between predicate executions as expected.
:::

## Going further

For more advanced options and configurations of the connector, explore the [Advanced section of its README](https://github.com/dubzzz/fast-check/tree/main/packages/vitest#advanced).

Now that you have a solid foundation, it's time to delve deeper into the world of property-based testing. Our official documentation covers a range of advanced topics, from [generating custom values](/docs/core-blocks/arbitraries/) tailored to your specific needs to exploring [advanced patterns](/docs/advanced/).

By diving into these resources, you'll gain a deeper understanding of fast-check's capabilities and unlock new possibilities for enhancing your testing workflow. Continue your exploration and elevate your property-based testing skills to new heights.
