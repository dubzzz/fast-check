import type { Random } from 'fast-check';

function draw(rng?: Random) {
  return rng?.nextBoolean();
}
