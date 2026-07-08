---
sidebar_position: 3
slug: /configuration/
description: Tune fast-check — seeds, number of runs, entry sizes, timeouts, reports — per assertion or globally, with clear precedence rules.
---

# Configuration

fast-check works out of the box, but everything it does is configurable: the number of runs per property, the seed that makes a failure reproducible, how large generated values can grow, how long a run can take and how results are reported.

There are two levels at which you can set any of these knobs and knowing how they interact is the single most useful thing on this page:

- **Per assertion** — pass a `Parameters` object as the second argument to `fc.assert(property, { ... })`. This wins over everything else and applies only to that one call.
- **Globally** — call [`fc.configureGlobal({ ... })`](/docs/configuration/global-settings/) once, typically in a test setup file, to apply defaults to every assertion in the process.

The per-assertion form always overrides the global one, so a common pattern is to pin conservative defaults globally (e.g. tighter timeouts in CI) and widen them locally for the few tests that need more runs, larger input or a specific seed.

```mdx-code-block
import DocCardList from '@theme/DocCardList';

<DocCardList />
```
