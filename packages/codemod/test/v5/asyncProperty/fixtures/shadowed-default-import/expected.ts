import fc from 'fast-check';
fc.property(arb, predicate);
function test(fc) {
  return fc.asyncProperty();
}
