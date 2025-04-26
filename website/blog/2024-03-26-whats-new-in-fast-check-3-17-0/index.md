---
title: What's new in fast-check 3.17.0?
authors: [dubzzz]
tags: [what's new, worker]
---

This release exposes additional details regarding the random generator passed to the property. It unlocks the ability to delegate random value generation in the workers in the context of [`@fast-check/worker`](https://github.com/dubzzz/fast-check/tree/main/packages/worker#readme).

Continue reading to explore the detailed updates it brings.

<!--truncate-->

## Main thread to Workers

### Introduction

The introduction of [`@fast-check/worker`](https://github.com/dubzzz/fast-check/tree/main/packages/worker#readme) marked a significant addition to the fast-check family with the 3.2.0 release. Its primary objective was to offload the execution of predicates to workers, enhancing interruptibility. However, despite this improvement, the parent thread remained responsible for computing inputs for the predicates, which were then transmitted to the workers.

<figure>
![Simplified workflow of an execution before](@site/static/img/blog/2024-03-26-whats-new-in-fast-check-3-17-0--worker-parent-gen.png)
<figurecaption>Simplified workflow of an execution with the main thread responsible for generating the values</figurecaption>
</figure>

### Past limitations

While the previous method served its purpose, it came with several limitations:

- Worker threads were unable to modify instances produced by the parent, restricting the flexibility of the system.
- The communication between parent and worker threads was limited to serializable values, constraining the range of potential inputs.
- The parent thread had to generate all values synchronously, preventing efficient delegation of tasks to workers.

These limitations not only constrained the usage of the library but also hindered its ability to efficiently handle diverse types of generated values. By addressing these shortcomings, we aim to enhance the functionality and usability of it.

### Objective

Our primary objective with [`@fast-check/worker`](https://github.com/dubzzz/fast-check/tree/main/packages/worker#readme) was to broaden its capability to generate a wider range of values, beyond just serializable ones. The key challenge we faced was finding a way to postpone the generation of inputs that would be utilized by the worker to execute the predicate. We aimed to relocate this input generation process to the worker itself. Since the worker possesses full knowledge of the property, including the predicate and the arbitraries, the missing piece for generating inputs within the worker was the random generator. Once obtained, we could simply execute `property.generate(randomGenerator, runId)` to compute the necessary inputs.

### Challenges and Solutions

In other words, our main challenge consists of passing the random number generator to the worker, which posed a hurdle due to its non-serializable nature.

Fortunately, our generators are based on pseudo-random number generators, each containing an internal state consisting of numerical values that can be captured at any point in time. This snapshot of the internal state could then be used to recreate the exact same generator, providing a solution to our problem.

Our generators operate in a pure manner, ensuring that inputs for each run are independent of the number of times the generator has been called in previous runs. This means that regardless of how many times the generator is invoked by the worker, it does not alter the generator needed for subsequent runs. Consequently, each run remains unaffected by the usage history of the generator, maintaining consistency and reliability throughout.

This decoupling allows us to move the generation to the worker as illustrated below:

<figure>
![Simplified workflow of an execution with worker generating values](@site/static/img/blog/2024-03-26-whats-new-in-fast-check-3-17-0--worker-worker-gen.png)
<figurecaption>Simplified workflow of an execution with worker responsible to generate the value</figurecaption>
</figure>

### Development Process

At this point many pieces were missing, but we had a plan:

- [`pure-rand`](https://github.com/dubzzz/pure-rand), the random generator library that we use, does not offer any access to the internal state of the produced generators.
- [`pure-rand`](https://github.com/dubzzz/pure-rand) does not offer any way to recreate a generator based on its internal state.
- `fast-check` does not offer ways to access or tweak internal states of the generators.

So we had to [expose the internal state of the generators from `pure-rand`](https://github.com/dubzzz/pure-rand/pull/694/files), then [allow to rebuild generators based on a snapshot of an internal state](https://github.com/dubzzz/pure-rand/pull/697/files#diff-38663fd81cbb739b8e5b4662fa13ba3b87e6e1b696684d299ba4952fb19dabf2R72-R78) and finally [offer a way to access all of that when generating values in the properties](https://github.com/dubzzz/fast-check/pull/4817/files#diff-b397cccb09a74939f0e82db0729d4393845af816c5b486a7721090c23b8f7359R102-R109).

### Outcome

With all necessary developments in place, we are thrilled to announce the launch of the first version of worker-based generated inputs in [`@fast-check/worker`](https://github.com/dubzzz/fast-check/tree/main/packages/worker#readme) 🚀

## Changelog since 3.16.0

The version 3.17.0 is based on version 3.16.0.

### Features

- ([PR#4817](https://github.com/dubzzz/fast-check/pull/4817)) Expose internal state of the PRNG from `Random`

### Fixes

- ([PR#4781](https://github.com/dubzzz/fast-check/pull/4781)) Doc: Official release note of 3.16.0
- ([PR#4799](https://github.com/dubzzz/fast-check/pull/4799)) Doc: Add more links in the footer
- ([PR#4800](https://github.com/dubzzz/fast-check/pull/4800)) Doc: Better colors for footer and dark mode
