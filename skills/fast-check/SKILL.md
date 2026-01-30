---
name: fast-check
description: Property-based testing framework for JavaScript/TypeScript. Use when writing property-based tests, creating arbitraries (random data generators), testing with shrinking, or integrating with test frameworks like Jest, Vitest, or Mocha.
---

# fast-check - Property-Based Testing Framework

Property-based testing framework for JavaScript/TypeScript that generates random test inputs, automatically shrinks failing cases to minimal counterexamples, and helps find edge cases you might never think to test manually.

## When to Use

- Writing property-based tests instead of example-based tests
- Generating random test data with automatic shrinking
- Testing invariants and properties that should hold for all inputs
- Finding edge cases and corner cases automatically
- Fuzzing APIs and functions with diverse inputs
- Model-based testing of stateful systems
- Detecting race conditions in async code

## Quick Start

```bash
# Install
npm install --save-dev fast-check
# or
pnpm add -D fast-check
# or
yarn add fast-check --dev
```

## Basic Usage

```ts
import fc from 'fast-check';

// Test a property: string always contains itself
fc.assert(
  fc.property(fc.string(), (text) => {
    return text.includes(text);
  })
);

// Test with multiple inputs
fc.assert(
  fc.property(fc.string(), fc.string(), fc.string(), (a, b, c) => {
    return (a + b + c).includes(b);
  })
);
```

## Integration with Test Frameworks

### Jest / Vitest

```ts
import fc from 'fast-check';
import { describe, it } from 'vitest'; // or jest

describe('MyFunction', () => {
  it('should maintain invariant', () => {
    fc.assert(
      fc.property(fc.integer(), (n) => {
        return myFunction(n) >= 0;
      })
    );
  });
});
```

### Mocha

```ts
import fc from 'fast-check';

describe('properties', () => {
  it('should always hold', () => {
    fc.assert(fc.property(fc.string(), (s) => s.length >= 0));
  });
});
```

## Core References

| Topic | Description | Reference |
|-------|-------------|-----------|
| Getting Started | Installation, first test, basic concepts | [guide-getting-started](references/guide-getting-started.md) |
| Arbitraries | Built-in data generators for all types | [core-arbitraries](references/core-arbitraries.md) |
| Properties | Defining and asserting properties | [core-properties](references/core-properties.md) |
| Runners | fc.assert, fc.check, and configuration | [core-runners](references/core-runners.md) |
| Shrinking | Understanding automatic shrinking | [core-shrinking](references/core-shrinking.md) |
| Debugging | Verbose mode, replay, and troubleshooting | [guide-debugging](references/guide-debugging.md) |

## Arbitraries (Data Generators)

### Primitive Arbitraries

| Arbitrary | Description | Example |
|-----------|-------------|---------|
| `fc.integer()` | Random integers | `fc.integer({ min: 0, max: 100 })` |
| `fc.nat()` | Natural numbers (≥0) | `fc.nat({ max: 1000 })` |
| `fc.bigInt()` | BigInt values | `fc.bigInt({ min: 0n, max: 1000n })` |
| `fc.float()` | Floating point | `fc.float({ min: 0, max: 1 })` |
| `fc.double()` | Double precision | `fc.double({ noNaN: true })` |
| `fc.boolean()` | true/false | `fc.boolean()` |
| `fc.string()` | Unicode strings | `fc.string({ minLength: 1, maxLength: 10 })` |
| `fc.char()` | Single character | `fc.char()` |

### String Arbitraries

| Arbitrary | Description | Example |
|-----------|-------------|---------|
| `fc.string()` | Unicode strings | `fc.string()` |
| `fc.asciiString()` | ASCII only | `fc.asciiString()` |
| `fc.unicodeString()` | Full Unicode | `fc.unicodeString()` |
| `fc.hexaString()` | Hex characters | `fc.hexaString()` |
| `fc.base64String()` | Base64 encoded | `fc.base64String()` |
| `fc.stringMatching()` | Match regex | `fc.stringMatching(/[a-z]+/)` |
| `fc.lorem()` | Lorem ipsum words | `fc.lorem({ maxCount: 5 })` |

