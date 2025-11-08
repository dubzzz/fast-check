---
sidebar_position: 2
slug: /tutorials/quick-start/our-first-property-based-test/
---

# Our first Property-Based Test

Write your first test

## What are we testing?

The code under test is a `sortNumbersAscending`: the algorithm takes an array of numbers and returns a sorted copy of it. Resulting values should be ordered from the smallest one to the largest one.

Here are some basic unit tests we could have written for it:

```js
test('should keep an already sorted array sorted', () => {
  expect(sortNumbersAscending([1, 2, 3])).toEqual([1, 2, 3]);
});
test('should sort a randomly ordered array in ascending order', () => {
  expect(sortNumbersAscending([3, 1, 2])).toEqual([1, 2, 3]);
});
test('should sort a descending ordered array in ascending order', () => {
  expect(sortNumbersAscending([3, 2, 1])).toEqual([1, 2, 3]);
});
```

These tests are what we call example based tests. They are based on clearly specified examples that the tester thought about when writing them.

## What is a property?

A property is to property-based tests, what an example is to example based tests: it's the core building block of it. Instead of explicitly defining values to test, we will ask the framework to build them for us. Instead of expecting clear values, we will check the shape of the output. And it has several positive impacts:

- We test more inputs over time
- We test more diverse inputs
- We don't need to think about counterexamples

A property can be expressed as follow:

> for any (x, y, ...)  
> such that precondition(x, y, ...) holds  
> predicate(x, y, ...) is true

:::info Property-based tests
You may want to refer to our [Why Property-Based?](/docs/introduction/why-property-based/) section to know more about the benefits and strengths of property-based tests.
:::

## Our first property

When thinking about properties, one may think about what's the algorithm is supposed to do. Here our algorithm is supposed to: "_Sort numeric elements from the smallest to the largest one_". In other words, given two indices in the array, the smallest index should be attached to value being smaller than the one at the larger index.

In other words, we could come up with the following property:

> for any
>
> - `data`, array of numerical values
> - `i`, index in `data`
> - `j`, index in `data`
>
> such that `i ≤ j`  
> `sortedData[i] ≤ sortedData[j]` is true, with `sortedData = sortNumbersAscending(data)`

Which could be summarized as:

> for any `data`, array of numerical values  
> `sortedData[i-1] ≤ sortedData[i]` is true for any `i` in `[1..data.length-1]`

## Our property written with fast-check

Let's start by adding import statement for fast-check into our test file.

```js title="sort.test.mjs"
import fc from 'fast-check';
```

Now that we have our property in mind, let's translate it into a running test:

```js title="sort.test.mjs"
test('should sort numeric elements from the smallest to the largest one', () => {
  fc.assert(
    fc.property(fc.array(fc.integer()), (data) => {
      const sortedData = sortNumbersAscending(data);
      for (let i = 1; i < data.length; ++i) {
        expect(sortedData[i - 1]).toBeLessThanOrEqual(sortedData[i]);
      }
    }),
  );
});
```

Congratulations, you've written your first property-based tests! 🎉
