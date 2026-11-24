import * as fc from 'fast-check';

const property = fc.property(fc.integer(), Number.isInteger);
const shared = { unbiased: false };
fc.assert(property, shared);
fc.check(property, shared);
