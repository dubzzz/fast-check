import * as fc from 'fast-check';

const property = fc.asyncProperty(fc.integer(), async (value) => Number.isInteger(value));
await fc.assert(property, {
  noDefaultPlugins: true,

  plugins: [fc.interruptAfterTimeLimit(30), fc.timeout(100), () => ({
    onAllRunsComplete: details => {
      if (details.interrupted && !details.failed) {
        details = {
          ...details,
          failed: true,
          interrupted: true
        };
      }

      return console.log(details.failed);
    }
  })]
});
