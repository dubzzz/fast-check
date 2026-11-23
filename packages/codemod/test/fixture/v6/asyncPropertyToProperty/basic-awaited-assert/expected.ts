import * as fc from 'fast-check';

await fc.assert(fc.property(fc.nat(), async () => true));
