import * as fc from 'fast-check';
fc.configureGlobal({
  ...fc.readConfigureGlobal()
});
fc.installGlobalPlugin(fc.timeout(10));
