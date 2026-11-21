import * as fc from 'fast-check';

const property = fc.asyncProperty(fc.integer(), async (value) => Number.isInteger(value));
await fc.assert(property, {
  timeout: 100,
  interruptAfterTimeLimit: 30,
  markInterruptAsFailure: true,
  reporter: (details) => console.log(details.failed),
});
