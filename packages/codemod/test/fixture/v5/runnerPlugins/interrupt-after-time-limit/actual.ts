import * as fc from 'fast-check';

const property = fc.property(fc.integer(), Number.isInteger);
fc.assert(property, { interruptAfterTimeLimit: 100 });
