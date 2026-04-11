---
sidebar_position: 0
slug: /core-blocks/arbitraries/
description: Every arbitrary in fast-check is a generator paired with a shrinker. This page explains that contract and helps you pick the right family for your test.
---

# Arbitraries

An arbitrary in fast-check is **not just a random value generator**. It is a generator paired with a **shrinker** — a rule that, when a test fails, walks the failing input back toward a simpler, easier-to-read one. Every arbitrary you compose inherits both halves of that contract, which is why a counterexample on a deeply nested object can still collapse to something like `[{ id: 0 }]` instead of a random wall of JSON.

fast-check groups its built-in arbitraries into four families, each with its own rules:

- **Primitives** — strings, numbers, booleans, dates, bigints. The only arbitraries with no upstream dependency; they anchor the shrink targets that every other family converges toward.
- **Composites** — arrays, objects, iterables, functions, typed arrays. Arbitraries you build *out of* other arbitraries to describe structured values.
- **Combiners** — `oneof`, `option`, `letrec`, `.filter`, `.map`, `.chain`, and friends. The functional glue: they take arbitraries as input and return new ones without generating anything themselves.
- **Fake data** — UUIDs, emails, URLs, filenames, and other realistic-shape values for code that branches on format.

A short decision guide: start from a primitive if the value is atomic, a composite if it has a shape you can describe, a combiner when you already have an arbitrary and need to refine it, and fake data only when your code cares about the *format* of a value rather than its raw contents. Anything that does not fit those four buckets lives on the [Others](/docs/core-blocks/arbitraries/others/) page.

```mdx-code-block
import DocCardList from '@theme/DocCardList';

<DocCardList />
```
