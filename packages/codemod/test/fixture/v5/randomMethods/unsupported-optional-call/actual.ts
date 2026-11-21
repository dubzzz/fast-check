import type { Random } from 'fast-check';

function draw(rng?: Random) {
  // The optional call must still return undefined when rng is absent.
  return rng?.nextBoolean();
}
