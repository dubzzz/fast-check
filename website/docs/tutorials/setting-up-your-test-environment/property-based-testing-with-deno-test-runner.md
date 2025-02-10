---
slug: /tutorials/setting-up-your-test-environment/property-based-testing-with-deno-test-runner/
description: Bring Property-Based Testing capabilities into Deno with fast-check
sidebar_label: With Deno test runner
image: /img/socials/fast-check-deno.png
---

# Property Based Testing with Deno test runner

Want to start playing with property-based testing in [Deno](https://deno.com/)? Welcome to this short and concise tutorial on integrating fast-check within Deno.

## Your first test

Let's write a test for [FizzBuzz](https://en.wikipedia.org/wiki/Fizz_buzz) using fast-check.

```js title="fizzbuzz.test.ts"
import { assertStringIncludes } from "jsr:@std/assert";
import fc from "npm:fast-check";

Deno.test({
  name: "should print Fizz whenever divisible by 3",
  fn() {
    fc.assert(
      fc.property(
        fc.nat().map((n) => n * 3),
        (n) => {
          assertStringIncludes(fizzbuzz(n), "Fizz");
        }
      )
    );
  },
});

// Code under test: should rather be imported from another file
function fizzbuzz(n: number): string {
  return n % 3 === 0
    ? n % 5 === 0
      ? "Fizz Buzz"
      : "Fizz"
    : n % 5 === 0
    ? "Buzz"
    : String(n);
}
```

You can now execute it by running the following command in a terminal:

```bash
deno test
```

You've written and executed your first Property-Based Test using the Deno test runner 🚀

## Going further

Property-based testing can be leveraged to test complex systems. This snippet was just a simple Hello-World example to give you a basic starting point. Our documentation provides advanced tricks to push the technique further, including [detecting race conditions](/docs/tutorials/detect-race-conditions/) and [finding vulnerabilities](/blog/2023/09/21/detect-prototype-pollution-automatically/).

FizzBuzz alone can also be extended with more properties. You may want to refer to [this article](https://dev.to/dubzzz/advent-of-pbt-2021-day-3-solution-366l) for more ideas.
