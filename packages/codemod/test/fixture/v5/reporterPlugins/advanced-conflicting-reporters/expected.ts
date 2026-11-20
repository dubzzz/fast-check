import * as fc from 'fast-check';

const property = fc.property(fc.integer(), Number.isInteger);
// Two reporter options are present. Choose which completion callback should handle the result.
await fc.assert(property, { reporter: (details) => console.log(details.failed), asyncReporter: async () => {} });
