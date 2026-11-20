import type { Random } from 'fast-check';

function draw(rng: Random) {
  return rng.nextInt(0, (1 << rng.nextInt(0, (1 << 3) - 1)) - 1);
}
