# Adapt v5 recipes to older versions

1. Identify the resolved version from the lockfile, then check exports/types and integration peer dependencies to establish which APIs are available.
2. Use the [v4](#adapt-to-v4) or [v3-and-earlier](#adapt-to-v3-and-earlier) guidance to translate predicates, hooks, and runner controls. Preserve the contract, oracle, and per-evaluation isolation.
3. Run the adapted test red and green. Keep concrete regression inputs across upgrades, obtain fresh seed/path reports, and verify historical replay before claiming it works.

## Adapt to v4

| Feature                | v5                                             | v4                                              |
| ---------------------- | ---------------------------------------------- | ----------------------------------------------- |
| Sync predicate         | `fc.property(...)`                             | Same                                            |
| Async predicate        | `fc.property(..., async (...) => ...)`         | `fc.asyncProperty(..., async (...) => ...)`     |
| Assertion / inspection | `await fc.assert(...)` / `await fc.check(...)` | Keep `await`, including sync properties         |
| Isolation              | Setup in predicate, cleanup in `finally`       | Same, including shrinking                       |
| Replay                 | Reported seed/path                             | Same version only; not portable across upgrades |

```js
// v4/v3: increment is the async application function under test.
await fc.assert(
  fc.asyncProperty(fc.integer(), async (value) => {
    expect(await increment(value)).toBe(value + 1);
  }),
);
```

- **✅ Do** adapt async component, browser, API, and scheduler recipes; keep synchronous sorting as `fc.property`.
- **❌ Don't** use v4's synchronous `fc.property` for async predicates or remove awaits to satisfy types.
- **✅ Do** choose compatible fast-check/Vitest integration versions. `it.prop` already handles async predicates; do not replace it mechanically with `fc.asyncProperty`. Use direct fast-check if the integration or `g` fixture is unavailable.

## Adapt hooks and runner controls

- **✅ Do** check whether the installed version exports the required lifecycle and time-limit plugins before using them. Earlier v4 uses property methods and runner parameters.
- **❌ Don't** pass removed v4 parameters to v5: unrecognized options do not enforce the intended behavior.

| Intent                   | v5                                                                     | Earlier v4                                                                                   |
| ------------------------ | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Per-predicate hooks      | `plugins: [fc.beforeEach(setup), fc.afterEach(cleanup)]`               | `property.beforeEach(setup).afterEach(cleanup)`                                              |
| Global hooks             | `fc.installGlobalPlugin(fc.beforeEach(setup))`; similarly `afterEach`  | `fc.configureGlobal({ beforeEach, afterEach })`; async: `asyncBeforeEach` / `asyncAfterEach` |
| Async evaluation timeout | `plugins: [fc.timeout(ms)]`                                            | `{ timeout: ms }` with `fc.asyncProperty`                                                    |
| Campaign interruption    | `plugins: [fc.interruptAfterTimeLimit(ms, { failOnInterrupt: true })]` | `{ interruptAfterTimeLimit: ms, markInterruptAsFailure: true }`                              |
| Time-limited skipping    | No direct equivalent; choose interruption and its failure policy       | `{ skipAllAfterTimeLimit: ms }`; skips evaluations, with different semantics                 |
| Unbiased generation      | `plugins: [fc.unbiased()]`                                             | `{ unbiased: true }`                                                                         |
| Duplicate values         | `plugins: [fc.skipEqualValues()]` or `fc.ignoreEqualValues()`          | `{ skipEqualValues: true }` or `{ ignoreEqualValues: true }`                                 |

- **✅ Do** invoke/await the previous hook argument in a v4 property-hook override when preserving existing hooks. V5 plugin hooks do not use that convention.
- **✅ Do** match v4 global async hooks to async properties; avoid incompatible sync/async hook combinations. Predicate-local `try/finally` works on both versions.
- **✅ Do** retain `numRuns`, `seed`, `path`, `examples`, and `endOnFailure` as runner parameters.
- **👍 Prefer** default generation bias. Unbiased generation does not automatically improve coverage; duplicate plugins can reduce actual executions or exhaust skips on small domains.
- **✅ Do** use [execution budgets](execution-and-limits.md) to preserve cleanup, cancellation, and failure reporting when translating hooks or time limits.

## Adapt to v3 and earlier

- **✅ Do** use v4's sync/async split in v3 and verify each arbitrary against the installed minor version. Preserve Unicode domains: older `fullUnicodeString()` and newer string-unit options differ. Consult the [v3-to-v4 migration guide](https://fast-check.dev/docs/migration-guide/from-3.x-to-4.x/) in reverse.
- **✅ Do** check scheduler availability: scheduler since v1.20.0; `waitFor` since v2.24.0; `waitIdle` / `waitNext` since v4.2.0. Prefer `waitFor` with the application's completion promise.
- **❌ Don't** blindly substitute `waitAll`: it can finish before work scheduled after additional awaits. Use deferred promises plus completion handshakes, or propose an upgrade; preserve overlap and behavior assertions.
- **✅ Do** check v2/v1 exports, signatures, runtime requirements, and shrink/replay semantics before choosing an equivalent recipe. Explain unavailable features rather than inventing equivalents.

References: [scheduler API](https://fast-check.dev/api-reference/interfaces/Scheduler.html), [migration guides](https://fast-check.dev/docs/migration-guide/).