### Composite Arbitraries

| Arbitrary | Description | Example |
|-----------|-------------|---------|
| `fc.array()` | Arrays of values | `fc.array(fc.integer())` |
| `fc.tuple()` | Fixed-size tuples | `fc.tuple(fc.string(), fc.integer())` |
| `fc.record()` | Objects with schema | `fc.record({ name: fc.string(), age: fc.nat() })` |
| `fc.dictionary()` | Key-value objects | `fc.dictionary(fc.string(), fc.integer())` |
| `fc.object()` | Random objects | `fc.object()` |
| `fc.anything()` | Any JSON-like value | `fc.anything()` |

### Date & Time

| Arbitrary | Description | Example |
|-----------|-------------|---------|
| `fc.date()` | Date objects | `fc.date({ min: new Date('2020-01-01') })` |

### Web & Network

| Arbitrary | Description | Example |
|-----------|-------------|---------|
| `fc.webUrl()` | Valid URLs | `fc.webUrl()` |
| `fc.domain()` | Domain names | `fc.domain()` |
| `fc.emailAddress()` | Email addresses | `fc.emailAddress()` |
| `fc.ipV4()` | IPv4 addresses | `fc.ipV4()` |
| `fc.ipV6()` | IPv6 addresses | `fc.ipV6()` |
| `fc.uuid()` | UUID v4 | `fc.uuid()` |
| `fc.ulid()` | ULID | `fc.ulid()` |

### Combiners (Transform Arbitraries)

| Method | Description | Example |
|--------|-------------|---------|
| `.map()` | Transform values | `fc.integer().map(n => n * 2)` |
| `.filter()` | Filter values | `fc.integer().filter(n => n > 0)` |
| `.chain()` | Dependent generation | `fc.integer().chain(n => fc.array(fc.nat(), { maxLength: n }))` |
| `fc.oneof()` | Pick from options | `fc.oneof(fc.string(), fc.integer())` |
| `fc.option()` | Value or null/undefined | `fc.option(fc.string())` |
| `fc.constant()` | Fixed value | `fc.constant('hello')` |
| `fc.constantFrom()` | Pick from constants | `fc.constantFrom('a', 'b', 'c')` |

## Common Patterns

### Testing Pure Functions

```ts
// Commutativity: a + b === b + a
fc.assert(
  fc.property(fc.integer(), fc.integer(), (a, b) => {
    return add(a, b) === add(b, a);
  })
);

// Associativity: (a + b) + c === a + (b + c)
fc.assert(
  fc.property(fc.integer(), fc.integer(), fc.integer(), (a, b, c) => {
    return add(add(a, b), c) === add(a, add(b, c));
  })
);

// Identity: a + 0 === a
fc.assert(
  fc.property(fc.integer(), (a) => {
    return add(a, 0) === a;
  })
);
```

### Testing Encode/Decode

```ts
// Round-trip: decode(encode(x)) === x
fc.assert(
  fc.property(fc.string(), (s) => {
    return decode(encode(s)) === s;
  })
);
```

### Testing Sort Functions

```ts
fc.assert(
  fc.property(fc.array(fc.integer()), (arr) => {
    const sorted = mySort([...arr]);
    // Same length
    if (sorted.length !== arr.length) return false;
    // Actually sorted
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] < sorted[i - 1]) return false;
    }
    // Contains same elements
    return arr.every((x) => sorted.includes(x));
  })
);
```

### Preconditions with fc.pre()

```ts
fc.assert(
  fc.property(fc.integer(), fc.integer(), (a, b) => {
    fc.pre(b !== 0); // Skip when b is 0
    return divide(a, b) * b === a;
  })
);
```

### Custom Arbitraries

```ts
// Create reusable arbitraries
const userArbitrary = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1 }),
  email: fc.emailAddress(),
  age: fc.integer({ min: 0, max: 150 }),
});

fc.assert(
  fc.property(userArbitrary, (user) => {
    return validateUser(user) === true;
  })
);
```

