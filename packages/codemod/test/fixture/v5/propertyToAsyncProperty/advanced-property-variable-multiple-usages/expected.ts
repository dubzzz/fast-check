import * as fc from 'fast-check';

const myProp = fc.asyncProperty(fc.nat(), () => true);
test('name of test 1', async () => {
  await fc.assert(myProp);
});
test('name of test 2', async () => {
  await fc.assert(myProp, { numRuns: 2 });
});
