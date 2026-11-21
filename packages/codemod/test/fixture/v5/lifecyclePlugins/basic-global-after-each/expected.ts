import * as fc from 'fast-check';

const seen: number[] = [];
fc.installGlobalPlugin(fc.afterEach(() => {
  seen.length = 0;
}));
