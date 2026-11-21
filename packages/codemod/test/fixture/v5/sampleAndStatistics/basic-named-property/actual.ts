import * as fc from 'fast-check';

const property = fc.property(fc.nat(), () => false);
const values = fc.sample(property);
