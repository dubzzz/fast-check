import * as fc from 'fast-check';

fc.configureGlobal({ timeout: 50 });
const property = fc.asyncProperty(fc.integer(), async (value) => Number.isInteger(value));
await fc.assert(property, { timeout: 200 });
