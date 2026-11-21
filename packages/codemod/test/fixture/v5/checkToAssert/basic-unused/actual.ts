import * as fc from 'fast-check';

fc.check(fc.property(fc.nat(), () => false));
