import * as fc from 'fast-check';

fc.configureGlobal({
  numRuns: 10
});
fc.installGlobalPlugin(fc.timeout(500));
