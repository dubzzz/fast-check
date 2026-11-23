import * as fc from 'fast-check';

test('the name of the test', () => {
  fc.assert(fc.property(fc.nat(), (n) => true));
});
