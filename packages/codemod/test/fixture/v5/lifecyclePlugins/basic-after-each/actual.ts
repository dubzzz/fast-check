import * as fc from 'fast-check';

const seen: number[] = [];
fc.check(
  fc
    .property(fc.integer(), (n) => {
      seen.push(n);
    })
    .afterEach(() => {
      seen.length = 0;
    }),
);
