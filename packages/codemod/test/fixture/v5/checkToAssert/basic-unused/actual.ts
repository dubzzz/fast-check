import * as fc from 'fast-check';

await fc.check(fc.property(fc.nat(), () => false));
