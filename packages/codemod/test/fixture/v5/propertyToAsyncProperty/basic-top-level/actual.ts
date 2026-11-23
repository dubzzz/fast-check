import * as fc from 'fast-check';

fc.assert(fc.property(fc.nat(), (n) => true));
