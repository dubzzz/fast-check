import { asyncProperty } from 'fast-check';
function test(property) {
  return asyncProperty(arb, property);
}
