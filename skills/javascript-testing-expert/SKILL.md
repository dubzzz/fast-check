---
name: javascript-testing-expert
description: Expert-level JavaScript testing skill focused on writing high-quality tests that find bugs, serve as documentation, and prevent regressions. Advocates for property-based testing with fast-check and protects against indeterministic code in tests. Does not cover black-box e2e testing.
---

> **⚠️ Scope:** Testing functions and components, not black-box e2e.

**🏅 Main objectives:** use tests as a way to...

1. uncover hard to detect bugs
2. document how to use the code
3. avoid regressions
4. challenge the code

**🔧 Recommended tooling:** `vitest`, `fast-check`, `@fast-check/vitest`, `@testing-library/*`, `@vitest/browser-playwright`, `msw` installed as devDependencies.  
**✅ Do** try to install missing and relevant tooling, only recommend for `@fast-check/vitest` and browser testing.  
**✅ Do** highly recommend user to install missing and relevant tooling.  
**✅ Do** adapt yourself to missing tools.

## File and code layout

**✅ Do** mimic the existing test structure of the project when adding new tests

**✅ Do** use one test file per code file

**👍 Prefer** using `.spec.ts` extension (e.g., `fileName.ts` → `fileName.spec.ts`) and colocated with the source file if no existing test structure is present

**✅ Do** put `it` within `describe`, when using `it`

**👍 Prefer** `it` over `test`

**✅ Do** name the `describe` with the name of the function being tested

**✅ Do** use a dedicated `describe` for each function being tested

**✅ Do** start naming `it` with "should" and considers that the name should be clear, as consise as possible and could be read as a sentence implicitly prefixed by "it"

**✅ Do** start with simple and documenting tests

**✅ Do** continue with advanced tests looking for edge-cases

**❌ Don't** delimitate explicitely simple from advanced tests, just but them in the right order

**✅ Do** put helper functions specific to the file after all the `describe`s just below a comment `// Helpers` stating the beginning of the helpers tailored for this file

## Core guidelines

**✅ Do** follow the AAA pattern and make it visible in the test

```ts
it('should...', () => {
  // Arrange
  code;

  // Act
  code;

  // Assert
  code;
});
```

**✅ Do** keep tests focused, try to assert on one precise aspect

**✅ Do** keep tests simple

**👎 Avoid** complex logic in tests or its helpers

**❌ Don't** test internal details

**👍 Prefer** stubs over mocks, the first one provides an alternate implementation, the second one helps to assert on calls being done or not  
Why? Often, asserting the number of calls is not something critical for the user of the function but purely an internal detail

**❌ Don't** rely on network call, stub it with `msw`

**✅ Do** reset globals and mocks in `beforeEach` if any `it` plays with mocks or spies or alter globals  
Alternatively, when using vitest you could check if flags `mockReset`, `unstubEnvs` and `unstubGlobals` have been enabled in the configuration, in such case resetting globals is done by default

**👍 Prefer** realistic data for documentation-like tests  
Eg.: use real names if you have to build instances of users

**❌ Don't** overuse snapshot tests; only snapshot things when the "what is expected to be seen in the snapshot" is clear  
Why? Snapshots tests tend to capture too many details in the snapshot, making them hard to update given future reader is lost on what was the real thing being tested

**👍 Prefer** snapshots when shape and structure are important (component hierarchy, attributes, non-regression on output structure)

**👍 Prefer** screenshots when final render is important (visual styling, layout)

**✅ Do** warn developer when the code under tests requires too many parameters and/or too many mocks/stubs to be forged (more than 10)  
Why? Code being hardly testable is often a code smell pinpointing an API having to be changed. Code is harder to evolve, harder to reason about and often handling too many responsibilities. Recommend the single-responsibility principle (SRP)

**✅ Do** try to make tests shorter and faster to read by factorizing recurrent logics into helper functions

**✅ Do** group shared logics under a function having a clear and explicit name, follow SRP for these helpers  
Eg.: avoid functions with lots of optional parameters, doing several things

**❌ Don't** write a big `prepare` function re-used by all tests in their act part, but make the name clearer and eventually split it into multiple functions

**✅ Do** make sure your test breaks if you drop the thing supposed to make it pass  
Eg.: When your test says "should do X when Y" makes sure that if you don't have Y it fails before keeping it.

**👎 Avoid** writing tests with entities specifying hardcoded values on unused fields

Example of test content

```ts
const user: User = {
  name: 'Paul', // unused
  birthday: '2010-02-03',
};
const age = computeAge(user);
//...
```

**👍 Prefer** leveraging `@fast-check/vitest`, if installed

```ts
import { describe } from 'vitest';
import { it, fc } from '@fast-check/vitest';

describe('computeAge', () => {
  it('should compute a positive age', ({ g }) => {
    // Arrange
    const user: User = {
      name: g(fc.string), // unused
      birthday: '2010-02-03',
    };

    // Act
    const age = computeAge(user);

    // Assert
    expect(age).toBeGreaterThan(0);
  });
});
```

**👍 Prefer** leveraging `fast-check`, if installed but not `@fast-check/vitest`

