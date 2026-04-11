---
sidebar_position: 0
slug: /core-blocks/
description: The three reference building blocks of fast-check — arbitraries, properties, and runners — and how they fit together into a single test.
---

# Core Blocks

Every fast-check test, however elaborate, is built from the same three pieces:

1. **Arbitraries** describe *what values to generate*. They pair a random generator with a shrinker so that failing inputs collapse back to readable counterexamples.
2. **Properties** describe *what must hold* for those values. A property takes one or more arbitraries and a predicate, and asserts `∀ inputs, predicate(inputs)`.
3. **Runners** describe *how to execute* the property: how many runs, with what seed, how to report failures, whether to throw or return details.

The pipeline always flows in that order — arbitraries feed properties, properties are handed to runners — and each section of this reference follows the same order. The children below are the reference pages for each block: start with [Properties](/docs/core-blocks/properties/) if you have never written one, jump to [Arbitraries](/docs/core-blocks/arbitraries/) when you need the right generator, and come back to [Runners](/docs/core-blocks/runners/) when you need to tune execution.

:::tip Reference, not tutorial
The Core Blocks pages are the exhaustive reference. If you are looking for a guided, hands-on walkthrough instead, start with the [Quick Start tutorial](/docs/tutorials/quick-start/basic-setup/).
:::

```mdx-code-block
import DocCardList from '@theme/DocCardList';

<DocCardList />
```
