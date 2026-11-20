import * as fc from 'fast-check';
const disabled = { unbiased: false };
fc.assert(prop, disabled);
const defaults = { timeout: 123, numRuns: 5 };
fc.configureGlobal(defaults);
const shared = { seed: 3, unbiased: true };
fc.assert(prop, shared);
fc.check(prop, shared);
