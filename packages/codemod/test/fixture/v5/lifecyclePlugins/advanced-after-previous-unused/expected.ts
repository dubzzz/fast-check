import * as fc from 'fast-check';

let label = '';
fc.assert(fc
  .property(fc.integer(), Number.isInteger), {
  plugins: [fc.afterEach(() => {
      label += '2';
    })]
});
