import fc from 'fast-check';
fc.configureGlobal({
  numRuns: 10
});

fc.installGlobalPlugin(fc.beforeEach(() => {
  init();
}));

fc.installGlobalPlugin(fc.afterEach(async () => {
  await cleanup();
}));
