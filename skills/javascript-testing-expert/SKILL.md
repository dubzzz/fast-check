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

**⚠️ IMPORTANT:** Try to install "Recommended tooling" and to recommend installing optional one when applicable. Adapt yourself to missing tools.

## Core Guidelines

**⚠️ IMPORTANT:** Always read the **must-read-test-writing.md** guide before writing or suggesting any line of test. Consider is as a recommended reading to review tests.

| For...                                                                | Reference                                                       |
| --------------------------------------------------------------------- | --------------------------------------------------------------- |
| File location in project (skip if project structure is already known) | [`project-structure.md`](./references/project-structure.md)     |
| Organizing describes, its, and helpers inside a spec file             | [`spec-file-structure.md`](./references/spec-file-structure.md) |

## Testing recipes

**⚠️ IMPORTANT:** Do not hesitate to grab details from multiple recipes if the code matches several of them. Read them with the lens of **must-read-test-writing.md**.

| When testing...                                                  | Reference                                               |
| ---------------------------------------------------------------- | ------------------------------------------------------- |
| Async functions                                                  | [`test-async-code.md`](./references/test-async-code.md) |
| Glue code wiring dependencies together (adapters, orchestrators) | [`test-glue-code.md`](./references/test-glue-code.md)   |

## Detailed patterns

Tricks to push deeper some patterns. Reading them might be of interest if you touch one of the discussed concepts.

| When...                                                 | Reference                                                               |
| ------------------------------------------------------- | ----------------------------------------------------------------------- |
| Handling dates, randomness, or platform-specific values | [`deterministic-test-data.md`](./references/deterministic-test-data.md) |
| Writing property-based tests                            | [`property-based-testing.md`](./references/property-based-testing.md)   |
| Migrating between `fast-check` and `@fast-check/vitest` | [`fc-vitest-migration.md`](./references/fc-vitest-migration.md)         |

---

## Decision tree

**❌ Don't** reimplement the logic of the code in assertions

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

## Precise guidelines
