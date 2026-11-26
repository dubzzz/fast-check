import * as fc from 'fast-check';

const assertAndGetRunDetails = 'reserved';
const assertAndGetRunDetailsSync = 'reserved';
console.log(assertAndGetRunDetails, assertAndGetRunDetailsSync);
const property = fc.property(fc.nat(), (n) => n < 100);
const { failed } = fc.check(property);
console.log(failed);
await fc.check(property);
