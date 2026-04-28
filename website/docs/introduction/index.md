---
sidebar_position: 1
slug: /introduction/
description: Start here — what property-based testing is, why fast-check exists, who already trusts it and how to install it in your project.
---

# Introduction

fast-check is the property-based testing library for JavaScript and TypeScript. Instead of asking you to hand-pick the inputs your tests run on, it generates them for you, runs your assertion over hundreds of cases and shrinks failures down to the smallest inputs that still reproduces them.

This section is the why of fast-check, not the how. Four pages, each answering a question a newcomer usually asks in order:

- **What is property-based testing?** The core idea, contrasted with the example-based tests you already write.
- **Why property-based?** The concrete bugs this approach surfaces that example-based tests miss.
- **Track record.** Real projects and bugs that property-based testing and fast-check specifically have caught.
- **Getting started.** Installing fast-check and running your first property in your existing test runner.

:::tip Prefer learning by doing?
If you would rather skip the theory and open an editor, head straight to the [Quick Start tutorial](/docs/tutorials/quick-start/basic-setup/). It walks you through a runnable project step by step. Come back here whenever you want the background.
:::

```mdx-code-block
import DocCardList from '@theme/DocCardList';

<DocCardList />
```
