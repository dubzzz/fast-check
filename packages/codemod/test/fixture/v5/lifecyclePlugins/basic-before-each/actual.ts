import * as fc from 'fast-check';

let count = 0;
fc.assert(
  fc
    .property(fc.nat(), (n) => count + n >= 0)
    .beforeEach(() => {
      count = 0;
    }),
);
