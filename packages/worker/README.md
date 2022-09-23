# `@fast-check/worker`

Provide built-ins to run predicates directly within dedicated workers

<a href="https://badge.fury.io/js/@fast-check%2Fworker"><img src="https://badge.fury.io/js/@fast-check%2Fworker.svg" alt="npm version" /></a>
<a href="https://www.npmjs.com/package/@fast-check/worker"><img src="https://img.shields.io/npm/dm/@fast-check%2Fworker" alt="monthly downloads" /></a>
<a href="https://github.com/dubzzz/fast-check/blob/main/packages/worker/LICENSE"><img src="https://img.shields.io/npm/l/@fast-check%2Fworker.svg" alt="License" /></a>

---

## Why?

`fast-check` alone is great but what if it led your code into an infinite and synchronous loop for such inputs? In such case, it would neither be able to shrink the issue, nor to report any for you as the single threaded philosophy at the root of JavaScript will prevent it from anything except waiting for the main thread to come back.

This package tends to provide a way to run easily your properties within dedicated workers automatically spawed by it.

## Easy to use

The most noticeable changes you will have to do are:

- hoist properties so that they get declared on the root scope
- replace `fc.property` by `workerProperty` and adds the extra URL parameter

```js
import { isMainThread } from 'node:worker_threads';
import { workerProperty, assertWorker } from '@fast-check/worker';
import fc from 'fast-check';

const workerFileUrl = new URL(import.meta.url); // or __fileName in commonjs
const p1 = workerProperty(workerFileUrl, fc.nat(), fc.nat(), (start, end) => {
  // starting a possibly infinite loop
  for (let i = start; i !== end; ++i) {
    // doing stuff...
  }
});

if (isMainThread) {
  test('should assess p1', async () => {
    await fc.assert(p1, { timeout: 1000 });
  });
}
```

## Minimal requirements

- Node ≥?.?.?
