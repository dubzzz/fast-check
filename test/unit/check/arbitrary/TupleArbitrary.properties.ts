import { Arbitrary } from '../../../../src/check/arbitrary/definition/Arbitrary';
import { integer } from '../../../../src/check/arbitrary/IntegerArbitrary';
import { Shrinkable } from '../../../../src/fast-check';
import { Random } from '../../../../src/random/generator/Random';

export class DummyArbitrary extends Arbitrary<string> {
  constructor(public id: number) {
    super();
  }
  generate(mrng: Random): Shrinkable<string> {
    return integer()
      .generate(mrng)
      .map((v) => `key${this.id}_${v}`);
  }
  withBias(freq: number): Arbitrary<string> {
    return new DummyArbitrary(2 * this.id + freq);
  }
}
function dummy(id: number): Arbitrary<string> {
  return new DummyArbitrary(id);
}

export { dummy };
