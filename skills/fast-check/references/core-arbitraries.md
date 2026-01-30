# Arbitraries Reference

Arbitraries are the building blocks of fast-check. They define how random values are generated and shrunk.

## Primitive Arbitraries

### Numbers

```ts
// Integers
fc.integer()                           // All safe integers
fc.integer({ min: 0, max: 100 })       // Bounded range
fc.nat()                               // Natural numbers (>= 0)
fc.nat({ max: 1000 })                  // Bounded natural numbers
fc.maxSafeInteger()                    // Only max safe integer
fc.maxSafeNat()                        // Only max safe natural

// BigInt
fc.bigInt()                            // Any bigint
fc.bigInt({ min: 0n, max: 1000n })     // Bounded bigint

// Floating point
fc.float()                             // 32-bit float
fc.float({ min: 0, max: 1 })           // Bounded float
fc.float({ noNaN: true })              // Exclude NaN
fc.float({ noDefaultInfinity: true })  // Exclude infinities
fc.double()                            // 64-bit double
fc.double({ noNaN: true, noDefaultInfinity: true })
```

### Strings

```ts
// Basic strings
fc.string()                            // Unicode string
fc.string({ minLength: 1 })            // Non-empty
fc.string({ maxLength: 10 })           // Limited length
fc.string({ minLength: 5, maxLength: 10 })

// Character sets
fc.asciiString()                       // ASCII only (0x00-0x7F)
fc.unicodeString()                     // Full Unicode
fc.hexaString()                        // 0-9, a-f
fc.base64String()                      // Base64 characters
fc.stringOf(fc.char())                 // Custom character set

// Single characters
fc.char()                              // Any character
fc.ascii()                             // ASCII character
fc.unicode()                           // Unicode character
fc.hexa()                              // Hex digit
fc.char16bits()                        // 16-bit character

// Pattern matching
fc.stringMatching(/[a-z]+/)            // Match regex pattern
fc.stringMatching(/\d{3}-\d{4}/)       // e.g., "123-4567"

// Lorem ipsum
fc.lorem()                             // Lorem ipsum words
fc.lorem({ maxCount: 5 })              // Limit word count
fc.lorem({ mode: 'sentences' })        // Generate sentences
```

### Booleans

```ts
fc.boolean()                           // true or false
```

### Dates

```ts
fc.date()                              // Any valid Date
fc.date({ min: new Date('2020-01-01') })
fc.date({ max: new Date('2025-12-31') })
fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') })
```

## Composite Arbitraries

### Arrays

```ts
fc.array(fc.integer())                 // Array of integers
fc.array(fc.string(), { minLength: 1 }) // Non-empty array
fc.array(fc.boolean(), { maxLength: 5 }) // Limited size
fc.array(fc.nat(), { minLength: 2, maxLength: 10 })

// Unique arrays
fc.uniqueArray(fc.integer())           // No duplicates
fc.uniqueArray(fc.string(), { 
  comparator: (a, b) => a.toLowerCase() === b.toLowerCase()
})

// Sparse arrays
fc.sparseArray(fc.integer())           // May have holes

// Subarrays
fc.subarray([1, 2, 3, 4, 5])           // Pick subset
fc.shuffledSubarray([1, 2, 3, 4, 5])   // Pick and shuffle
```

### Tuples

```ts
fc.tuple(fc.string(), fc.integer())    // [string, number]
fc.tuple(fc.boolean(), fc.nat(), fc.string())
```

### Objects/Records

```ts
// Fixed shape
fc.record({
  name: fc.string(),
  age: fc.nat({ max: 150 }),
  email: fc.emailAddress(),
})

// With optional fields
fc.record({
  required: fc.string(),
  optional: fc.option(fc.integer()),
})

// With required keys only
fc.record(
  { a: fc.nat(), b: fc.string(), c: fc.boolean() },
  { requiredKeys: ['a', 'b'] }
)
```

### Dictionaries

```ts
fc.dictionary(fc.string(), fc.integer())  // { [key: string]: number }
fc.dictionary(
  fc.string({ minLength: 1, maxLength: 10 }),
  fc.array(fc.nat())
)
```

### Generic Objects

```ts
fc.object()                            // Random object structure
fc.object({ maxDepth: 2 })             // Limit nesting
fc.anything()                          // Any JSON-compatible value
fc.json()                              // Valid JSON string
fc.jsonValue()                         // Parsed JSON value
```

## Web & Network Arbitraries

