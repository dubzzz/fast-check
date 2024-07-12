---
slug: /tutorials/setting-up-your-test-environment/property-based-testing-with-bun-test-runner/
description: Enrich Bun test runner with Property-Based Testing capabilities. Discover best practices to setup fast-check for it
sidebar_label: With Bun test runner
image: /img/socials/fast-check-bun.png
---

# Property Based Testing with Bun test runner

You're using [Bun](https://bun.sh/) and you want to explore property-based testing with it. Stay here! This quick tutorial will give you the basics to get started.

## Basic setup

First, add fast-check as a development dependency to your project:

```bash
bun install -D fast-check
```

Congratulations, everything is ready to start using Property-Based Tests with the Bun test runner 🚀

## Your first test

For our first test, we will consider a function called `decompose`. `decompose` takes an integer value between 1 (included) and 2,147,483,647 (included) and decomposes it into the list of its prime factors. For example, the value `20` can be decomposed as `20 = 2 x 2 x 5`, where neither `2` nor `5` can be decomposed further.

One of the things we could assess about such an algorithm is that the array of prime factors should multiply back to the original value. In other words, whatever input we pass to our function (within the accepted range), we expect it to provide us a list of factors that, when multiplied together, give us back our original value.

```js title="decompose.spec.ts"
import { describe, it, expect } from 'bun:test';
import fc from 'fast-check';

describe('decompose', () => {
  it('should produce an array such that the product equals the input', () => {
   fc.assert(
    fc.property(fc.integer({ min: 2, max: 2 ** 31 - 1 }), (n) => {
      const factors = decompose(n);
      const productOfFactors = factors.reduce((a, b) => a * b, 1);
      return productOfFactors === n;
    })
  );
  });
});

// Code under test: should rather be imported from another file
function decompose(n: number): number[] {
  // Quick implementation: the maximal number supported is 2**31-1
  let done = false;
  const factors: number[] = [];
  while (!done) {
    done = true;
    const stop = Math.sqrt(n);
    for (let i = 2; i <= stop; ++i) {
      if (n % i === 0) {
        factors.push(i);
        n = Math.floor(n / i);
        done = false;
        break;
      }
    }
  }
  return [...factors, n];
}
```

You can now execute it by running the following command in a terminal:

```bash
bun test
```

You've written and executed your first Property-Based Test using the Bun test runner 🚀

## Going further

The example of `decompose` can be extended much further with additional properties. If you want to explore more properties you could come up with, you can read [this article](https://dev.to/dubzzz/advent-of-pbt-2021-day-2-solution-367b).

fast-check is not only about testing simple algorithms, it can be extended to much more complex pieces of code, including:

- [checking asynchronous code](/docs/core-blocks/properties/#asynchronous-properties),
- [detecting race conditions](/docs/tutorials/detect-race-conditions/),
- [building complex inputs](/docs/core-blocks/arbitraries/), and more.

Our documentation is the best place to start to discover all these capabilities.
