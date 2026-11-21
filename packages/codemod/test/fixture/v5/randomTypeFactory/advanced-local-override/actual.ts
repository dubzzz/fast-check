import * as fc from 'fast-check';

fc.configureGlobal({ randomType: 'mersenne' });
fc.assert(fc.property(fc.integer(), Number.isInteger), { randomType: 'xorshift128plus' });
