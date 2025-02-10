# `@fast-check/jest`

![fast-check logo](https://media.githubusercontent.com/media/dubzzz/fast-check/main/website/static/img/logo.png)

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

### Support for variations of `test` and `it`

If you want to forward custom parameters to `fast-check`, `test.prop` and its variants accept an optional `fc.Parameters` ([more](https://fast-check.dev/docs/core-blocks/runners/#assert)).

`@fast-check/jest` also comes with support for `.only`, `.skip`, `.todo` and `.concurrent` from `jest`. It also accepts more complex ones such as `.concurrent.failing` or `.concurrent.only.failing`.

```javascript
import { it, test, fc } from '@fast-check/jest';

// With custom `fc.Parameters`, here { seed: 4242 }
test.prop([fc.nat(), fc.nat()], { seed: 4242 })('should replay the test for the seed 4242', (a, b) => {
  return a + b === b + a;
});

// With .skip
test.skip.prop([fc.string()])('should be skipped', (text) => {
  return text.length === [...text].length;
});

// With it version
describe('with it', () => {
  it.prop([fc.nat(), fc.nat()])('should run too', (a, b) => {
    return a + b === b + a;
  });
});
```

### Experimental worker-based runner

**The following feature is experimental!** When used it makes runners able to kill long running synchonous code. Meaning that it will make fast-check able to kill infinite loops blocking the main thread. So far, the feature does not fully support transformations performed via transform steps defined with jest.

The CommonJS approach would be:

```js
const { init, fc } = require('@fast-check/jest/worker');
const { pathToFileURL } = require('node:url');

const { test, expect } = init(pathToFileURL(__filename));
// can also be passed options such as isolationLevel: init(pathToFileURL(__filename), {})

test.prop([fc.constant(null)])('should pass', (value) => {
  expect(value).toBe(null);
});
```

The ES Modules approach would be:

```js
import { init, fc } from '@fast-check/jest/worker';

const { test, expect } = await init(new URL(import.meta.url));
// can also be passed options such as isolationLevel: init(new URL(import.meta.url), {})

test.prop([fc.constant(null)])('should pass', (value) => {
  expect(value).toBe(null);
});
```

⚠️ Do not forget to add the `await` before `init` for the ES Module version!

## Minimal requirements

| @fast-check/jest | jest                                    | fast-check | node                                                                                  |
| ---------------- | --------------------------------------- | ---------- | ------------------------------------------------------------------------------------- |
| ^2.0.0           | &gt;=26.5.0<sup>(1)</sup><sup>(2)</sup> | ^3.0.0     | &gt;=14.15.0<sup>(3)</sup> and &lt;18, &gt;=18.17.0 and &lt;19<sup>(4)</sup>, &gt;=20 |
| ^1.0.0           | &gt;=26.5.0<sup>(1)</sup><sup>(2)</sup> | ^3.0.0     | &gt;=14.15.0<sup>(3)</sup> and &lt;18, &gt;=18.17.0 and &lt;19<sup>(4)</sup>, &gt;=20 |

- (1) any version of `jest` should be greater or equal than 26.5.0 if you are using `commonjs`
- (2) in order to use `esm` build, you may need to enable experimental features of node, see [here](https://github.com/dubzzz/fast-check/blob/main/packages/test-jest-bundle-esm/package.json)
- (3) &gt;=14.15.0 is the minimal requirements for `jest`, &gt;=12.17.0 is the one for `@fast-check/jest`
- (4) timeout defined on jest might not be properly applied to fast-check for node 18 (until 18.17.0) and node 19, see [#4004](https://github.com/dubzzz/fast-check/pull/4004)
