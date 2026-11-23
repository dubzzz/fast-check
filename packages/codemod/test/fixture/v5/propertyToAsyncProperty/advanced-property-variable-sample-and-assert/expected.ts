import * as fc from 'fast-check';

const myProp = fc.asyncProperty(fc.nat(), () => true);
test('samples the shared property', () => {
  fc.sample(myProp);
});
test('asserts the shared property', async () => {
  await fc.assert(myProp);
});
