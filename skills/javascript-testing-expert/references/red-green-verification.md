# Verify red before accepting green

- **✅ Required:** Confirm every added test fails when its target behavior is violated, then passes with correct behavior. Apply this to examples and properties at every layer.

## Red

- **👍 Prefer** writing and running the test before implementing the behavior or fix.
- **✅ Do** test existing behavior against the pre-fix implementation, a faulty dependency, or a targeted local mutation.
- **✅ Do** keep the oracle intact. Break the behavior the test protects.
- **❌ Don't** accept an import error, broken fixture, unrelated timeout, or artificial failing assertion as proof.
- **✅ Do** strengthen the assertion or exercised cases if the broken behavior still passes.

## Green and refactor

- **✅ Do** implement or restore correct behavior and rerun the same case.
- **✅ Do** remove temporary defects before committing. Keep tests green while refactoring.
- **✅ Do** report the observed failure and success. If execution is blocked, say that failure sensitivity remains unverified.

## Properties and races

- **✅ Do** keep the failing input, action sequence, or scheduler seed/path. Replay against broken and correct implementations.
- **👍 Prefer** an explicit example or controlled schedule when needed to exercise the defect reliably.
- **❌ Don't** rely on an arbitrary random campaign eventually finding a particular bug.
- **✅ Do** choose a race defect that depends on completion order. Also check transient violations: stale data can be published before the final result becomes correct.

Background: [Kent Beck’s TDD workflow](https://newsletter.kentbeck.com/p/canon-tdd).
