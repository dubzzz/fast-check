import * as fc from 'fast-check';

const property = fc.property(fc.integer(), Number.isInteger);
// Installing this reporter globally would also run it on the locally overridden assertion.
fc.configureGlobal({ reporter: (details) => console.log(details.failed) });
// In v4 this reporter supersedes the global reporter.
await fc.assert(property, { reporter: (details) => console.log(details.numRuns) });
