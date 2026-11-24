import * as fc from 'fast-check';

declare function save(failed: boolean): Promise<void>;
const property = fc.asyncProperty(fc.integer(), async (n) => Number.isInteger(n));
await fc.assert(property, {
  noDefaultPlugins: true,
  plugins: [() => ({
    onAllRunsComplete: async (details) => {
      await save(details.failed);
    }
  })],
});
