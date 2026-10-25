# Verify red before accepting green

- **✅ Required:** Confirm every added test fails when its target behavior is violated, then passes with correct behavior. Apply this to examples and properties at every layer.

## Follow this order

1. **✅ Do** choose how to violate the target behavior. Prefer running before the fix. For already-correct behavior, inject a faulty dependency or make an isolated local mutation. Keep the oracle intact.
2. **✅ Do** run the test and confirm its intended assertion fails. If broken behavior passes, strengthen the assertion or exercised cases, then repeat this step.
3. **✅ Do** implement or restore correct behavior and rerun the same case to confirm green. Remove temporary defects before committing; keep tests green while refactoring.
4. **✅ Do** report the observed failure and success. If execution is blocked, say that failure sensitivity remains unverified.

- **❌ Don't** accept an import error, broken fixture, unrelated timeout, or artificial failing assertion as proof. Fix the unrelated failure and repeat step 2.

## Properties and races

- **✅ Do** keep the failing input, action sequence, or scheduler seed/path. Replay against broken and correct implementations.
- **👍 Prefer** an explicit example or controlled schedule when needed to exercise the defect reliably.
- **❌ Don't** rely on an arbitrary random campaign eventually finding a particular bug.
- **✅ Do** choose a race defect that depends on completion order. Also check transient violations: stale data can be published before the final result becomes correct.

Background: [Kent Beck’s TDD workflow](https://newsletter.kentbeck.com/p/canon-tdd).
