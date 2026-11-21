import * as fc from 'fast-check';

const property = fc.asyncProperty(fc.nat(), async () => false);
const details = await fc.check(property);
if (details.failed) console.log(details.counterexample);
