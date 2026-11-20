import * as fc from 'fast-check';

const property = fc.asyncProperty(fc.integer(), async (value) => Number.isInteger(value));
await fc.assert(property, { timeout: 500 });
