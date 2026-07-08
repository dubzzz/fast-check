---
sidebar_position: 1
slug: /core-blocks/arbitraries/primitives/
description: The base arbitraries fast-check builds every other generator on — strings, numbers, booleans, dates and bigints, with their canonical shrink targets.
---

# Primitives

Primitive arbitraries are the only arbitraries in fast-check that do not depend on another one. Everything else — composites, combiners, fake data — is eventually wired back to a primitive, which makes the rules on this page the foundation of how the whole library behaves.

Two things are worth knowing before you open any child page:

- **Constraints stay local.** Each primitive exposes its own constraints (ranges for numbers, allowed characters for strings, bounds for dates…). When a more complex arbitrary is built on top, it inherits whatever constraints you put here — so the narrower you make a primitive, the narrower every downstream value becomes.
- **Shrinking converges to canonical "simple" values.** When a test fails, fast-check shrinks each primitive toward a well-known minimum: `0` for numbers, `''` for strings, `false` for booleans, the Unix epoch for dates, `0n` for bigints. Every counterexample you read in the terminal is the product of that convergence, so it pays to recognise these anchors on sight.

```mdx-code-block
import DocCardList from '@theme/DocCardList';

<DocCardList />
```
