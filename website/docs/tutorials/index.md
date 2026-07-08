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

## Which tutorial is right for me?

Pick the one that matches where you are today:

- 🚀 **New to fast-check** → [Quick Start](/docs/tutorials/quick-start/basic-setup/)
- 🧰 **Integrating with an existing test runner** → [Setting up your Test Environment](/docs/tutorials/setting-up-your-test-environment/)
- 🏎️ **Chasing bugs that only appear under concurrency** → [Detect race conditions](/docs/tutorials/detect-race-conditions/)

## All tutorials

```mdx-code-block
import DocCardList from '@theme/DocCardList';

<DocCardList />
```

## Looking for something more specific?

These tutorials are intentionally focused. Once you are comfortable with the basics, the rest of the documentation is organized to help you go further:

- [**Core Blocks**](/docs/core-blocks/properties/) — the reference for properties, runners and arbitraries.
- [**Configuration**](/docs/configuration/user-definable-values/) — fine-tune fast-check to match your project's constraints.
- [**Advanced**](/docs/advanced/model-based-testing/) — model-based testing, race conditions in depth, and more.
- [**API Reference**](/docs/api/) — the exhaustive list of every exported symbol.
