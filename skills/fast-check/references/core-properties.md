# Properties Reference

Properties define what should be true for all generated inputs. They are the core of property-based testing.

## Basic Property

```ts
import fc from 'fast-check';

// Define a property
const property = fc.property(
  fc.integer(),           // Arbitrary 1
  fc.string(),            // Arbitrary 2
  (n, s) => {             // Predicate: (number, string) => boolean
    return true;          // Return true if property holds
  }
);

// Assert the property
fc.assert(property);
```

## Multiple Inputs

```ts
// Single input
fc.property(fc.string(), (s) => s.length >= 0);

// Two inputs
fc.property(fc.integer(), fc.integer(), (a, b) => a + b === b + a);

// Three inputs
fc.property(fc.string(), fc.string(), fc.string(), (a, b, c) => {
  return (a + b + c).includes(b);
});

// Many inputs (up to any number)
fc.property(
  fc.integer(),
  fc.integer(),
  fc.integer(),
  fc.integer(),
  (a, b, c, d) => {
    return (a + b) + (c + d) === a + (b + c) + d;
  }
);
```

## Return Values

### Boolean Return

```ts
// Return true/false
fc.property(fc.integer(), (n) => {
  return n * 0 === 0;  // true = pass, false = fail
});
```

### Void Return (Use Assertions)

```ts
// Use test framework assertions
fc.property(fc.integer(), (n) => {
  expect(n * 0).toBe(0);  // Throws on failure
  // No return needed
});
```

### Throwing

```ts
// Throw to fail
fc.property(fc.string(), (s) => {
  if (s.length > 1000) {
    throw new Error('String too long');
  }
  return true;
});
```

## Preconditions

Use `fc.pre()` to skip invalid inputs:

```ts
fc.property(fc.integer(), fc.integer(), (a, b) => {
  fc.pre(b !== 0);           // Skip when b is 0
  return a / b * b === a;    // Safe to divide now
});

// Multiple preconditions
fc.property(fc.string(), fc.nat(), (s, n) => {
  fc.pre(s.length > 0);
  fc.pre(n < s.length);
  return s[n] !== undefined;
});
```

**Warning**: Too many skipped values will cause the test to fail. Use appropriate arbitraries instead:

```ts
// Better: use appropriate arbitrary
fc.property(fc.integer({ min: 1 }), (n) => {
  return n > 0;  // Always true
});

// Instead of:
fc.property(fc.integer(), (n) => {
  fc.pre(n > 0);  // Skips many values
  return n > 0;
});
```

## Async Properties

```ts
// Async property
fc.asyncProperty(fc.string(), async (s) => {
  const result = await asyncOperation(s);
  return result.success;
});

// Assert async property
await fc.assert(
  fc.asyncProperty(fc.integer(), async (n) => {
    const data = await fetchData(n);
    return data !== null;
  })
);
```

## Property Modifiers

### beforeEach / afterEach

```ts
fc.property(fc.integer(), (n) => n >= 0)
  .beforeEach(() => {
    // Setup before each test run
    console.log('Starting test');
  })
  .afterEach(() => {
    // Cleanup after each test run
    console.log('Test complete');
  });

// Async hooks
fc.asyncProperty(fc.string(), async (s) => true)
  .beforeEach(async () => {
    await setupDatabase();
  })
  .afterEach(async () => {
    await cleanupDatabase();
  });
```

## Common Property Patterns

### Idempotence

```ts
// f(f(x)) === f(x)
fc.property(fc.string(), (s) => {
  return normalize(normalize(s)) === normalize(s);
});
```

### Commutativity

```ts
// f(a, b) === f(b, a)
fc.property(fc.integer(), fc.integer(), (a, b) => {
  return add(a, b) === add(b, a);
});
```

### Associativity

```ts
// f(f(a, b), c) === f(a, f(b, c))
fc.property(fc.integer(), fc.integer(), fc.integer(), (a, b, c) => {
  return add(add(a, b), c) === add(a, add(b, c));
});
```

### Identity Element

```ts
// f(a, identity) === a
fc.property(fc.integer(), (a) => {
  return add(a, 0) === a;
});

fc.property(fc.string(), (s) => {
  return concat(s, '') === s;
});
```

### Inverse Operations

```ts
// decode(encode(x)) === x
fc.property(fc.string(), (s) => {
  return decode(encode(s)) === s;
});

// parse(stringify(x)) deepEquals x
fc.property(fc.jsonValue(), (value) => {
  return JSON.stringify(JSON.parse(JSON.stringify(value))) === JSON.stringify(value);
});
```

### Invariants

```ts
// Property that should always hold
fc.property(fc.array(fc.integer()), (arr) => {
  const sorted = sort([...arr]);
  
  // Length preserved
  if (sorted.length !== arr.length) return false;
  
  // Order correct
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] < sorted[i - 1]) return false;
  }
  
  return true;
});
```

### Test Oracle

```ts
// Compare with known-correct implementation
fc.property(fc.array(fc.integer()), (arr) => {
  const myResult = mySort([...arr]);
  const expected = [...arr].sort((a, b) => a - b);
  return JSON.stringify(myResult) === JSON.stringify(expected);
});
```

### Round-Trip / Bijection

```ts
// Serialization round-trip
fc.property(fc.record({ name: fc.string(), value: fc.integer() }), (obj) => {
  const serialized = serialize(obj);
  const deserialized = deserialize(serialized);
  return JSON.stringify(obj) === JSON.stringify(deserialized);
});
```

### No Crash / No Throw

```ts
// Function doesn't throw for any input
fc.property(fc.anything(), (input) => {
  try {
    processInput(input);
    return true;
  } catch (e) {
    return false;  // Fail if throws
  }
});
```

### Different Path, Same Result

```ts
// Two ways to compute same result
fc.property(fc.array(fc.integer()), (arr) => {
  // Method 1: filter then count
  const count1 = arr.filter(x => x > 0).length;
  
  // Method 2: reduce
  const count2 = arr.reduce((acc, x) => acc + (x > 0 ? 1 : 0), 0);
  
  return count1 === count2;
});
```

## Naming Properties

Good property names describe what's being tested:

```ts
describe('addition', () => {
  it('is commutative: a + b = b + a', () => {
    fc.assert(fc.property(fc.integer(), fc.integer(), (a, b) => 
      a + b === b + a
    ));
  });

  it('is associative: (a + b) + c = a + (b + c)', () => {
    fc.assert(fc.property(fc.integer(), fc.integer(), fc.integer(), (a, b, c) => 
      (a + b) + c === a + (b + c)
    ));
  });

  it('has identity element 0: a + 0 = a', () => {
    fc.assert(fc.property(fc.integer(), (a) => 
      a + 0 === a
    ));
  });
});
```
