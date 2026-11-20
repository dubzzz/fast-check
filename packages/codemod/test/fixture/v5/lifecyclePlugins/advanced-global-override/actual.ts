import * as fc from 'fast-check';

let count = 0;
fc.configureGlobal({
  beforeEach: () => {
    count = 1;
  },
});
const property = fc.property(fc.nat(), (n) => n + count >= 0);
fc.assert(property.beforeEach(() => {
  count = 2;
}));
