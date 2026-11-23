import * as fc from 'fast-check';

const myProp = fc.property(fc.nat(), () => true);
test('samples the shared property', () => {
  fc.sample(myProp);
});
test('asserts the shared property', () => {
  fc.assert(myProp);
});