```ts
// URLs
fc.webUrl()                            // https://example.com/path
fc.webUrl({ validSchemes: ['https'] }) // Only HTTPS
fc.webUrl({ withQueryParameters: true })
fc.webUrl({ withFragments: true })

// Components
fc.domain()                            // example.com
fc.webPath()                           // /path/to/resource
fc.webQueryParameters()                // key=value&foo=bar
fc.webSegment()                        // Single path segment
fc.webAuthority()                      // user:pass@host:port

// Email
fc.emailAddress()                      // user@example.com

// IP Addresses
fc.ipV4()                              // 192.168.1.1
fc.ipV4Extended()                      // Various IPv4 formats
fc.ipV6()                              // 2001:db8::1

// Identifiers
fc.uuid()                              // UUID v4
fc.ulid()                              // ULID
```

## Combiners

### Transform Values

```ts
// Map: transform generated values
fc.integer().map(n => n * 2)           // Double all integers
fc.string().map(s => s.toUpperCase())  // Uppercase strings
fc.array(fc.integer()).map(arr => arr.sort())

// Note: map preserves shrinking when transformation is simple
```

### Filter Values

```ts
// Filter: only keep values matching predicate
fc.integer().filter(n => n > 0)        // Positive only
fc.string().filter(s => s.length > 0)  // Non-empty

// Warning: excessive filtering can slow down generation
// Prefer bounded arbitraries when possible:
fc.integer({ min: 1 })                 // Better than filter
```

### Chain (Dependent Generation)

```ts
// Generate based on previous value
fc.integer({ min: 0, max: 10 }).chain(size => 
  fc.array(fc.string(), { minLength: size, maxLength: size })
)

// Generate array of specific length from first value
fc.nat({ max: 5 }).chain(n =>
  fc.tuple(fc.constant(n), fc.array(fc.integer(), { minLength: n, maxLength: n }))
)
```

### Choice

```ts
// Pick from arbitraries
fc.oneof(fc.string(), fc.integer(), fc.boolean())

// Weighted choice
fc.oneof(
  { weight: 5, arbitrary: fc.string() },  // 5x more likely
  { weight: 1, arbitrary: fc.integer() }
)

// From constants
fc.constantFrom('red', 'green', 'blue')
fc.constantFrom(1, 2, 3, 4, 5)

// Single constant
fc.constant('fixed-value')
fc.constant({ always: 'this-object' })
```

### Optional Values

```ts
fc.option(fc.string())                 // string | null
fc.option(fc.integer(), { nil: undefined })  // number | undefined
fc.option(fc.string(), { freq: 5 })    // 1/5 chance of nil
```

## Advanced Arbitraries

### Recursive Structures

```ts
// Using letrec for recursive types
const { tree } = fc.letrec(tie => ({
  leaf: fc.record({ type: fc.constant('leaf'), value: fc.integer() }),
  node: fc.record({
    type: fc.constant('node'),
    left: tie('tree'),
    right: tie('tree'),
  }),
  tree: fc.oneof(tie('leaf'), tie('node')),
}));

// Using memo for simpler cases
const treeArb = fc.memo(n => {
  if (n <= 1) return fc.record({ value: fc.integer() });
  return fc.record({
    value: fc.integer(),
    left: treeArb(n - 1),
    right: treeArb(n - 1),
  });
});
```

### Functions

```ts
// Generate pure functions
fc.func(fc.integer())                  // (...args) => number
fc.compareFunc()                       // (a, b) => number (for sorting)
fc.compareBooleanFunc()                // (a, b) => boolean
```

### Context for Debugging

```ts
fc.context()                           // Log within tests

fc.assert(
  fc.property(fc.integer(), fc.context(), (n, ctx) => {
    ctx.log(`Testing with n = ${n}`);
    const result = compute(n);
    ctx.log(`Result = ${result}`);
    return result > 0;
  })
);
```

### Generator-style (fc.gen)

```ts
// Use generator syntax for complex generation
fc.gen().map(g => {
  const count = g(fc.nat, { max: 5 });
  const items = Array.from({ length: count }, () => g(fc.string));
  return { count, items };
});
```

## Typed Arrays

```ts
fc.int8Array()
fc.int16Array()
fc.int32Array()
fc.uint8Array()
fc.uint8ClampedArray()
fc.uint16Array()
fc.uint32Array()
fc.float32Array()
fc.float64Array()
fc.bigInt64Array()
fc.bigUint64Array()

// With constraints
fc.int32Array({ minLength: 1, maxLength: 10 })
```

## Shrinking Behavior

All arbitraries automatically shrink toward "simpler" values:
- Numbers shrink toward 0
- Strings shrink toward empty string
- Arrays shrink toward empty array
- Objects shrink by removing optional keys

```ts
// Disable shrinking
fc.integer().noShrink()

// Limit shrink depth
fc.integer().noBias().noShrink()
```
