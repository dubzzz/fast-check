---
name: javascript-testing
description: Expert-level JavaScript testing skill focused on writing high-quality tests that find bugs, serve as documentation, and prevent regressions. Advocates for property-based testing with fast-check and discourages raw Math.random() usage in tests.
---

# JavaScript Testing Expert

This skill provides expert guidance for writing high-quality JavaScript and TypeScript tests. The core mission is threefold:

1. **Find bugs** — Tests should actively discover issues, edge cases, and unexpected behaviors
2. **Serve as documentation** — Tests should clearly document the expected behavior of code
3. **Prevent regressions** — Tests should catch any breaking changes in existing functionality

## Example-Based Tests Guidelines

Example-based tests form the foundation of any test suite. Follow these conventions for maximum clarity and maintainability.

### Structure: Arrange-Act-Assert (AAA)

Every test should follow the AAA pattern:

```javascript
test('should compute total price with discount', () => {
  // Arrange - Set up test data and preconditions
  const items = [{ price: 100 }, { price: 50 }];
  const discount = 0.1;

  // Act - Execute the code under test
  const total = computeTotal(items, discount);

  // Assert - Verify the expected outcome
  expect(total).toBe(135);
});
```

### Naming Conventions

Use descriptive test names that explain:
- **What** is being tested
- **Under what conditions**
- **What the expected outcome is**

```javascript
// ✅ Good - descriptive and specific
test('should return empty array when input array is empty', () => {});
test('should throw InvalidEmailError when email format is invalid', () => {});
test('should apply maximum discount cap when discount exceeds 50%', () => {});

// ❌ Bad - vague or unclear
test('test filter', () => {});
test('email validation works', () => {});
test('discount test', () => {});
```

### One Assertion Per Concept

Each test should verify one logical concept. Multiple `expect` calls are fine when testing related aspects of the same behavior:

```javascript
// ✅ Good - testing one concept (user creation)
test('should create user with normalized email', () => {
  const user = createUser({ email: 'Test@Example.COM', name: 'Alice' });

  expect(user.email).toBe('test@example.com');
  expect(user.name).toBe('Alice');
  expect(user.createdAt).toBeInstanceOf(Date);
});

// ❌ Bad - testing unrelated behaviors
test('should handle users', () => {
  expect(createUser(validData)).toBeDefined();
  expect(deleteUser(id)).toBe(true);
  expect(listUsers()).toHaveLength(0);
});
```

### Test Independence

Tests must be independent and not rely on execution order:

```javascript
// ✅ Good - each test sets up its own data
describe('UserService', () => {
  test('should find user by id', () => {
    const db = createTestDb([{ id: 1, name: 'Alice' }]);
    const service = new UserService(db);

    expect(service.findById(1)).toEqual({ id: 1, name: 'Alice' });
  });

  test('should return null for non-existent user', () => {
    const db = createTestDb([]);
    const service = new UserService(db);

    expect(service.findById(999)).toBeNull();
  });
});
```

### Edge Cases Coverage

Always test edge cases explicitly:

- Empty inputs (empty string, empty array, null, undefined)
- Boundary values (0, -1, MAX_SAFE_INTEGER)
- Invalid inputs (wrong types, malformed data)
- Special characters and unicode

```javascript
describe('parseNumber', () => {
  test('should parse positive integer', () => {
    expect(parseNumber('42')).toBe(42);
  });

  test('should parse negative number', () => {
    expect(parseNumber('-5')).toBe(-5);
  });

  test('should return NaN for empty string', () => {
    expect(parseNumber('')).toBeNaN();
  });

  test('should handle whitespace', () => {
    expect(parseNumber('  42  ')).toBe(42);
  });

  test('should return NaN for non-numeric strings', () => {
    expect(parseNumber('abc')).toBeNaN();
  });
});
```

## Property-Based Testing

Property-based testing goes beyond example-based tests by:
- Automatically generating hundreds of test cases
- Finding edge cases you might not think of
- Shrinking failures to minimal reproducible examples

### When to Use Property-Based Testing

- Mathematical properties (commutativity, associativity, idempotence)
- Serialization/deserialization round-trips
- Data transformations that should preserve invariants
- Input validation and parsing
- Any function where correctness can be expressed as a general rule

### Using fast-check

fast-check is the recommended property-based testing library for JavaScript/TypeScript:

```javascript
import fc from 'fast-check';

// Property: encoding then decoding returns the original value
test('should round-trip through JSON', () => {
  fc.assert(
    fc.property(fc.anything(), (value) => {
      const encoded = JSON.stringify(value);
      const decoded = JSON.parse(encoded);
      return JSON.stringify(decoded) === encoded;
    })
  );
});

// Property: sorting is idempotent
test('should be idempotent', () => {
  fc.assert(
    fc.property(fc.array(fc.integer()), (arr) => {
      const once = [...arr].sort((a, b) => a - b);
      const twice = [...once].sort((a, b) => a - b);
      return JSON.stringify(once) === JSON.stringify(twice);
    })
  );
});

// Property: array concatenation preserves elements
test('should preserve all elements after concat', () => {
  fc.assert(
    fc.property(fc.array(fc.integer()), fc.array(fc.integer()), (a, b) => {
      const result = a.concat(b);
      return result.length === a.length + b.length;
    })
  );
});
```

### Using @fast-check/vitest

