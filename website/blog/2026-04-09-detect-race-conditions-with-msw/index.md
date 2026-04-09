---
title: Detect race conditions with MSW and fast-check
authors: [dubzzz]
tags: [tips, race-conditions, integration]
---

Race conditions are among the most elusive bugs in JavaScript. They do not crash reliably, they rarely show up in unit tests, and they depend on timing you cannot control. Yet they affect real users every day — stale data rendered on screen, actions applied to the wrong resource, UI states that should be impossible.

[MSW](https://mswjs.io/) (Mock Service Worker) is the go-to tool for intercepting network requests in tests. fast-check's [`scheduler`](/docs/core-blocks/arbitraries/others/#scheduler) can re-order when promises resolve. This post shows how to combine both so that **fast-check controls the timing of your HTTP responses**, exposing race conditions automatically — without modifying the code under test.

<!--truncate-->

## The bug

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

The code looks correct — and it is, as long as only one call is in flight at a time. But what happens when a user navigates quickly from one profile to another?

```
switchUser("alice")   →  fetch starts  →  …  →  response arrives  →  displayedUser = alice
switchUser("bob")     →  fetch starts  →  response arrives  →  displayedUser = bob
```

If Alice's response is slower than Bob's, the final state is Alice — even though the user last requested Bob. This is a classic **stale-response race condition**, and it is nearly impossible to reproduce with hard-coded mocks because those always resolve in a deterministic order.

## The idea

fast-check ships a [`scheduler`](/docs/advanced/race-conditions/) arbitrary. It generates random orderings for promise resolutions. Each test run tries a different ordering; when one triggers a bug, fast-check reports the exact sequence of events that caused it.

The missing link has always been: _how do I plug the scheduler into code that calls `fetch` directly?_

MSW solves that. It intercepts `fetch` at the network level, so the code under test does not need to accept an injected fetcher. Inside an MSW handler we can call `s.schedule()` to hand control of response timing over to fast-check.

## Wiring MSW and the scheduler

Here is the full test:

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
            // This is the key line:
            // s.schedule() holds the response until the scheduler releases it.
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

1. **`s.schedule(promise, label)`** inside the MSW handler registers a task with the scheduler. The handler `await`s it, which means the HTTP response is held until the scheduler releases it.
2. **`s.waitFor(Promise.all([p1, p2]))`** tells the scheduler to start processing tasks — in a random order — until both `switchUser` calls have completed.
3. **fast-check runs the property many times**, each time with a different random ordering. If any ordering breaks the assertion, it reports it.

### Running the test

```txt
Error: Property failed after 1 tests
{ seed: -40745109, path: "0", endOnFailure: true }
Counterexample: [schedulerFor()`
-> [task${2}] promise::GET /users/bob resolved with value "response for bob"
-> [task${1}] promise::GET /users/alice resolved with value "response for alice"`]

Caused by: AssertionError: expected 'alice' to be 'bob'
```

fast-check found the issue on the very first run. The counterexample tells a clear story: Bob's response arrived first, then Alice's overwrote it.

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

The `scheduled` wrapper intercepts each response, registers it with the scheduler using the HTTP method and pathname as a label, and holds it until the scheduler decides to release it.

:::info Why `s.waitFor` and not `s.waitIdle`?

`waitFor` is designed for frameworks that register promises asynchronously — which is exactly what MSW does. Internally it waits a few microtasks before each scheduling step, giving MSW time to intercept the `fetch` call and enter the handler. `waitIdle` could miss tasks that have not been registered yet.
:::

## Key takeaways

- **No code modification**: MSW intercepts `fetch` at the network level. The code under test uses the real `fetch` API, unchanged.
- **No flaky sleeps**: The scheduler explores orderings deterministically. If a race exists, fast-check will find it and report a minimal counterexample.
- **Reproducible failures**: The `seed` and `path` printed in the error let you replay the exact failing ordering.
- **Incremental adoption**: Start by wrapping one endpoint with `scheduled()`. You do not need to schedule every handler — only the ones involved in the concurrency scenario you are testing.
