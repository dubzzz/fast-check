# Async behavior and race conditions

- **✅ Do** look for race properties in search, autosave, caches, queues, cancellation, retries, and concurrent updates.
- **✅ Do** name the contract first: latest request wins, call order is preserved, updates are never lost, or published state stays consistent.

## Control the boundary that creates the race

- **✅ Do** inject a deterministic dependency and wrap it with `s.scheduleFunction(dependency)`.
- **❌ Don't** assume it delays the dependency's initial side effects: the dependency runs immediately; the scheduler controls promise delivery.
- **✅ Do** place a scheduled gate before a write, or inject storage, when testing write order. Wrapping an already-completed write only varies acknowledgement order.
- **✅ Do** start overlapping operations before waiting for them.
- **❌ Don't** await scheduled work without driving the scheduler; that can deadlock.
- **👍 Prefer** `await s.waitFor(completion)` when completion includes all relevant work and state updates.
- **✅ Do** use `waitIdle()` only when all relevant work is scheduled or reachable from scheduled tasks.
- **✅ Do** inspect intermediate observations as well as the final result; a briefly published stale value can be a bug.

## Recipe: only the latest requested result may be published

Example contract: `createSearch({ lookup, publish })` returns `search(query)`. Each call starts a lookup; only the latest requested result may be published. Its promise settles after publication or discard.

- **✅ Do** adapt the application import and always await `fc.assert`.
- **👍 Prefer** two distinct fixed queries to isolate response ordering; generate queries and action sequences separately when they matter.
- **✅ Do** use this v5 recipe; read [version compatibility](version-compatibility.md) for older projects.

```ts
import { expect, it } from 'vitest';
import * as fc from 'fast-check';
import { createSearch } from './search.js';

it('should publish only the latest requested result despite response order', async () => {
  await fc.assert(latestRequestProperty(createSearch));
});

// Helpers
function latestRequestProperty(factory: typeof createSearch) {
  return fc.property(fc.scheduler(), async (s) => {
    // Arrange: recreate all application state for every run and shrink attempt.
    const published: string[] = [];
    const lookup = s.scheduleFunction(async (query: string) => `result:${query}`);
    const search = factory({ lookup, publish: (value) => published.push(value) });

    // Act: both requests are in flight before releasing either response.
    const older = search('older');
    const latest = search('latest');
    await s.waitFor(Promise.all([older, latest]));

    // Assert: inspect the history, not just the final value.
    expect(published).toContain('result:latest');
    expect(published).not.toContain('result:older');
  });
}
```

- **✅ Do** remove stale-response protection, observe the intended failure, restore it, and observe green.
- **✅ Do** add rejection, cancellation, and multiple batches when required by the contract.
- **✅ Do** define what a failed latest request should display before asserting it.
- **❌ Don't** leave expected rejections or detached promises unhandled.

## Components, browsers, and stateful systems

- **✅ Do** wrap React updates with async `act`, through `fc.scheduler({ act })` or the wait method's `act` argument.
- **❌ Don't** await a UI query that needs a held response before advancing the scheduler.
- **✅ Do** unmount and restore stubs in `finally` inside each predicate.
- **❌ Don't** assume a test-process scheduler controls browser events, network, timers, or another process.
- **✅ Do** confirm intercepted browser requests have arrived, generate their delivery order, then assert UI state after each release.
- **✅ Do** retain real integration tests and state which boundary the generated test controls.
- **❌ Don't** substitute random sleeps, network latency, or retries for controlled scheduling.
- **✅ Do** explicitly advance and restore fake timers; the scheduler does not advance them.
- **👍 Prefer** `fc.commands` and `fc.asyncModelRun` with a small independent model for longer workflows.
- **❌ Don't** use `fc.scheduledModelRun` when a scheduled command waits for another task held by the same scheduler.
- **✅ Do** check preconditions against the model, assert after transitions, and recreate model and system for every evaluation.

## Reproduce and keep the failure

- **✅ Do** retain the seed, path, counterexample, and scheduler trace.
- **✅ Do** replay with the same arbitraries, configuration, and fast-check version.

```ts
await fc.assert(latestRequestProperty(createSearch), {
  seed: reportedSeed,
  path: reportedPath,
  endOnFailure: true,
});
```

- **✅ Do** keep a small regression with `fc.schedulerFor` alongside the generated property.
- **❌ Don't** replace assertions about application behavior with assertions about scheduler order.
- **❌ Don't** permanently pin the exploratory property to one seed.
- **❌ Don't** claim exhaustive race coverage from sampled controlled interleavings.
- **✅ Do** read [execution hooks and limits](execution-and-limits.md) for per-evaluation lifecycle plugins and bounded exploration/shrinking.
