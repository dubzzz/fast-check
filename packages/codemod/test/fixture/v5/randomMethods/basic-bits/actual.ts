import * as fc from 'fast-check';

function draw(rng: fc.Random, bits: number) {
  return rng.next(bits);
}
