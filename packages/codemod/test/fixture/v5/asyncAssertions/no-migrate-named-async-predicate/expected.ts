import * as fc from 'fast-check';

const predicate = async () => true;
const prop = fc.property(fc.nat(), predicate);
fc.assert(prop);
