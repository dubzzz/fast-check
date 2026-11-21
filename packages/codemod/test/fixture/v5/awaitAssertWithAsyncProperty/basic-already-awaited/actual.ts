import * as fc from 'fast-check';

await fc.assert(fc.property(arb, predicate));
