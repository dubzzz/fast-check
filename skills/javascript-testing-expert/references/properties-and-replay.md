# Properties and reproducibility

Use fast-check v5 for these recipes. For older projects, read Version compatibility.

## Choose an oracle before the generator

Translate “works for these examples” into a statement about supported inputs. Write that statement in plain language before writing code.

| Pattern                     | Example                                                          | Guard against                                                          |
| --------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Independent invariant       | Output is ordered and preserves every input item                 | An empty output satisfies ordering alone                               |
| Relation between executions | Normalizing twice equals normalizing once                        | An implementation that always returns a constant                       |
| Round trip                  | Decoding an encoding returns the supported input                 | Two mutually wrong implementations; values the format cannot represent |
| Constructed input           | A text containing a generated pattern must be found              | Checking only matches that the implementation chose to report          |
| Simpler reference           | A custom sort agrees with the built-in numeric sort              | Reimplementing the same algorithm in the oracle                        |
| State model                 | Cart count equals successful adds minus removals after each step | Asserting only the final state and missing transient violations        |

Combine weak properties with stronger ones and clear examples. Idempotence alone does not specify a normalizer, and “does not throw” only specifies absence of crashes.

## Example: sort without losing data or mutating the input

Assume `sortNumbers` accepts an array of integers, returns the same elements in numeric ascending order, and leaves its argument unchanged. Adapt this contract if the real API intentionally sorts in place. The native sort on a copy is a simpler independent oracle for a custom implementation.

```ts
import { it, expect } from 'vitest';
import * as fc from 'fast-check';
import { sortNumbers } from './sortNumbers.js';

it('should sort all elements without changing the input', async () => {
  await fc.assert(
    fc.property(fc.array(fc.integer()), (input) => {
      // Arrange
      const original = [...input];
      const expected = [...original].sort((a, b) => a - b);

      // Act
      const actual = sortNumbers(input);

      // Assert
      expect(actual).toEqual(expected);
      expect(input).toEqual(original);
    }),
  );
});
```

The oracle rejects unordered output, dropped duplicates, and unintended mutation. Keep explicit examples for any additional documented behavior such as stability of equal-key records. Do not constrain the input to already sorted or distinct arrays to make a broken sort pass.

For a substring search, construct `prefix + pattern + suffix` from three generated strings. Assert that the returned index is valid and `text.slice(index, index + pattern.length) === pattern`. If the API promises the first occurrence, compare with `text.indexOf(pattern)` too. Never use `fc.pre(index !== -1)` on the result: returning “not found” is precisely a bug this property should catch. Test the absent-pattern contract separately.

## APIs and stateful workflows

Use an asynchronous `fc.property` around the real test client (v5). For example, generate a valid resource, create an isolated tenant inside the callback, save the resource, read it back, and compare the fields promised by the API. Release the tenant in `finally`. For a rejected update, compare observable state before and after the rejection.

An idempotency property should repeat the same request with the same idempotency key and verify one observable effect. Distinct requests with distinct keys are a different property. A unique tenant or transaction prevents one generated case, parallel test, or shrinking attempt from contaminating another. Use a real test service when the integration boundary is the subject; use a controlled stub when testing the client in isolation.

For sequences, model only externally visible state. Generate valid commands directly, or use `fc.commands` and command preconditions based on the model. Recreate both model and real system per evaluation. Check state after each action. Bound sequence length only as a documented exploration budget or contract constraint.

## Keep generation and failure reproducible

