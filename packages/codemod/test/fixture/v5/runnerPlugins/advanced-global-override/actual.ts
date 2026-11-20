import * as fc from 'fast-check';

// Installing a global timeout would also affect the assertion that overrides it below.
fc.configureGlobal({ timeout: 50 });
const property = fc.asyncProperty(fc.integer(), async (value) => Number.isInteger(value));
// This local timeout replaces the global timeout in v4.
await fc.assert(property, { timeout: 200 });
