import * as fc from 'fast-check';

const property = fc.property(fc.integer(), Number.isInteger);
await fc.assert(property, { includeErrorInReport: false });
