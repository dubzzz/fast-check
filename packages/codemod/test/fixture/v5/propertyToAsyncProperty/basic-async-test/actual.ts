import * as fc from 'fast-check';

test('the name of the test', async () => {
  await fc.assert(fc.property(fc.nat(), (n) => true));
});
