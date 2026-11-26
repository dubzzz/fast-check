import * as fc from 'fast-check';

const property = fc.property(fc.nat(), (n) => n < 100);
const out = fc.check(property);
if (out.failed) console.log(out.counterexample);
const details = await fc.check(property);
if (details.failed) console.log(details.counterexample);
