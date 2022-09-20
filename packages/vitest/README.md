# `@fast-check/vitest`

![fast-check logo](https://raw.githubusercontent.com/dubzzz/fast-check/main/packages/fast-check/documentation/images/logo.png)

Bring the power of property based testing framework `fast-check` into Vitest.
`@fast-check/vitest` simplifies the integration of `fast-check` into Jest testing framework.

<a href="https://badge.fury.io/js/@fast-check%2Fvitest"><img src="https://badge.fury.io/js/@fast-check%2Fvitest.svg" alt="npm version" /></a>
<a href="https://www.npmjs.com/package/@fast-check/vitest"><img src="https://img.shields.io/npm/dm/@fast-check%2Fvitest" alt="monthly downloads" /></a>
<a href="https://github.com/dubzzz/fast-check/blob/main/packages/jest/LICENSE"><img src="https://img.shields.io/npm/l/@fast-check%2Fvitest.svg" alt="License" /></a>

---

## Getting Started

Install `@fast-check/vitest`:

```bash
npm install --save-dev @fast-check/vitest
```

In order to work properly, `@fast-check/vitest` requires `vitest` to be installed.

## Example

```javascript
import { testProp, fc } from '@fast-check/vitest';

// for all a, b, c strings
// b is a substring of a + b + c
testProp('should detect the substring', [fc.string(), fc.string(), fc.string()], (a, b, c) => {
  return (a + b + c).includes(b);
});
```

Please note that the properties accepted by `@fast-check/vitest` as input can either be synchronous or asynchronous (even just `PromiseLike` instances).

## Advanced

If you want to forward custom parameters to fast-check, `testProp` accepts an optional `fc.Parameters` ([more](https://github.com/dubzzz/fast-check/blob/main/documentation/1-Guides/Runners.md#runners)).

`@fast-check/vitest` also comes with `.only`, `.skip`, `.todo` and `.concurrent` from jest. It also accepts more complex ones such as `.concurrent.failing` or `.concurrent.only.failing`.

```javascript
import { itProp, testProp, fc } from '@fast-check/vitest';

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

| @fast-check/vitest | jest                                 | fast-check |
| ------------------ | ------------------------------------ | ---------- |
| ^1.0.0             | >=26.5.0<sup>(1)</sup><sup>(2)</sup> | ^3.0.0     |

- (1) any version of `jest` should be greater or equal than 26.5.0 if you are using `commonjs`
- (2) in order to use `esm` build, you may need to enable experimental features of node, see [here](https://github.com/dubzzz/fast-check/blob/main/packages/test-jest-bundle-esm/package.json)
