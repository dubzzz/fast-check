import * as fc from 'fast-check';

// The replacement plugin does not pass the previous hook to its callback.
fc.assert(fc.property(fc.integer(), Number.isInteger).beforeEach((previous) => previous()));
