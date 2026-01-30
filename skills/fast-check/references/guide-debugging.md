# Debugging fast-check Tests

When tests fail, fast-check provides powerful tools to understand and fix the problem.

## Reading Failure Output

When a property fails, fast-check outputs:

```text
Error: Property failed after 42 tests
{ seed: 1234567890, path: "41:2:1:0" }
Counterexample: ["edge", -5]
Shrunk 4 time(s)
Got error: Property failed by returning false

Hint: Enable verbose mode in order to have the list of all failing values encountered during the run
```

### Key Information

| Field | Description |
|-------|-------------|
| `seed` | Random seed for reproduction |
| `path` | Shrink path to minimal counterexample |
| `Counterexample` | The minimal failing input |
| `Shrunk N times` | Number of shrink steps taken |
| `Got error` | The actual error message |

## Reproducing Failures

### Replay with Seed

```ts
fc.assert(
  fc.property(fc.string(), fc.integer(), (s, n) => {
    return myFunction(s, n);
  }),
  { seed: 1234567890 }  // Exact seed from failure
);
```

### Replay with Seed and Path

```ts
// Jump directly to the minimal counterexample
fc.assert(
  fc.property(fc.string(), fc.integer(), (s, n) => {
    return myFunction(s, n);
  }),
  { 
    seed: 1234567890,
    path: '41:2:1:0',
  }
);
```

## Verbose Mode

Enable verbose mode to see all generated values:

```ts
// Basic verbose
fc.assert(property, { verbose: true });

// Very verbose (includes shrink steps)
fc.assert(property, { verbose: 2 });
```

### Verbosity Levels

```ts
import fc, { VerbosityLevel } from 'fast-check';

// None (default)
fc.assert(property, { verbose: VerbosityLevel.None });

// Verbose - shows all failing values
fc.assert(property, { verbose: VerbosityLevel.Verbose });

// VeryVerbose - shows all values and shrink attempts
fc.assert(property, { verbose: VerbosityLevel.VeryVerbose });
```

## Using fc.context()

Add logging to your tests:

```ts
fc.assert(
  fc.property(fc.integer(), fc.integer(), fc.context(), (a, b, ctx) => {
    ctx.log(`Testing with a=${a}, b=${b}`);
    const result = divide(a, b);
    ctx.log(`Result: ${result}`);
    return result >= 0;
  })
);

// On failure, logs are included in output
```

## Debugging Strategies

### 1. Isolate the Property

```ts
// Instead of one complex property, break into parts
describe('sorting', () => {
  it('preserves length', () => {
    fc.assert(
      fc.property(fc.array(fc.integer()), (arr) => {
        return sort(arr).length === arr.length;
      })
    );
  });

  it('produces ordered output', () => {
    fc.assert(
      fc.property(fc.array(fc.integer()), (arr) => {
        const sorted = sort(arr);
        for (let i = 1; i < sorted.length; i++) {
          if (sorted[i] < sorted[i - 1]) return false;
        }
        return true;
      })
    );
  });
});
```

### 2. Use Examples

Test known edge cases explicitly:

```ts
fc.assert(
  fc.property(fc.string(), (s) => {
    return parse(s) !== null;
  }),
  {
    examples: [
      [''],           // Empty string
      [' '],          // Whitespace
      ['null'],       // Literal "null"
      ['undefined'],  // Literal "undefined"
      ['<script>'],   // HTML-like
    ],
  }
);
```

### 3. Add Preconditions

Skip invalid inputs while debugging:

```ts
fc.assert(
  fc.property(fc.string(), (s) => {
    fc.pre(s.length > 0);  // Skip empty strings temporarily
    fc.pre(!s.includes('\\'));  // Skip backslashes
    return myFunction(s);
  })
);
```

### 4. Sample Values

Generate and inspect values manually:

```ts
// See what's being generated
const samples = fc.sample(
  fc.record({
    name: fc.string(),
    age: fc.nat(),
  }),
  10
);

console.log(samples);
```

### 5. Statistics

Understand value distribution:

```ts
fc.statistics(
  fc.integer({ min: -100, max: 100 }),
  (n) => {
    if (n < -10) return 'very negative';
    if (n < 0) return 'negative';
    if (n === 0) return 'zero';
    if (n <= 10) return 'small positive';
    return 'large positive';
  },
  { numRuns: 10000 }
);
```

## Common Issues

### Too Many Skipped Runs

```text
Error: Failed to run property, too many pre-condition failures encountered
```

**Solution**: Use more specific arbitraries instead of filter/pre:

```ts
// Bad: filters out most values
fc.integer().filter(n => n > 0 && n < 10)

// Good: generates valid range directly
fc.integer({ min: 1, max: 9 })
```

### Timeout Issues

```text
Error: Property timeout after 1000ms
```

**Solution**: Increase timeout or optimize property:

```ts
fc.assert(property, { 
  timeout: 5000,  // 5 seconds per run
});
```

### Non-Deterministic Failures

**Solution**: Use fixed seed and avoid external state:

```ts
// Always test with same seed first
fc.assert(property, { seed: 42 });

// Avoid external dependencies
fc.property(fc.integer(), (n) => {
  // Don't use: Date.now(), Math.random(), global state
  return pureFunction(n);
});
```

## CI Integration

### Log Seeds

```ts
const seed = Date.now();
console.log(`fast-check seed: ${seed}`);

fc.assert(property, { seed });
```

### Save Failure Info

```ts
const result = fc.check(property);

if (result.failed) {
  // Save for reproduction
  console.log(JSON.stringify({
    seed: result.seed,
    path: result.counterexamplePath,
    counterexample: result.counterexample,
  }));
}
```

### Increase Runs in CI

```ts
const isCI = process.env.CI === 'true';

fc.assert(property, {
  numRuns: isCI ? 10000 : 100,
});
```

## Troubleshooting Checklist

1. ✅ Read the counterexample carefully
2. ✅ Replay with seed and path
3. ✅ Enable verbose mode
4. ✅ Add fc.context() logging
5. ✅ Check for precondition issues
6. ✅ Verify arbitrary generates expected values
7. ✅ Break complex properties into simpler ones
8. ✅ Test with specific examples
9. ✅ Check for non-determinism
10. ✅ Review shrunk counterexample for root cause
