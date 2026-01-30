# Shrinking Reference

Shrinking is the process of finding minimal counterexamples when a test fails. It's one of fast-check's most powerful features.

## How Shrinking Works

When a test fails, fast-check doesn't just report the failing input. It tries to find a **simpler** input that still fails:

```ts
// Example: testing that all strings have length < 10
fc.assert(fc.property(fc.string(), (s) => s.length < 10));

// Initial failure might be:
// "abcdefghijklmnop" (16 characters)

// After shrinking:
// "aaaaaaaaaa" (10 characters - minimal)
```

## Default Shrinking Behaviors

### Numbers

Numbers shrink toward 0:

```ts
fc.integer()    // 1000 → 500 → 250 → ... → 1 → 0
fc.integer()    // -50 → -25 → ... → -1 → 0
fc.nat()        // 100 → 50 → 25 → ... → 1 → 0
fc.float()      // 3.14159 → 1.57 → 0.785 → ... → 0
```

### Strings

Strings shrink by:
1. Reducing length
2. Simplifying characters (toward 'a' for ASCII)

```ts
fc.string()     // "hello world" → "hello" → "hel" → "a"
fc.string()     // "xyz" → "xy" → "x" → "" (empty string)
```

### Arrays

Arrays shrink by:
1. Removing elements
2. Shrinking remaining elements

```ts
fc.array(fc.integer())
// [5, 10, 15, 20] → [5, 10, 15] → [5, 10] → [5] → [0] → []
```

### Booleans

Booleans shrink toward false:

```ts
fc.boolean()    // true → false
```

### Objects/Records

Objects shrink by:
1. Removing optional keys
2. Shrinking remaining values

```ts
fc.record({ a: fc.integer(), b: fc.option(fc.string()) })
// { a: 100, b: "hello" } → { a: 100, b: null } → { a: 0, b: null }
```

## Shrinking with Combiners

### map()

Shrinking is preserved through `map()`:

```ts
fc.integer().map(n => n * 2)
// 100 → 50 → 25 → ... → 2 → 0 (all multiplied by 2)
```

### filter()

Shrinking respects filter constraints:

```ts
fc.integer().filter(n => n > 10)
// 100 → 50 → 25 → 12 → 11 (stops at boundary)
```

### chain()

Chain preserves shrinking on both parts:

```ts
fc.integer({ min: 1, max: 5 }).chain(size => 
  fc.array(fc.string(), { minLength: size, maxLength: size })
)
// First shrinks array contents, then shrinks size
```

## Controlling Shrinking

### Disable Shrinking

```ts
// Disable completely
fc.integer().noShrink()

// Limit shrink iterations
fc.assert(property, { 
  numRuns: 100,
  // Shrinking continues until no smaller example found
});
```

### Limit Shrink Attempts

```ts
import { limitShrink } from 'fast-check';

// Limit number of shrink values considered
fc.integer().chain(n => limitShrink(fc.array(fc.string()), 10))
```

## Why Shrinking Matters

### Without Shrinking

```ts
// Failure report:
// Counterexample: [{name: "xK2#@pQ9", age: 847, addresses: [...complex nested data...]}]
// Hard to understand what caused the failure
```

### With Shrinking

```ts
// Failure report:
// Counterexample: [{name: "", age: 0, addresses: []}]
// Clear: empty name might be the issue
```

## Debugging Shrinking

### Verbose Mode

```ts
fc.assert(
  fc.property(fc.integer(), (n) => n < 50),
  { 
    verbose: 2,  // VeryVerbose - shows shrink steps
  }
);

// Output shows each shrink step:
// Shrink: [100] → [50] ✗
// Shrink: [50] → [25] ✓ (passed, backtrack)
// Shrink: [50] → [75] ✓
// Shrink: [50] → [51] ✗
// Shrink: [51] → [50] ✓
// Final counterexample: [51]
```

### Understanding Shrink Paths

```ts
// The path in error output shows shrink decisions
// path: "0:1:2:0"
//   0 - first shrink attempt succeeded
//   1 - second shrink attempt succeeded
//   2 - third shrink attempt succeeded
//   0 - fourth shrink attempt succeeded
```

## Custom Shrinking

When you need custom shrink behavior, you can define your own arbitrary:

```ts
import fc, { Arbitrary } from 'fast-check';

// Custom arbitrary with custom shrinking
const myArbitrary = fc.integer({ min: 0, max: 100 }).map(
  n => ({ value: n, metadata: 'something' }),
);

// The shrinking behavior follows the underlying integer arbitrary
```

## Shrinking Best Practices

1. **Trust the shrink**: Let fast-check find minimal examples
   
2. **Use bounded arbitraries**: They shrink more efficiently
   ```ts
   fc.integer({ min: 0, max: 100 })  // Shrinks faster than unbounded
   ```

3. **Prefer `.map()` over `.filter()`**: Filtering can interfere with shrinking

4. **Check minimal examples**: The shrunk counterexample often reveals the root cause

5. **Use verbose mode when debugging**:
   ```ts
   { verbose: true }  // See what's happening during shrink
   ```

## Shrinking Guarantees

fast-check guarantees:
1. Shrunk values are "smaller" by some metric
2. Shrunk values still fail the property
3. Shrinking terminates (finite number of shrink candidates)
4. Built-in arbitraries have well-defined shrinking

## Technical Details

Shrinking is implemented as a lazy tree structure:
- Each value has zero or more "smaller" values
- Shrinking explores this tree depth-first
- When a shrunk value passes, backtracking occurs
- When a shrunk value fails, exploration continues deeper
