import * as fc from 'fast-check';

await fc.assert(fc.asyncProperty(arb, predicate));
