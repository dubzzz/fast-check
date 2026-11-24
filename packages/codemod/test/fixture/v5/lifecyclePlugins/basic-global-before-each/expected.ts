import * as fc from 'fast-check';

let count = 0;
fc.installGlobalPlugin(fc.beforeEach(() => {
  count = 0;
}));
