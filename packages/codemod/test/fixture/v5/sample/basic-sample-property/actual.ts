import * as fc from 'fast-check';

const values = fc.sample(fc.property(fc.nat(), () => false));
