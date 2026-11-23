# `@fast-check/codemod`

![fast-check logo](https://fast-check.dev/assets/images/logo.png)

Codemods to help upgrade projects using `fast-check`.

## Getting Started

Requires Node.js 20.19.0 or later. Run a transform on a file or directory:

```sh
npx @fast-check/codemod@latest <transform> <path>
```

Add `--dry --print` to preview changes without writing files. Commit your work before running a codemod, then review the diff.

Patterns that require manual migration are left unchanged and reported with their file, line, column and an explanation. These warnings do not fail the codemod.

## Transforms

### Migrate to v5

<details><summary><code>v5/awaitAssert</code> (≥1.0.0)<sup><a href="#minimum-fast-check-version">(1)</a></sup> — Awaits fast-check assertions</summary>

```diff
-fc.assert(prop);
+await fc.assert(prop);
```

</details>

<details><summary><code>v5/defaultImport</code> (≥1.0.0) — Replaces default imports with namespace imports. Also handles `import type`</summary>

Example:

```diff
-import fc from 'fast-check';
+import * as fc from 'fast-check';
```

</details>

<details><summary><code>v5/randomMethods</code> (≥1.0.0) — Migrates removed Random methods to bounded nextInt calls</summary>

```diff
-rng.nextBoolean();
+rng.nextInt(0, 1) === 1;
```

Applies to direct calls on a variable or parameter annotated as fast-check’s `Random`. Handles `next(bits)`, `nextInt()`, `nextBoolean()` and `nextDouble()`. The double uses the same two draws in the same order.

</details>

<details><summary><code>v5/stringUnit</code> (≥3.23.0) — Migrates Unicode flags on object and JSON arbitraries</summary>

```diff
-fc.object({ withUnicodeString: true });
+fc.object({ stringUnit: 'binary' });
```

Applies to inline boolean flags on `object`, `anything`, `json` and `jsonValue`. When the options already include `stringUnit`, the transform drops the redundant literal flag. On 3.23.0, switching to the binary unit preserves the Unicode character range but can change which string a seed generates.

</details>

<details><summary><code>v5/randomTypeFactory</code> (≥4.6.0) — Imports pure-rand v8 generator factories</summary>

```diff
-fc.configureGlobal({ randomType: 'congruential' });
+fc.configureGlobal({ randomType: congruential32 });
```

Requires a direct dependency on `pure-rand` v8.

</details>

<details><summary><code>v5/awaitAssertWithAsyncProperty</code> (≥4.11.0 and <5.0.0) — Awaits assertions with inline async properties</summary>

```diff
-fc.assert(fc.property(arb, predicate));
+await fc.assert(fc.asyncProperty(arb, predicate));
```

</details>

<details><summary><code>v5/propertyToAsyncProperty</code> (≥4.11.0) — Renames property to asyncProperty</summary>

**What is doing this codemod?**

This codemod is changing all references to `property` into references to `asyncProperty`. While doing that it converts any synchrounous assertion linked to `property` into an asynchrounous one.

**When to use it?**

The best moment to use it is right before moving to `^5.0.0`. We recommend running it while still in `4.x` from `4.11.0` or later.

**Example of code change:**

```diff
--test('my property', () => {
--  fc.assert(fc.property(arb, predicate));
++test('my property', async () => {
++  await fc.assert(fc.asyncProperty(arb, predicate));
  });
```

</details>

<details><summary><code>v5/asyncProperty</code> (≥5.0.0) — Renames asyncProperty to property</summary>

```diff
-fc.assert(fc.asyncProperty(arb, predicate));
+fc.assert(fc.property(arb, predicate));
```

</details>

<details><summary><code>v5/checkToAssert</code> (≥5.0.0) — Preserves RunDetails when migrating check to assert</summary>

```diff
-const details = fc.check(property);
+const details = await assertAndGetRunDetails(property);
 if (details.failed) console.log(details.counterexample);
```

Both synchronous and awaited checks use the generated helper. It captures `RunDetails` with `onAllRunsComplete` and sets `noDefaultPlugins: true` so a failing run still returns its details.

</details>

<p id="minimum-fast-check-version">

**(1)** Versions shown as `≥x.y.z` indicate the minimum `fast-check` version required to apply the transform. For example, `≥1.0.0` requires `fast-check` 1.0.0 or later.

</p>
