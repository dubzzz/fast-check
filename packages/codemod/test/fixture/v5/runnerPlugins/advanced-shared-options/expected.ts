import * as fc from 'fast-check';

const property = fc.property(fc.integer(), Number.isInteger);
const shared = { seed: 3, plugins: [fc.unbiased()] };
fc.assert(property, shared);
fc.check(property, shared);
