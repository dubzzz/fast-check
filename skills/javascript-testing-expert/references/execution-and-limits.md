# Per-evaluation hooks and execution budgets

1. Identify state to recreate for every generated case and shrinking attempt. Choose predicate-local setup/`finally`, or lifecycle plugins for reusable fixture hooks.
2. Assign each resource one cleanup owner. Set up dependencies before dependents so teardown can release them in reverse order.
3. Measure evaluation cost to choose run and time budgets using the table below. Allow additional outer-runner time for counterexample reporting and cleanup.
4. Run the property and retain any failure report. If the budget interrupts shrinking, keep the best counterexample and resume with a larger budget.

## Isolate each evaluation

- **✅ Do** pass `fc.beforeEach(...)` / `fc.afterEach(...)` through `plugins` when hooks fit existing infrastructure. They surround generated cases **and shrinking attempts**; async hooks are awaited.
- **✅ Do** return teardown from `fc.beforeEach` that closes the resource acquired by that invocation, including after assertion failures:

```js
// Application fixture: openIsolatedStore provides write, read, and dispose.
let store;
await fc.assert(
  fc.property(fc.string(), async (value) => {
    await store.write(value);
    expect(await store.read()).toBe(value);
  }),
  {
    plugins: [
      fc.beforeEach(async () => {
        const opened = await openIsolatedStore();
        store = opened;
        return () => opened.dispose();
      }),
    ],
  },
);
```

- **✅ Do** make `fc.afterEach(cleanup)` tolerate incomplete setup: after hooks run even if a before hook fails. Setup that throws before returning its teardown must release its own partial resources.
- **✅ Do** declare lifecycle plugins in dependency order: adjacent before hooks run in declaration order, with teardown in reverse.
- **✅ Do** keep fixture variables local to each campaign so concurrent tests cannot overwrite them.
- **👍 Prefer** local plugins to limit hooks to properties that need them. Install suite-wide hooks once in test setup with `fc.installGlobalPlugin(fc.beforeEach(...))` or `fc.installGlobalPlugin(fc.afterEach(...))`. Global plugins wrap local ones.
- **❌ Don't** install plugins repeatedly inside tests or predicates. `configureGlobal` sets defaults such as `numRuns`, not hooks or plugins.

## Budget exploration and shrinking

- **✅ Do** include setup, actions, assertions, and cleanup when measuring evaluation cost. Budget shrinking separately: `numRuns` limits successful exploration, not shrinking evaluations.

| Need                                     | Control                                                                | Meaning                                                             |
| ---------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Bound successful exploration             | `numRuns` and an arbitrary's `size`                                    | Fewer cases or smaller typical inputs; shrinking still runs         |
| Capture the first failure quickly        | `endOnFailure: true`                                                   | Reports the first failing case without shrinking                    |
| Budget the campaign, including shrinking | `plugins: [fc.interruptAfterTimeLimit(ms, { failOnInterrupt: true })]` | Fails an incomplete campaign; preserves a discovered counterexample |
| Detect one slow async evaluation         | `plugins: [fc.timeout(ms)]`                                            | Reports a timeout, not a behavior assertion failure                 |

- **✅ Do** set `failOnInterrupt: true` when requiring the full campaign: the default can report success after interruption before any failure, despite fewer than `numRuns` executions.
- **❌ Don't** assume either time plugin stops application code, blocks until cleanup finishes, or interrupts synchronous blocking code. Pass the final predicate context's optional `signal` to operations supporting cancellation; settle pending work before reusing resources.
- **👍 Prefer** `endOnFailure` or campaign interruption over `fc.noShrink` / `fc.limitShrink` for expensive tests. Save the input, seed, path, and configuration, then resume shrinking with a larger budget.
- **✅ Do** keep arbitraries and controlled dependencies unchanged when resuming shrinking; adjust only the time budget or `endOnFailure` to preserve replay.
- **❌ Don't** call an interrupted counterexample minimal or rely on an outer timeout that cuts off reporting.
- **✅ Do** preserve project defaults and justify local budgets, especially hard length caps that exclude longer behavior.
- **❌ Don't** shrink the input domain, skip failures, or disable shrinking to turn a failing test green.

Use [properties and replay](properties-and-replay.md) to reproduce a counterexample, and [version compatibility](version-compatibility.md) to map these controls to older APIs.
