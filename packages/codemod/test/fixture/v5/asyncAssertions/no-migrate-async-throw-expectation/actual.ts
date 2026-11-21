import * as fc from 'fast-check';

expect(() => fc.assert(fc.property(fc.nat(), async () => false))).toThrow();
