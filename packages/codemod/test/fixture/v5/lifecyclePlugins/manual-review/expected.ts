import * as fc from 'fast-check';
const unknown = factory();
fc.assert(fc.property(arb, predicate).beforeEach((previous) => previous()));
fc.assert(fc.property(arb, predicate).beforeEach(unknown));
fc.check(
  fc
    .property(arb, predicate)
    .afterEach(() => {})
    .afterEach(() => {}),
);
fc.assert(other.property(arb, predicate).beforeEach(() => {}));
const reused = fc.property(arb, predicate).beforeEach(() => {});
fc.assert(reused);
fc.check(reused);
