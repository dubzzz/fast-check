# Per-evaluation hooks and execution budgets

## Isolate each evaluation

- **👍 Prefer** setup inside the predicate and cleanup in `finally` so each generated case and shrinking attempt owns its fixture.
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
- **✅ Do** declare dependency setup before dependent setup. Adjacent lifecycle plugins run before hooks in declaration order and teardown in reverse, releasing dependents first.
- **❌ Don't** release a resource through both teardown and `afterEach`; choose one cleanup owner.
- **✅ Do** keep fixture variables local to each campaign so concurrent tests cannot overwrite them.
- **👍 Prefer** local plugins to limit hooks to properties that need them. Install suite-wide hooks once in test setup with `fc.installGlobalPlugin(fc.beforeEach(...))` or `fc.installGlobalPlugin(fc.afterEach(...))`. Global plugins wrap local ones.
- **❌ Don't** install plugins repeatedly inside tests or predicates. `configureGlobal` sets defaults such as `numRuns`, not hooks or plugins.

## Budget exploration and shrinking

- **✅ Do** measure setup, actions, assertions, cleanup, and shrinking to choose run and time budgets. `numRuns` does not bound shrinking evaluations.
- **✅ Do** leave the outer runner enough time for fast-check's counterexample report and application cleanup.

| Need                                     | Control                                                                | Meaning                                                             |
| ---------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Bound successful exploration             | `numRuns` and an arbitrary's `size`                                    | Fewer cases or smaller typical inputs; shrinking still runs         |
| Capture the first failure quickly        | `endOnFailure: true`                                                   | Reports the first failing case without shrinking                    |
| Budget the campaign, including shrinking | `plugins: [fc.interruptAfterTimeLimit(ms, { failOnInterrupt: true })]` | Fails an incomplete campaign; preserves a discovered counterexample |
| Detect one slow async evaluation         | `plugins: [fc.timeout(ms)]`                                            | Reports a timeout, not a behavior assertion failure                 |

- **✅ Do** set `failOnInterrupt: true` when requiring the full campaign: the default can report success after interruption before any failure, despite fewer than `numRuns` executions.
- **❌ Don't** assume either time plugin stops application code, blocks until cleanup finishes, or interrupts synchronous blocking code. Pass the final predicate context's optional `signal` to operations supporting cancellation; settle pending work before reusing resources.
- **👍 Prefer** `endOnFailure` or campaign interruption over `fc.noShrink` / `fc.limitShrink` for expensive tests. Save the input, seed, path, and configuration, then resume shrinking with a larger budget.
- **✅ Do** retain the best reported counterexample if shrinking is interrupted. Keep arbitraries and controlled dependencies unchanged when resuming; adjust only the time budget or `endOnFailure`.
- **❌ Don't** call an interrupted counterexample minimal or rely on an outer timeout that cuts off reporting.
- **✅ Do** preserve project defaults and justify local budgets, especially hard length caps that exclude longer behavior.
- **❌ Don't** shrink the input domain, skip failures, or disable shrinking to turn a failing test green.

Use [properties and replay](properties-and-replay.md) to reproduce a counterexample, and [version compatibility](version-compatibility.md) to map these controls to older APIs.
