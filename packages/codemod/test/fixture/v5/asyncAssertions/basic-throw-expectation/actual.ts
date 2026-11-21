import * as fc from 'fast-check';

expect(() => fc.assert(fc.property(fc.integer(), () => false))).toThrow('failed');
