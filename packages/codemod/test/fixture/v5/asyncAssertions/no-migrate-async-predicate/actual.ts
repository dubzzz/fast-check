import * as fc from 'fast-check';

test('example', () => {
  fc.assert(fc.property(fc.nat(), async () => true));
});
