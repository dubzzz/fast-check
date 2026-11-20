import * as fc from 'fast-check';

const property = fc.property(fc.integer(), Number.isInteger);
await fc.assert(property, {
  timeout: 100,
  plugins: [fc.unbiased()],
  reporter(details) {
    console.log(details.failed);
  },
});
