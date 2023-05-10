---
sidebar_position: 2
slug: /introduction/why-property-based/
---

# Why Property-Based?

Learn about the benefits and advantages of property-based testing.

## Testing today

The tests that we typically write today can be classified as example-based tests. They explicitly specify the inputs and outputs we want to use and observe.

### Unit, Integration and E2E

All layers of tests that we use today leverage this approach. Unit tests hardcode the values they pass as inputs to the functions under tests, as well as the expected return values. The same is true for integration and end-to-end tests. In end-to-end tests, we generally hardcode both the inputs and the scenarios we want to cover. In a certain sense, the expected outputs of a function are replaced by what we expect to see on the screen.

In other words, most of our tests depend on very specific sets of inputs and expect very specific outcomes.

### Limitations

The problem with our current approach to testing software is that it places the responsibility of identifying bugs solely on the developers writing the tests. They must think about all the things that could go wrong if they want their tests to find all potential bugs. While it's possible to think about common failure cases with enough experience, it's not really feasible to consider all possible edge cases without proving the code line by line.

## Property-based

What makes our current tests so inflexible is how strictly tied they are to specific values.

### Random

Property-based testing overcomes this by allowing users to focus on the behaviors they want to assess, rather than the specific values required to assess them.

By generating random inputs and applying them to the code being tested, property-based testing can help identify edge cases and potential issues that may not have been considered with example-based tests. This approach is particularly useful when dealing with complex or hard-to-reach code paths that may not be exercised with traditional testing methods. It also proves useful to detect unexpected issues and edge cases linked to very specific sets of inputs.

### Reproducible

Property-based testing is fully deterministic. All tests are launched with a precise seed, so you will get the same set of values every time, making it easy to reproduce errors.

### Designed for bugs

The aim of property-based testing is not to generate random data, but to find bugs. Property-based testing frameworks are designed to detect common problems with a higher probability. For example, it is almost impossible to randomly generate an array with duplicated 32-bit integer values. However, property-based testing can create such an array, as well as other common values that trigger issues, such as -1, 0, or even dangerous strings like `__proto__` in JavaScript. Depending on the framework you use, you may have access to more sophisticated randomization techniques that increase the likelihood of generating such cases.

### Designed for users

Property-based is not only about randomizing inputs to find bugs; it's also about helping users to find and to fix the errors. As a consequence, property-based testing frameworks come with what we refer to as: shrinking capabilities. Basically given a failure, they will take it and attempt to report another one much simpler to read and investigate. In general long inputs containing many complex characters or values tend to guide the developer on wrong tracks. With shrinker, this useless noise will be dropped and the failure being reported will only focus on the minimal input to make the predicate fail.

### Document the code

Another benefit of property-based testing is that it can help to document the behavior of your code in a high-level way. For example, when testing a sorting algorithm, you can use property-based tests to specify all the invariants that users can expect from the algorithm, such as the resulting array having the same values as the source array and being sorted in ascending order.

By writing property-based tests, you capture the essence of what the code should do.

## Testing tomorrow

Although property-based testing is a powerful technique, it should not be viewed as a substitute for traditional example-based testing. Instead, it should be used in conjunction with example-based testing as a complementary approach. Property-based testing is capable of detecting different types of bugs and can document things in a different way, making it a valuable addition to the testing process.

## Alternatives

When it comes to random, several alternatives are available. But they are probably less tailored for tests.

### Fake data

Fake data generators mostly consist of generating realistic data to demonstrate a tool or product. Although they can be used in testing, they have some limitations:

- Not reproducible except by hardcoding a seed, which makes them equivalent to example-based testing. Hardcoding the seed is the same as hardcoding the value, and all runs will always be against the same inputs.
- Not tailored for detecting bugs. They do not aim to find bugs, so they will not produce known sources of issues.
- Not tailored for testing. The reported errors might be hard to read and will never be reduced to something smaller.

Fake data generators are great, but not appropriate for testing when used alone: nothing prevents a property-based testing framework from using them.

### Fuzzing

Fuzzing is the idea of firing lots of randomly generated values onto an algorithm to find bugs. In a way, it's not that far from property-based testing and can even be considered a sub-case of it. Fuzzing techniques mostly involve:

- Running tests repeatedly
- Asserting that the code never crashes

Both of these can be achieved with property-based testing.
