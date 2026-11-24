import * as fc from 'fast-check';

let label = '';
fc.assert(
  fc
    .property(fc.integer(), Number.isInteger)
    .beforeEach(() => {
      label += '1';
    })
    .beforeEach((prev) => {
      prev();
      label += '2';
    }),
);
