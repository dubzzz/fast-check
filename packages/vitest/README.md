# `@fast-check/vitest`

![fast-check logo](https://media.githubusercontent.com/media/dubzzz/fast-check/main/website/static/img/logo.png)

Bring the power of property based testing framework `fast-check` into Vitest.
`@fast-check/vitest` simplifies the integration of `fast-check` into Vitest.

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
import { test, fc } from '@fast-check/vitest';

// for all a, b, c strings
// b is a substring of a + b + c
test.prop([fc.string(), fc.string(), fc.string()])('should detect the substring', (a, b, c) => {
  return (a + b + c).includes(b);
});

// same property but using named values
test.prop({ a: fc.string(), b: fc.string(), c: fc.string() })('should detect the substring', ({ a, b, c }) => {
  return (a + b + c).includes(b);
});
```

Please note that the properties accepted by `@fast-check/vitest` as input can either be synchronous or asynchronous (even just `PromiseLike` instances).

## Advanced

If you want to forward custom parameters to fast-check, `test.prop` accepts an optional `fc.Parameters` ([more](https://github.com/dubzzz/fast-check/blob/main/documentation/1-Guides/Runners.md#runners)).

`@fast-check/vitest` also comes with `.only`, `.skip`, `.todo` and `.concurrent` from vitest. It also accepts more complex ones such as `.concurrent.skip`.

```javascript
import { it, test, fc } from '@fast-check/vitest';

test.prop([fc.nat(), fc.nat()], { seed: 4242 })('should replay the test for the seed 4242', (a, b) => {
  return a + b === b + a;
});

test.skip.prop([fc.string()])('should be skipped', (text) => {
  return text.length === [...text].length;
});

describe('with it', () => {
  it.prop([fc.nat(), fc.nat()])('should run too', (a, b) => {
    return a + b === b + a;
  });
});
```

## Minimal requirements

| @fast-check/vitest | vitest   | fast-check |
| ------------------ | -------- | ---------- |
| ^0.0.0             | >=0.28.1 | ^3.0.0     |
