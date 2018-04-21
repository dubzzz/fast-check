import * as assert from 'assert';
import * as fc from '../../../../lib/fast-check';

import Arbitrary from '../../../../src/check/arbitrary/definition/Arbitrary';
import Shrinkable from '../../../../src/check/arbitrary/definition/Shrinkable';
import { integer } from '../../../../src/check/arbitrary/IntegerArbitrary';
import Random from '../../../../src/random/generator/Random';

export class DummyArbitrary extends Arbitrary<string> {
  constructor(public id: number) {
    super();
  }
  generate(mrng: Random) {
    return integer()
      .generate(mrng)
      .map(v => `key${this.id}_${v}`);
  }
}
function dummy(id: number) {
  return new DummyArbitrary(id);
}

export { dummy };
