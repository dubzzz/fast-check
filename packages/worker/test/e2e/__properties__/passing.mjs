// @ts-check
import fc from 'fast-check';
import { propertyFor } from '@fast-check/worker';
import { writeFileSync } from 'fs';
import * as process from 'process';

// new w.Worker(new URL('file:///workspaces/fast-check/packages/worker/test/e2e/__properties__/passing.mjs'))
// Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'fast-check' imported from /workspaces/fast-check/packages/worker/test/e2e/__properties__/passing.mjs
//     at packageResolve (node:internal/modules/esm/resolve:844:9)
//     at moduleResolve (node:internal/modules/esm/resolve:901:20)
//     at defaultResolve (node:internal/modules/esm/resolve:1121:11)
//     at ModuleLoader.defaultResolve (node:internal/modules/esm/loader:396:12)
//     at ModuleLoader.resolve (node:internal/modules/esm/loader:365:25)
//     at ModuleLoader.getModuleJob (node:internal/modules/esm/loader:240:38)
//     at ModuleWrap.<anonymous> (node:internal/modules/esm/module_job:85:39)
//     at link (node:internal/modules/esm/module_job:84:36)

const property = propertyFor(new URL(import.meta.url));
writeFileSync('/workspaces/fast-check/debug.log', `[${process.pid}] predicate (url=${new URL(import.meta.url)})\n`, {
  flag: 'a',
});

export const passingProperty = property(
  fc.integer({ min: -1000, max: 1000 }),
  fc.integer({ min: -1000, max: 1000 }),
  (from, to) => {
    writeFileSync('/workspaces/fast-check/debug.log', `[${process.pid}] from: ${from}, to: ${to} -> START\n`, {
      flag: 'a',
    });
    for (let i = from; i <= to; ++i) {
      // Loop from "from" to "to" ALWAYS finite
    }
    writeFileSync('/workspaces/fast-check/debug.log', `[${process.pid}] from: ${from}, to: ${to} -> END\n`, {
      flag: 'a',
    });
  },
);
