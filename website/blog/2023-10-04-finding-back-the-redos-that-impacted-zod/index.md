---
title: Finding back the ReDOS that impacted Zod
authors: [dubzzz]
tags: [investigation, tips, cve, vulnerability]
---

On the 28th of September 2023, a critical security vulnerability impacting any version of [Zod](https://zod.dev/) got reported as [CVE-2023-4316](https://www.cve.org/CVERecord?id=CVE-2023-4316). Zod defines itself as "TypeScript-first schema validation with static type inference".

In this post, we will come up with a simple way to foresee such vulnerabilities by leveraging fast-check and its ecosystem.

<!--truncate-->

## The vulnerability

The vulnerability has been categorized as a Regular Expression Denial of Service (ReDOS). It corresponds to a specific class of issues implying regexes suffering from uncontrollable execution time. A more detailed definition of ReDOS and the vulnerability itself can be found on [Snyk](https://security.snyk.io/vuln/SNYK-JS-ZOD-5925617).

In the case of Zod, the ReDOS was touching the validator of email addresses and has been fixed by [colinhacks/zod#2824](https://github.com/colinhacks/zod/pull/2824).

## The idea

fast-check has been designed with finding bugs in mind. As such not only it generates random entries for the algorithm under test but also attempts to play on known weaknesses of JavaScript codes. In the context of ReDOS, what we are looking for is neither a crash nor an invariant not being fulfilled. What we are looking for is an input driving our algorithm crazy and uncontrollable in terms of execution time.

In other words we want fast-check to report us whenever it finds an input that puts our code out-of-control.

## The basic setup

Our basic setup consists into repharsing our idea in terms of property understandable by fast-check. The skeleton for such test would be:

```js
import fc from 'fast-check';

const timeLimitMs = 1_000; // TODO: specify a limit based on the needs of the algorithm
const arbitraries = []; // TODO: our arbitraries or generators of random data
fc.assert(
  fc.property(...arbitraries, (...inputs) => {
    const startTime = performance.now();
    try {
      algorithm(...inputs);
    } catch (err) {}
    const endTime = performance.now();
    const delayMs = endTime - startTime;
    if (delayMs > timeLimitMs) {
      throw new Error(`The computation of algorithm(...inputs) took ${delayMs}ms`);
    }
  }),
);
```

If we applied it to the Zod case we would have written:

```js
import { z } from 'zod';
import fc from 'fast-check';

const timeLimitMs = 1_000;
const validator = z.string().email();
fc.assert(
  fc.property(fc.emailAddress(), (rawString) => {
    const startTime = performance.now();
    try {
      validator.parse(rawString);
    } catch (err) {}
    const endTime = performance.now();
    const delayMs = endTime - startTime;
    if (delayMs > timeLimitMs) {
      throw new Error(`The computation of validator.parse took ${delayMs}ms`);
    }
  }),
);
```

While it will perfectly works, the proposed approach has several gotchas we will address in the next section.

## The advanced setup

### Input size

In many cases, ReDOS or DOS-like class of issues, rely on large data. By default, fast-check limits itself to rather small entries in order to avoid your tests running for too long. But in the context of our investigations of ReDOS, we want large entries to be generated.

It can be unlocked by adding the line:

```js
fc.configureGlobal({ baseSize: 'xlarge' });
```

Before instanciating any of arbitrary or on arbitrary by arbitrary basis.

### Number of entries

On large, stable and actively maintained and used projects such as Zod, the vulnerabilities might be tricky otherwise they would already have been fixed. As such limiting the number of executions of the property to 100 which is the default in fast-check might probably not be efficient.

The number of runs can be increased by passing an extra argument to `fc.assert`:

```js
fc.assert(property, { numRuns: 1_000_000 });
```

### Shrinker

While shrinking is pretty useful in general, if our aim is to check the existance of an input causing long execution time we probably don't need to shrink the failure immediately. As such we can pass an extra option to `fc.assert` to avoid running into shrinking logic:

```js
fc.assert(property, { endOnFailure: true });
// with the number of entries and shrinker together:
// fc.assert(property, { numRuns: 1_000_000, endOnFailure: true });
```

### Time

In such test, nothing prevents the code under test to last for hours or even worst infinitely. By itself fast-check cannot do anything to stop on a synchronously running piece of code except waiting it ends.

The package [@fast-check/worker](https://www.npmjs.com/package/@fast-check/worker) has been designed to address that problem. Instead of running the synchronous code in the main thread, it pops a worker and executes the property on the side. As such it makes any piece of synchronous code stoppeable.

In order to plug it, we have to replace our `fc.property`, `fc.asyncProperty` and `fc.assert` by the helpers it provides. Our skeleton would be updated that way:

```js
import fc from 'fast-check';
import { isMainThread } from 'node:worker_threads';
import { assert, propertyFor } from '@fast-check/worker';

const timeLimitMs = 1_000; // TODO: specify a limit based on the needs of the algorithm
const arbitraries = []; // TODO: our arbitraries or generators of random data
const property = propertyFor(new URL(import.meta.url));
const propertyDOSCheck = property(...arbitraries, (rawString) => {
  const startTime = performance.now();
  try {
    validator.parse(rawString);
  } catch (err) {}
  const endTime = performance.now();
  const delayMs = endTime - startTime;
  if (delayMs > timeLimitMs) {
    throw new Error(`The computation of validator.parse took ${delayMs}ms`);
  }
});
if (isMainThread) {
  await assert(propertyDOSCheck, {
    numRuns: 1_000_000,
    endOnFailure: true,
    interruptAfterTimeLimit: 60_000, // we want to kill the predicate if it takes more than {interruptAfterTimeLimit}ms
    markInterruptAsFailure: true, // and mark the run as failed
  });
}
```

You may have seen that we silently added two extra options to `assert`: `interruptAfterTimeLimit` and `markInterruptAsFailure`. They have been added to make sure that if one run takes more than `interruptAfterTimeLimit`ms, it will be interrupted and marked as failed. But we kept our initial `timeLimitMs` and the `performance.now()` within the predicate. Indeed, the worker runner has to spin a new worker from time to time and it takes time that count for the time limit.

The `interruptAfterTimeLimit` is making sure that the time to spin a new worker, to send data to it and to run the prediacte will never break the specified limit.

### Invalid items

In some cases, DOS might be more likely for cases implying broken entries. In the case of Zod, we proposed to generate only valid email addresses but if we want to make sure that the code will not be mad with any possible user input, we probably want to generate more.

We can for instance replace `fc.emailAddress()` by:

```js
fc.oneof(fc.emailAddress(), fc.fullUnicodeString());
```

## The final snippet

Now that we covered the basics and the gotchas of our initial snippet, let's put everything together to find back the issue reported in Zod:

```js
import fc from 'fast-check';
import { isMainThread } from 'node:worker_threads';
import { assert, propertyFor } from '@fast-check/worker';
const property = propertyFor(new URL(import.meta.url));

const timeLimitMs = 1_000;
const validator = z.string().email();
const propertyDOSCheck = property(fc.emailAddress(), (...inputs) => {
  const startTime = performance.now();
  try {
    algorithm(...inputs);
  } catch (err) {}
  const endTime = performance.now();
  const delayMs = endTime - startTime;
  if (delayMs > timeLimitMs) {
    throw new Error(`The computation of algorithm(...inputs) took ${delayMs}ms`);
  }
});
if (isMainThread) {
  await assert(propertyDOSCheck, {
    // we want to stop immediately on failure to report issues asap, drop it to have shrinking
    endOnFailure: true,
    // we want to kill the predicate if it takes more than {interruptAfterTimeLimit}ms
    interruptAfterTimeLimit: 60_000,
    // and mark the run as failed
    markInterruptAsFailure: true,
    // fuzzing implies possibly running for longer than usual tests (when we want to look for the issues, not in CI)
    numRuns: 1_000_000,
  });
}
```

Let's run it locally and see if we find something... and we do!

```txt
Error: Property failed after 1233 tests
{ seed: 2051841007, path: "1232:5:1:2:12:18:24:30:36", endOnFailure: true }
Counterexample: ["aaaaaakeyconstructorcall1nl=constructorcalle.&g//{%fvf|&q+!v7@npd.z3n5vfs0ivqopytanq2ye37swpycij2a0.v6usxu6qfov9sb9rmown92tk6omw7ujl4-pa274fnbgnx0l9xdn18rq.nmsvklo9r3a-frz-2.gxqagvl7h2c5.imvj9wk-tw1rv8a.i.q3
hpcqgdugnhc8ydfjvvcfci4k1adqgnssmkecpqmiabqux08cfrh3su5zkf.binumohcqsyzjjetfbuntgknunsjeklecfoirjngvpzi"]
Shrunk 8 time(s)
Got error: The computation took 1667.1613000035286ms
```
