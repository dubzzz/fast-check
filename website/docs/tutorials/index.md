---
sidebar_position: 5
slug: /tutorials/
description: Hands-on tutorials to learn Property-Based Testing with fast-check — from your very first test to detecting real-world race conditions.
---

# Tutorials

Hands-on guides to become productive with fast-check, whether you are writing your first property-based test or tackling advanced topics like race conditions.

## Why follow a tutorial?

Reading the reference documentation tells you _what_ fast-check can do. Following a tutorial teaches you _how_ to apply it to real code. Each tutorial in this section:

- starts from a runnable project you can clone locally,
- walks you through a concrete problem step by step,
- highlights the fast-check features that matter most for that scenario,
- ends with takeaways you can immediately bring back to your own codebase.

:::tip New to Property-Based Testing?
If the concept itself is new, start by reading [What is Property-Based Testing?](/docs/introduction/what-is-property-based-testing/) and [Why Property-Based?](/docs/introduction/why-property-based/) before diving in.
:::

## Learning paths

Pick the path that matches where you are today.

### 🚀 I'm completely new to fast-check

Start with the **Quick Start** tutorial. In just three short pages you will bootstrap a project, write your first property, and learn how to read the reports produced when a property fails.

1. [Basic Setup](/docs/tutorials/quick-start/basic-setup/) — clone a ready-to-run project and get the tests running.
2. [Our first Property-Based Test](/docs/tutorials/quick-start/our-first-property-based-test/) — rewrite a classic example-based test into a property.
3. [Read test reports](/docs/tutorials/quick-start/read-test-reports/) — understand shrinking, seeds, and counterexamples.

### 🧰 I want to plug fast-check into my existing test runner

Head to [Setting up your Test Environment](/docs/tutorials/setting-up-your-test-environment/). fast-check is runner-agnostic, but each ecosystem has its own idioms. You will find dedicated guides for:

- [Jest](/docs/tutorials/setting-up-your-test-environment/property-based-testing-with-jest/)
- [Bun test runner](/docs/tutorials/setting-up-your-test-environment/property-based-testing-with-bun-test-runner/)
- [Deno test runner](/docs/tutorials/setting-up-your-test-environment/property-based-testing-with-deno-test-runner/)
- [Node.js built-in test runner](/docs/tutorials/setting-up-your-test-environment/property-based-testing-with-nodejs-test-runner/)

### 🏎️ I want to hunt bugs that only show up under concurrency

Race conditions are notoriously hard to test with traditional techniques. The [Detect race conditions](/docs/tutorials/detect-race-conditions/) tutorial shows how fast-check can surface them reliably. You will build up — one puzzle at a time — the reflexes needed to catch ordering bugs in asynchronous code.

## What's inside?

| Tutorial | You will learn | Good for |
| --- | --- | --- |
| [Quick Start](/docs/tutorials/quick-start/basic-setup/) | Writing your first property, understanding shrinking and seeds | Absolute beginners |
| [Setting up your Test Environment](/docs/tutorials/setting-up-your-test-environment/) | Integrating fast-check with Jest, Bun, Deno or Node.js built-in test runner | Developers adopting fast-check in an existing project |
| [Detect race conditions](/docs/tutorials/detect-race-conditions/) | Modeling concurrent scenarios and finding ordering bugs | Developers working on async-heavy code |

## Looking for something more specific?

These tutorials are intentionally focused. Once you are comfortable with the basics, the rest of the documentation is organized to help you go further:

- [**Core Blocks**](/docs/core-blocks/properties/) — the reference for properties, runners and arbitraries.
- [**Configuration**](/docs/configuration/user-definable-values/) — fine-tune fast-check to match your project's constraints.
- [**Advanced**](/docs/advanced/model-based-testing/) — model-based testing, race conditions in depth, and more.
- [**API Reference**](https://fast-check.dev/api-reference/index.html) — the exhaustive list of every exported symbol.

:::info Got feedback or a tutorial idea?
Tutorials improve when real users tell us what's missing. If a step is unclear, or you'd love to see a tutorial on a topic we don't cover yet, please [open an issue](https://github.com/dubzzz/fast-check/issues) or start a discussion on the repository. Contributions are very welcome! 💙
:::
