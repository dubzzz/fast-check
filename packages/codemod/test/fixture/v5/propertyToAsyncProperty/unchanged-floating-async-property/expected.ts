import * as fc from 'fast-check';

fc.assert(fc.asyncProperty(fc.nat(), (n) => true));
