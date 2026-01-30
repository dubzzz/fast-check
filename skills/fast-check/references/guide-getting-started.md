# Getting Started with fast-check

## Installation

```bash
# npm
npm install --save-dev fast-check

# yarn
yarn add fast-check --dev

# pnpm
pnpm add -D fast-check
```

## Your First Property-Based Test

```ts
import fc from 'fast-check';

// A simple property: string concatenation length
fc.assert(
  fc.property(fc.string(), fc.string(), (a, b) => {
    return (a + b).length === a.length + b.length;
  })
);
```

## What is Property-Based Testing?

Property-based testing is a testing methodology where you define **properties** that should hold for all inputs, rather than testing specific examples.

### Example-Based vs Property-Based

**Example-based (traditional):**
```ts
test('sort works', () => {
  expect(sort([3, 1, 2])).toEqual([1, 2, 3]);
  expect(sort([5, 4])).toEqual([4, 5]);
  expect(sort([])).toEqual([]);
});
```

**Property-based:**
```ts
test('sort properties', () => {
  fc.assert(
    fc.property(fc.array(fc.integer()), (arr) => {
      const sorted = sort(arr);
      // Property 1: Same length
      if (sorted.length !== arr.length) return false;
      // Property 2: Elements are ordered
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] < sorted[i - 1]) return false;
      }
      // Property 3: Same elements
      return arr.every((x) => sorted.includes(x));
    })
  );
});
```

## Core Concepts

### 1. Arbitraries

Arbitraries are random data generators. fast-check provides arbitraries for:

- Primitives: `fc.integer()`, `fc.string()`, `fc.boolean()`
- Composites: `fc.array()`, `fc.record()`, `fc.tuple()`
- Web: `fc.emailAddress()`, `fc.webUrl()`, `fc.uuid()`
- And many more

### 2. Properties

Properties define what should be true for all generated inputs:

```ts
fc.property(fc.integer(), (n) => {
  return Math.abs(n) >= 0; // Should be true for all integers
});
```

### 3. Assertions

`fc.assert()` runs the property with many random inputs and throws if any fails:

```ts
fc.assert(property); // Throws on failure
```

### 4. Shrinking

When a test fails, fast-check automatically "shrinks" the input to find the minimal failing case. This makes debugging much easier.

## Integration with Test Frameworks

### Jest

```ts
import fc from 'fast-check';

describe('math operations', () => {
  it('addition is commutative', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (a, b) => {
        return a + b === b + a;
      })
    );
  });
});
```

### Vitest

```ts
import fc from 'fast-check';
import { describe, it } from 'vitest';

describe('math operations', () => {
  it('addition is commutative', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (a, b) => {
        return a + b === b + a;
      })
    );
  });
});
```

### Mocha

```ts
import fc from 'fast-check';

describe('math operations', () => {
  it('addition is commutative', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (a, b) => {
        return a + b === b + a;
      })
    );
  });
});
```

## Next Steps

- Learn about [built-in arbitraries](core-arbitraries.md)
- Understand [properties in depth](core-properties.md)
- Configure [runners](core-runners.md)
- Master [debugging techniques](guide-debugging.md)
