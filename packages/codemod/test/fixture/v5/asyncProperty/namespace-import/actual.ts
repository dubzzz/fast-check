import * as fc from 'fast-check';
test(async () => {
  await fc.assert(fc.asyncProperty(fc.integer(), async (n) => n === n));
});
