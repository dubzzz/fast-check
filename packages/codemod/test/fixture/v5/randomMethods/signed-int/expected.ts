import * as fc from 'fast-check';

function draw(rng: fc.Random) {
  return rng.nextInt(-2147483648, 2147483647);
}
