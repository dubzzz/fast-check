import check from 'fast-check';
test(async () => {
  await check.assert(check.property(check.integer(), async (n) => n === n));
});
