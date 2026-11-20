# `@fast-check/codemod`

![fast-check logo](https://fast-check.dev/assets/images/logo.png)

Codemods to help upgrade projects using `fast-check`.

## Getting Started

Requires Node.js 20.19.0 or later. Run a transform on a file or directory:

```sh
npx @fast-check/codemod@latest <transform> <path>
```

Add `--dry --print` to preview changes without writing files. Commit your work before running a codemod, then review the diff.

## Transforms

### Migrate to v5

<details><summary><code>v5/defaultImport</code> (≥1.0.0)<sup><a href="#minimum-fast-check-version">(1)</a></sup> — Replaces default imports with namespace imports. Also handles `import type`</summary>

Example:

```diff
-import fc from 'fast-check';
+import * as fc from 'fast-check';
```

</details>

<details><summary><code>v5/runnerPlugins</code> (≥4.10.0) — Moves runner options into plugins</summary>

```diff
-fc.assert(property, { timeout: 500 });
+fc.assert(property, { plugins: [fc.timeout(500)] });
-fc.check(property, { unbiased: false });
+fc.check(property);
-fc.configureGlobal({ numRuns: 20, ignoreEqualValues: true });
+fc.configureGlobal({ numRuns: 20 });
+fc.installGlobalPlugin(fc.ignoreEqualValues());
```

Also handles `interruptAfterTimeLimit` and its `markInterruptAsFailure` flag. Use ≥4.10.2 for the interrupt plugin's timer fix.
For v4 `check`, global setup and assertions with a custom reporter, the transform also keeps an enabled `markInterruptAsFailure` so callers still receive failed run details on interruption. Revisit that flag with the v5 reporting migration.
Literal options shared only by local `assert` and `check` calls can be migrated once at their declaration. Options that escape to other consumers need manual review. In one-time global setup, a call that only re-applies `readConfigureGlobal()` drops out after its options move to plugins.
Global plugin installs accumulate across calls and survive `resetConfigureGlobal()`; check for overrides in other files.
On v4, global plugins apply to `assert` and `check`; migrate any `unbiased` dependency in `sample` or `statistics` separately.
`skipAllAfterTimeLimit` has no equivalent plugin.

</details>

<details><summary><code>v5/lifecyclePlugins</code> (≥4.10.0) — Moves property hooks into runner plugins</summary>

```diff
-fc.assert(fc.property(arb, predicate).beforeEach(() => { reset(); }));
+fc.assert(fc.property(arb, predicate), { plugins: [fc.beforeEach(() => { reset(); })] });
-fc.configureGlobal({ asyncAfterEach: async () => { await cleanUp(); } });
+fc.installGlobalPlugin(fc.afterEach(async () => { await cleanUp(); }));
```

Handles local `beforeEach` and `afterEach` on inline property builders or a single-use property declared immediately before its runner.
It also handles one-time global hook setup. Hooks stay outside migrated runner timeouts. Review repeated hooks, callbacks that call a previous hook, and opaque local callbacks manually. Check across files for local hooks that used to override global hooks.

</details>

<p id="minimum-fast-check-version">

**(1)** Versions shown as `≥x.y.z` indicate the minimum `fast-check` version required to apply the transform. For example, `≥1.0.0` requires `fast-check` 1.0.0 or later.

</p>
