import * as fc from 'fast-check';

test('numbers', async () => {
  await fc.assert(fc.property(fc.integer(), Number.isInteger));
});
