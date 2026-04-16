# Test glue code {#tldr}

> **⚠️ Scope:** How to test code that orchestrates and connects external dependencies?

## If the function only wires dependencies together...

**❌ Don't** repeat the implementation in the test

**👎 Avoid** testing with mock simple glue code without added logic

```ts
// fetchAndTransform: fetches data from an API and transforms it without doing anything special (no branching logic)
function fetchAndTransform(fetchData, transformData, id) {
  const fetched = await fetchData(id);
  return transformData(fetched);
}

// ❌ Problematic: rewrite the code logic in the test without any added value
it('should fetch and transform', async () => {
  // Arrange
  const fetchedData = { id: 1, name: 'test' };
  const mockFetch = vi.fn().mockResolvedValue(fetchedData);
  const mockTransform = vi.fn().mockReturnValue({ id: 1, displayName: 'TEST' });

  // Act
  const result = await fetchAndTransform(mockFetch, mockTransform, 1);

  // Assert
  expect(mockFetch).toHaveBeenCalledTimes(1);
  expect(mockFetch).toHaveBeenCalledWith(1);
  expect(mockTransform).toHaveBeenCalledTimes(1);
  expect(mockTransform).toHaveBeenCalledWith(fetchedData);
  expect(result).toEqual({ id: 1, displayName: 'TEST' });
});
```

**👍 Prefer** testing a few examples in an integration fashion to have them as public examples if the function is supposed to be used as a publicly available one

**👍 Prefer** screenshoting the function if it is supposed to render a complex but logic-less UI

**👍 Prefer** snapshoting the function if it is supposed to render a complex but logic-less UI and screenshot options are not on the table

```tsx
// Modal component
function Modal(props) {
  const { title, onClose, onConfirm, children } = props;
  return (
    <Popover onClose={onClose}>
      <ModalHeader title={title} />
      <ModalContent children={children} />
      <ModalActionBar onCancel={onClose} onConfirm={onConfirm} />
    </Popover>
  );
}

// ❌ Screenshot tests on ModalHeader won't make sense alone in many cases. Except if the component is supposed to be publically used. Same for all other internally used components.
// ✅ BUT testing their logic in an unitary fashion makes sense.

// ✅ Screenshot tests on Modal makes sense to avoid visual regressions.
// 👍 If screenshot tests are not available snapshot tests on the DOM structure may prevent unwanted regressions when bumping sub-libraries or when changing deep components pulled by transitivity.
// 👍 If snapshot tests get used make it clear that they have been used to prevent unwanted changes but that as long as the developer expects the change we are fine with updating them.
```

## If the function has branching logic based on dependency results...

**✅ Do** test each branch to ensure the correct dependency is called

**✅ Do** use stubs or fakes instead of mocks when possible to avoid over-specification

```ts
// processUser: fetches user, then either updates or creates based on existence

// ❌ Problematic: over-specified with exact call counts and orders
it('should update existing user', async () => {
  const mockGet = vi.fn().mockResolvedValue({ id: 1 });
  const mockUpdate = vi.fn().mockResolvedValue(undefined);
  const mockCreate = vi.fn();

  await processUser(mockGet, mockUpdate, mockCreate, 1);

  expect(mockGet).toHaveBeenCalledTimes(1);
  expect(mockUpdate).toHaveBeenCalledTimes(1);
  expect(mockCreate).toHaveBeenCalledTimes(0);
});

// ✅ Good: focus on the outcome and the branch taken
it('should update when user exists', async () => {
  const existingUser = { id: 1, name: 'Alice' };
  const mockGet = vi.fn().mockResolvedValue(existingUser);
  const mockUpdate = vi.fn().mockResolvedValue(undefined);
  const mockCreate = vi.fn();

  await processUser(mockGet, mockUpdate, mockCreate, 1);

  expect(mockUpdate).toHaveBeenCalledWith(existingUser);
  expect(mockCreate).not.toHaveBeenCalled();
});
```

## If the function aggregates results from multiple dependencies...

**✅ Do** test the aggregation logic, not the individual dependency behaviors

**✅ Do** consider using property-based testing to verify aggregation invariants

```ts
// combineData: calls multiple APIs and merges results

// ✅ Good: focus on how results are combined
it('should merge data from both sources', async () => {
  const sourceA = { users: [{ id: 1 }] };
  const sourceB = { users: [{ id: 2 }] };
  const fetchA = vi.fn().mockResolvedValue(sourceA);
  const fetchB = vi.fn().mockResolvedValue(sourceB);

  const result = await combineData(fetchA, fetchB);

  expect(result.users).toHaveLength(2);
  expect(result.users).toContainEqual({ id: 1 });
  expect(result.users).toContainEqual({ id: 2 });
});
```

## If error handling is part of the glue logic...

**✅ Do** test error propagation and recovery paths

**✅ Do** verify that errors from one dependency are handled before calling others

```ts
// fetchWithFallback: tries primary source, falls back to secondary on failure

// ✅ Good: test the fallback behavior which is the glue's responsibility
it('should fallback to secondary when primary fails', async () => {
  const primaryFetch = vi.fn().mockRejectedValue(new Error('Primary down'));
  const secondaryFetch = vi.fn().mockResolvedValue({ data: 'fallback' });

  const result = await fetchWithFallback(primaryFetch, secondaryFetch);

  expect(result).toEqual({ data: 'fallback' });
  expect(secondaryFetch).toHaveBeenCalled();
});

it('should not call secondary when primary succeeds', async () => {
  const primaryFetch = vi.fn().mockResolvedValue({ data: 'primary' });
  const secondaryFetch = vi.fn();

  const result = await fetchWithFallback(primaryFetch, secondaryFetch);

  expect(result).toEqual({ data: 'primary' });
  expect(secondaryFetch).not.toHaveBeenCalled();
});
```

## General guidance for glue code testing...

- **✅ Do** prefer dependency injection over module mocking for better testability

- **✅ Do** keep glue code thin — if there's complex logic, extract it to a testable unit

- **⚠️ Avoid** testing implementation details like call order unless it's part of the contract

- **⚠️ Avoid** re-testing behavior that's already covered by the dependencies' own tests
