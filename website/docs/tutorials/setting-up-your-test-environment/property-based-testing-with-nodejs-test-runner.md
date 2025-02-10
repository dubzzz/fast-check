---
slug: /tutorials/setting-up-your-test-environment/property-based-testing-with-nodejs-test-runner/
description: Extend the Node.js test runner with Property-Based Testing capabilities. Discover best practices to setup fast-check for it
sidebar_label: With Node.js test runner
image: /img/socials/fast-check-nodejs.png
---

# Property Based Testing with Node.js test runner

Officially made stable with Node.js v20, there is now an [official test runner](https://nodejs.org/en/blog/announcements/v20-release-announce#stable-test-runner) in Node.js since 2023. As with any other test runner, fast-check can be integrated with just a few steps.

The following tutorial provides some pointers and tricks to achieve this integration smoothly.

## Basic setup

Add fast-check to your set of dependencies:

```bash npm2yarn
npm install --save-dev fast-check
```

Congratulations, everything is ready to start using Property-Based Tests with the Node.js test runner 🚀

## Your first test

For our first test, we will test an algorithm computing a value of the [Fibonacci sequence](https://en.wikipedia.org/wiki/Fibonacci_sequence). Our property-based test will assess that our implementation respects the rule: `fibo(n) = fibo(n-1) + fibo(n-2)`.

```js title="fibo.test.js"
const assert = require('node:assert');
const { test } = require('node:test');
const fc = require('fast-check');

test('should follow the rule: fibo(n) = fibo(n-1) + fibo(n-2)', () => {
  fc.assert(
    fc.property(fc.integer({ min: 2, max: 78 }), (n) => {
      assert.equal(fibo(n), fibo(n - 1) + fibo(n - 2));
    }),
  );
});

// Code under test: should rather be imported from another file
function fibo(n) {
  // Note: n must be in the range 0 (included) to 78 (included)
  let a = 0;
  if (n === 0) {
    return a;
  }
  let b = 1;
  for (let i = 1; i !== n; ++i) {
    const c = a + b;
    a = b;
    b = c;
  }
  return b;
}
```

You can now execute it by running the following command in a terminal:

```bash
node --test
```

You've written and executed your first Property-Based Test using the Node.js test runner 🚀

## Going further

The Fibonacci sequence isn't just about `fibo(n) = fibo(n-1) + fibo(n-2)`. Tests can be extended much further with additional properties to confirm the implementation. You can read [this article](https://dev.to/dubzzz/advent-of-pbt-2021-day-7-solution-4lf3) to explore more properties for it.

There are many advanced techniques to manage fast-check like a pro. Whether you want to start experimenting with [asynchronous properties](/docs/core-blocks/properties/#asynchronous-properties), [detecting race conditions](/docs/tutorials/detect-race-conditions/), [building complex values](/docs/core-blocks/arbitraries/), or more, our documentation is the best place to start to discover all these details and subtleties.
