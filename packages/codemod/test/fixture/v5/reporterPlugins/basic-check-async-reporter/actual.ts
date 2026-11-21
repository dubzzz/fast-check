import * as fc from 'fast-check';

const property = fc.asyncProperty(fc.integer(), async () => true);
await fc.check(property, { seed: 42, asyncReporter: async () => {} });
