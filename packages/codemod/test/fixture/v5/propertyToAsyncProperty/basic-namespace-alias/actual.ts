import * as fc2 from 'fast-check';

fc2.assert(fc2.property(fc2.nat(), (n) => true));
