import fc from 'fast-check';

await fc.assert(fc.property(fc.integer(), async () => true));
