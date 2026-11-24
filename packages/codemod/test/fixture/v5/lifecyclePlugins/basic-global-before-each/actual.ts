import * as fc from 'fast-check';

let count = 0;
fc.configureGlobal({
  beforeEach: () => {
    count = 0;
  },
});
