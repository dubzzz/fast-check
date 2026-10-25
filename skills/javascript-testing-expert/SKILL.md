---
name: javascript-testing-expert
description: Write, review, or improve JavaScript and TypeScript tests. Propose property-based testing with fast-check for unit, API, integration, component, browser, and end-to-end tests, including asynchronous code and race conditions.
---

# JavaScript testing expert

Use tests to find bugs, document behavior, and prevent regressions.

## Start with the contract

1. **✅ Do** read requirements to identify supported inputs, expected behavior, and observable results.
2. **✅ Do** inspect the implementation for branches, state changes, and async boundaries that could violate that contract.
3. **✅ Do** inspect nearby tests and runner configuration to choose the test location, fixtures, cleanup, and run command.
4. **✅ Do** check resolved dependency versions and exports to select supported testing APIs.
5. **✅ Do** state the contract and choose the cheapest layer that exercises the risk. Preserve requested component, browser, and integration boundaries.

- **✅ Do** propose a useful property for every testing request, even when the user does not mention property-based testing.
- **✅ Do** keep clear examples for important behavior and regressions.
- **❌ Don't** force a weak or tautological property. Explain when no useful property is practical.

## Confirm red, then green

1. **✅ Required:** Run each added test against missing or broken behavior. Confirm that the intended assertion fails.
2. **✅ Do** implement or restore correct behavior, then rerun the same case and confirm it passes.
3. **✅ Do** report the observed failure and success. If execution is blocked, state that failure sensitivity remains unverified.

- **👍 Prefer** testing before the fix or injecting a faulty dependency. Use an isolated local mutation when needed; restore it before committing.
- **❌ Don't** count a broken fixture, import error, or unrelated timeout as evidence.

Use [red–green verification](references/red-green-verification.md) to choose the broken behavior and handle a test that fails for the wrong reason.

## Find properties at every layer

| Layer             | Vary                                        | Check                                                            |
| ----------------- | ------------------------------------------- | ---------------------------------------------------------------- |
| Unit              | Inputs and related inputs                   | Preservation, round trips, simpler reference results             |
| API / integration | Requests and operation sequences            | Idempotency, read-after-write, rejected updates preserve state   |
| Component         | Props and user actions                      | Visible state matches the model; disabled actions have no effect |
| Browser / E2E     | Inputs, journeys, reloads                   | Persistence, navigation, and workflow invariants                 |
| Async / races     | Overlapping operations and completion order | Latest request wins, ordered results, no lost updates            |

- **✅ Do** assert the invariant after each relevant action or response; a correct final state can hide transient failures.
- **👍 Prefer** generated action arrays for simple sequences. Use `fc.commands` when a model must decide which actions are valid.
- **❌ Don't** claim the scheduler controls uninstrumented browser, network, or operating-system work.

## Write meaningful assertions

- **✅ Do** assert public behavior with an independent oracle: a simpler reference, model, relation, or constructed input.
- **❌ Don't** copy the production algorithm into the expected result or filter cases based on the actual output.
- **✅ Do** ensure the relevant assertion executes. Empty loops and swallowed errors can make broken code pass.
- **👍 Prefer** UI queries by role, label, or accessible name to assert what users can observe.
- **👍 Prefer** small stubs at dependency boundaries to control responses. Avoid testing trivial private logic or repeating internal mock call sequences.
- **✅ Do** use fixed screenshots for visual contracts and targeted snapshots for structural contracts. DOM snapshots do not establish visual correctness.

## Generate and isolate cases

- **✅ Do** generate the supported domain; separate invalid-input properties with explicit error contracts.
- **👍 Prefer** arbitrary options and `map` to construct valid inputs without excessive discards. Use defaults when they cover the supported domain.
- **👍 Prefer** `size: '-1'` or fewer runs for cost before a hard cap. Explain runtime budgets; never exclude a known failure.
- **✅ Do** create fresh fixtures for every generated case and shrinking attempt.
- **✅ Do** clean up with predicate-local `try/finally` or lifecycle plugins. Outer runner hooks do not surround every fast-check evaluation.
- **✅ Do** reset applicable DOM, server data, storage, clocks, mocks, and pending work. A fresh browser context does not reset the server.

## Fit the project

- **✅ Do** use `fc.property` for sync and async predicates; always await `fc.assert`.
- **✅ Do** use [version compatibility](references/version-compatibility.md) to adapt predicates, hooks, and limits for older installations; do not silently upgrade dependencies.
- **✅ Do** use [test structure](references/test-structure.md) to organize files, name behavior checks, and keep fixtures readable.
- **👍 Prefer** an installed, compatible `@fast-check/vitest`; otherwise use fast-check inside the current runner.
- **✅ Do** retain counterexamples and seed/path for replay. Keep readable regressions alongside exploratory properties.

## Read only the relevant references

- [Properties and replay](references/properties-and-replay.md): oracles, domains, shrinking, regression cases.
- [Test structure](references/test-structure.md): file layout, naming, documenting examples, shared contracts, mock limits.
- [Deterministic data and tooling](references/deterministic-data-and-tooling.md): unused fields, dates, Faker, generators, runner integration.
- [APIs and glue code](references/apis-and-glue.md): rejected updates and observable integration contracts.
- [Components and browsers](references/components-and-browser.md): generated interactions and per-case isolation.
- [Async code and races](references/async-and-races.md): controlled dependencies and completion orders.
- [Execution hooks and limits](references/execution-and-limits.md): lifecycle plugins and slow-test budgets.
