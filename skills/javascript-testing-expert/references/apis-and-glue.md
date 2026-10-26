# Properties for APIs and glue code

1. Choose an observable rule: saved data reads back, rejected updates preserve state, repeated requests have one effect, or combined results preserve source data.
2. Choose the boundary: controlled dependencies for orchestration decisions, or a real test service for integration.
3. Generate payloads or operation sequences from the contract, with known initial state for each evaluation.
4. Execute through the public interface, check responses and resulting state, and dispose of the evaluation's resources.

## Choose the contract

- **✅ Do** test glue code's decisions and combined results: aggregation preserves source items; fallback uses the secondary result only when the primary fails.
- **❌ Don't** substitute mock-call order for an observable contract. Keep clear examples for error paths and simple wiring with no useful generated invariant.
- **✅ Do** repeat the same request with the same idempotency key to verify one observable effect. Distinct requests with distinct keys need a separate property.

## Recipe: a rejected update must not change the resource

This example assumes an inventory API accepts nonnegative integer quantities and
rejects negative integers with status 422. Adapt these assumptions to the actual
API contract. The two arbitraries describe valid initial state and invalid input;
they do not filter cases based on the application's response.

Provide an application-specific `createInventoryFixture(initialQuantity)` helper
that creates a fresh resource in an isolated test namespace. It returns:

- `read()`: reads the public resource representation, `{ quantity: number }`.
- `update(quantity)`: sends the update and returns `{ status: number }`, including
  expected validation failures rather than throwing for their HTTP status.
- `dispose()`: removes the resource and its namespace.

Use the real HTTP client in this helper for an API integration test. The helper
must release partially acquired resources if its own setup fails. Browser storage
or resetting client mocks does not isolate server-side data.

```ts
import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';
import { createInventoryFixture } from './inventory-test-fixture.js';

describe('inventory', () => {
  it('should reject negative quantities without changing the resource', async () => {
    await fc.assert(rejectedUpdateProperty(createInventoryFixture));
  });
});

// Helpers
function rejectedUpdateProperty(createFixture: typeof createInventoryFixture) {
  return fc.property(fc.nat(), fc.integer({ max: -1 }), async (initialQuantity, invalidQuantity) => {
    const fixture = await createFixture(initialQuantity);
    try {
      // Arrange: read the observable state before the invalid operation.
      const before = await fixture.read();
      expect(before).toEqual({ quantity: initialQuantity });

      // Act
      const response = await fixture.update(invalidQuantity);

      // Assert both rejection and absence of a partial write.
      expect(response.status).toBe(422);
      expect(await fixture.read()).toEqual(before);
    } finally {
      // Every generated case and shrinking attempt owns its resource.
      await fixture.dispose();
    }
  });
}
```

Validate red by temporarily making the implementation write the invalid quantity
before rejecting it. The state comparison must fail even though status 422 is
correct. Also check that accepting the invalid update fails the response assertion.
Restore the implementation and confirm the same inputs pass. Preserve seed/path
and use the [replay guidance](properties-and-replay.md) for a discovered failure.

For longer workflows, generate commands against a small independent model and
verify state after each action. For overlapping requests or retries, also use the
[race-condition recipe](async-and-races.md): state which completion boundary the
test controls and check intermediate observable effects.
