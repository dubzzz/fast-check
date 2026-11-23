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

<details><summary><code>v5/defaultImport</code> (≥1.0.0)<sup><a href="#minimum-fast-check-version">(1)</a></sup> — Replaces default imports with namespace imports</summary>

**What is doing this codemod?**

This codemod replaces default imports from `fast-check` with namespace imports. It also handles `import type` and preserves any named imports in a separate declaration.

**Example of code change:**

```diff
-import fc from 'fast-check';
+import * as fc from 'fast-check';
```

</details>

<details><summary><code>v5/randomMethods</code> (≥1.0.0) — Migrates removed Random methods to bounded nextInt calls</summary>

**What is doing this codemod?**

This codemod replaces calls to `next(bits)`, `nextInt()`, `nextBoolean()` and `nextDouble()` with expressions using bounded `nextInt` calls. These methods have been dropped in `5.x`.

**Example of code change:**

```diff
-rng.nextBoolean();
+rng.nextInt(0, 1) === 1;
```

</details>

<details><summary><code>v5/stringUnit</code> (≥3.23.0) — Migrates Unicode flags on object and JSON arbitraries</summary>

**What is doing this codemod?**

This codemod replaces inline boolean `withUnicodeString` and `noUnicodeString` flags on `object`, `anything`, `json` and `jsonValue` with the corresponding `stringUnit` option. When the options already include `stringUnit`, it drops the redundant literal flag.

**Example of code change:**

```diff
-fc.object({ withUnicodeString: true });
+fc.object({ stringUnit: 'binary' });
```

</details>

<details><summary><code>v5/randomTypeFactory</code> (≥4.6.0) — Imports pure-rand v8 generator factories</summary>

**What is doing this codemod?**

This codemod updates how you customize the random generator used by fast-check, either for an individual call or through global configuration. It replaces predefined string names passed as `randomType` with their corresponding generator factories imported from `pure-rand` v8.

**Example of code change:**

```diff
+import { congruential32 } from 'pure-rand/generator/congruential32';

-fc.configureGlobal({ randomType: 'congruential' });
+fc.configureGlobal({ randomType: congruential32 });
```

</details>

<details><summary><code>v5/propertyToAsyncProperty</code> (≥4.11.0) — Renames property to asyncProperty</summary>

**What is doing this codemod?**

This codemod is changing all references to `property` into references to `asyncProperty`. While doing that it converts any synchrounous assertion linked to `property` into an asynchrounous one.

**Example of code change:**

```diff
-test('my property', () => {
-  fc.assert(fc.property(arb, predicate));
+test('my property', async () => {
+  await fc.assert(fc.asyncProperty(arb, predicate));
  });
```

</details>

<details><summary><code>v5/checkToAssert</code> (≥5.0.0) — Preserves RunDetails when migrating check to assert</summary>

**What is doing this codemod?**

This codemod replaces `check` calls with `assert` calls using `noDefaultPlugins: true`. It preserves access to `RunDetails` by adding a helper that captures them through a plugin’s `onAllRunsComplete` hook.

Assumes fast-check v5 after `v5/propertyToAsyncProperty`, where `check` always returns a promise. Synchronous or uncertain usages are left unchanged with a warning.

**Example of code change:**

```diff
-const details = await fc.check(property);
+const details = await assertAndGetRunDetails(property);
 if (details.failed) console.log(details.counterexample);
```

</details>

### Migrate to v6

Version 6 is still not planned, that said some deprecation notice have already been put in place and some codemod can help you to apply patches to clean them.

<details><summary><code>v6/asyncPropertyToProperty</code> (≥5.0.0) — Renames asyncProperty to property</summary>

**What is doing this codemod?**

This codemod replaces references to the deprecated `asyncProperty` with `property`. Since v5, `property` supports both synchronous and asynchronous predicates and `asyncProperty` is simply an alias for it.

**Example of code change:**

```diff
-await fc.assert(fc.asyncProperty(arb, predicate));
+await fc.assert(fc.property(arb, predicate));
```

</details>

<p id="minimum-fast-check-version">

**(1)** Versions shown as `≥x.y.z` indicate the minimum `fast-check` version required to apply the transform. For example, `≥1.0.0` requires `fast-check` 1.0.0 or later.

</p>
