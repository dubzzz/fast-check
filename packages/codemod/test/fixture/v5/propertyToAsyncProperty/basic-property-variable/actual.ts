import * as fc from 'fast-check';

const myProp = fc.property(fc.nat(), () => true);
fc.assert(myProp);
