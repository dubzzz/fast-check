import * as fc from 'fast-check';

let label = '';
fc.assert(
  fc
    .property(fc.integer(), Number.isInteger)
    .afterEach(() => {
      label += '1';
    })
    .afterEach((prev) => {
      label += '2';
      prev();
    }),
);
