import * as fc from 'fast-check';

const property = fc.property(fc.integer(), Number.isInteger);
await fc.assert(property, {
  timeout: 100,

  plugins: [fc.unbiased(), () => ({
    onAllRunsComplete: function(details) {
      console.log(details.failed);
    }
  })],

  noDefaultPlugins: true
});
