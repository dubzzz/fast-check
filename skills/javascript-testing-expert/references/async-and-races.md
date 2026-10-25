# Async behavior and race conditions

- **✅ Do** look for order-dependent failures in search, autosave, caches, queues, cancellation, retries, and concurrent updates: stale results, lost writes, or inconsistent published state.
- **✅ Do** name the contract first: latest request wins, call order is preserved, updates are never lost, or published state stays consistent.

## Control the boundary that creates the race

- **✅ Do** inject a deterministic dependency and wrap it with `s.scheduleFunction(dependency)` to vary response delivery while keeping responses reproducible.
- **❌ Don't** assume it delays the dependency's initial side effects: the dependency runs immediately; the scheduler controls promise delivery.
- **✅ Do** place a scheduled gate before a write, or inject storage, when testing write order. Wrapping an already-completed write only varies acknowledgement order.
- **✅ Do** start overlapping operations before waiting for them; awaiting each in turn prevents the race.
- **❌ Don't** await scheduled work without driving the scheduler; that can deadlock.
- **👍 Prefer** `await s.waitFor(completion)` to drive the scheduler until the operation finishes. The completion promise must include all relevant work and state updates.
- **✅ Do** use `waitIdle()` to drain scheduled work only when no relevant future task depends on an uncontrolled event.
- **✅ Do** inspect intermediate observations as well as the final result; a briefly published stale value can be a bug.
- **✅ Do** vary operation counts and shared-resource client counts to expose contention that two calls on one instance may miss.
- **✅ Do** interleave user actions with response deliveries while preserving each user's action order. A burst of calls before any response explores only one interaction pattern.

## Recipe: only the latest requested result may be published

Example contract: `createSearch({ lookup, publish })` returns `search(query)`. Each call starts a lookup; only the latest requested result may be published. Its promise settles after publication or discard.

`scheduleSequence` preserves the user's query order while allowing responses between actions. An earlier result is valid before the next request starts, so record which query was latest at each publication.

- **✅ Do** import the real application implementation and await `fc.assert` so the test waits for exploration and reports its failures.
- **👍 Prefer** two distinct fixed queries to isolate response ordering; generate queries and action sequences separately when they matter.
- **✅ Do** use [version compatibility](version-compatibility.md) to adapt scheduler and predicate APIs for older projects.

```ts
import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';
import { createSearch } from './search.js';

describe('createSearch', () => {
  it('should publish only the latest requested result despite response order', async () => {
    await fc.assert(latestRequestProperty(createSearch));
  });
});

// Helpers
function latestRequestProperty(factory: typeof createSearch) {
  return fc.property(fc.scheduler(), async (s) => {
    // Arrange: recreate all application state for every run and shrink attempt.
    let latestQuery = '';
    const published: { value: string; expected: string }[] = [];
    const requests: Promise<unknown>[] = [];
    const errors: unknown[] = [];
    const search = factory({
      lookup: s.scheduleFunction(async (query: string) => `result:${query}`),
      publish: (value) => {
        published.push({ value, expected: `result:${latestQuery}` });
      },
    });

    // Act: user actions and response deliveries compete for the next scheduled step.
    const sequence = s.scheduleSequence(
      ['older', 'latest'].map((query) => ({
        label: `search(${query})`,
        builder: async () => {
          latestQuery = query;
          // Start the request; awaiting it here would block response delivery.
          requests.push(
            search(query).catch((error) => {
              errors.push(error);
            }),
          );
        },
      })),
    );
    // Finish issuing actions before collecting all started request completions.
    const status = await s.waitFor(sequence.task);
    await s.waitFor(Promise.all(requests));

    // Assert: sequence.task resolves even when a builder fails, so check its status.
    expect(status).toEqual({ done: true, faulty: false });
    expect(errors).toEqual([]);
    for (const { value, expected } of published) expect(value).toBe(expected);
    expect(published[published.length - 1]?.value).toBe('result:latest');
  });
}
```

- **✅ Do** confirm this property catches missing stale-response protection: observe the intended failure with protection absent, then green with protection restored.
- **✅ Do** record observations in application callbacks and assert afterward; application error handling could swallow assertions thrown inside those callbacks.
- **✅ Do** cover rejection, cancellation, and later batches when supported; assert their specified effect on published state and pending work.
- **✅ Do** generate dependency successes and failures independently of delivery order. Check the settled observable state, including cleared loading indicators and recovery when promised.
- **✅ Do** define what a failed latest request should display before asserting it.
- **❌ Don't** leave expected rejections or detached promises unhandled; await or catch them so failures are attributed to this evaluation.

## Components, browsers, and stateful systems

- **✅ Do** wrap React updates with async `act`, through `fc.scheduler({ act })` or the wait method's `act` argument, so assertions see committed UI updates.
- **❌ Don't** await a UI query that needs a held response before advancing the scheduler; the query cannot succeed until that response is released.
- **❌ Don't** assume a test-process scheduler controls browser events, network, timers, or another process.
- **✅ Do** confirm intercepted browser requests have arrived, generate their delivery order, then assert UI state after each release.
- **✅ Do** retain real integration tests to check wiring that controlled dependencies bypass; state which boundary each generated test controls.
- **❌ Don't** substitute random sleeps, network latency, or retries for controlled scheduling; failing orders become unreliable to reproduce.
- **✅ Do** interleave explicit clock advances with response deliveries for debounce, retries, or polling; flushing all timers first misses these interactions. The scheduler does not advance timers.
- **✅ Do** restore real timers after each evaluation so later tests do not inherit the simulated clock.
- **👍 Prefer** `fc.commands` and `fc.asyncModelRun` for longer workflows; compare each action's result with a small model of the public contract.
- **❌ Don't** use `fc.scheduledModelRun` when a scheduled command waits for another task held by the same scheduler; that dependency can deadlock.
- **✅ Do** decide whether a command is valid from the model, then assert the application's resulting state; a broken application must not decide which checks to skip.
- **✅ Do** recreate model and system for every evaluation so each generated sequence and shrink attempt starts from the specified initial state.

## Reproduce and keep the failure

- **✅ Do** save the scheduler trace alongside the counterexample; use the [replay steps](properties-and-replay.md#replay-an-observed-failure) to reproduce it before fixing the race.

- **✅ Do** keep the failing order as a small `fc.schedulerFor` regression alongside the generated property, covering the known bug while exploration continues.
- **❌ Don't** replace application assertions with scheduler-order assertions; delivering responses in an order does not prove the application handled them correctly.
- **❌ Don't** claim exhaustive race coverage from sampled controlled interleavings.
- **✅ Do** use [execution hooks and limits](execution-and-limits.md) to clean up pending work and bound exploration without losing the counterexample report.
