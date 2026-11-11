import fc from 'fast-check';
fc.asyncProperty(arb, predicate);
function test(fc) {
  return fc.asyncProperty();
}