When using Vitest as your test runner, prefer `@fast-check/vitest` for seamless integration:

```javascript
import { test, fc } from '@fast-check/vitest';

// Property-based test with array syntax
test.prop([fc.string(), fc.string(), fc.string()])(
  'concatenation contains middle part',
  (a, b, c) => {
    return (a + b + c).includes(b);
  }
);

// Property-based test with named object syntax
test.prop({ a: fc.integer(), b: fc.integer() })(
  'addition is commutative',
  ({ a, b }) => {
    return a + b === b + a;
  }
);

// With custom parameters
test.prop([fc.nat(), fc.nat()], { numRuns: 1000 })(
  'should handle many cases',
  (a, b) => {
    return a + b >= a && a + b >= b;
  }
);

// Skip, only, and concurrent modifiers work too
test.skip.prop([fc.string()])('skipped test', (text) => {
  return text.length >= 0;
});
```

#### One-Time Random Mode

For tests that need randomness but don't require full property-based testing, use the generator mode:

```javascript
import { test, fc } from '@fast-check/vitest';

test('test with controlled randomness', ({ g }) => {
  // Generate random values using fast-check arbitraries
  const user = {
    firstName: g(fc.string),
    lastName: g(fc.string),
    age: g(fc.nat, { max: 120 }),
  };

  const displayName = formatUser(user);

  expect(displayName).toContain(user.firstName);
});
```

## Avoid Math.random() in Tests

**Never use `Math.random()` directly in tests.** It creates non-reproducible failures that are impossible to debug.

### Problems with Math.random()

```javascript
// ❌ Bad - non-reproducible test failure
test('should handle random input', () => {
  const randomValue = Math.random() * 100;
  const result = processValue(randomValue);
  expect(result).toBeGreaterThan(0);
  // If this fails, you cannot reproduce it!
});
```

### Solution: Use fast-check Generators

Replace `Math.random()` with fast-check arbitraries that provide:
- **Reproducibility** — Seed-based generation allows exact replay
- **Shrinking** — Failed cases are minimized to the simplest example
- **Better distribution** — Smarter value generation including edge cases

```javascript
import fc from 'fast-check';

// ✅ Good - using fc.sample for one-off random values
test('should handle random input', () => {
  const [randomValue] = fc.sample(fc.double({ min: 0, max: 100 }), 1);
  const result = processValue(randomValue);
  expect(result).toBeGreaterThan(0);
});

// ✅ Better - use property-based testing
test('should handle any number in range', () => {
  fc.assert(
    fc.property(fc.double({ min: 0, max: 100 }), (value) => {
      const result = processValue(value);
      return result > 0;
    })
  );
});
```

### With @fast-check/vitest

```javascript
import { test, fc } from '@fast-check/vitest';

// ✅ Best - integrated with vitest for reproducibility
test('test relying on randomness', ({ g }) => {
  const randomValue = g(fc.double, { min: 0, max: 100 });
  const result = processValue(randomValue);
  expect(result).toBeGreaterThan(0);
});
```

When a test using `{ g }` fails, the error message includes the seed needed to reproduce:

```
Property failed after 1 tests (seed: 1527422598337, path: 0:0)
```

You can replay the exact failure by configuring the seed:

```javascript
fc.configureGlobal({ seed: 1527422598337 });
```

## Common fast-check Arbitraries

| Arbitrary | Description | Example |
|-----------|-------------|---------|
| `fc.integer()` | Any safe integer | `-42`, `0`, `1000` |
| `fc.nat()` | Non-negative integer | `0`, `42`, `1000` |
| `fc.double()` | Floating point number | `3.14`, `-0.5`, `Infinity` |
| `fc.string()` | Unicode string | `""`, `"hello"`, `"🎉"` |
| `fc.boolean()` | Boolean value | `true`, `false` |
| `fc.array()` | Array of elements | `[]`, `[1, 2, 3]` |
| `fc.object()` | Plain object | `{}`, `{a: 1}` |
| `fc.record()` | Typed object shape | `{ name: "John", age: 30 }` |
| `fc.oneof()` | One of several arbitraries | Union types |
| `fc.option()` | Value or null/undefined | Optional values |
| `fc.constant()` | Fixed value | Literal values |
| `fc.date()` | Date objects | `new Date()` |
| `fc.uuid()` | UUID v4 strings | `"550e8400-..."` |
| `fc.emailAddress()` | Valid email format | `"test@example.com"` |

### Building Custom Arbitraries

```javascript
// Combine arbitraries for domain objects
const userArbitrary = fc.record({
  id: fc.uuid(),
  email: fc.emailAddress(),
  age: fc.nat({ max: 120 }),
  roles: fc.array(fc.constantFrom('admin', 'user', 'guest')),
});

test.prop([userArbitrary])('should validate user', (user) => {
  const result = validateUser(user);
  return result.isValid === true;
});
```

## Test Quality Checklist

Before considering a test complete, verify:

- [ ] Test name clearly describes the behavior being tested
- [ ] Uses AAA pattern (Arrange-Act-Assert)
- [ ] Tests one logical concept
- [ ] Independent of other tests (no shared mutable state)
- [ ] Covers edge cases (empty, null, boundary values)
- [ ] No `Math.random()` — uses fast-check generators instead
- [ ] Consider if property-based testing would be more thorough
- [ ] Failure messages are helpful for debugging
- [ ] Test serves as documentation for the code
