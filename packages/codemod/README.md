# @fast-check/codemod

Codemods to help migrate fast-check projects.

```sh
npx @fast-check/codemod@latest v5/asyncProperty <path/to/folder>
```

Commit your changes before running a codemod, then review the diff. A path can be a file or a directory. Directories are processed recursively for JavaScript and TypeScript files (`js`, `jsx`, `ts`, `tsx`, `mjs`, `cjs`, `mts`, `cts`), excluding `node_modules` and `.git`.

Additional options are passed to [jscodeshift](https://github.com/facebook/jscodeshift). To preview changes without writing files:

```sh
npx @fast-check/codemod@latest v5/asyncProperty <path/to/folder> --dry --print
```

## v5/asyncProperty

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

The CLI, transform, and tests are written in TypeScript. Tests run the source CLI directly with Node.js 22.18+; no build is needed. From the repository root:

```sh
pnpm --filter @fast-check/codemod typecheck
pnpm test --run --project @fast-check/codemod
node packages/codemod/src/cli.ts v5/asyncProperty <path> --dry --print
```

The E2E cases live in `test/fixture/<version>/<codemod>/<name>/{actual,expected}.ts`, starting with `v5/asyncProperty`. The shared `test/fixtures.spec.ts` discovers the directories and nests a `describe.each` for versions, a `describe.each` for codemods, and an `it.each` for cases.

One shared `beforeAll` copies inputs into `.test-artifacts/<version>/<codemod>/<name>.ts` and runs each codemod on its directory. Tests compare each transformed file with its `expected.ts` and check that a second run is idempotent. A shared `afterAll` removes the artifacts directory when the suite finishes, including when a test fails.

Fixtures are source text to migrate, so they are excluded from typechecking, linting, and formatting. To add a case, add a new fixture directory with the two files.

For publication, `pnpm --filter @fast-check/codemod build` uses Rolldown to compile the CLI and transform into `lib/`.
