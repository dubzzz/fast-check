import * as fc from 'fast-check';

const property = fc.property(fc.integer(), Number.isInteger);
// The callback uses defaultReportMessage, which is removed in v5.
await fc.assert(property, { reporter: (details) => console.log(fc.defaultReportMessage(details)) });
