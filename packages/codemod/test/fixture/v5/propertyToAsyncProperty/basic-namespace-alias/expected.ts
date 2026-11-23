import * as fc2 from 'fast-check';

await fc2.assert(fc2.asyncProperty(fc2.nat(), (n) => true));
