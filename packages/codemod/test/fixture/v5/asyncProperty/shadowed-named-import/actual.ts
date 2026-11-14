import { asyncProperty } from 'fast-check';
asyncProperty(arb, predicate);
function test(asyncProperty) {
  return asyncProperty();
}
