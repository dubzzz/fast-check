import * as fc from 'fast-check';
fc.configureGlobal({
  beforeEach: () => {
    reset();
  },
});
fc.assert(
  fc.property(arb, predicate).beforeEach(() => {
    resetLocal();
  }),
);
