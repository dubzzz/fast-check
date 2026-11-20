import * as fc from 'fast-check';

let count = 0;
fc.configureGlobal({
  beforeEach: () => {
    count = 1;
  },
});
fc.assert(
  fc
    .property(fc.nat(), (n) => n + count >= 0)
    .beforeEach(() => {
      count = 2;
    }),
);
