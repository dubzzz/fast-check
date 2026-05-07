---
sidebar_position: 1
slug: /guides/one-time-random-mode/
title: One-time random mode
description: Introduce controlled, reproducible randomness into example-based Vitest tests.
---

# One-time random mode

This mode extends Vitest's default `test` and `it` functions with a `g`
helper, allowing you to introduce controlled randomness into your tests
while ensuring failures remain reproducible. This makes it easier to
debug flaky tests and avoid irreproducible failures due to randomness.

Unlike property-based testing, this mode does not run tests multiple
times or attempt shrinking when failures occur. Instead, it provides a
deterministic way to introduce randomness when needed.

```ts
import { test, fc } from '@fast-check/vitest';
import { expect } from 'vitest';

test('test relying on randomness', ({ g }) => {
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

test('test not relying on randomness', () => {
  // your test
});
```

## Forcing a replay

Provide a fixed seed via `fc.configureGlobal({ seed })` to force a replay.
You can also disable shrinking with
`fc.configureGlobal({ endOnFailure: false })`, or combine the two.
