import * as fc from 'fast-check';

test('the name of the test', () => {
  return fc.assert(fc.asyncProperty(fc.nat(), (n) => true));
});
