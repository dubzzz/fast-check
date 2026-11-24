import * as fc from 'fast-check';

const property = fc.property(fc.integer(), Number.isInteger);
await fc.assert(property, {
  plugins: [fc.unbiased(), fc.timeout(100), () => ({
    onAllRunsComplete: function(details) {
      console.log(details.failed);
    }
  })],
  noDefaultPlugins: true,
});
