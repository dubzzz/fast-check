# `@fast-check/worker`

Provide built-ins to run predicates directly within dedicated workers

<a href="https://badge.fury.io/js/@fast-check%2Fworker"><img src="https://badge.fury.io/js/@fast-check%2Fworker.svg" alt="npm version" /></a>
<a href="https://www.npmjs.com/package/@fast-check/worker"><img src="https://img.shields.io/npm/dm/@fast-check%2Fworker" alt="monthly downloads" /></a>
<a href="https://github.com/dubzzz/fast-check/blob/main/packages/worker/LICENSE"><img src="https://img.shields.io/npm/l/@fast-check%2Fworker.svg" alt="License" /></a>

---

## Why?

`fast-check` alone is great but what if it led your code into an infinite and synchronous loop for such inputs? In such case, it would neither be able to shrink the issue, nor to report any for you as the single threaded philosophy at the root of JavaScript will prevent it from anything except waiting for the main thread to come back.

This package tends to provide a way to run easily your properties within dedicated workers automatically spawed by it.

## Example

Here are some of the changes you will have to do:

- hoist properties so that they get declared on the root scope
- replace `fc.property` by `workerProperty` and adds the extra URL parameter
- clean pending workers via an explicit call to `clearAllWorkersFor`
- transpilation has not been addressed yet but it may probably work

```js
import { test } from '@jest/globals';
import fc from 'fast-check';
import { isMainThread } from 'node:worker_threads';
import { workerProperty, clearAllWorkersFor } from '@fast-check/worker';

const workerFileUrl = new URL(import.meta.url); // or pathToFileURL(__filename) in commonjs
const p1 = workerProperty(workerFileUrl, fc.nat(), fc.nat(), (start, end) => {
  // starting a possibly infinite loop
  for (let i = start; i !== end; ++i) {
    // doing stuff...
  }
});

if (isMainThread) {
  test('should assess p1', async () => {
    try {
      await fc.assert(p1, { timeout: 1000 });
    } finally {
      // No automatic garbage collection of workers having reached the timeout
      clearAllWorkersFor(p1);
    }
  });
}
```

Refer to the tests defined `test/main.spec.ts` for a living example of how you can use this package with a test runner such as Jest.

## Minimal requirements

- Node ≥14.18.0<sup>(1)</sup><sup>(2)</sup>
- TypeScript ≥4.1 (optional)

_(1): `worker_threads` alone would only require Node ≥10.5.0, but our usage of `require(node:*)` forces us to request at least Node ≥14.18.0_

_(2): this package targets ES2020 specification which is quite well supported (more than 94%) by any Node ≥14.5.0_