- Prefer the built-in arbitraries and combinators (`record`, `tuple`, `array`, `oneof`, `map`, `chain`) to a custom generator. Use their constraints to represent the actual domain.
- `fc.integer()` generates signed 32-bit integers by default. Use `fc.maxSafeInteger()` when the contract spans safe integers. Do not mistake a generator's default range for the complete API domain.
- Floating-point contracts need deliberate handling of `NaN` and infinities. Even with `noNaN: true`, `fc.double` can generate infinity unless its bounds or `noDefaultInfinity` exclude it.
- `fc.string()` does not mean every possible Unicode string. Check the installed version's string units when Unicode behavior matters. Likewise, choose JSON-compatible arbitraries for a JSON round-trip, not arbitrary JavaScript values.
- Prefer a small `size` for expensive generated structures. For a browser property, start with a measured run budget (for example 20 runs), allow time for shrinking, and retain cheap, broader properties below the browser layer.
- Do not wrap a single `fc.sample` call in an example test and describe it as a shrinking property. Sampling does not shrink assertion failures or automatically report the seed. If sampling is unavoidable, supply and record the seed and sampled inputs yourself.
- Faker adapters need seeded randomness and actual method calls such as `faker.person.firstName()`. A custom arbitrary without a shrinker cannot minimize those values; prefer built-in shrinkable generators when possible.

## Replay an observed failure

Keep fast-check's full failure report, especially the counterexample, seed, and path. Pass the actual reported values back to `fc.assert` on the unchanged property. The following are illustrative values, not a known failure:

```ts
await fc.assert(propertyUnderTest, { seed: 12345, path: '0:1:0' });
```

For `@fast-check/vitest`, pass those parameters as the second argument to `it.prop`. Preserve generator ordering, constraints, examples, library version, and controlled external state. A seed cannot recreate an uncontrolled network response or operating-system schedule. Command-based properties may also report command replay information; retain it rather than reconstructing a sequence by hand.

First reproduce the failure, then distinguish a production bug from an incorrect property, unsupported input, or leaking fixture. Fix the appropriate cause. Add the smallest useful counterexample as a named regression test or through `examples`, and retain the exploring property with varying seeds. A permanently fixed seed alone limits future exploration.

## Core guidelines

- **✅** Assert public, user-observable behavior. Prefer semantic queries such as roles, accessible names, and labels over implementation details. Assert call counts only when they are part of the contract (for example, deduplicating a request).
- **👍** Prefer small stubs over extensive mocks. Excessive setup can indicate a responsibility or dependency boundary worth simplifying; do not refactor unrelated production code just to add a test.
- **✅** Keep the oracle independent: a simpler reference, a model, a relation between executions, or a known consequence of constructed inputs. Never copy the production algorithm into the expected result.
- **❌** Do not discard a generated case because the system under test produced an inconvenient result. Preconditions describe inputs and model state, never whether the observed output passed.
- **✅** Verify that an assertion runs for the intended case. A loop over an empty result, a catch that swallows failures, or `fc.pre` based on the actual result can make a broken implementation pass.
- **✅** Apply the required red–green–refactor check to each added test. “Should preserve all items” must fail if an item disappears. Merely making a prerequisite false does not prove the test's sensitivity.
- **✅** Use targeted snapshots when a known structure is the contract and fixed screenshots when appearance is the contract. Do not create a new golden snapshot for every random input, or treat a DOM snapshot as proof of visual correctness.

## Generate the contract's domain

- **✅** Use arbitrary defaults when they match the supported inputs. Construct valid correlated data rather than generating unrelated values and discarding most of them with `.filter` or `fc.pre`.
- **✅** Keep invalid inputs in a separate property with an explicit error contract. Do not silently narrow the domain to make a failing test pass.
- **✅** Distinguish semantic constraints from execution budgets. A business rule may require a positive amount; a browser test may need a short sequence for runtime. Document either reason. Prefer a smaller `size` (for example `size: '-1'`) or fewer runs before imposing a hard cap; a budget cap limits explored behavior and is not an application requirement.
- **✅** Cover important boundaries with explicit examples as well as generated cases. Small run counts cannot guarantee a particular edge case is exercised.
- **✅** Account for JavaScript semantics: `NaN`, infinities, signed zero, unsafe integer arithmetic, Unicode, and invalid dates where the contract permits them. Use `bigint` for an exact integer oracle when appropriate; do not change the system's input type to evade a bug.
- **❌** Avoid raw `Math.random()`, unseeded Faker, real time, ambient locale, and external network variability in the test harness. Use shrinkable arbitraries and explicit dependencies. If the production code depends on randomness or time, inject or control that dependency too.

For per-evaluation lifecycle plugins and bounded exploration/shrinking, read Execution hooks and limits.
