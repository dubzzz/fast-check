import * as fc from 'fast-check';

const userArb = fc.asyncProperty(fc.nat(), async () => false);
const values = fc.sample(userArb);
