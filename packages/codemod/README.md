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

<p id="minimum-fast-check-version">

**(1)** Versions shown as `≥x.y.z` indicate the minimum `fast-check` version required to apply the transform. For example, `≥1.0.0` requires `fast-check` 1.0.0 or later.

</p>
