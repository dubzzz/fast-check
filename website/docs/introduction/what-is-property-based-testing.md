---
sidebar_position: 1
slug: /introduction/what-is-property-based-testing/
---

# What is Property-Based Testing?

Learn the basic concepts behind the approach.

:::tip
If you are already familiar with property-based testing, you may want to skip straight to the [getting started](/docs/introduction/getting-started) section to see fast-check in action.
:::

## Examples versus properties

The vast majority of automated tests written today are "example-based" tests. Developers choose an exact set of values to input to the code being tested, and then they specify the exact outputs which are expected. This is true whether the tests in question are unit, integration, or end-to-end. The idea is that if developers can provide a sufficiently thorough set of examples of the code's desired behavior then the behavior of the code will be reliable.

In other words, example-based tests depend on very specific sets of inputs and expect very specific outcomes. When we write an example-based test we assert the way the code should behave on **one** set of inputs.

"Property-based" tests are different. A property-based test allows users to focus on the behaviors they want to assess, rather than the specific values required to assess them. A "property" is an assertion of a relationship between a code's input and output which should hold for **all** sets of inputs.

In fast-check a property is a function which takes randomly-generated inputs as an argument, uses them to perform a test, and then throws an error if the test fails.

## The property-based feature set

Property-based testing libraries enable this approach by providing three main features:

- Random input generation

- Multiple runs per test

- Counterexample shrinking

These are mostly orthogonal to the feature sets provided by most testing frameworks such as grouping tests into suites, performing assertions, installing mocks, etc. This makes property-based testing highly compatible with existing testing frameworks. Indeed, fast-check can be used in conjunction with any of the major JavaScript/TypeScript testing frameworks.

## Randomly-generated inputs

A property-based testing framework provides tools for generating arbitrary values of some given type. Fast-check refers to these as "arbitraries". An arbitrary may be very simple; for example, the `string` arbitrary produces random strings, and the `integer` arbitrary produces random integers. Arbitraries can also be used as building blocks to make more complex arbitraries. The `array` combiner can turn our arbitrary for generating strings into an arbitrary for generating arrays of strings. The `record` arbitrary can produce objects of a desired type, whose keys are strings and whose values are produced by other arbitraries.

It can be beneficial to have a fully-deterministic test suite which always succeeds or fails the same way every time it is run. Fast-check's arbitraries use a seeded random number generator, so while the generated values are "random" in the sense that they do not follow an obvious pattern, providing a seed can ensure that they are still deterministic and repeatable.

## Large numbers of test runs

As stated previously, a property should hold for all valid input values. It is not generally possible to test every single value, so property-based testing libraries sample a very large number of inputs. The higher the number of inputs sampled, the more confidence we can have that the property always holds. Fast-check will sample 100 inputs per test by default. This value is configurable globally and per-test.

In order to ensure good coverage of the possibility space fast-check will produce a range of different sizes of inputs. Numbers will be both small and large, arrays will be both short and long, etc.

## Counterexample shrinking

Tests are most useful if they both detect failures and help developers to diagnose the root cause of the failure. When fast-check detects a failed test it will provide the developer with a "counterexample" showing an input in which the test failed. Fast-check will attempt to make sure this counterexample is as small as possible. For example, if the test failed when given an array, fast-check will try removing elements and check whether the test still fails. As a result a failure caused by an array with dozens of elements may result in the developer being shown a failing input with only 2 or 3 items. This makes it much easier to diagnose and debug the root cause of failures, and is a major differentiator between property-based testing libraries like fast-check and more naive approaches to random input generation.

# Next steps

To see how fast-check puts these concepts into action, check out the [getting started](/docs/introduction/getting-started) section of this guide. For a deeper discussion of the motivations behind property-based testing, check out our page on [why property based testing](/docs/introduction/why-property-based).