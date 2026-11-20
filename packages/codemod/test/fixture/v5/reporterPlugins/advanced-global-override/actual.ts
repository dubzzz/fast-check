import * as fc from 'fast-check';

const property = fc.property(fc.integer(), Number.isInteger);
fc.configureGlobal({ reporter: (details) => console.log(details.failed) });
await fc.assert(property, { reporter: (details) => console.log(details.numRuns) });
