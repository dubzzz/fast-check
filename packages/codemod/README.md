# @fast-check/codemod

Codemods to help migrate fast-check projects.

```sh
npx @fast-check/codemod@latest v5/no-asyncProperty <path/to/folder>
```

Commit your changes before running a codemod, then review the diff. A path can be a file or a directory. Directories are processed recursively for JavaScript and TypeScript files (`js`, `jsx`, `ts`, `tsx`, `mjs`, `cjs`, `mts`, `cts`), excluding `node_modules` and `.git`.

Additional options are passed to [jscodeshift](https://github.com/facebook/jscodeshift). To preview changes without writing files:

```sh
npx @fast-check/codemod@latest v5/no-asyncProperty <path/to/folder> --dry --print
```

## v5/no-asyncProperty

In fast-check v5, `property` replaces `asyncProperty` and accepts async predicates.

```diff
 import fc from 'fast-check';
-await fc.assert(fc.asyncProperty(fc.integer(), async (n) => n === n));
+await fc.assert(fc.property(fc.integer(), async (n) => n === n));
```

The transform supports default, namespace (`import * as fc`), and named imports from `fast-check`:

```diff
-import { assert, asyncProperty } from 'fast-check';
-await assert(asyncProperty(arb, async (value) => check(value)));
+import { assert, property } from 'fast-check';
+await assert(property(arb, async (value) => check(value)));
```

Named import aliases are preserved. If renaming an unaliased import would collide with an existing `property`, it becomes `import { property as asyncProperty }` and keeps its local references. Shadowed variables, unrelated imports, comments, and strings are left alone. The async predicate and surrounding `await` are preserved.

This first transform handles ES imports. CommonJS `require`, re-exports from `fast-check`, destructuring from the namespace, and dynamically computed member names are not migrated.

## Development

The CLI, transform, and tests are written in TypeScript. Rolldown compiles the CLI and transform into `lib/` for publication. From the repository root:

```sh
pnpm --filter @fast-check/codemod build
pnpm --filter @fast-check/codemod typecheck
pnpm test --run --project @fast-check/codemod
node packages/codemod/lib/cli.cjs v5/no-asyncProperty <path> --dry --print
```

Tests compare input/output strings, check repeat runs, and build and run the compiled CLI against temporary files and directories.
