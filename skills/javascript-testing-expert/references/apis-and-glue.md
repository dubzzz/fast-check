# Properties for APIs and glue code

Test the observable responsibility of the boundary: a saved resource can be read
back, a rejected update leaves state unchanged, or repeated requests with the same
idempotency key produce one effect. Generate payloads and operation sequences;
assert responses and resulting state through the public interface.

For glue code, choose a property of its decisions or combined result. Aggregation
can preserve all source items; a fallback can return the secondary result only
when the primary fails; retrying an idempotent operation can preserve state.
Use small controlled dependencies when testing the orchestrator itself and a real
test service when testing integration. Merely repeating the implementation's mock
call order does not establish either contract. Keep clear examples for important
error paths and simple wiring that has no useful generated invariant.

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
