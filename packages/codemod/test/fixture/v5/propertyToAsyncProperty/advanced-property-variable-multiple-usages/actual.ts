import * as fc from 'fast-check';

const myProp = fc.property(fc.nat(), () => true);
test('name of test 1', () => {
  fc.assert(myProp);
});
test('name of test 2', () => {
  fc.assert(myProp, { numRuns: 2 });
});
