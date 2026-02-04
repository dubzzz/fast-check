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

**👎 Avoid** overusing `.filter` and `fc.pre`  
Why? They slow down the generation of values by dropping some generated ones

**👍 Prefer** using options provided by arbitraries to directly generate valid values  
Eg.: use `fc.string({ minLength: 2 })` instead of `fc.string().filter(s => s.length >= 2)`  
Eg.: use `fc.integer({ min: 1 })` instead of `fc.integer().filter(n => n >= 1)`, or use `fc.nat()` instead of `fc.integer().filter(n => n >= 0)`

**👍 Prefer** using `map` over `filter` when a `map` trick can avoid filtering  
Eg.: use `fc.nat().map(n => n * 2)` for even numbers  
Eg.: use `fc.tuple(fc.string(), fc.string()).map(([start, end]) => start + 'A' + end)` for strings always having an 'A' character

**👍 Prefer** bigint type over number type for integer computations used within predicates when there is a risk of overflow (eg.: when running pow, multiply.. on generated values)

## Classical Properties

1. **Characteristics independent of the inputs.** _Eg.: for any floating point number d, Math.floor(d) is an integer. for any integer n, Math.abs(n) ≥ 0_
2. **Characteristics derived from the inputs.** _Eg.: for any a and b integers, the average of a and b is between a and b. for any n, the product of all numbers in the prime factor decomposition of n equals n. for any array of data, sorted(data) and data contains the same elements. for any n1, n2 integers such that n1 != n2, romanString(n1) != romanString(n2). for any floating point number d, Math.floor(d) is an integer such as d-1 ≤ Math.floor(d) ≤ d_
3. **Restricted set of inputs with useful characteristics.** _Eg.: for any array data with no duplicates, the result of removing duplicates from data is data itself. for any a, b and c strings, the concatenation of a, b and c always contains b. for any prime number p, its decomposition into prime factors is itself_
4. **Characteristics on combination of functions.** _Eg.: zipping then unzipping a file should result in the original file. lcm(a,b) times gcd(a,b) must be equal to a times b_
5. **Comparison with a simpler implementation.** _Eg.: c is contained inside sorted array data for binary search is equivalent to c is contained inside data for linear search_

## Be careful with the signature of `g`

**⚠️ Important:** When using `g` from `@fast-check/vitest` or `fc.gen()`, pass the arbitrary **function** (e.g., `fc.string`, `fc.date`) along with its arguments as separate parameters to `g`, not the result of calling it.

```ts
// ❌ Incorrect usages
g(fc.string());
g(fc.date({ min: new Date('2010-01-01') }));

// ✅ Correct usages
g(fc.string);
g(fc.date, { min: new Date('2010-01-01') });
```
