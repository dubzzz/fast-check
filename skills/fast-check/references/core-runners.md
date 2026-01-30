# Runners Reference

Runners execute properties and report results. The main runners are `fc.assert()` and `fc.check()`.

## fc.assert()

Runs a property and throws on failure. Use in tests.

```ts
import fc from 'fast-check';

// Basic usage - throws if property fails
fc.assert(fc.property(fc.integer(), (n) => n * 0 === 0));

// With configuration
fc.assert(
  fc.property(fc.string(), (s) => s.length >= 0),
  { numRuns: 1000 }
);
```

## fc.check()

Runs a property and returns a result object. Use for programmatic inspection.

```ts
const result = fc.check(fc.property(fc.integer(), (n) => n >= 0));

if (result.failed) {
  console.log('Counterexample:', result.counterexample);
  console.log('Error:', result.error);
}
```

### Result Object

```ts
interface RunDetails<Ts> {
  failed: boolean;
  interrupted: boolean;
  numRuns: number;
  numSkips: number;
  numShrinks: number;
  seed: number;
  counterexample: Ts | null;
  counterexamplePath: string | null;
  error: string | null;
  failures: Ts[];
  executionSummary: ExecutionTree<Ts>[];
  verbose: VerbosityLevel;
  runConfiguration: Parameters<Ts>;
}
```

## Configuration Options

```ts
fc.assert(property, {
  // Number of runs
  numRuns: 100,              // Default: 100
  
  // Reproducibility
  seed: 42,                  // Fixed seed for reproducible runs
  path: '0:1:2',             // Replay specific shrink path
  
  // Verbosity
  verbose: true,             // Show all generated values
  // Or use VerbosityLevel:
  // 0 = None, 1 = Verbose, 2 = VeryVerbose
  
  // Examples
  examples: [                // Always test these first
    ['example1'],
    ['example2'],
  ],
  
  // Timeouts
  timeout: 1000,             // Max time per run in ms
  interruptAfterTimeLimit: 5000,  // Total test time limit
  
  // Behavior
  endOnFailure: true,        // Stop on first failure (default: false)
  skipAllAfterTimeLimit: 1000,  // Skip remaining after timeout
  
  // Reporting
  reporter: (out) => {       // Custom reporter
    console.log(JSON.stringify(out));
  },
  
  // Async
  asyncReporter: async (out) => {
    await sendToServer(out);
  },
});
```

### Common Configurations

#### CI Configuration

```ts
// Slower but more thorough for CI
fc.assert(property, {
  numRuns: 10000,
  timeout: 5000,
});
```

#### Development Configuration

```ts
// Fast feedback during development
fc.assert(property, {
  numRuns: 10,
  verbose: true,
});
```

#### Reproducible Tests

```ts
// Use fixed seed
fc.assert(property, {
  seed: Date.now(),  // Log this for reproduction
});
```

## fc.sample()

Generate sample values without running assertions.

```ts
// Get array of values
const samples = fc.sample(fc.integer(), 10);
console.log(samples);  // e.g., [0, -5, 2, 8, -1, ...]

// Sample with configuration
const samples2 = fc.sample(fc.string(), {
  numRuns: 5,
  seed: 42,
});
```

## fc.statistics()

Analyze distribution of generated values.

```ts
fc.statistics(
  fc.integer({ min: 0, max: 100 }),
  (n) => {
    if (n < 10) return 'small';
    if (n < 50) return 'medium';
    return 'large';
  },
  { numRuns: 10000 }
);

// Output:
// small...: 10.5%
// medium..: 40.2%
// large...: 49.3%
```

### Multiple Classifications

```ts
fc.statistics(
  fc.record({ name: fc.string(), age: fc.nat({ max: 100 }) }),
  (user) => {
    const categories = [];
    if (user.name.length === 0) categories.push('empty-name');
    if (user.age < 18) categories.push('minor');
    if (user.age >= 65) categories.push('senior');
    return categories.length > 0 ? categories.join(', ') : 'regular';
  }
);
```

## Async Runners

```ts
// Async assert
await fc.assert(
  fc.asyncProperty(fc.string(), async (s) => {
    const result = await asyncOperation(s);
    return result.success;
  })
);

// Async check
const result = await fc.check(
  fc.asyncProperty(fc.integer(), async (n) => {
    return await validate(n);
  })
);
```

## Error Handling

### Reading Failure Output

```text
Property failed after 42 tests
{ seed: 1234567890, path: "41:2:1" }
Counterexample: ["hello", 5]
Shrunk 3 time(s)
Got error: Expected true but got false
```

- **seed**: Use to reproduce the exact run
- **path**: Shrink path to minimal counterexample
- **Counterexample**: The minimal failing input
- **Shrunk N times**: How many shrink steps

### Replaying Failures

```ts
// Replay with seed and path
fc.assert(
  fc.property(fc.string(), fc.integer(), (s, n) => {
    return myFunction(s, n);
  }),
  {
    seed: 1234567890,
    path: '41:2:1',
  }
);
```

## Custom Reporters

```ts
// Custom reporter function
fc.assert(
  fc.property(fc.integer(), (n) => n >= 0),
  {
    reporter: (runDetails) => {
      if (runDetails.failed) {
        console.error('Test failed!');
        console.error('Seed:', runDetails.seed);
        console.error('Counterexample:', runDetails.counterexample);
      } else {
        console.log(`Passed ${runDetails.numRuns} tests`);
      }
    },
  }
);
```

## Best Practices

1. **Use meaningful numRuns**: More runs = more confidence
   ```ts
   { numRuns: 100 }    // Quick check (default)
   { numRuns: 1000 }   // Normal testing
   { numRuns: 10000 }  // Thorough testing / CI
   ```

2. **Set timeouts for slow tests**:
   ```ts
   { timeout: 1000 }  // Fail if single run takes > 1s
   ```

3. **Use verbose mode for debugging**:
   ```ts
   { verbose: true }
   ```

4. **Save seeds in CI logs**:
   ```ts
   const seed = Date.now();
   console.log('Test seed:', seed);
   fc.assert(property, { seed });
   ```

5. **Include known edge cases**:
   ```ts
   { examples: [[''], [null], [' leading space']] }
   ```
