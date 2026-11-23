import * as fc from 'fast-check';

const myProp = fc.asyncProperty(fc.nat(), () => true);
await fc.assert(myProp);
