---
sidebar_position: 2
slug: /introduction/why-property-based
---

# Why Property Based?

Understand the benefits and strengths of property based tests.

## Testing today

The tests we are used to write today can mostly be gathered under the name: example based tests. They are explicitely specifying the inputs and the outputs we want to use and observe.

### Unit, Integration and E2E

All the layers of tests we currently use leverage it. Unit tests are explicitely hardcoding the values they pass as inputs of the functions under tests and the ones they expect to be returned. Same thing applies for integration and end-to-end tests. In e2e tests, we generally hardcode the inputs but also the scenario we want to cover and in a certain way the outputs of a function are replaced by what we expect to see on the screen.

In other words, most of our tests depends on very specific sets of entries and expect very specific outcomes.

### Limitations

The problem with our current way to test softwares is that the responsability to pinpoint bugs is the one of the developpers writing the tests. They have to think about all the things that may go wrong if they want their tests to find all the bugs. But while thinking about the classical cases of failures is feasible with enough experience, thinking about all the possible edge cases in not really feasible except by proving the code line by line.

##
