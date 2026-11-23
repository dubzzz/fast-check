import * as fc from 'fast-check';

await fc.assert(fc.asyncProperty(fc.nat(), async () => true));
