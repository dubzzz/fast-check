---
title: Detect race conditions with MSW and fast-check
authors: [dubzzz]
tags: [tips, race-conditions, integration]
---

You already mock your API calls with [MSW](https://mswjs.io/). Your tests cover the happy path, edge cases, maybe even error scenarios. But there is one class of bugs they will never catch: **race conditions**. Hard-coded mocks always respond in the same order, so timing-dependent bugs stay invisible.

What if you could take those existing MSW handlers and plug in fast-check to **explore every possible response ordering** — automatically? That is exactly what this post is about.

<!--truncate-->

## A test that passes — but shouldn't

Consider a simple helper that fetches and displays a user profile:

```ts
type UserProfile = { id: string; name: string };

let displayedUser: UserProfile | null = null;

export async function switchUser(userId: string): Promise<void> {
  const res = await fetch(`https://api.example.com/users/${userId}`);
  const data: UserProfile = await res.json();
  displayedUser = data;
}
```

A typical MSW-based test would set up a handler, call `switchUser`, and assert the result. That test passes because MSW always delivers responses in the same order. But in production, two rapid navigations can overlap:

```
switchUser("alice")   →  fetch starts  →  …  →  response arrives  →  displayedUser = alice
switchUser("bob")     →  fetch starts  →  response arrives  →  displayedUser = bob
```

If Alice's response is slower than Bob's, the final state is Alice — even though the user last requested Bob. This is a classic **stale-response race condition**.

## From MSW mock to race condition detector

fast-check ships a [`scheduler`](/docs/advanced/race-conditions/) arbitrary. It generates random orderings for promise resolutions: each test run tries a different ordering, and when one triggers a bug, fast-check reports the exact sequence of events that caused it.

The key insight is that MSW and the scheduler can be connected with a single line. Inside an MSW handler, call `s.schedule()` to hand control of response timing over to fast-check:

```ts
http.get('https://api.example.com/users/:id', async ({ params }) => {
  const id = params['id'] as string;
  // This single line is all you need:
  // it holds the response until the scheduler releases it
  await s.schedule(Promise.resolve(`response for ${id}`), `GET /users/${id}`);
  return HttpResponse.json({ id, name: `User ${id}` });
})
```

The handler still runs immediately when `fetch` is called — but it pauses before returning the response. The scheduler decides _when_ each paused handler gets to continue, trying a different order on every run.

## The full test

Here is what the complete test looks like:

```ts
import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import fc from 'fast-check';
import { switchUser, getDisplayedUser, reset } from './UserProfileLoader.js';

describe('switchUser', () => {
  it('should display the last requested user', async () => {
    await fc.assert(
      fc.asyncProperty(fc.scheduler(), async (s) => {
        reset();

        const server = setupServer(
          http.get('https://api.example.com/users/:id', async ({ params }) => {
            const id = params['id'] as string;
            await s.schedule(Promise.resolve(`response for ${id}`), `GET /users/${id}`);
            return HttpResponse.json({ id, name: `User ${id}` });
          }),
        );
        server.listen({ onUnhandledRequest: 'error' });

        try {
          // Fire two requests without awaiting them individually
          const p1 = switchUser('alice');
          const p2 = switchUser('bob');

          // Let the scheduler decide the order responses arrive
          await s.waitFor(Promise.all([p1, p2]));

          // The displayed user must always be the last one requested
          expect(getDisplayedUser()?.id).toBe('bob');
        } finally {
          server.close();
        }
      }),
    );
  });
});
```

Three things make this work:

1. **`s.schedule(promise, label)`** inside the MSW handler registers a task with the scheduler. The handler `await`s it, so the HTTP response is held until the scheduler releases it.
2. **`s.waitFor(Promise.all([p1, p2]))`** tells the scheduler to start processing tasks — in a random order — until both `switchUser` calls have completed.
3. **fast-check runs the property many times**, each time with a different random ordering. If any ordering breaks the assertion, it reports it.

### The counterexample

```txt
Error: Property failed after 1 tests
{ seed: -40745109, path: "0", endOnFailure: true }
Counterexample: [schedulerFor()`
-> [task${2}] promise::GET /users/bob resolved with value "response for bob"
-> [task${1}] promise::GET /users/alice resolved with value "response for alice"`]

Caused by: AssertionError: expected 'alice' to be 'bob'
```

fast-check found the issue on the very first run. The counterexample tells a clear story: Bob's response arrived first, then Alice's overwrote it. The `seed` and `path` let you replay this exact scenario at will.

## The fix

A simple staleness guard solves it:

```ts
let lastRequestedId: string | null = null;

