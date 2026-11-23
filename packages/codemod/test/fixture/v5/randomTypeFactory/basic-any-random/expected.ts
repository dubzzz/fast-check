import { congruential32 } from 'pure-rand/generator/congruential32';
import { mersenne } from 'pure-rand/generator/mersenne';
import { xoroshiro128plus } from 'pure-rand/generator/xoroshiro128plus';
import { xorshift128plus } from 'pure-rand/generator/xorshift128plus';
import * as fc from 'fast-check';

test('running against congruential', async () => {
  await fc.assert(
    fc.asyncProperty(fc.integer(), () => true),
    { randomType: congruential32 },
  );
});

test('running against congruential32', async () => {
  await fc.assert(
    fc.asyncProperty(fc.integer(), () => true),
    { randomType: congruential32 },
  );
});

test('running against mersenne', async () => {
  await fc.assert(
    fc.asyncProperty(fc.integer(), () => true),
    { randomType: mersenne },
  );
});

test('running against xoroshiro128plus', async () => {
  await fc.assert(
    fc.asyncProperty(fc.integer(), () => true),
    { randomType: xoroshiro128plus },
  );
});

test('running against xorshift128plus', async () => {
  await fc.assert(
    fc.asyncProperty(fc.integer(), () => true),
    { randomType: xorshift128plus },
  );
});
