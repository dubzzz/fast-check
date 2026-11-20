import * as fc from 'fast-check';

fc.configureGlobal({
  ...fc.readConfigureGlobal(),
  numRuns: 20
});
fc.installGlobalPlugin(fc.timeout(10));
