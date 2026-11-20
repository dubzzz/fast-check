import * as fc from 'fast-check';

abstract class Coin extends fc.Arbitrary<boolean> {
  generate(rng: fc.Random) {
    return new fc.Value(!rng.nextBoolean(), undefined);
  }
}
