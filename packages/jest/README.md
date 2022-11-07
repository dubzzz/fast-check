# `@fast-check/jest`

![fast-check logo](https://raw.githubusercontent.com/dubzzz/fast-check/main/packages/fast-check/documentation/images/logo.png)

Bring the power of property based testing framework `fast-check` into Jest.
`@fast-check/jest` simplifies the integration of `fast-check` into Jest testing framework.

<a href="https://badge.fury.io/js/@fast-check%2Fjest"><img src="https://badge.fury.io/js/@fast-check%2Fjest.svg" alt="npm version" /></a>
<a href="https://www.npmjs.com/package/@fast-check/jest"><img src="https://img.shields.io/npm/dm/@fast-check%2Fjest" alt="monthly downloads" /></a>
<a href="https://github.com/dubzzz/fast-check/blob/main/packages/jest/LICENSE"><img src="https://img.shields.io/npm/l/@fast-check%2Fjest.svg" alt="License" /></a>

---

## Getting Started

Install `@fast-check/jest`:

```bash
npm install --save-dev @fast-check/jest
```

In order to work properly, `@fast-check/jest` requires `jest` to be installed.

We also highly recommend users to launch their tests using the `--show-seed` option provided by Jest. It ensures Jest will always print the seed by itself (requires Jest ≥29.2.0).

```sh
jest --show-seed
```

## Example

```javascript
import { test, fc } from '@fast-check/jest';

// for all a, b, c strings
// b is a substring of a + b + c
test.prop([fc.string(), fc.string(), fc.string()])('should detect the substring', (a, b, c) => {
  return (a + b + c).includes(b);
});

// Or the exact same test but based on named parameters
test.prop({ a: fc.string(), b: fc.string(), c: fc.string() })('should detect the substring', ({ a, b, c }) => {
  return (a + b + c).includes(b);
});
```

The `it` and `test` functions returned by `@fast-check/jest` are just enriched versions of the ones coming from `jest` itself. They both come with `.prop`.

Please note that the properties accepted by `@fast-check/jest` as input can either be synchronous or asynchronous (even just `PromiseLike` instances). In other words, the predicate passed as the last argument can be asynchronous.

**Remark:** `it` and `test` have been introduced in 1.4.0. You have to refer to [Deprecated API](#deprecated-api) if you are using a version of `@fast-check/jest` <1.4.0.

## Advanced

If you want to forward custom parameters to `fast-check`, `test.prop` and its variants accept an optional `fc.Parameters` ([more](https://github.com/dubzzz/fast-check/blob/main/packages/fast-check/documentation/Runners.md#runners)).

`@fast-check/jest` also comes with support for `.only`, `.skip`, `.todo` and `.concurrent` from `jest`. It also accepts more complex ones such as `.concurrent.failing` or `.concurrent.only.failing`.

```javascript
import { it, test, fc } from '@fast-check/jest';

// With custom `fc.Parameters`, here { seed: 4242 }
test.prop([fc.nat(), fc.nat()], { seed: 4242 })('should replay the test for the seed 4242', (a, b) => {
  return a + b === b + a;
});

// With .skip
test.skip.prop([fc.fullUnicodeString()])('should be skipped', (text) => {
  return text.length === [...text].length;
});

// With it version
describe('with it', () => {
  it.prop([fc.nat(), fc.nat()])('should run too', (a, b) => {
    return a + b === b + a;
  });
});
```

## Deprecated API

Our old API was not as close from `jest` as the current one is. Writing a property was done via:

```ts
import { testProp, fc } from '@fast-check/jest';

testProp('should detect the substring', [fc.string(), fc.string(), fc.string()], (a, b, c) => {
  return (a + b + c).includes(b);
});
```

This API is available in all 1.x versions but may not exist anymore starting at 2.x.

## Minimal requirements

| @fast-check/jest | jest                                 | fast-check |
| ---------------- | ------------------------------------ | ---------- |
| ^1.0.0           | >=26.5.0<sup>(1)</sup><sup>(2)</sup> | ^3.0.0     |

- (1) any version of `jest` should be greater or equal than 26.5.0 if you are using `commonjs`
- (2) in order to use `esm` build, you may need to enable experimental features of node, see [here](https://github.com/dubzzz/fast-check/blob/main/packages/test-jest-bundle-esm/package.json)