**👎 Avoid** writing tests depending on unstable values  
Eg.: in the example above `computeAge` depends on the current date  
Remark: same for locales and plenty other platform dependent values

**👍 Prefer** stubbing today using `vi.setSystemTime`

**👍 Prefer** controlling today using `@fast-check/vitest`  
Why? Contrary to `vi.setSystemTime` alone you check the code against one new today at each run, but if it happens to fail one day you will be reported with the exact date causing the problem

```ts
// Arrange
vi.setSystemTime(g(fc.date, { min: new Date('2010-02-04'), noInvalidDate: true }));
const user: User = {
  name: g(fc.string), // unused
  birthday: '2010-02-03',
};
```

**👎 Avoid** writing tests depending on random values or entities

**👍 Prefer** controlling randomly generated values by relying on `@fast-check/vitest` if installed, or `fast-check` otherwise

**✅ Do** use property based tests for any test with a notion of always or never  
Eg.: name being "should always do x when y" or "should never do x when y"  
Remark: consider these tests as advanced and put them after the documentation tests and not with them

**👍 Prefer** using property based testing for edge case detection instead of writing all cases one by one

**❌ Don't** try to test 100% of the algorithm cases using property-based testing
Why? Property-based testing and example-based testing are complementary. Property-based tests are excellent for uncovering edge cases and validating general properties, while example-based tests provide clear documentation and cover specific important scenarios. Use both approaches together for comprehensive test coverage.

```ts
// for all a, b, c strings
// b is a substring of a + b + c
it.prop([fc.string(), fc.string(), fc.string()])('should detect the substring', (a, b, c) => {
  // Arrange
  const text = a + b + c;
  const pattern = b;

  // Act
  const result = isSubstring(text, pattern);

  // Assert
  expect(result).toBe(true);
});
```

**✅ Do** extract complex logic from components into dedicated and testable functions

**❌ Don't** test trivial component logic that has zero complexity

**👍 Prefer** testing the DOM structure and user interactions when using testing-library

**👍 Prefer** testing the visual display and user interactions when using browser testing

**👍 Prefer** querying by accessible attributes and user-visible text by relying on `getByRole`, `getByLabelText`, `getByText` over `getByTestId` whenever possible for testing-library and browser testing

**✅ Do** ensure non visual regression of Design System components and more generally visual components by leveraging screenshot tests in browser when available  
**✅ Do** fallback to snapshot tests capturing the DOM structure if screenshot tests cannot be ran

## Guidelines for properties

All this section considers that we are in the context of property based tests!

**⚠️ Important:** When using `g` from `@fast-check/vitest`, pass the arbitrary **function** (e.g., `fc.string`, `fc.date`) along with its arguments as separate parameters to `g`, not the result of calling it.  
Correct: `g(fc.string)`, `g(fc.date, { min: new Date('2010-01-01') })`  
Incorrect: `g(fc.string())`, `g(fc.date({ min: new Date('2010-01-01') }))`

**❌ Don't** generate inputs directly  
The risk being that you may end up rewriting the code being tested in the test

**✅ Do** construct values to build some inputs where you know the expected outcome

**❌ Don't** expect the returned value in details, in many cases you won't have enough details to be able to assert the full value

**✅ Do** expect some aspects and characteristics of the returned value

**❌ NEVER** specify any `maxLength` on an arbitrary if it is a not a requirement of the algorithm  
**👍 Prefer** specifying a `size: '-1'` if you feel that the algorithm will take very long on large inputs (by default fast-check generates up to 10 items, so only use `size` when clearly required)  
Eg.: No `fc.string({maxLength: 5})` or `fc.array(arb, {maxLength: 8})` except being a string requirement

**❌ NEVER** specify any constraint on an arbitrary if it is not a requirement of the arbitrary, use defaults as much as possible  
Eg.: if the algorithm should accept any integer just ask an integer without specifying any min and max

**👎 Avoid** overusing `.filter` and `fc.pre`  
Why? They slow down the generation of values by dropping some generated ones

**👍 Prefer** using options provided by arbitraries to directly generate valid values  
Eg.: use `fc.string({ minLength: 2 })` instead of `fc.string().filter(s => s.length >= 2)`  
Eg.: use `fc.integer({ min: 1 })` instead of `fc.integer().filter(n => n >= 1)`, or use `fc.nat()` instead of `fc.integer().filter(n => n >= 0)`

**👍 Prefer** using `map` over `filter` when a `map` trick can avoid filtering  
Eg.: use `fc.nat().map(n => n * 2)` for even numbers  
Eg.: use `fc.tuple(fc.string(), fc.string()).map(([start, end]) => start + 'A' + end)` for strings always having an 'A' character

**👍 Prefer** bigint type over number type for integer computations used within predicates when there is a risk of overflow (eg.: when running pow, multiply.. on generated values)

Some classical properties:

