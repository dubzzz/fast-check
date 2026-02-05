# Property-Based Testing

> **⚠️ Scope:** How to write effective property-based tests with fast-check?

## Guidelines

**✅ Do** construct values to build some inputs where you know the expected outcome

```ts
// indexOf(pattern, text): -1 if pattern is not a substring of text, the index where pattern starts in text

// ✅ Good: generate values and build inputs with clear characteristics
fc.assert(
  fc.property(fc.string(), fc.string(), fc.string(), (a, b, c) => {
    // Arrange
    const pattern = b;
    const text = a + b + c;

    // Act
    const out = indexOf(pattern, text);

    // Assert
    expect(out).toBeGreaterThanOrEqual(0); // `${b}` is always a substring of `${a}${b}${c}`
  }),
);
```

**❌ Don't** expect the returned value in details, in many cases you won't have enough details to be able to assert the full value

**✅ Do** expect some aspects and characteristics of the returned value

```ts
// indexOf(pattern, text): -1 if pattern is not a substring of text, the index where pattern starts in text

// ⚠️ Risky: can easily make the tester re-implementing the code in the test
// Overfitting the generated values with the requested arguments is a risky option in property based tests
fc.assert(
  fc.property(fc.string(), fc.string(), (pattern, text) => {
    // Act
    const out = indexOf(pattern, text);

    // Assert
    // ⚠️ Trying to expect something on 'out' will likely correspond into reimplementing indexOf.
    // It may make sense if the implementation under test is really tailored for precise entries or very optimized making its code likely to have bugs.
    // But in general, it's often a bad idea with property based tests.
  }),
);

// ✅ Good: check some aspects of the output
fc.assert(
  fc.property(fc.string(), fc.string(), (pattern, text) => {
    // Act
    const out = indexOf(pattern, text);
    fc.pre(out !== -1); // when -1, we can't really know except reimplementing indexOf

    // Assert
    expect(text.substring(out, pattern.length)).toBe(pattern);
  }),
);
```

**✅ Do** use both example based testing and property based testing in your tests

**❌ Don't** try to cover everything with property based testing

Example:

> With `isSubstring(substring, text)` returning `true` if the pattern is a substring of text, covering positive cases is straightforward. However, testing negative cases often leads to reimplementing the function under test.
>
> In this case, exposing `indexOf` instead of `isSubstring` solves the problem: `indexOf` provides more detailed output that you can use to verify correctness even when there is no match.

**❌ Don't** specify any constraint on an arbitrary if it is not a requirement of the arbitrary, use defaults as much as possible

**❌ Don't** specify any `maxLength` on an arbitrary if it is a not a requirement of the algorithm

```ts
// ❌ Bad if the algorithm accepts...
fc.string({ maxLength: 8 }); // ...any string without any constraints
fc.array(arb, { maxLength: 8 }); // ...any array without any constraints
fc.integer({ min: -10, max: 10 }); // ...any integer without any constraints

// ✅ Good
fc.string(); // or fc.string({ size: '-1' }), if having large strings can lead to slow tests
fc.array(arb); // or fc.string(arb, { size: '-1' }), if having large strings can lead to slow tests
fc.integer();

// ✅ Also good
fc.string({ minLength: 1 }); // if the test requires at least one character
fc.string({ maxLength: 3 }); // if the test requires at most three characters
fc.array(arb, { minLength: 2 }); // if the test requires at least two items
fc.integer({ min: -1 }); // if the test requires the integer to be greater or equal than -1
fc.integer({ max: -1 }); // if the test requires the integer to be less or equal than -1
```

**👍 Prefer** bigint type over number type for integer computations used within predicates when there is a risk of overflow (eg.: when running pow, multiply.. on generated values)

```ts
// companies is an array of objects made of two fields: numEmployees and averageSalary, both being integer values that has been produced by fast-check

// ❌ Potentially dangerous: risk of overflow, risk is higher with multiply, pow... but still be careful with others too
let total = 0;
for (const { numEmployees, averageSalary } of companies) {
  total += numEmployees * averageSalary;
}

// ✅ Safer
let total = 0n;
for (const { numEmployees, averageSalary } of companies) {
  // Generally speaking:
  // - high risk of overflow with "*"
  // - low risk of overflow with "+", be careful with "+" if you rely on `fc.maxSafeInteger` as in such case the risk is high
  // In that example high risk in both, given the result of "*" is probably a large integer value that could lead us to overflows with "+"
  total += BigInt(numEmployees) * BigInt(averageSalary);
}
```

## Classical Properties

Non exhaustive list of classical tricks to find properties:

**✅ Characteristics independent of the inputs**

Examples:

- for any floating point number `d`, `Math.floor(d)` is an integer
- for any integer `n`, `Math.abs(n) ≥ 0`

**✅ Characteristics derived from the inputs**

Examples:

- for any `a` and `b` integers, the average of `a` and `b` is between `a` and `b`
- for any `n`, the product of all numbers in the prime factor decomposition of `n` equals `n`
- for any array of `data`, `sorted(data)` and `data` contains the same elements
- for any `n1`, `n2` integers such that `n1 != n2`, `romanString(n1) != romanString(n2)`
- for any floating point number `d`, `Math.floor(d)` is an integer such as `d-1 ≤ Math.floor(d) ≤ d`

