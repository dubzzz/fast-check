// @ts-check
import fc from 'fast-check';
import { propertyFor } from '@fast-check/worker';
import { writeFileSync } from 'node:fs';

const property = propertyFor(new URL(import.meta.url));

writeFileSync('/workspaces/fast-check/debug.log', `-----\n`, { flag: 'a' });
writeFileSync('/workspaces/fast-check/debug.log', `[${process.pid}] Predicate execution for: passing (on mount)\n`, { flag: 'a' });
export const passingProperty = property(
  fc.integer({ min: -1000, max: 1000 }),
  fc.integer({ min: -1000, max: 1000 }),
  (from, to) => {
    writeFileSync('/workspaces/fast-check/debug.log', `[${process.pid}] Predicate execution for: passing\n`, { flag: 'a' });
    for (let i = from; i <= to; ++i) {
      // Loop from "from" to "to" ALWAYS finite
    }
  },
);
