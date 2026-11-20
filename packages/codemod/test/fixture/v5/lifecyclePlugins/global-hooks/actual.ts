import fc from 'fast-check';
fc.configureGlobal({
  numRuns: 10,
  beforeEach: () => {
    init();
  },
  asyncAfterEach: async () => {
    await cleanup();
  },
});
