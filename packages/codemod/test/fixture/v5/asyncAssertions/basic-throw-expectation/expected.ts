import * as fc from 'fast-check';

await expect(fc.assert(fc.property(fc.integer(), () => false))).rejects.toThrow('failed');
