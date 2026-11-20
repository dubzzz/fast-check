import * as fc from 'fast-check';
fc.assert(prop);
fc.configureGlobal({
  numRuns: 5
});
fc.installGlobalPlugin(fc.timeout(123));
const shared = { seed: 3, unbiased: true };
fc.assert(prop, shared);
fc.check(prop, shared);
