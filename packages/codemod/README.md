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

<details><summary><code>v5/randomMethods</code> (≥1.0.0) — Migrates removed Random methods to bounded nextInt calls</summary>

```diff
-rng.nextBoolean();
+rng.nextInt(0, 1) === 1;
```

Applies to direct calls on a variable or parameter annotated as fast-check’s `Random`. Handles `next(bits)`, `nextInt()`, `nextBoolean()` and `nextDouble()`. The double uses the same two draws in the same order.

</details>

<details><summary><code>v5/defaultImport</code> (≥1.0.0)<sup><a href="#minimum-fast-check-version">(1)</a></sup> — Replaces default imports with namespace imports. Also handles `import type`</summary>

Example:

```diff
-import fc from 'fast-check';
+import * as fc from 'fast-check';
```

</details>

<details><summary><code>v5/stringUnit</code> (≥3.23.0) — Migrates Unicode flags on object and JSON arbitraries</summary>

```diff
-fc.object({ withUnicodeString: true });
+fc.object({ stringUnit: 'binary' });
```

Applies to inline boolean flags on `object`, `anything`, `json` and `jsonValue`. When the options already include `stringUnit`, the transform drops the redundant literal flag. On 3.23.0, switching to the binary unit preserves the Unicode character range but can change which string a seed generates.

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
A local assertion with default reporting moves `markInterruptAsFailure: true` into the plugin as `failOnInterrupt: true`. For v4 `check`, custom reporters and global setup, an enabled flag needs manual migration because the plugin can throw before callers receive failed run details.
Literal options shared only by local `assert` and `check` calls can be migrated once at their declaration. Options that escape to other consumers need manual review. In one-time global setup, a call that only re-applies `readConfigureGlobal()` drops out after its options move to plugins.
Global plugin installs accumulate across calls and survive `resetConfigureGlobal()`; check for overrides in other files.
On v4, global plugins apply to `assert` and `check`; migrate any `unbiased` dependency in `sample` or `statistics` separately.
`skipAllAfterTimeLimit` has no equivalent plugin.

</details>

<p id="minimum-fast-check-version">

**(1)** Versions shown as `≥x.y.z` indicate the minimum `fast-check` version required to apply the transform. For example, `≥1.0.0` requires `fast-check` 1.0.0 or later.

</p>
