import * as fc from 'fast-check';

const myProp = fc.property(fc.nat(), () => true);
export { myProp };
