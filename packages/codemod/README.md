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

<details><summary><code>v5/runnerPlugins &lt;path&gt; --reporters-only</code> (≥5.0.0) — Migrates error reporting</summary>

```diff
-fc.assert(property, { reporter: (details) => collect(details) });
+fc.assert(property, {
+  noDefaultPlugins: true,
+  plugins: [() => ({ onAllRunsComplete: (details) => collect(details) })],
+});
```

Handles `reporter`, `asyncReporter` and `includeErrorInReport` on `assert` and one-time `configureGlobal` setup.
A custom reporter can accept a failing property. The transform disables default reporting so that decision takes effect.
For `includeErrorInReport`, it installs a configured `defaultReporter`. Global reporters use the `post` position.
Review mixed reporting policies, global overrides in other files, and reporters that consume removed v4 formatting helpers.
This pass targets v5 and leaves execution options for the default v4 pass. The legacy `check` runner never called reporters.

</details>

<details><summary><code>v5/runnerPlugins</code> (≥4.10.0) — Moves runner options into plugins</summary>

```diff
-fc.assert(property, { timeout: 500, skipEqualValues: true });
+fc.assert(property, { plugins: [fc.skipEqualValues(), fc.timeout(500)] });
-fc.check(property, { unbiased: false });
+fc.check(property);
-fc.configureGlobal({ numRuns: 20, ignoreEqualValues: true });
+fc.configureGlobal({ numRuns: 20 });
+fc.installGlobalPlugin(fc.ignoreEqualValues());
```

Also handles `interruptAfterTimeLimit` and its `markInterruptAsFailure` flag. Use ≥4.10.2 for the interrupt plugin's timer fix.
For v4 `check`, global setup and assertions with a custom reporter, the transform also keeps an enabled `markInterruptAsFailure` so callers still receive failed run details on interruption. Revisit that flag with the v5 reporting migration.
The transform handles inline option objects, single-use constants with literal values, and one-time top-level global setup. Review shared or spread options manually.
Global plugin installs accumulate across calls and survive `resetConfigureGlobal()`; check for overrides in other files.
On v4, global plugins apply to `assert` and `check`; migrate any `unbiased` dependency in `sample` or `statistics` separately.
`skipAllAfterTimeLimit` has no equivalent plugin.

</details>

<p id="minimum-fast-check-version">

**(1)** Versions shown as `≥x.y.z` indicate the minimum `fast-check` version required to apply the transform. For example, `≥1.0.0` requires `fast-check` 1.0.0 or later.

</p>
