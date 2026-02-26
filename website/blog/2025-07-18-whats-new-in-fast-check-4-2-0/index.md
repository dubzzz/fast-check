---
title: What's new in fast-check 4.2.0?
authors: [dubzzz]
tags: [release, scheduler, race-conditions, async-testing]
---

With version 4.2.0, we are re-affirming our will to provide our users with efficient and easy to use primitives around race condition detection. Because race conditions are far from easy to detect and think of we want to make them easy to track. For that reason we decided to introduce two new primitives to help you waiting for the scheduler to be done.

Continue reading to explore the detailed updates it brings.

<!--truncate-->

## Context

When releasing version 4.0.0 of fast-check we decided that having a predictable behaviour on `waitOne` and `waitAll` was key. We thus dropped a subtle gotcha from their respective implementations that was making them dependent on how many micro tasks were to be awaited before scheduling the next ones. While making them more predictive (no threshold effect) it made them harder to use making race condition detection more complex to write. That said primitives like `waitFor` stayed simple to use even they forced our users to build something we can wait for.

## `waitIdle` a better `waitAll`

The newly introduced `waitIdle` provides a simple, efficient and predicable way to wait for all tasks to be scheduled by `fc.scheduler`. It does not come with the gotchas we had on `waitAll` in previous majors while offering an API as easy to use.

Let see how it simplify the flow of checking race conditions:

```ts
import { test, expect } from 'vitest';

test('our test', async () => {
  await fc.assert(
    fc.asyncProperty(fc.scheduler(), async (s) => {
      const fetchIdFor = s.scheduleFunction(async (name) => `id:${name}`);
      const { doStuff, warmup } = buildDoStuff(fetchIdFor);
      await warmup();
      let done = false;
      doStuff('name').then(() => (done = true));
      await s.waitAll();
      expect(done).toBe(true);
    }),
  );
});

// In a real world example, the function below would probably have been defined
// into a dedicated file not being the file holding the test.
function buildDoStuff(fetchIdFor) {
  return {
    doStuff: async function doStuff(name) {
      const { default: executeTaskOnId } = await import('./executor');
      await executeTaskOnId(await fetchIdFor(name));
    },
    warmup: async function warmup(name) {
      await import('./executor');
    },
  };
}
```

This test does not pass. Actually nothing got scheduled in time so `waitAll` ended immediatelly. Calling `s.report()` after the execution of `waitAll` and checking its output confirms it: nothing has been released by the scheduler and the scheduler has not seen any tasks yet. The whole problem is that the call to `fetchIdFor` is delayed a bit too much for `waitAll` to see it. Overall `waitAll` makes the test harder to reason about as it may trigger failures for non obvious reasons that depends on micro-tasks.

With `waitIdle`, the test would have passed. The call would have been triggered and we would have scheduled all the expected tasks including the one from our call to `fetchIdFor`.

## `waitNext` a better `waitOne`

With the same idea as `waitIdle`, we created `waitNext`. Instead of waiting for everything to be done, it waits for exactly N tasks to be scheduled no matter which ones. It can be seen as a better `waitOne` adding the ability to wait for things to be really scheduled and based on a count.

## Changelog since 4.1.0

The version 4.2.0 is based on version 4.1.1, but let see what's changed since 4.1.0 itself.

### Features

- ([PR#5953](https://github.com/dubzzz/fast-check/pull/5953)) Do not silent errors popping in `act`
- ([PR#5890](https://github.com/dubzzz/fast-check/pull/5890)) Introduce new awaiter on our `scheduler`
- ([PR#6016](https://github.com/dubzzz/fast-check/pull/6016)) Introduce `waitIdle`, a revamped `waitAll` for `scheduler`
- ([PR#6026](https://github.com/dubzzz/fast-check/pull/6026)) Deprecate `waitOne` and `waitAll`

### Fixes

- ([PR#5900](https://github.com/dubzzz/fast-check/pull/5900)) Bug: Avoid overlapping tasks during `scheduler` execution
- ([PR#5903](https://github.com/dubzzz/fast-check/pull/5903)) CI: Only run coverage for ubuntu on node 22
- ([PR#5904](https://github.com/dubzzz/fast-check/pull/5904)) CI: Shard Vitest execution on Windows runners
- ([PR#5907](https://github.com/dubzzz/fast-check/pull/5907)) CI: Always publish on pkg-pr-new
- ([PR#5935](https://github.com/dubzzz/fast-check/pull/5935)) CI: Get rid of LFS storage
- ([PR#5936](https://github.com/dubzzz/fast-check/pull/5936)) CI: Safer and faster static assets with hash checks
- ([PR#5943](https://github.com/dubzzz/fast-check/pull/5943)) CI: Stop stale from closing validated ideas
- ([PR#5954](https://github.com/dubzzz/fast-check/pull/5954)) CI: Make poisoning test compatible with Node 24
- ([PR#5969](https://github.com/dubzzz/fast-check/pull/5969)) CI: Measure coverage on Mac OS
- ([PR#5971](https://github.com/dubzzz/fast-check/pull/5971)) CI: Better exclusion list for Vitest
- ([PR#5989](https://github.com/dubzzz/fast-check/pull/5989)) CI: Attempt to stabilize tests
- ([PR#5894](https://github.com/dubzzz/fast-check/pull/5894)) Doc: Release note for 4.1.0
- ([PR#5937](https://github.com/dubzzz/fast-check/pull/5937)) Doc: Reference social media links on blog authors
- ([PR#5938](https://github.com/dubzzz/fast-check/pull/5938)) Doc: Fix social images on /docs and /blog
- ([PR#5965](https://github.com/dubzzz/fast-check/pull/5965)) Doc: update stringMatching docs
- ([PR#5966](https://github.com/dubzzz/fast-check/pull/5966)) Doc: Fix typo in model-based-testing.md
- ([PR#6015](https://github.com/dubzzz/fast-check/pull/6015)) Doc: Add new contributor matthyk
- ([PR#5973](https://github.com/dubzzz/fast-check/pull/5973)) Test: Drop unused checks in tests
- ([PR#6019](https://github.com/dubzzz/fast-check/pull/6019)) Test: Stop testing against Node 18
- ([PR#5901](https://github.com/dubzzz/fast-check/pull/5901)) Performance: Slightly faster `scheduler` with explicit `undefined` check
