import * as fc from 'fast-check';

let count = 0;
// A global plugin would also run on the property that overrides this hook below.
fc.configureGlobal({
  beforeEach: () => {
    count = 1;
  },
});
const property = fc.property(fc.nat(), (n) => n + count >= 0);
// In v4 this property hook replaces the global hook.
fc.assert(
  property.beforeEach(() => {
    count = 2;
  }),
);
