import * as fc from 'fast-check';

fc.assert(fc.property(fc.integer(), Number.isInteger).beforeEach((previous) => previous()));