1. Characteristics independent of the inputs. _Eg.: for any floating point number d, Math.floor(d) is an integer. for any integer n, Math.abs(n) ≥ 0_
2. Characteristics derived from the inputs. _Eg.: for any a and b integers, the average of a and b is between a and b. for any n, the product of all numbers in the prime factor decomposition of n equals n. for any array of data, sorted(data) and data contains the same elements. for any n1, n2 integers such that n1 != n2, romanString(n1) != romanString(n2). for any floating point number d, Math.floor(d) is an integer such as d-1 ≤ Math.floor(d) ≤ d_
3. Restricted set of inputs with useful characteristics. _Eg.: for any array data with no duplicates, the result of removing duplicates from data is data itself. for any a, b and c strings, the concatenation of a, b and c always contains b. for any prime number p, its decomposition into prime factors is itself_
4. Characteristics on combination of functions. _Eg.: zipping then unzipping a file should result in the original file. lcm(a,b) times gcd(a,b) must be equal to a times b_
5. Comparison with a simpler implementation. _Eg.: c is contained inside sorted array data for binary search is equivalent to c is contained inside data for linear search_

## Guidelines for race conditions

**✅ Do** write tests checking for race conditions and playing with resolution order — _automatically handled by `fast-check`_ — when an algorithm accepts asynchronous functions as input

**✅ Do** leverage `fast-check` and its `fc.scheduler()` arbitrary to test asynchronous code depending on asynchronous functions

Turn:

```ts
it('should resolve in call order', async () => {
  // Arrange
  const seenAnswers = [];
  const call = vi.fn().mockImplementation((v) => Promise.resolve(v));

  // Act
  const queued = queue(call);
  await Promise.all([queued(1).then((v) => seenAnswers.push(v)), queued(2).then((v) => seenAnswers.push(v))]);

  // Assert
  expect(seenAnswers).toEqual([1, 2]);
});
```

Into:

```ts
it('should resolve in call order', async () => {
  await fc.assert(
    fc.asyncProperty(fc.scheduler(), async (s) => {
      // Arrange
      const seenAnswers = [];
      const call = vi.fn().mockImplementation((v) => Promise.resolve(v));

      // Act
      const queued = queue(s.scheduleFunction(call));
      await s.waitFor(
        Promise.all([queued(1).then((v) => seenAnswers.push(v)), queued(2).then((v) => seenAnswers.push(v))]),
      );

      // Assert
      expect(seenAnswers).toEqual([1, 2]);
    }),
  );
});
```

## Recommendation for faker users

If using `faker` to fake data, we recommend wiring any fake data generation within `fast-check` by leveraging this code snippet:

```ts
// Source: https://fast-check.dev/blog/2024/07/18/integrating-faker-with-fast-check/
import { Faker, Randomizer, base } from '@faker-js/faker';
import * as fc from 'fast-check';

class FakerBuilder<TValue> extends fc.Arbitrary<TValue> {
  constructor(private readonly generator: (faker: Faker) => TValue) {
    super();
  }
  generate(mrng: fc.Random, biasFactor: number | undefined): fc.Value<TValue> {
    const randomizer: Randomizer = {
      next: (): number => mrng.nextDouble(),
      seed: () => {}, // no-op, no support for updates of the seed, could even throw
    };
    const customFaker = new Faker({ locale: base, randomizer });
    return new fc.Value(this.generator(customFaker), undefined);
  }
  canShrinkWithoutContext(value: unknown): value is TValue {
    return false;
  }
  shrink(value: TValue, context: unknown): fc.Stream<fc.Value<TValue>> {
    return fc.Stream.nil();
  }
}

function fakerToArb<TValue>(generator: (faker: Faker) => TValue): fc.Arbitrary<TValue> {
  return new FakerBuilder(generator);
}
```

Example of usage

```ts
fc.assert(
  fc.property(
    fakerToArb((faker) => faker.person.firstName),
    fakerToArb((faker) => faker.person.lastName),
    (firstName, lastName) => {
      // code
    },
  ),
);
```

## Equivalence `fast-check` and `@fast-check/vitest`

Example 1.

```ts
// with @fast-check/vitest
import { it, fc } from '@fast-check/vitest';
it('...', ({ g }) => {
  //...
});

// with fast-check
import { it } from 'vitest';
import * as fc from 'fast-check';
it('...', () => {
  fc.assert(
    fc.property(fc.gen(), (g) => {
      //...
    }),
  );
});
```

Example 2.

```ts
// with @fast-check/vitest
import { it, fc } from '@fast-check/vitest';
it.prop([...arbitraries])('...', (...values) => {
  //...
});

// with fast-check
import { it } from 'vitest';
import * as fc from 'fast-check';
it('...', () => {
  fc.assert(
    fc.property(...arbitraries, (...values) => {
      //...
    }),
  );
});
```

Example 3. If the predicate of `it` or `it.prop` is asynchronous, when using only `fast-check` the property has to be instantiated via `asyncProperty` and `assert` has to be awaited.

```ts
// with @fast-check/vitest
import { it, fc } from '@fast-check/vitest';
it.prop([...arbitraries])('...', async (...values) => {
  //...
});

// with fast-check
import { it } from 'vitest';
import * as fc from 'fast-check';
it('...', async () => {
  await fc.assert(
    fc.asyncProperty(...arbitraries, async (...values) => {
      //...
    }),
  );
});
```
