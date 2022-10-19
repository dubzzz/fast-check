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
import { testProp, fc } from '@fast-check/jest';

// for all a, b, c strings
// b is a substring of a + b + c
testProp('should detect the substring', [fc.string(), fc.string(), fc.string()], (a, b, c) => {
  return (a + b + c).includes(b);
});
```

Please note that the properties accepted by `@fast-check/jest` as input can either be synchronous or asynchronous (even just `PromiseLike` instances).

## Advanced

If you want to forward custom parameters to fast-check, `testProp` accepts an optional `fc.Parameters` ([more](https://github.com/dubzzz/fast-check/blob/main/documentation/1-Guides/Runners.md#runners)).

`@fast-check/jest` also comes with `.only`, `.skip`, `.todo` and `.concurrent` from jest. It also accepts more complex ones such as `.concurrent.failing` or `.concurrent.only.failing`.

```javascript
import { itProp, testProp, fc } from '@fast-check/jest';

testProp(
  'should replay the test for the seed 4242',
  [fc.nat(), fc.nat()],
  (a, b) => {
    return a + b === b + a;
  },
  { seed: 4242 }
);

testProp.skip('should be skipped', [fc.fullUnicodeString()], (text) => {
  return text.length === [...text].length;
});

describe('with it', () => {
  itProp('should run too', [fc.nat(), fc.nat()], (a, b) => {
    return a + b === b + a;
  });
});
```

## Minimal requirements

| @fast-check/jest | jest                                 | fast-check |
| ---------------- | ------------------------------------ | ---------- |
| ^1.0.0           | >=26.5.0<sup>(1)</sup><sup>(2)</sup> | ^3.0.0     |

- (1) any version of `jest` should be greater or equal than 26.5.0 if you are using `commonjs`
- (2) in order to use `esm` build, you may need to enable experimental features of node, see [here](https://github.com/dubzzz/fast-check/blob/main/packages/test-jest-bundle-esm/package.json)
