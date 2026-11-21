import * as fc from 'fast-check';

const property = fc.asyncProperty(fc.integer(), async () => false);
await fc.assert(property, {
  timeout: 100,
  asyncReporter: async (details) => {
    await record(details.failed);
  },
});
