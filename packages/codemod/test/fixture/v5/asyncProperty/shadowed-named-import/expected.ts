import { property } from 'fast-check';
property(arb, predicate);
function test(asyncProperty) {
  return asyncProperty();
}
