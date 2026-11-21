import * as fc from 'fast-check';

const seen: number[] = [];
fc.configureGlobal({
  afterEach: () => {
    seen.length = 0;
  },
});
