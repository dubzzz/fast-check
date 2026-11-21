import type { Random } from 'fast-check';

function draw(rng: Random) {
  return (rng.nextInt(0, 2 ** 26 - 1) * 2 ** 27 + rng.nextInt(0, 2 ** 27 - 1)) / 2 ** 53;
}
