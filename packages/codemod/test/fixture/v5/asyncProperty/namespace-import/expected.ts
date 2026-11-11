import * as fc from 'fast-check';
test(async () => {
  await fc.assert(fc.property(fc.integer(), async (n) => n === n));
});
