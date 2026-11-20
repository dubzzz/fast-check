import * as fc from 'fast-check';

abstract class Coin extends fc.Arbitrary<boolean> {
  generate(rng: fc.Random) {
    return new fc.Value(!(rng.nextInt(0, 1) === 1), undefined);
  }
}
