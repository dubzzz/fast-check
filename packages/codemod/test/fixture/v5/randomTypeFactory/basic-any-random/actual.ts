import * as fc from 'fast-check';

test('running against congruential', async () => {
  await fc.assert(
    fc.asyncProperty(fc.integer(), () => true),
    { randomType: 'congruential' },
  );
});

test('running against congruential32', async () => {
  await fc.assert(
    fc.asyncProperty(fc.integer(), () => true),
    { randomType: 'congruential32' },
  );
});

test('running against mersenne', async () => {
  await fc.assert(
    fc.asyncProperty(fc.integer(), () => true),
    { randomType: 'mersenne' },
  );
});

test('running against xoroshiro128plus', async () => {
  await fc.assert(
    fc.asyncProperty(fc.integer(), () => true),
    { randomType: 'xoroshiro128plus' },
  );
});

test('running against xorshift128plus', async () => {
  await fc.assert(
    fc.asyncProperty(fc.integer(), () => true),
    { randomType: 'xorshift128plus' },
  );
});
