import * as fc from 'fast-check';

function draw(rng: fc.Random, bits: number) {
  return rng.nextInt(0, (1 << bits) - 1);
}
