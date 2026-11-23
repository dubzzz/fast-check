import fc from 'fast-check';

await fc.assert(fc.asyncProperty(fc.integer(), async () => true));
