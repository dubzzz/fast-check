# Test structure and dependencies

## File layout and naming

- **✅ Do** follow existing project conventions so new tests are discoverable and run with the established suite. Use the defaults below where no convention exists.
- **✅ Do** use one test file per code file so its behavior has one place to look for coverage.
- **👍 Prefer** colocated `.spec.ts` files, such as `cart.ts` → `cart.spec.ts`, to make source and tests easy to find together.
- **👍 Prefer** `it` over `test` when the runner supports both, so `it('should ...')` reads as a behavior statement.
- **✅ Do** put each `it` inside a `describe` named after the function or public component under test. Give each function its own group so failures identify the responsible API.
- **✅ Do** start `it` names with `should` and state the expected result, so a failure explains which behavior broke.

## Readable examples and shared contracts

- **✅ Do** place simple documenting examples before exploratory properties, introducing the behavior before its edge cases.
- **👍 Prefer** realistic data for documenting examples, such as plausible names and purchases, so readers can understand the scenario. Keep generated domains broad enough to find unusual failures.
- **✅ Do** keep each test focused on one behavior; use several assertions when needed to establish that behavior.
- **✅ Do** make Arrange, Act, and Assert visible so readers can separate setup, the operation, and its expected effects.
- **✅ Do** put shared helpers below tests under `// Helpers`, named for their purpose. Avoid a configurable `prepare` helper that hides the operation being tested.
- **👍 Prefer** a shared contract suite for interchangeable implementations or configurations, with each variant named, so coverage stays consistent. Keep differing behavior in explicit tests.
- **✅ Do** cover synchronous return/throw and asynchronous resolve/reject when the API supports them. Check synchronous behavior before awaiting; `await` alone hides whether a value was returned directly or through a promise.

## Keep dependencies proportionate

- **✅ Do** warn the developer when a test needs more than about 10 mocks or stubs. Explain that the tested code may handle too many responsibilities and suggest separating them using the single-responsibility principle.
- **❌ Don't** turn that warning into an unrelated production refactor; propose the design change separately.
- **👎 Avoid** rebuilding dependency internals with mocks. If setup mainly reproduces call sequences, assert a public outcome using a real dependency or one boundary stub.
- **✅ Do** assert call counts only when they express the contract, such as deduplicating requests; otherwise check the observable result.
- **❌ Don't** duplicate a dependency's own tests; assert how the application uses its result or handles its failure.
