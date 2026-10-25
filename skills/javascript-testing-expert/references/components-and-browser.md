# Properties for components and browser journeys

## Choose observable contracts

- **✅ Do** generate props, input values, or user actions around a visible invariant: selection survives filtering, undo restores state, or stale results never replace newer ones.
- **✅ Do** use UI properties to verify rendering, event wiring, focus, persistence, and navigation through the interface users operate.
- **👍 Prefer** broad tests of complex domain logic in pure functions too; they explore more cases cheaply while UI tests verify integration.
- **✅ Do** keep named examples and reviewed screenshots for important journeys and visual states; generated runs may not visit those exact cases.
- **❌ Don't** create a fresh golden screenshot for each random input; without a reviewed expected image, the comparison cannot detect a visual regression.
- **✅ Do** use [version compatibility](version-compatibility.md) to adapt async predicates for older projects.

For design-system components:

| Generate                                  | Assert                                                 |
| ----------------------------------------- | ------------------------------------------------------ |
| Labels, variants, and activation attempts | Disabled controls never activate                       |
| Keyboard and pointer action sequences     | Equivalent activation has the same visible effect      |
| Toggle, select, and dismiss sequences     | ARIA state agrees with visible state after each action |

- **✅ Do** confirm the assertion catches a missing event guard or state update: observe red with that behavior absent, then green when restored.

## Component: a sequence of interactions

Example contract: `Counter` starts at zero, accepts `max`, exposes a numeric `status`, and has `Increment`/`Decrement` buttons. Both stay enabled; clicks at a boundary leave the value unchanged.

- **✅ Do** derive the model from the public contract, independently of the component's update algorithm.
- **👍 Prefer** meaningful behavior such as selection, undo, or focus restoration when adapting this example; avoid properties that only restate trivial component logic.
- **✅ Do** render the real component in the project's DOM environment to exercise its actual rendering and event wiring.

```tsx
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';
import { Counter } from './Counter.js';

describe('Counter', () => {
  it('should follow the bounded counter model after every interaction', async () => {
    await fc.assert(counterProperty(), { numRuns: 40 });
  });
});

// Helpers
function counterProperty() {
  // 30 actions is an execution budget for this UI recipe, not a domain limit.
  const actions = fc.array(fc.constantFrom('Increment', 'Decrement'), { maxLength: 30, size: 'max' });
  return fc.property(actions, async (sequence) => {
    const user = userEvent.setup();
    try {
      // Arrange: a fresh component and model for every evaluation.
      render(<Counter max={3} />);
      const transitions = { Increment: [1, 2, 3, 3], Decrement: [0, 0, 1, 2] } as const;
      let expected: 0 | 1 | 2 | 3 = 0;
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

- **✅ Do** await async queries and `waitFor` assertions so missing UI updates fail the test instead of continuing after it finishes.
- **❌ Don't** put clicks or other side effects inside `waitFor`; it retries its callback and may repeat the action.
- **✅ Do** settle or cancel pending work before cleanup, then restore timers, spies, handlers, and globals so later evaluations inherit no effects.
- **❌ Don't** run concurrent properties against shared DOM or global mocks; one evaluation can alter another's observations.
- **👍 Prefer** `fc.commands` with `fc.asyncModelRun` when action availability depends on model state.
- **✅ Do** derive command preconditions from the model so a broken application cannot decide which checks to skip.
- **✅ Do** describe each command's action and inputs in `toString()` so failures show a readable sequence.

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

- **✅ Do** choose run counts and sequence lengths from measured execution cost; document these exploration budgets separately from application limits.
- **✅ Do** use `size: 'max'` to make the full bounded length range available; `maxLength` alone does not guarantee that range with default sizing.
- **❌ Don't** narrow the domain to make a failing property pass.
- **👍 Prefer** `endOnFailure: true` for expensive journeys: retain the first failing sequence, seed, and path promptly.
- **✅ Do** replay first, then minimize from that seed/path with `endOnFailure: false` and a separate shrinking budget.
- **❌ Don't** rely on the runner timeout for replay evidence; it can expire before fast-check reports. Use [execution and limits](execution-and-limits.md) to reserve time for reporting and cleanup.
- **✅ Do** create isolated backend data per evaluation and dispose of it in `finally` so journeys and shrink attempts cannot affect each other.
- **❌ Don't** assume a new browser context resets the server, or that `page.reload()` clears persistent storage.
- **❌ Don't** run destructive generated journeys against production.
- **✅ Do** exercise real services when integration is the subject; stub unrelated dependencies at controlled boundaries.
- **👍 Prefer** locator waiting and web-first assertions over fixed sleeps; they wait for the required UI state and fail when it never appears.
- **✅ Do** record seed, path, sequence, application version, and relevant Playwright traces. A browser retry is not replay.
- **✅ Do** use [race properties](async-and-races.md) when response order affects UI state: control deliveries and check for transient stale results.
- **❌ Don't** assume scheduling `page.click()` controls the requests or application work it triggers.
