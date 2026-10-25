# Properties for components and browser journeys

## Choose observable contracts

- **✅ Do** generate props, input values, or user actions around a visible invariant: selection survives filtering, undo restores state, or stale results never replace newer ones.
- **✅ Do** keep UI properties for rendering, event wiring, focus, persistence, and navigation.
- **👍 Prefer** testing complex domain logic broadly in pure functions too.
- **✅ Do** keep named examples and fixed screenshots for important journeys and visual states.
- **❌ Don't** treat random screenshots or DOM snapshots as proof of visual correctness.
- **✅ Do** use these v5 recipes with the project's runner; read [version compatibility](version-compatibility.md) for older projects.

For design-system components:

| Generate                                  | Assert                                                 |
| ----------------------------------------- | ------------------------------------------------------ |
| Labels, variants, and activation attempts | Disabled controls never activate                       |
| Keyboard and pointer action sequences     | Equivalent activation has the same visible effect      |
| Toggle, select, and dismiss sequences     | ARIA state agrees with visible state after each action |

- **✅ Do** remove a relevant event guard or state update temporarily, observe red, restore it, and observe green.

## Component: a sequence of interactions

Example contract: `Counter` starts at zero, accepts `max`, exposes a numeric `status`, and has `Increment`/`Decrement` buttons. Both stay enabled; clicks at a boundary leave the value unchanged.

- **✅ Do** derive the model from the public contract, independently of the component's update algorithm.
- **👍 Prefer** a consequential application contract when adapting this small example.
- **✅ Do** use the project's DOM environment and import the real component.

```js
import { createElement } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import * as fc from 'fast-check';
import { Counter } from './Counter.js';
```

- **✅ Do** put setup and cleanup inside the predicate, including shrinking evaluations.
- **❌ Don't** assume runner `beforeEach`/`afterEach` hooks surround each fast-check evaluation.

```js
function counterProperty(CounterUnderTest) {
  // 30 actions is an execution budget for this UI recipe, not a domain limit.
  const actions = fc.array(fc.constantFrom('Increment', 'Decrement'), { maxLength: 30, size: 'max' });
  return fc.property(actions, async (sequence) => {
    const user = userEvent.setup();
    try {
      // Arrange: a fresh component and model for every evaluation.
      render(createElement(CounterUnderTest, { max: 3 }));
      const transitions = { Increment: [1, 2, 3, 3], Decrement: [0, 0, 1, 2] };
      let expected = 0;
      expect(screen.getByRole('status').textContent).toBe(String(expected));

      for (const action of sequence) {
        // Act: use the public interface, not component internals.
        await user.click(screen.getByRole('button', { name: action, exact: true }));
        expected = transitions[action][expected];

        // Assert after every action, not only at the end of the journey.
        expect(screen.getByRole('status').textContent).toBe(String(expected));
      }
    } finally {
      cleanup();
    }
  });
}
```

```js
it('should follow the bounded counter model after every interaction', async () => {
  await fc.assert(counterProperty(Counter), { numRuns: 40 });
});
```

- **✅ Do** await async queries or `waitFor` assertions.
- **❌ Don't** put clicks or other side effects inside `waitFor`.
- **✅ Do** settle or cancel pending work before cleanup; restore timers, spies, handlers, and globals.
- **❌ Don't** run concurrent properties against shared DOM or global mocks.
- **👍 Prefer** `fc.commands` with `fc.asyncModelRun` when action availability depends on model state.
- **✅ Do** base command preconditions on the model and give commands useful `toString()` descriptions.
- **❌ Don't** discard a case because the application produced a failing result.

## Browser/E2E: preserve the same property

- **✅ Do** run fast-check in the Playwright process and drive the application through browser actions.
- **✅ Do** adapt the route and locators below. The example assumes `baseURL` serves `/counter?max=3` with the same contract.

```js
import { test, expect } from '@playwright/test';
import * as fc from 'fast-check';

test('counter follows its model across user journeys', async ({ browser, baseURL }) => {
  // Include setup and all generated journeys in this test's budget.
  test.setTimeout(120_000);
  const actions = fc.array(fc.constantFrom('Increment', 'Decrement'), { maxLength: 20, size: 'max' });
  await fc.assert(
    fc.property(actions, async (sequence) => {
      // A new context isolates cookies and browser storage for each evaluation.
      const context = await browser.newContext({ baseURL });
      try {
        const page = await context.newPage();
        // Bound each action so a missing element fails before the runner deadline.
        page.setDefaultTimeout(5_000);
        await page.goto('/counter?max=3');
        const transitions = { Increment: [1, 2, 3, 3], Decrement: [0, 0, 1, 2] };
        let expected = 0;
        await expect(page.getByRole('status')).toHaveText(String(expected));

        for (const action of sequence) {
          await page.getByRole('button', { name: action, exact: true }).click();
          expected = transitions[action][expected];
          await expect(page.getByRole('status')).toHaveText(String(expected));
        }
      } finally {
        await context.close();
      }
    }),
    // Report the first counterexample promptly; minimize it in a separate run.
    { numRuns: 20, endOnFailure: true },
  );
});
```

- **✅ Do** treat run count and sequence length as measured exploration budgets, not application requirements.
- **✅ Do** use `size: 'max'` to make the full bounded length range available; `maxLength` alone does not guarantee that range with default sizing.
- **❌ Don't** narrow the domain to make a failing property pass.
- **👍 Prefer** `endOnFailure: true` for expensive journeys: retain the first failing sequence, seed, and path promptly.
- **✅ Do** replay first, then minimize from that seed/path with `endOnFailure: false` and a separate shrinking budget.
- **❌ Don't** rely on the runner timeout for replay evidence; it can expire before fast-check reports. Read [execution and limits](execution-and-limits.md).
- **✅ Do** isolate backend data per evaluation and dispose of it in `finally`.
- **❌ Don't** assume a new browser context resets the server, or that `page.reload()` clears persistent storage.
- **❌ Don't** run destructive generated journeys against production.
- **✅ Do** exercise real services when integration is the subject; stub unrelated dependencies at controlled boundaries.
- **👍 Prefer** locator waiting and web-first assertions over fixed sleeps.
- **✅ Do** record seed, path, sequence, application version, and relevant Playwright traces. A browser retry is not replay.
- **✅ Do** control response delivery for [race properties](async-and-races.md).
- **❌ Don't** assume scheduling `page.click()` controls the requests or application work it triggers.
