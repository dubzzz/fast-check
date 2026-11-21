import * as fc from 'fast-check';

const property = fc.asyncProperty(fc.integer(), async (value) => Number.isInteger(value));
// On v4 the interrupt plugin can throw before this reporter receives the failed RunDetails.
await fc.assert(property, {
  interruptAfterTimeLimit: 30,
  markInterruptAsFailure: true,
  reporter: (details) => console.log(details.failed),
});
