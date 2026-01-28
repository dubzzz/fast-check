# `@fast-check/worker`

![fast-check logo](https://fast-check.dev/assets/images/logo.png)

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
- replace `fc.property` by `property` coming from `propertyFor(<path-to-file>)`
- replace `fc.assert` by `assert` coming from `@fast-check/worker` for automatic cleaning of the workers as the test ends
- transpilation has not been addressed yet but it may probably work
- in theory, if you were only using `propertyFor` and `assert` without any external framework for `test`, `it` and others, the separation of the property from the assertion would be useless as the check for main thread is fully handled within `@fast-check/worker` itself so no hoisting needing in such case

```js
import { test } from '@jest/globals';
import fc from 'fast-check';
import { isMainThread } from 'node:worker_threads';
import { assert, propertyFor } from '@fast-check/worker';

const property = propertyFor(new URL(import.meta.url)); // or propertyFor(pathToFileURL(__filename)) in commonjs
const p1 = property(fc.nat(), fc.nat(), (start, end) => {
  // starting a possibly infinite loop
  for (let i = start; i !== end; ++i) {
    // doing stuff...
  }
});

if (isMainThread) {
  test('should assess p1', async () => {
    await assert(p1, { timeout: 1000 });
  });
}
```

Refer to the tests defined `test/main.spec.ts` for a living example of how you can use this package with a test runner such as Jest.

## Extra options

The builder of properties `propertyFor` accepts a second parameter to customize how the workers will behave. By default, workers will be shared across properties. In case you want a more isolation between your runs, you can use:

```js
const property = propertyFor(new URL(import.meta.url), { isolationLevel: 'predicate' });
// Other values:
// - "file": Re-use workers cross properties (default)
// - "property": Re-use workers for each run of the predicate. Not shared across properties!
// - "predicate": One worker per run of the predicate
```

By default, workers will receive the generated values from their parent thread. In some cases, such sending is made impossible as the generated values include non-serializable pieces. In such cases, you can opt-in to generate the values directly within the workers by using:

```js
const property = propertyFor(new URL(import.meta.url), { randomSource: 'worker' });
// Other values:
// - "main-thread": The main thread will be responsible to generate the random values and send them to the worker thread. It unfortunately cannot send any value that cannot be serialized between threads. (default)
// - "worker": The worker is responsible to generate its own values based on the instructions provided by the main thread. Switching to a worker mode allows to support non-serializable values, unfortunately it drops all shrinking. capabilities.
```

## Minimal requirements

- Node ≥20.19.0<sup>(1)</sup><sup>(2)</sup><sup>(3)</sup>
- TypeScript ≥4.1 (optional)

_(1): Requires support for `require(esm)`._

_(2): this package targets ES2020 specification which is quite well supported (more than 94%) by any Node ≥14.5.0_

_(3): this package requires a version of node able to understand `package.json#exports`, supported by any Node ≥12.17.0_