**✅ Restricted set of inputs with useful characteristics**

Examples:

- for any array `data` with no duplicates, the result of removing duplicates from `data` is `data` itself
- for any `a`, `b` and `c` strings, the concatenation of `a`, `b` and `c` always contains `b`
- for any prime number `p`, its decomposition into prime factors is itself

**✅ Characteristics on combination of functions**

Examples:

- zipping then unzipping a file should result in the original file
- `lcm(a,b)` times `gcd(a,b)` must be equal to `a` times `b`

**✅ Comparison with a simpler implementation**

Examples:

- `c` is contained inside sorted array `data` for binary search is equivalent to `c` is contained inside `data` for linear search

**✅ Idempotence**

Examples:

- sorting an already sorted array returns the same array. for any number `n`, `Math.abs(Math.abs(n))` equals `Math.abs(n)`
- normalizing a file path twice gives the same result as normalizing once

## Custom arbitraries

**👎 Avoid** overusing `.filter` and `fc.pre`, they may slow down the generation of values by dropping some generated ones

**👍 Prefer** using options provided by arbitraries to directly generate valid values

```ts
// ❌ Bad, as fast-check provides native equivalent...
fc.string().filter((s) => s.length >= 2);
fc.integer().filter((n) => n >= 1);

// ✅ Good
fc.string({ minLength: 2 });
fc.integer({ min: 1 });
```

**👍 Prefer** using `map` over `filter` when a `map` trick can avoid filtering

```ts
// ❌ Bad approach for even values only
fc.nat().filter((n) => n % 2 === 0); // would drop half of the generated values

// ✅ Good approach for even values only
fc.nat().map((n) => n * 2);

// 🤷 Less recommended (see rule on using defaults), but still acceptable in case you risk overflows
fc.nat({ max: 0x3fffffff }).map((n) => n * 2); // keeping values in the range [0, 0x7fffffff]

// ❌ Bad approach for strings always containing A
fc.string().filter((s) => s.includes('A'));

// ❌ Still bad approach for strings always containing A
fc.string({ minLength: 1 }).filter((s) => s.includes('A'));

// ✅ Good approach for strings always containing A
fc.stringMatching(/A/);

// 🤷 Less recommended for that specific example as we have a simpler to understand alternative, but still a working approach for strings always containing A
fc.tuple(fc.string(), fc.string()).map(([start, end]) => start + 'A' + end);
```

## Commonly misused APIs

### When using `g` from `@fast-check/vitest` or `fc.gen()`,

**✅ Do** pass the arbitrary function (e.g., `fc.string`, `fc.date`) along with its arguments as separate parameters to `g`, not the result of calling the arbitrary function

```ts
// ❌ Incorrect usages
g(fc.string());
g(fc.date({ min: new Date('2010-01-01') }));

// ✅ Correct usages
g(fc.string);
g(fc.date, { min: new Date('2010-01-01') });
```

### When using `beforeEach`,

**✅ Do** explicitly define `beforeEach` and `afterEach` option on `fc.assert` or set it globally via `fc.configureGlobal`

```ts
// ❌ Incorrect usage: the beforeEach will not apply to fast-check
import { beforeEach, describe, it } from 'vitest';
import fc from 'fast-check';

// `functionToRunOnBeforeEach` will only be executed before each `it` and `test`
beforeEach(functionToRunOnBeforeEach);

describe('functionName', () => {
  it('should do xyz', () => {
    fc.assert(
      fc.property(...arbitraries, (...values) => {
        /* code requiring beforeEach to be executed before each execution */
      }),
    );
  });
});

// ✅ Correct usage: with local definition
import { beforeEach, describe, it } from 'vitest';
import fc from 'fast-check';

beforeEach(functionToRunOnBeforeEach);

describe('functionName', () => {
  it('should do xyz', () => {
    fc.assert(
      fc
        .property(...arbitraries, (...values) => {
          /* code requiring `beforeEach` to be executed before each execution */
        })
        // you may also want to use:
        // - `afterEach` alone, just replace `beforeEach` by `afterEach` in this snippet
        // - both together, just do `.beforeEach(...).afterEach(...)`
        .beforeEach((previousBeforeEach) => {
          previousBeforeEach(); // trigger globally defined `beforeEach` if any
          functionToRunOnBeforeEach();
        }),
    );
  });
});

// ✅ Correct usage: with global definition
import { beforeEach, describe, it } from 'vitest';
import fc from 'fast-check';

beforeEach(functionToRunOnBeforeEach);

fc.configureGlobal({ beforeEach: functionToRunOnBeforeEach });
// you may also want to use:
// - `afterEach`, same as `beforeEach` just replace in the snippet
// - `asyncBeforeEach` or `asyncAfterEach`, ⚠️ use with caution 1. only applies to `fc.asyncProperty` 2. makes `fc.property` unable to be executed

describe('functionName', () => {
  it('should do xyz', () => {
    fc.assert(
      fc.property(...arbitraries, (...values) => {
        /* code requiring beforeEach to be executed before each execution */
      }),
    );
  });
});
```
