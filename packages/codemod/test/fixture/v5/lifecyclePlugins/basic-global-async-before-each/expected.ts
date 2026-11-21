import * as fc from 'fast-check';

declare function reset(): Promise<void>;
fc.installGlobalPlugin(fc.beforeEach(async () => {
  await reset();
}));
