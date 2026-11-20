import fc from 'fast-check';
fc.configureGlobal({
  numRuns: 20
});

if (enabled === true) {
  fc.installGlobalPlugin(fc.skipEqualValues());
}

fc.installGlobalPlugin(fc.timeout(100));
