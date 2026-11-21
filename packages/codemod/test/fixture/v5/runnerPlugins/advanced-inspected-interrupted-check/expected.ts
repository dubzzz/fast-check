import * as fc from 'fast-check';

const property = fc.asyncProperty(fc.integer(), async (value) => Number.isInteger(value));
const details = await fc.check(property, { markInterruptAsFailure: true, plugins: [fc.interruptAfterTimeLimit(30)] });
console.log(details.failed);
