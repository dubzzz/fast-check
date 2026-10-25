---
name: javascript-testing-expert
description: Write, review, or improve JavaScript and TypeScript tests. Propose property-based testing with fast-check for unit, API, integration, component, browser, and end-to-end tests, including asynchronous code and race conditions.
---

# JavaScript testing expert

Use tests to find bugs, document behavior, and prevent regressions.

## Start with the contract

- **✅ Do** read the requirements, implementation, nearby tests, runner configuration, and installed versions.
- **✅ Do** state the expected behavior, supported inputs, and observable result before choosing generators.
- **✅ Do** propose a useful property for every testing request, even when the user does not mention property-based testing.
- **✅ Do** keep clear examples for important behavior and regressions.
- **❌ Don't** force a weak or tautological property. Explain when no useful property is practical.
- **✅ Do** choose the cheapest layer that exercises the risk. Preserve requested component, browser, and integration boundaries.

## Find properties at every layer

| Layer             | Vary                                        | Check                                                            |
| ----------------- | ------------------------------------------- | ---------------------------------------------------------------- |
| Unit              | Inputs and related inputs                   | Preservation, round trips, simpler reference results             |
| API / integration | Requests and operation sequences            | Idempotency, read-after-write, rejected updates preserve state   |
| Component         | Props and user actions                      | Visible state matches the model; disabled actions have no effect |
| Browser / E2E     | Inputs, journeys, reloads                   | Persistence, navigation, and workflow invariants                 |
| Async / races     | Overlapping operations and completion order | Latest request wins, ordered results, no lost updates            |

- **✅ Do** check meaningful intermediate states, not only the final result.
- **👍 Prefer** a small action array first. Use `fc.commands` and model runners when preconditions or longer workflows justify them.
- **❌ Don't** claim the scheduler controls uninstrumented browser, network, or operating-system work.

## Write meaningful assertions

- **✅ Do** assert public behavior with an independent oracle: a simpler reference, model, relation, or constructed input.
- **❌ Don't** copy the production algorithm into the expected result or filter cases based on the actual output.
- **✅ Do** ensure the relevant assertion executes. Empty loops and swallowed errors can make broken code pass.
- **👍 Prefer** semantic UI queries and small stubs. Avoid testing trivial private logic or repeating internal mock call sequences.
- **✅ Do** use fixed screenshots for visual contracts and targeted snapshots for structural contracts. DOM snapshots do not establish visual correctness.

## Generate and isolate cases

- **✅ Do** generate the supported domain; separate invalid-input properties with explicit error contracts.
- **👍 Prefer** arbitrary options and `map` over excessive filtering. Use defaults when they match the domain.
- **👍 Prefer** `size: '-1'` or fewer runs for cost before a hard cap. Explain runtime budgets; never exclude a known failure.
- **✅ Do** create fresh fixtures for every generated case and shrinking attempt.
- **✅ Do** clean up with predicate-local `try/finally` or v5 lifecycle plugins. Outer runner hooks do not surround every fast-check evaluation.
- **✅ Do** reset applicable DOM, server data, storage, clocks, mocks, and pending work. A fresh browser context does not reset the server.

## Fit the project; default to v5

- **✅ Do** use v5 `fc.property` for sync and async predicates; always await `fc.assert`.
- **✅ Do** check the resolved package and exports. For older installations, read [version compatibility](references/version-compatibility.md); do not silently upgrade dependencies.
- **✅ Do** follow existing layout and runner conventions. Otherwise prefer `.spec.ts`, function/component-named `describe` blocks, and clear `it('should ...')` names.
- **✅ Do** make Arrange/Act/Assert visible. Put simple examples first and helpers below tests.
- **👍 Prefer** an installed, compatible `@fast-check/vitest`; otherwise use fast-check inside the current runner.
- **✅ Do** retain counterexamples and seed/path for replay. Keep readable regressions alongside exploratory properties.

## Read only the relevant references

- [Properties and replay](references/properties-and-replay.md): oracles, domains, shrinking, regression cases.
- [Deterministic data and tooling](references/deterministic-data-and-tooling.md): unused fields, dates, Faker, generators, runner integration.
- [APIs and glue code](references/apis-and-glue.md): rejected updates and observable integration contracts.
- [Async code and races](references/async-and-races.md): controlled dependencies and completion orders.
- [Execution hooks and limits](references/execution-and-limits.md): v5 lifecycle plugins and slow-test budgets.
