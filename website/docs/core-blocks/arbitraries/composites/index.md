---
sidebar_position: 0
slug: /core-blocks/arbitraries/composites/
description: Combine smaller arbitraries into arrays, objects, iterables, functions and typed arrays — with size control and two-dimensional shrinking.
---

# Composites

Composite arbitraries take other arbitraries as input and assemble them into structured values. An `array` is built from an arbitrary for its elements, a `record` is built from arbitraries for each of its fields, and so on — there is no "random structure" to speak of, only a shape you describe and a child arbitrary that fills it.

Two concepts recur on every page in this section and are worth learning once:

- **Size control.** Most composites accept `minLength` / `maxLength` bounds and a `size` modifier that scales how large generated values tend to be in practice (see [`size` explained](/docs/configuration/larger-entries-by-default/#size-explained)). These are the main knobs to keep generation costs under control when your children are themselves expensive.
- **Two-dimensional shrinking.** When a test fails on a composite, fast-check shrinks along two axes independently: the **structure** (it tries shorter arrays, fewer object keys, smaller tuples) *and* the **contents** (each surviving element is shrunk by its own arbitrary). This is why counterexamples on nested data tend to collapse cleanly to the minimal offender rather than to an opaque blob.

```mdx-code-block
import DocCardList from '@theme/DocCardList';

<DocCardList />
```
