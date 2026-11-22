import type { Random } from 'fast-check';

function draw(rng: Random, bits: [number]) {
  return rng.next(...bits);
}
