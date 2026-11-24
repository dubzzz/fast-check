import * as fc from 'fast-check';

declare function close(): Promise<void>;
fc.configureGlobal({
  asyncAfterEach: async () => {
    await close();
  },
});
