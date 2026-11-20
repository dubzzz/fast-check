import * as fc from 'fast-check';
fc.assert(prop, { timeout: 500, seed: 42, ignoreEqualValues: true, plugins: [other], unbiased: true });
fc.check(prop, { markInterruptAsFailure: true, interruptAfterTimeLimit: 20, skipEqualValues: true });
fc.assert(prop, { skipEqualValues: enabled });
fc.check(prop, { ignoreEqualValues: false, unbiased: false });
fc.assert(prop, {});
fc.check(prop, { seed: 42, unbiased: false });
fc.assert(prop, { timeout: limit });
fc.assert(prop, { timeout: 4000000000 });
