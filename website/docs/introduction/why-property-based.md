---
sidebar_position: 3
slug: /introduction/why-property-based/
---

# Why Property-Based Testing?

Learn about the benefits and advantages of property-based testing. If you have never encountered property-based testing before, it is best to start with the definitions in [What is Property-Based Testing?](/docs/introduction/what-is-property-based-testing).

## Testing today

The tests that we typically write today can be classified as example-based tests. They explicitly specify the inputs and outputs we want to use and observe.

### Unit, Integration and E2E

All layers of tests that we use today leverage this approach. Unit tests hardcode the values they pass as inputs to the functions under tests, as well as the expected return values. The same is true for integration and end-to-end tests. In end-to-end tests, we generally hardcode both the inputs and the scenarios we want to cover. In a certain sense, the expected outputs of a function are replaced by what we expect to see on the screen.

### Limitations

A major problem with our current approach to testing software is that it places the responsibility of identifying bugs solely on the developers writing the tests. They must think about all the things that could go wrong if they want their tests to find all potential bugs. While this is a skill which can be developed with experience, it requires careful analysis of the code under test and even seasoned developers can miss edge cases.

Additionally, when reading example-based testing suites it is easy to "not see the forest through all of the trees". Such suites often list out a number of input/output pairs, but can make it hard to understand the big picture of how the software should behave by reading the tests alone. This compounds the difficulty of ensuring that all edge cases have been properly covered.

## The property-based alternative

Removing the burden of specifying specific examples for tests provides a number of benefits.

### Better detection of edge cases

By generating random inputs and applying them to the code being tested, property-based testing can help identify edge cases and potential issues that may not have been considered with example-based tests. This approach is particularly useful when dealing with complex or hard-to-reach code paths that may not be exercised with traditional testing methods. It also proves useful to detect unexpected issues and edge cases linked to very specific sets of inputs.

### Designed for bugs

The aim of property-based testing is not to generate random data for its own sake, but specifically to generate data which finds bugs. Property-based testing frameworks are designed to detect common problems with a higher probability. 

For example, say that a function takes an array of numbers as an argument. A common source of real-world bugs is when such functions expect their inputs to not contain duplicates, but don't contain the proper checks for this. To address these bugs fast-check will ensure that tests which depend on arrays will receive some arrays with duplicate values and some without them.

It's common for numerical code to have edge cases around the values `0`, `1`, or `-1`, or when handling unexpectedly large inputs. For this reason, fast-check numerical arbitraries ensure coverage of values close to the edges of their valid ranges, as well as values spread throughout their range.

fast-check even supports detecting some security vulnerabilities, such as by including the potentially dangerous string `__proto__` when generating objects. This has successfully detected CVEs in open source projects; see the [track record](/docs/introduction/track-record/) for more details.

This is not a complete list; the takeaway is that property-based testing libraries are more than just naive value generators, and can be tailored to detecting common real-world mistakes without imposing additional difficulty on the developers who are writing the tests.

### Designed for users

Property-based is not only about randomizing inputs to find bugs; it's also about helping users to find and to fix the errors. Counterexample shrinking is an essential component in this, and is unique to property-based testing frameworks. Debugging a bad input that is hundreds of lines long can be nightmarish so fast-check works to drop unnecessary noise from any inputs which cause failures. The result is generally small counterexamples which either make the failure obvious or which can be easily copied into a normal example-based test and debugged as usual.

### Document the code

Another benefit of property-based testing is that it can help to document the behavior of your code in a high-level way. For example, when testing a sorting algorithm, you can use property-based tests to specify all the invariants that users can expect from the algorithm, such as the resulting array having the same values as the source array and being sorted in ascending order.

By writing property-based tests, you capture the essence of what the code should do.

### Improve maintainability

It's commonly accepted that a thorough example-based unit test suite encourages developers to make more modular and maintainable code, and that code which is hard to unit test is usually also hard to maintain and reuse. In this way unit testing is about more than just catching bugs: it also promotes a healthy codebase.

Similarly, a thorough suite of property-based tests encourages developers to write crisp abstractions whose behavior is easy to clearly describe. Trying to write a property-based test for a piece of code can sometimes reveal that the code itself is trying to do too many things or that it has unnecessary edge cases. Codebases which adopt property-based testing often find that the test suites push developers towards more comprehensible designs.

## Non-tradeoffs

Property-based testing does not require throwing out the knowledge, tools, and best practices that developers already have around testing. This section addresses some common misconceptions about property-based testing.

### Hybrid approaches

Although property-based testing is a powerful technique, it should not be viewed as a substitute for traditional example-based testing. Instead, it should be used in conjunction with example-based testing as a complementary approach. Property-based testing is capable of detecting different types of bugs and can document things in a different way, making it a valuable addition to the testing process.

### Reproducibility

A common objection to property-based or random testing is that test suites should be deterministic, in order to prevent flaky tests. Property-based testing with fast-check can be made fully deterministic by setting a constant `seed` value in the [fast-check global config](/docs/configuration/global-settings/). With this configuration all tests are launched with a precise seed, so you will get the same set of values every time.

Even without setting a global seed, fast-check provides a seed for failed tests. This seed can be provided as an argument to `fc.assert` during debugging, making it easy to reproduce errors.

### Full compatibility with existing tools

Fast-check does not sit in opposition to well-established testing frameworks like Jest, Vitest, Mocha or Jasmine. It is a tool which can be used in conjunction with them. Property-based tests are defined inside of these frameworks' test blocks, and are run like any other tests in these frameworks. This means that fast-check can be added incrementally to existing codebases without needing to rewrite or migrate existing tests.

## Alternatives

There are alternative approaches to generating random inputs for tests, but they have downsides when compared to a full property-based library.

### Fake data

Fake data generators mostly consist of generating realistic data to demonstrate a tool or product. Although they can be used in testing, they have some limitations:

- Frequently not reproducible, although some tools provide a way of hard-coding a test seed.
- Not tailored for detecting bugs. These libraries do not generally aim to cover common edge cases in their outputs. They also don't generally have a mechanism for covering the possibility space by generating a range of output sizes.
- Not designed for debugging. Without support for counterexample shrinking, fully random data generations will produce large error values which are hard to use.

Fake data generators are a great tool for certain use cases, but they are not as effective as property-based tests for producing a reliable and maintainable test suite. It is reasonable to use both approaches in the areas where they shine the best.

### Fuzzing

Fuzzing is the idea of firing lots of randomly generated values onto an algorithm to find bugs. In a way, it's not that far from property-based testing and can even be considered a sub-case of it. Fuzzing techniques mostly involve:

- Running tests repeatedly
- Asserting that the code never crashes

Both of these can be achieved with property-based testing.
