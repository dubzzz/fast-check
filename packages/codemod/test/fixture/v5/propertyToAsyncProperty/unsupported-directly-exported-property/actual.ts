import * as fc from 'fast-check';

export const myProp = fc.property(fc.nat(), () => true);
