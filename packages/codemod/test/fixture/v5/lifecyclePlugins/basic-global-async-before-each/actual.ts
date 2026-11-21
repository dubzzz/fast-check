import * as fc from 'fast-check';

declare function reset(): Promise<void>;
fc.configureGlobal({
  asyncBeforeEach: async () => {
    await reset();
  },
});
