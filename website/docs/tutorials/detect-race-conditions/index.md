---
sidebar_position: 2
slug: /tutorials/detect-race-conditions/
description: What's the plan for this tutorial?
---

# Detect race conditions

Learn how to detect race conditions in your code through clear and instructive examples

:::tip Already familiar with race conditions?
Skip the definitions and jump straight to the hands-on part.

➡️ **Start with [step 1: your first race condition test](/docs/tutorials/detect-race-conditions/your-first-race-condition-test/)** 🚀
:::

## Tutorial structure

This tutorial aims to equip you with techniques to write tests that can detect race conditions. To achieve this, it will cover specific algorithms and introduce helpful concepts and tools related to fast-check and its race condition detection mechanisms. By the end of this tutorial, you will be able to apply these techniques and tools to your own tests.

Throughout this tutorial, the examples have been crafted to ensure that tests pass initially on the code being tested. Your objective will be to make the tests fail by implementing the suggested changes. Each section will introduce new concepts and provide the necessary information to apply these learnings to code beyond the scope of this tutorial. Each page will come with its own puzzle.

```mdx-code-block
import DocCardList from '@theme/DocCardList';

<DocCardList />
```

## Definition of a race condition

:::info Let's align our understanding of the concept
While this section is fully optional, it has the benefit to make sure that we all align on the definition of race condition throughout this tutorial.
:::

Taking the Wikipedia definition: _"A race condition […] is the condition […] where the system's substantive behavior is dependent on the sequence or timing of other uncontrollable events."_ (source: https://en.wikipedia.org/wiki/Race_condition). This definition highlights two main reasons why race conditions are prevalent in JavaScript:

- sequence of events,
- events being out-of-control.

Consider a front-end application where a user types into a text field. User will focus and emit several keypress events. In addition, if the text field is connected to a backend API, it will receive updates over time. As none of these events are under our control, we may face race conditions. Indeed, we cannot predict when the user will type or what they will type, nor when our APIs will respond.

JavaScript, being event-based by nature, is prone to race conditions when asynchronous operations or events are used. Despite the language being single-threaded, it does not prevent the occurrence of race conditions.

:::note New to property-based testing?
This tutorial will introduce the scheduler-specific bits as we go, but if the concepts of "arbitraries" and "properties" are completely new to you, a 5-minute detour through [What is property-based testing?](/docs/introduction/what-is-property-based-testing/) will make the rest much easier to follow.
:::

## Race condition explained through an example

To help grasp the concept of a race condition, let's look at a real-world example involving an autocomplete field. As previously discussed, the unpredictable events occurring in the autocomplete field can trigger a race condition. As an example, in the animated image below, we can see that while the user is typing, outdated suggestions appear and disappear in a flickering manner. It makes it difficult for the user to select any option before the input stabilizes. The suggestions seem to appear out of order, causing confusion and frustration for the user.

![Dancing autocomplete field](@site/static/img/tutorials/autocomplete-bug.gif)

Even worse, if we wait long enough, the autocomplete field may stabilize itself but on a past result. This means that the suggestions being displayed do not match the current query, leading to confusion and a poor user experience.

![Inconsistent results in autocomplete field](@site/static/img/tutorials/autocomplete-bug-screenshot.png)

To zoom in on what happened, we can summarize the issue with the help of this small diagram:

![Autocomplete race explained](@site/static/img/tutorials/autocomplete-race-explained.png)

In other words, the issue occurred as the user performed two searches subsequently: one for 'London' followed immediately by one for 'Paris'. However, the response for 'Paris' (the second request) came back before the response for 'London' (the first request), and our component did not handle it properly. This delay in responses is expected from an API perspective. There could be multiple reasons for this behavior, such as queries not being routed to the same servers with one server being heavily utilized and resulting in longer response times.

As we have seen in this simple example, race conditions are easy to create, as they only require two concurrent events, and can cause significant problems from a user's perspective. It is worth noting that the example we took for this section was only a visual glitch, but race conditions can have much more critical impacts than just a wrong display.

:::info Could you write a test that catches this bug?
That is exactly what you will learn in the next five steps. We'll start from a test that passes — despite the buggy code under test — and, step by step, turn it into a property that fast-check can break. Every time a page ends with "Your turn!", your job is to make the test fail.
:::

:::tip How to solve them?
This tutorial is designed to guide you in adding tests to your codebase, ensuring the absence of race condition issues in the future. It will not directly focus on giving you keys to solve them. For more in-depth information on solving race conditions and useful techniques for identifying them outside of tests, refer to the article ["Handling API request race conditions in React" by Sébastien Lorber](https://sebastienlorber.com/handling-api-request-race-conditions-in-react). Once you're done with the tutorial, the [advanced race-conditions reference](/docs/advanced/race-conditions/) gives you the full map of what the scheduler can do.
:::
