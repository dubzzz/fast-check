# @fast-check/codemod

Codemods to help migrate fast-check projects.

```sh
npx @fast-check/codemod@latest v5/defaultImport <path/to/folder>
```

Commit your changes before running a codemod, then review the diff. A path can be a file or a directory. Directories are processed recursively for JavaScript and TypeScript files (`js`, `jsx`, `ts`, `tsx`, `mjs`, `cjs`, `mts`, `cts`), excluding `node_modules` and `.git`.

Additional options are passed to [jscodeshift](https://github.com/facebook/jscodeshift). To preview changes without writing files:

```sh
npx @fast-check/codemod@latest v5/defaultImport <path/to/folder> --dry --print
```

## v5/defaultImport

Replace default imports from `fast-check` with namespace imports for v5, keeping the local name and its usages:

```diff
-import fc from 'fast-check';
+import * as fc from 'fast-check';
 fc.sample(fc.integer());
```

Type-only default imports remain type-only:

```diff
-import type fc from 'fast-check';
+import type * as fc from 'fast-check';
 type Arbitrary = fc.Arbitrary<number>;
```

Mixed imports are split into separate declarations, preserving named imports and their aliases:

```diff
-import fc, { integer as int, type Arbitrary } from 'fast-check';
+import * as fc from 'fast-check';
+import { integer as int, type Arbitrary } from 'fast-check';
```

The transform also handles named default imports (`import { default as fc }`), including type-only forms (`import type { default as fc }` and `import { type default as fc }`). Existing namespace imports, named imports other than `default`, imports from other modules, comments, and strings are preserved. Running the codemod again leaves the result unchanged.

This transform handles ES import declarations. CommonJS `require`, dynamic imports, and re-exports are not migrated. Imports with attributes (`with { ... }`) are left unchanged because the printer does not yet support them.

## Development

The CLI, transform, and tests are written in TypeScript. Tests run the source CLI directly with Node.js 22.18+; no build is needed. From the repository root:

```sh
pnpm --filter @fast-check/codemod typecheck
pnpm test --run --project @fast-check/codemod
node packages/codemod/src/cli.ts v5/defaultImport <path> --dry --print
```

The E2E cases live in `test/fixture/<version>/<codemod>/<name>/{actual,expected}.ts`, starting with `v5/defaultImport`. The shared `test/fixtures.spec.ts` discovers the directories and uses one `describe.each` named `Codemod <version>/<codemod>`, with an `it.each` for cases.

Each codemod suite has its own `beforeAll`, which copies inputs into `.test-artifacts/<version>/<codemod>/once/<name>.ts` and runs the codemod on that directory. It then copies the migrated files into the adjacent `twice/` directory and runs the codemod there again. Each test uses `toMatchFileSnapshot` to compare the first migration with its `expected.ts` and compares both migrated files directly to verify `migrate(actual) = migrate(migrate(actual))`, even when updating snapshots. Setup and teardown only clean that suite's `.test-artifacts/<version>/<codemod>/` directory, preserving other versions and codemods. Each suite uses `afterAll` so cleanup also runs if setup fails before it could return a teardown function.

Fixtures are source text to migrate, so they are excluded from typechecking and linting. `actual.ts` files are formatted normally; `expected.ts` files are excluded from formatting to preserve the exact expected output. To add a case, add an `actual.ts` in a new fixture directory. Create or update the expected files with:

```sh
pnpm test --run --project @fast-check/codemod test/fixtures.spec.ts -u
```

Review the resulting changes to `expected.ts` before committing them.

For publication, `pnpm --filter @fast-check/codemod build` uses the shared Rolldown configuration to compile the CLI and transforms listed in `package.json` exports into `lib/`, preserving their paths. The package uses `type: module` and publishes only ESM.
