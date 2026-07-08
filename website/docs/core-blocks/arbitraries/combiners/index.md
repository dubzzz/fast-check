---
sidebar_position: 3
slug: /core-blocks/arbitraries/combiners/
description: Transform and compose existing arbitraries — pick among them, constrain them, tie them together recursively or promote plain values into generators.
---

# Combiners

Combiners are the only arbitraries in fast-check that do not generate anything on their own. They take one or more existing arbitraries as input and return a new one. They are the functional glue that lets a handful of primitives and composites cover the full space of values a real codebase cares about.

You will reach for a combiner whenever you want to:

- **promote plain values** into the arbitrary world (`constant`, `constantFrom`),
- **choose between alternatives** (`oneof`, `option`),
- **tie arbitraries together recursively** (`letrec`) to generate trees, ASTs or JSON-like structures,
- **refine or transform** an existing arbitrary with `.filter`, `.map`, `.chain`, or adjust its shrinking with `noShrink` / `limitShrink`.

Because every combiner wraps another arbitrary, shrinking composes too: the combiner preserves (or deliberately limits) the shrink behaviour of the arbitrary it wraps, so a counterexample through `oneof(...).map(...)` still collapses toward the simple values defined by the innermost primitive.

```mdx-code-block
import DocCardList from '@theme/DocCardList';

<DocCardList />
```
