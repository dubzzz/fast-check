import * as fc from 'fast-check';
fc.configureGlobal({ timeout: 50 });
fc.check(prop, { timeout: 200 });
fc.assert(prop, { ...opts, unbiased: true });
fc.assert(prop, { markInterruptAsFailure: true });
fc.assert(prop, { skipAllAfterTimeLimit: 200, timeout: 5 });
fc.assert(prop, { plugins, skipEqualValues: true });
fc.assert(prop, { reporter, asyncReporter, includeErrorInReport: true });
other.check(prop, { unbiased: true });
