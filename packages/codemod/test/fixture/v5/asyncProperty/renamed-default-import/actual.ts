import check from 'fast-check';
test(async () => {
  await check.assert(check.asyncProperty(check.integer(), async (n) => n === n));
});
