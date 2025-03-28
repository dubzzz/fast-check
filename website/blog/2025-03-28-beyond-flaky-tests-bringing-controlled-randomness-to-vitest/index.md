---
title: Beyond flaky tests — Bringing Controlled Randomness to Vitest
authors: [dubzzz]
tags: [vitest]
---

Random failures in tests are frustrating and time-consuming to debug. What if your test runner could help eliminate flaky tests by safely handling randomness? In this article, we explore a new approach to testing that integrates built-in fuzzing directly into Vitest, making tests more reliable, reproducible, and robust.

<!--truncate-->

## A hidden threat in your tests

Have you ever encountered a test that randomly fails, seemingly without reason? It works perfectly for months, then suddenly, one day, it breaks, then it passes on next runs. If you have a large test suite, chances are you've already experienced this frustration.

Take a look at the following test:

```ts
test('considered active if its end timestamp is 100ms after now', () => {
  // Arrange
  const now = Date.now();
  const user: User = {
    // many other fields...
    endDateTimestamp: Date.now() + 100,
  };

  // Act
  const active = isStillActive(user, now);

  // Assert
  expect(active).toBe(true);
});
```

It looks stable, but in reality, it’s a ticking time bomb. The reason? `Date.now()` is not monotonic — it can go backwards in time, especially when dealing with negative leap seconds. The test is subtly fragile, and when it fails, debugging the issue can take hours or days or even years.

## The problem: Uncontrolled randomness

While depending on random or non-deterministic values in tests is generally discouraged, developers frequently use timestamps, random numbers, unique IDs, or even generated values from libraries like [Faker](https://fakerjs.dev/) without realizing the risks.

The core issue? These values are inherently non-reproducible, making debugging a nightmare when a test fails unexpectedly.

## The proposal: Built-in fuzzing with stability in mind

What if your test runner could automatically handle randomness safely, ensuring reproducibility without requiring you to adopt an entirely new testing paradigm? What if you could enjoy the benefits of randomized testing without the headaches?

We suggest integrating a built-in solution for handling randomness directly within [Vitest](https://vitest.dev/). It could provide a safety net against hidden instability while keeping the door opened for more advanced patterns such as property-based testing.

### How it works?

With our experimental library `@fast-check/vitest`, we've introduced a simple way to manage randomness safely and reproducibly within your tests. Instead of relying on uncontrolled random calls, you can use `g`, a generator function, as follows:

```ts
// import { test, fc } from '@fast-check/vitest';

test('considered active if its end timestamp is 100ms after now', ({ g }) => {
  // Arrange
  const now = g(fc.nat);
  const user: User = {
    // many other fields...
    endDateTimestamp: now + 100,
  };

  // Act
  const active = isStillActive(user, now);

  // Assert
  expect(active).toBe(true);
});
```

This simple change eliminates flakiness while maintaining the ease of writing tests. The best part? Everything stays deterministic and reproducible — any failure can be traced back to its exact random value and seed.

### Seamless integration with Faker

Care about more realistic random values? No problem. You can integrate `g` with libraries like Faker to generate lifelike test data without losing control over randomness:

```ts
import { Faker, base } from '@faker-js/faker';

test('the name of your test', ({ g }) => {
  const faker = new Faker({
    locale: base,
    randomizer: {
      next: () => g(fc.nat, { max: 0xffffffff }) / 0x100000000,
      seed: () => {},
    },
  });
  // Your test...
});
```

### Pushing further with race conditions

What’s more unpredictable than random values? Race conditions. They’re among the hardest bugs to detect and reproduce. But what if this new primitive could help you catch them for free?

Consider a `queue` function that ensures function calls are executed sequentially. This is our prime candidate for race conditions, and we provide a full guide on detecting them with property-based testing [here](https://fast-check.dev/docs/tutorials/detect-race-conditions/).

So let’s build a simple test that looks like a standard unit test but catching race conditions with no tears:

```js
test('queued calls are resolved in proper order', async ({ g }) => {
  // Arrange
  const s = g(fc.scheduler);
  const sourceFun = (v) => Promise.resolve(v);
  const queuedFun = queue(s.scheduleFunction(sourceFun));

  // Act
  const onSuccess = vi.fn();
  const p1 = queuedFun(1).then(onSuccess);
  const p2 = queuedFun(2).then(onSuccess);
  const p3 = queuedFun(3).then(onSuccess);
  await s.waitFor(Promise.all([p1, p2, p3]));

  // Assert
  expect(onSuccess).toHaveBeenNthCalledWith(1, 1);
  expect(onSuccess).toHaveBeenNthCalledWith(2, 2);
  expect(onSuccess).toHaveBeenNthCalledWith(3, 3);
});
```

In the test above, we wrap our function `sourceFun` — which simply returns the received input — with `s.scheduleFunction`. Instead of resolving immediately, this wrapped function will only resolve when the scheduler — `s` — decides it should.

This means that if multiple calls are fired simultaneously, the scheduler can intentionally reorder their resolution, mimicking real-world race conditions. The test ensures that the calls complete in the correct order, and we release all scheduled executions by calling `s.waitFor(<promise>)`. The ordering is the choice of `s`.

## Bringing this to Vitest?

We believe this approach is crucial for making tests more stable, reproducible, and robust across the ecosystem. The need for random or fake data in tests isn't new, but without proper tooling, it often leads to flakiness and unreliable results.

Our goal isn’t to keep this feature confined to @fast-check/vitest — we want it to be natively integrated into Vitest as a first-class feature.

Imagine being able to safely use random data in your tests without worrying about flakiness. Imagine running `vitest --fuzz=<num_samples>` to automatically validate your code across multiple randomized inputs — without modifying a single test, simply because randomness was introduced intentionally.

To get there, we need your support:

- Upvote and contribute to the discussion on [vitest#2212](https://github.com/vitest-dev/vitest/discussions/2212).
- Share your feedback on [fast-check#5845](https://github.com/dubzzz/fast-check/discussions/5845).

## Next steps

There are still challenges to address before full integration:

- Better handling of global timeouts.
- A native fuzz mode (e.g., `vitest --fuzz=100`) for running tests multiple times with different inputs.
- Enhanced support for passing custom flags to fast-check.
- A way to support property-based tests natively without requiring `test.prop` or `test.fuzz`.
