import * as fc from 'fast-check';

const property = fc.property(fc.integer(), Number.isInteger);
// The configurable defaultReporter factory is a v5 API. Keep the v4 formatting option.
await fc.assert(property, { includeErrorInReport: true });
