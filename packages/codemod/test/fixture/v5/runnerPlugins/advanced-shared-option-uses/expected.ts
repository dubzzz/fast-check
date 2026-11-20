import * as fc from 'fast-check';

const property = fc.property(fc.integer(), Number.isInteger);
fc.assert(property);
fc.check(property);

const inspected = { unbiased: true };
fc.assert(property, inspected);
fc.check(property, inspected);
console.log(inspected.unbiased);
