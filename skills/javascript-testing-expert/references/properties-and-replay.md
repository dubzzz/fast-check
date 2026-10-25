# Properties and reproducibility

For older installations, use [Version compatibility](version-compatibility.md) to adapt predicates and runner APIs.

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

- **✅ Do** assert the promised error type, code, or value. Check identity when propagation must preserve the original error; accepting any exception can hide an unrelated failure.

For stateful contracts, use [API recipes](apis-and-glue.md) for persistence and idempotency, [interaction models](components-and-browser.md) for user journeys, and [race properties](async-and-races.md) for overlapping operations.

## Example: sort without losing data or mutating the input

Assume `sortNumbers` accepts an array of integers, returns the same elements in numeric ascending order, and leaves its argument unchanged. Adapt this contract if the real API intentionally sorts in place. The native sort on a copy is a simpler independent oracle for a custom implementation.

```ts
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { sortNumbers } from './sortNumbers.js';

describe('sortNumbers', () => {
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
});
```

The oracle rejects unordered output, dropped duplicates, and unintended mutation. Keep explicit examples for any additional documented behavior such as stability of equal-key records. Do not constrain the input to already sorted or distinct arrays to make a broken sort pass.

**✅ Do** construct the event a property needs, then generate its surroundings: insert a matching item or a failing callback among arbitrary neighbors. Do not rely on chance to exercise the behavior under test.

For a substring search, construct `prefix + pattern + suffix` from three generated strings. Assert that the returned index is valid and `text.slice(index, index + pattern.length) === pattern`. If the API promises the first occurrence, compare with `text.indexOf(pattern)` too. Never use `fc.pre(index !== -1)` on the result: returning “not found” is precisely a bug this property should catch. Test the absent-pattern contract separately.

## Keep generation and failure reproducible

- **👍 Prefer** built-in arbitraries and combinators (`record`, `tuple`, `array`, `oneof`, `map`, `chain`) to retain shrinking and replay support. Use their constraints to represent the actual domain.
- **✅ Do** use `fc.maxSafeInteger()` when the contract spans safe integers; `fc.integer()` covers only signed 32-bit integers by default. Use `bigint` for an exact integer oracle when appropriate.
- **✅ Do** specify expected behavior for supported `NaN`, infinities, signed zero, and invalid dates. `noNaN: true` does not exclude infinity from `fc.double`; use bounds or `noDefaultInfinity` when required.
- **✅ Do** choose string units that cover the supported Unicode domain; `fc.string()` does not generate every possible Unicode string by default.
- **✅ Do** use JSON-compatible arbitraries for a JSON round-trip, so unrepresentable JavaScript values do not invalidate the property.
- **✅ Do** keep explicit examples for important boundaries; small random campaigns need not hit a particular edge case.
- **❌ Don't** describe a single `fc.sample` call as a shrinking property. Sampling neither shrinks assertion failures nor reports the seed automatically; record seed and inputs yourself if sampling is necessary.

## Replay an observed failure

1. **✅ Do** keep fast-check's full failure report, especially the counterexample, seed, and path, so the failing case can be reproduced.
2. **✅ Do** replay the reported seed/path on the unchanged property. Preserve generator order, constraints, examples, library version, and controlled external state.
3. **✅ Do** identify whether the failure comes from production code, an incorrect property, unsupported input, or a leaking fixture. Fix that cause and rerun the same case.
4. **✅ Do** keep the smallest useful counterexample as a named regression or through `examples`, alongside the exploratory property. A permanently fixed seed alone limits future exploration.

The following seed/path values are illustrative, not a known failure:

```ts
await fc.assert(propertyUnderTest, { seed: 12345, path: '0:1:0' });
```

For `@fast-check/vitest`, pass those parameters as the second argument to `it.prop`. A seed cannot recreate an uncontrolled network response or operating-system schedule. Retain command replay information too, when reported, to reproduce the generated sequence.

Use [Execution hooks and limits](execution-and-limits.md) to choose per-evaluation cleanup and budgets that leave time for shrinking and reporting.
