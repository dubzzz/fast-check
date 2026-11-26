import * as fc from 'fast-check';

const property = fc.asyncProperty(fc.nat(), async () => false);
const out = fc.check(property);
console.log(out.failed);
