import * as fc from 'fast-check';

function draw(rng: fc.Random) {
  return rng.nextInt(0, 1) === 1;
}
