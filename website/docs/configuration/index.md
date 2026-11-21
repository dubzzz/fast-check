---
sidebar_position: 3
slug: /configuration/
description: Tune fast-check — seeds, number of runs, entry sizes, timeouts, reports — per assertion or globally, with clear precedence rules.
---

# Configuration

fast-check works out of the box, but everything it does is configurable: the number of runs per property, the seed that makes a failure reproducible, how large generated values can grow, how long a run can take and how results are reported.

Runner parameters and plugins have different rules for sharing configuration:

- **Parameters** — pass a `Parameters` object to a runner, or use [`fc.configureGlobal({ ... })`](/docs/configuration/global-settings/) to set defaults. Local parameters override the corresponding global defaults. For example, a local `numRuns` or `seed` replaces the global value.
- **Plugins** — pass plugins through the runner's `plugins` option, or install them with [`fc.installGlobalPlugin(...)`](/docs/core-blocks/plugins/#installing-plugins-globally). Global and local plugins are combined, in order; a local plugin does not replace a global one.

For example, adding `fc.timeout(10_000)` locally does not relax a globally installed `fc.timeout(1_000)`: both limits apply. Use `noGlobalPlugins: true` when a run must opt out of global plugins, then explicitly supply the plugins it still needs. This disables all global plugins for that run, not just its time limits.

Default plugins are controlled separately by `noDefaultPlugins`. See [plugin ordering and isolation](/docs/core-blocks/plugins/#installing-plugins-globally) for the full rules. These rules apply to `assert`, `sample` and `statistics`.

```mdx-code-block
import DocCardList from '@theme/DocCardList';

<DocCardList />
```