export async function switchUser(userId: string): Promise<void> {
  lastRequestedId = userId;
  const res = await fetch(`https://api.example.com/users/${userId}`);
  const data: UserProfile = await res.json();
  if (lastRequestedId === userId) {
    displayedUser = data;
  }
}
```

With this change the test passes across all orderings — fast-check cannot find a sequence that breaks it.

:::tip AbortController

In production code you would probably also abort the in-flight request using an `AbortController` so the browser does not waste bandwidth on a response nobody cares about. The staleness guard shown here is the minimal fix to illustrate the concept.
:::

## Going further: a reusable `scheduled` helper

Calling `s.schedule()` inside every MSW handler is mechanical. We can extract a small wrapper that does it transparently:

```ts
import type { Scheduler } from 'fast-check';
import type { HttpResponseResolver, DefaultBodyType } from 'msw';

function scheduled<
  Params extends Record<string, string | readonly string[]>,
  RequestBody extends DefaultBodyType,
  ResponseBody extends DefaultBodyType,
>(
  s: Scheduler,
  resolver: HttpResponseResolver<Params, RequestBody, ResponseBody>,
): HttpResponseResolver<Params, RequestBody, ResponseBody> {
  return async (info) => {
    const url = new URL(info.request.url);
    const label = `${info.request.method} ${url.pathname}`;
    await s.schedule(Promise.resolve(label), label);
    return resolver(info);
  };
}
```

With this helper, handlers look exactly like regular MSW handlers — no scheduler knowledge required:

```ts
const server = setupServer(
  http.get(
    'https://api.example.com/users/:id',
    scheduled(s, ({ params }) => {
      const id = params['id'] as string;
      return HttpResponse.json({ id, name: `User ${id}` });
    }),
  ),
);
```

The `scheduled` wrapper intercepts each response, registers it with the scheduler using the HTTP method and pathname as a label, and holds it until the scheduler decides to release it. If you already have MSW handlers defined elsewhere, wrapping them with `scheduled(s, existingResolver)` is all it takes to turn them into race condition detectors.

:::info `@fast-check/vitest` integration

If you use [`@fast-check/vitest`](https://www.npmjs.com/package/@fast-check/vitest), you do not need to restructure your test around `fc.assert` and `fc.asyncProperty`. The extended `test` function injects a `g` helper that can generate a scheduler inline:

```ts
import { test, fc } from '@fast-check/vitest';
import { expect } from 'vitest';

test('should display the last requested user', async ({ g }) => {
  const s = g(fc.scheduler);
  reset();

  const server = setupServer(
    http.get(
      'https://api.example.com/users/:id',
      scheduled(s, ({ params }) => {
        const id = params['id'] as string;
        return HttpResponse.json({ id, name: `User ${id}` });
      }),
    ),
  );
  server.listen({ onUnhandledRequest: 'error' });

  try {
    const p1 = switchUser('alice');
    const p2 = switchUser('bob');
    await s.waitFor(Promise.all([p1, p2]));
    expect(getDisplayedUser()?.id).toBe('bob');
  } finally {
    server.close();
  }
});
```

`g(fc.scheduler)` gives you a `Scheduler` right inside a regular vitest test, with built-in seeding and reproducibility. A single execution will not explore every possible ordering, but it will try a random one — and if it fails, the seed printed in the output lets you replay it deterministically. It is the lightest way to start introducing race condition coverage without committing to full property-based testing upfront.
:::

:::info Why `s.waitFor` and not `s.waitIdle`?

`waitFor` is designed for frameworks that register promises asynchronously — which is exactly what MSW does. Internally it waits a few microtasks before each scheduling step, giving MSW time to intercept the `fetch` call and enter the handler. `waitIdle` could miss tasks that have not been registered yet.
:::

## Key takeaways

- **Build on what you have**: If you already use MSW, you are one wrapper away from race condition detection. Your existing handlers, your existing assertions — just add a scheduler.
- **No code modification**: MSW intercepts `fetch` at the network level. The code under test uses the real `fetch` API, unchanged.
- **No flaky sleeps**: The scheduler explores orderings deterministically. If a race exists, fast-check will find it and report a minimal counterexample.
- **Incremental adoption**: Start by wrapping one endpoint with `scheduled()`. You do not need to schedule every handler — only the ones involved in the concurrency scenario you are testing.
