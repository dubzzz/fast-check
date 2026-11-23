import * as fc from 'fast-check';

const property = fc.asyncProperty(fc.nat(), async () => false);
const values = fc.sample(property);
