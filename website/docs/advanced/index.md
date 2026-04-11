---
sidebar_position: 0
slug: /advanced/
description: Techniques that go beyond a single property — model-based testing, race conditions, fuzzing loops, and realistic fake data generation.
---

# Advanced

The pages in this section assume you are already comfortable writing a property and running it with `fc.assert`. They show what happens when you want fast-check to do more than check a single invariant on a single call.

Each page solves a different class of problem that cannot be expressed cleanly as a one-shot property:

- **Model-based testing** — when the system under test has *state*, and a bug only shows up after a specific sequence of operations. You describe the legal operations as commands and let fast-check search the space of sequences.
- **Race conditions** — when the bug is not in *what* your async code does but in *which order* its callbacks resolve. fast-check's scheduler lets you deterministically explore those interleavings.
- **Fuzzing** — when you want to keep hunting for counterexamples across runs or beyond the default budget, turning fast-check into a continuous fuzz loop rather than a CI gate.
- **Fake data** — when you need large volumes of realistic-looking values outside the property-test context, for seeding environments or staging datasets.

:::tip Want a hands-on walkthrough on race conditions?
[Race conditions](/docs/advanced/race-conditions/) is the reference. If you would rather learn by writing a failing test step by step, the [Detect race conditions tutorial](/docs/tutorials/detect-race-conditions/) covers the same ground interactively.
:::

```mdx-code-block
import DocCardList from '@theme/DocCardList';

<DocCardList />
```
