# `@fast-check/ava`

![fast-check logo](https://raw.githubusercontent.com/dubzzz/fast-check/main/logo/logo.png)

Bring the power of property based testing framework `fast-check` into AVA.
`@fast-check/ava` simplifies the integration of `fast-check` into AVA testing framework.

<a href="https://badge.fury.io/js/@fast-check%2Fava"><img src="https://badge.fury.io/js/@fast-check%2Fava.svg" alt="npm version" /></a>
<a href="https://www.npmjs.com/package/@fast-check/ava"><img src="https://img.shields.io/npm/dm/@fast-check%2Fava" alt="monthly downloads" /></a>
<a href="https://github.com/dubzzz/fast-check/blob/main/packages/ava/LICENSE"><img src="https://img.shields.io/npm/l/@fast-check%2Fava.svg" alt="License" /></a>

---

## Getting Started

Install `@fast-check/ava`:

```bash
npm install --save-dev @fast-check/ava
```

In order to work properly, `@fast-check/ava` requires `ava` to be installed.

## Example

```typescript
import { testProp, fc } from '@fast-check/ava';

// for all a, b, c strings
// b is a substring of a + b + c
testProp('should detect the substring', [fc.string(), fc.string(), fc.string()], (t, a, b, c) => {
  t.true((a + b + c).includes(b));
});
```

The property is passed [AVA's `t` argument](https://github.com/avajs/ava/blob/main/docs/02-execution-context.md#execution-context-t-argument) as its first parameter, and the value of each arbitrary for the current test case for the rest of the parameters.

`@fast-check/ava` supports all of [AVA's assertions](https://github.com/avajs/ava/blob/main/docs/03-assertions.md#assertions) and like AVA, it supports synchronous and asynchronous functions, including promises, observables, and callbacks. See [AVA's documentation](https://github.com/avajs/ava/blob/main/docs/01-writing-tests.md#declaring-test) for more information.

## Advanced

### `fast-check` Parameters

`testProp` accepts an optional `fc.Parameters` for forwarding custom parameters to `fast-check` ([more](https://github.com/dubzzz/fast-check/blob/main/packages/fast-check/documentation/Runners.md#runners)).

```typescript
import { testProp, fc } from '@fast-check/ava';

testProp(
  'should detect the substring',
  [fc.string(), fc.string(), fc.string()],
  (t, a, b, c) => {
    t.true((a + b + c).includes(b));
  },
  { numRuns: 10 } // Example of parameters
);
```

### AVA Modifiers

`@fast-check/ava` also comes with [`.only`], [`.serial`] [`.skip`], and [`.failing`] modifiers from AVA.

```typescript
import { testProp, fc } from '@fast-check/ava';

testProp(
  'should replay the test for the seed 4242',
  [fc.nat(), fc.nat()],
  (t, a, b) => {
    t.is(a + b, b + a);
  },
  { seed: 4242 }
);

testProp.skip('should be skipped', [fc.fullUnicodeString()], (t, text) => {
  t.is([...text].length, text.length);
});
```

[`.only`]: https://github.com/avajs/ava/blob/main/docs/01-writing-tests.md#running-specific-tests
[`.serial`]: https://github.com/avajs/ava/blob/main/docs/01-writing-tests.md#running-tests-serially
[`.skip`]: https://github.com/avajs/ava/blob/main/docs/01-writing-tests.md#skipping-tests
[`.failing`]: https://github.com/avajs/ava/blob/main/docs/01-writing-tests.md#failing-tests

### AVA `before`/`after` Hooks

`@fast-check/ava` exposes AVA's `before`/`after` [hooks]:

```typescript
import { testProp, fc } from '@fast-check/ava';

testProp.before((t) => {
  connectToDatabase();
});

testProp();
// ... omitted for brevity

testProp.after((t) => {
  closeDatabaseConnection();
});
```

[hooks]: https://github.com/avajs/ava/blob/main/docs/01-writing-tests.md#before--after-hooks

### AVA Execution Context

`@fast-check/ava` mirror's AVA's procedure for customizing the test [execution context]:

```typescript
import { fc, testProp as anyTestProp, PropertyTestInterface } from '@fast-check/ava';

type TestContext = {
  state: string;
};

const testProp = anyTestProp as PropertyTestInterface<TestContext>;

testProp('should reach terminal state', [fc.string()], (t, received) => {
  // here t is typed as ExecutionContext<TestContext>
  console.log(t.context.state); // logs 'uninitialized'
  // ... omitted for brevity
});
```

[execution context]: https://github.com/avajs/ava/blob/main/docs/02-execution-context.md

## Minimal requirements

| @fast-check/ava | AVA     | fast-check |
| --------------- | ------- | ---------- |
| ^1.0.0          | >=4.0.0 | ^3.0.0     |
