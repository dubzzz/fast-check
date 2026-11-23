import * as fc from 'fast-check';

fc.sample(fc.property(fc.nat(), () => true));
