import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig } from 'vitest/config';

// Wires the two fast-check builds compared by arbitrary.bench.ts:
//   - fast-check-current: the build under test (this PR / your working copy)
//   - fast-check-main    : the baseline published for main
// Both are resolved as packages living under packages/fast-check/node_modules, so
// they are externalised by vitest and Node resolves their (external) pure-rand
// subpath imports against the copy already installed there.
//
// Both builds are mandatory: a missing one fails the run rather than reporting
// half a comparison.
//
// Local usage:
//   pnpm --filter fast-check build                  # build your working copy
//   npm pack https://pkg.pr.new/dubzzz/fast-check@main --pack-destination packages/fast-check/node_modules
//   mkdir -p packages/fast-check/node_modules/fast-check-main
//   tar -xf packages/fast-check/node_modules/fast-check-main.tgz \
//       -C packages/fast-check/node_modules/fast-check-main --strip-components=1
//   pnpm bench

const here = import.meta.dirname;
const fastCheckModules = join(here, '..', 'packages', 'fast-check', 'node_modules');

const currentDir = process.env.FAST_CHECK_CURRENT_DIR ?? join(fastCheckModules, 'fast-check');
const mainDir = process.env.FAST_CHECK_MAIN_DIR ?? join(fastCheckModules, 'fast-check-main');

if (!existsSync(join(currentDir, 'lib', 'fast-check.js'))) {
  throw new Error(
    `Could not find the build under test at ${currentDir}. Build it first: pnpm --filter fast-check build`,
  );
}
if (!existsSync(join(mainDir, 'lib', 'fast-check.js'))) {
  throw new Error(
    `Could not find the main baseline at ${mainDir}. Provide it via pkg.pr.new locally (see this file's header) ` +
      `or set FAST_CHECK_MAIN_DIR to its package directory.`,
  );
}

export default defineConfig({
  test: {
    root: here,
    benchmark: {
      include: ['*.bench.ts'],
    },
  },
  resolve: {
    alias: {
      'fast-check-current': currentDir,
      'fast-check-main': mainDir,
    },
  },
});
