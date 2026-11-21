import * as fc from 'fast-check';

const property = fc.asyncProperty(fc.integer(), async (value) => Number.isInteger(value));
await fc.check(property, {
  plugins: [fc.interruptAfterTimeLimit(30)]
});
