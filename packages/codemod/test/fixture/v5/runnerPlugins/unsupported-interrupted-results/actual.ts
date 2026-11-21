import * as fc from 'fast-check';

const property = fc.asyncProperty(fc.integer(), async (value) => Number.isInteger(value));
// On v4 the interrupt plugin can throw before check returns its failed RunDetails.
await fc.check(property, { interruptAfterTimeLimit: 30, markInterruptAsFailure: true });
