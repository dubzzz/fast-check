import * as fc from 'fast-check';

declare function close(): Promise<void>;
fc.installGlobalPlugin(fc.afterEach(async () => {
  await close();
}));
