# `@fast-check/codemod`

![fast-check logo](https://fast-check.dev/assets/images/logo.png)

Codemods to help upgrade projects using `fast-check`.

## Getting Started

Requires Node.js 20.19.0 or later. Run a transform on a file or directory:

```sh
npx @fast-check/codemod@latest v5/defaultImport <path>
```

Add `--dry --print` to preview changes without writing files. Commit your work before running a codemod, then review the diff.

## Transforms

### v5

These transforms help prepare your code for fast-check v5. Each lists the earliest fast-check version it can be used with, so you can apply it before upgrading when possible.

#### `v5/defaultImport`

**Can be used with fast-check 1.0.0 and later**, including any 1.x, 2.x, 3.x or 4.x release.

Replaces default imports with namespace imports. Also handles `import type` and defaults combined with named imports.

<details>
<summary>Migration example</summary>

```diff
-import fc from 'fast-check';
+import * as fc from 'fast-check';
```

</details>
