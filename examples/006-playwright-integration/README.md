# Playwright + Vitest Integration Examples

This directory contains examples demonstrating how to write unit and integration tests using Playwright with Vitest and fast-check.

## Overview

These examples showcase:

1. **Unit Tests** - Testing pure JavaScript functions with property-based testing
2. **Integration Tests** - Testing UI interactions with Playwright
3. **Property-Based Integration Tests** - Combining Playwright with fast-check for exhaustive UI testing

## Structure

```
006-playwright-integration/
├── simple-app/
│   ├── index.html                  # Simple calculator web app
│   ├── calculator.js               # Calculator logic
│   ├── calculator.spec.ts          # Unit tests with property-based testing
│   ├── integration.spec.ts         # Integration tests with Playwright
│   └── property-based.spec.ts      # Property-based integration tests
├── playwright.config.ts            # Playwright configuration
└── README.md                       # This file
```

## Running the Tests

### Unit Tests

Unit tests use Vitest with `@fast-check/vitest` for property-based testing:

```bash
# From the repository root
pnpm test -- simple-app/calculator.spec.ts
```

### Integration Tests

Integration tests use Playwright to test the UI:

```bash
# From this directory
npx playwright test integration.spec.ts
```

### Property-Based Integration Tests

These tests combine Playwright's browser automation with fast-check's property-based testing:

```bash
# From this directory
npx playwright test property-based.spec.ts
```

### Run All Tests

```bash
# Run all Playwright tests
npx playwright test

# Run unit tests
pnpm test -- calculator.spec.ts
```

## Key Concepts

### Unit Testing with Property-Based Testing

The `calculator.spec.ts` file demonstrates:

- Testing mathematical properties (commutativity, associativity, identity)
- Using `it.prop()` from `@fast-check/vitest`
- Generating test data with fast-check arbitraries

```typescript
it.prop([fc.integer(), fc.integer()])('should be commutative', (a, b) => {
  expect(add(a, b)).toBe(add(b, a));
});
```

### Integration Testing with Playwright

The `integration.spec.ts` file demonstrates:

- Browser automation with Playwright
- Testing user interactions (filling forms, clicking buttons)
- Asserting on UI state and displayed content

```typescript
test('should add two numbers correctly', async ({ page }) => {
  await page.fill('#num1', '5');
  await page.fill('#num2', '3');
  await page.click('#add');
  await expect(page.locator('#result')).toHaveText('Result: 8');
});
```

### Property-Based Integration Testing

The `property-based.spec.ts` file demonstrates:

- Combining Playwright with fast-check for exhaustive UI testing
- Testing UI properties across many input combinations
- Using `fc.assert()` with `fc.asyncProperty()`

```typescript
test('addition should be commutative in the UI', async ({ page }) => {
  await fc.assert(
    fc.asyncProperty(fc.integer(), fc.integer(), async (a, b) => {
      // Test that a + b = b + a in the UI
    }),
    { numRuns: 10 }
  );
});
```

## Best Practices

### 1. Start with Unit Tests

Always start with unit tests for pure logic. They're faster and easier to debug.

### 2. Use Property-Based Testing for Unit Tests

Property-based testing helps discover edge cases that example-based tests might miss.

### 3. Integration Tests for User Flows

Use Playwright integration tests to verify complete user workflows and UI behavior.

### 4. Combine Both for Comprehensive Testing

Use property-based testing with Playwright for exhaustive testing of UI properties, but limit `numRuns` to keep tests fast.

### 5. Keep Test Data Realistic

Use fast-check's arbitraries with constraints that match real-world usage:

```typescript
fc.integer({ min: -1000, max: 1000 }) // Reasonable range
fc.integer({ min: 1, max: 1000 })     // Non-zero divisors
```

### 6. Test Properties, Not Implementation

Focus on testing observable behaviors and mathematical properties:

- ✅ "Addition is commutative"
- ✅ "Division by zero shows an error"
- ❌ "Function calls a specific method"

## Benefits of This Approach

1. **Better Coverage** - Property-based tests explore many more scenarios than example-based tests
2. **Faster Feedback** - Unit tests run quickly, integration tests verify real behavior
3. **Reproducible Failures** - fast-check provides seeds to reproduce failures
4. **Real Browser Testing** - Playwright tests run in real browsers
5. **Combined Strengths** - Fast unit tests + thorough integration tests = confidence

## Additional Resources

- [fast-check Documentation](https://fast-check.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [@fast-check/vitest Documentation](https://github.com/dubzzz/fast-check/tree/main/packages/vitest)
