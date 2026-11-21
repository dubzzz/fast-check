import * as fc from 'fast-check';

const property = fc.asyncProperty(fc.integer(), async () => false);
await fc.assert(property, {
  noDefaultPlugins: true,
  plugins: [fc.timeout(100), () => ({
    onAllRunsComplete: async (details) => {
      await record(details.failed);
    }
  })],
});