### Recursive Structures

```ts
// Use fc.letrec for recursive types like trees
const { tree } = fc.letrec((tie) => ({
  tree: fc.oneof(
    fc.record({ type: fc.constant('leaf'), value: fc.integer() }),
    fc.record({
      type: fc.constant('node'),
      left: tie('tree'),
      right: tie('tree'),
    })
  ),
}));
```

## Runner Configuration

```ts
fc.assert(
  fc.property(fc.string(), (s) => s.length >= 0),
  {
    numRuns: 1000,           // Number of test runs (default: 100)
    seed: 42,                // Reproducible runs
    verbose: true,           // Show all generated values
    endOnFailure: true,      // Stop on first failure
    timeout: 5000,           // Timeout per run in ms
    examples: [['test']],    // Always test these examples first
  }
);
```

## Debugging Failed Tests

When a test fails, fast-check outputs:
1. **Seed** - for reproducibility
2. **Path** - shrink path to minimal case
3. **Counterexample** - the minimal failing input

```ts
// Replay a specific failure
fc.assert(
  fc.property(fc.string(), (s) => {
    return s.length < 10;
  }),
  { seed: 1234567890, path: '0:1:2' }
);

// Enable verbose mode
fc.assert(
  fc.property(fc.string(), (s) => s.length < 10),
  { verbose: true }
);
```

## Advanced Features

### Model-Based Testing

```ts
import fc from 'fast-check';

// Define commands
class PushCommand implements fc.Command<Model, Real> {
  constructor(readonly value: number) {}
  check = () => true;
  run(m: Model, r: Real) {
    m.push(this.value);
    r.push(this.value);
  }
  toString = () => `push(${this.value})`;
}

// Generate command sequences
const commands = fc.commands([
  fc.integer().map((v) => new PushCommand(v)),
  // ... more commands
]);

fc.assert(
  fc.property(commands, (cmds) => {
    const model = createModel();
    const real = createReal();
    fc.modelRun(() => ({ model, real }), cmds);
  })
);
```

### Race Condition Detection

```ts
import fc from 'fast-check';

fc.assert(
  fc.asyncProperty(fc.scheduler(), async (s) => {
    // Wrap async operations
    const fetch1 = s.schedule(Promise.resolve('a'));
    const fetch2 = s.schedule(Promise.resolve('b'));
    
    // Execute in random order
    const results = await s.waitAll([fetch1, fetch2]);
    
    // Assert invariants hold regardless of order
    return results.length === 2;
  })
);
```

### Generate Without Assert (fc.sample)

```ts
// Get sample values
const samples = fc.sample(fc.integer(), 10);
console.log(samples); // [0, -1, 2, -3, ...]

// Use for manual testing
const testData = fc.sample(
  fc.record({ name: fc.string(), age: fc.nat() }),
  5
);
```

## Best Practices

1. **Start simple**: Begin with basic arbitraries and add complexity as needed

2. **Use descriptive property names**: Name tests after the property being tested
   ```ts
   it('addition is commutative', () => { ... });
   ```

3. **Prefer .map() over .filter()**: Filtering discards values and can be slow
   ```ts
   // Prefer
   fc.integer({ min: 1 })
   // Over
   fc.integer().filter(n => n > 0)
   ```

4. **Use fc.pre() sparingly**: Too many preconditions slow tests

5. **Leverage shrinking**: Let fast-check find minimal counterexamples

6. **Save seeds for CI**: Log seeds in CI for reproducibility

7. **Use examples for known edge cases**:
   ```ts
   fc.assert(property, { examples: [[''], ['edge case']] });
   ```

8. **Custom arbitraries for domain types**: Build reusable arbitraries for your domain

## Resources

- Documentation: https://fast-check.dev/
- API Reference: https://fast-check.dev/api-reference/index.html
- Quick Start Tutorial: https://fast-check.dev/docs/tutorials/quick-start/
- GitHub: https://github.com/dubzzz/fast-check
