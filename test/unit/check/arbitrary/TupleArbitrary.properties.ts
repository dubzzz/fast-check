import * as assert from 'assert';
import * as fc from '../../../../lib/fast-check';

import Arbitrary from '../../../../src/check/arbitrary/definition/Arbitrary';
import Shrinkable from '../../../../src/check/arbitrary/definition/Shrinkable';
import { integer } from '../../../../src/check/arbitrary/IntegerArbitrary';
import { tuple, genericTuple } from '../../../../src/check/arbitrary/TupleArbitrary';
import Random from '../../../../src/random/generator/Random';

import * as stubRng from '../../stubs/generators';

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

function assertSameTupleForSameSeed(arbs: DummyArbitrary[]) {
  const arb = genericTuple(arbs);
  return fc.assert(
    fc.property(fc.integer(), seed => {
      const mrng1 = stubRng.mutable.fastincrease(seed);
      const mrng2 = stubRng.mutable.fastincrease(seed);
      const g1 = arb.generate(mrng1).value;
      assert.ok(g1.every((v: string, idx: number) => v.startsWith(`key${arbs[idx].id}_`)));
      assert.deepEqual(arb.generate(mrng2).value, g1);
      return true;
    })
  );
}

function assertShrinkInRange(arbs: DummyArbitrary[]) {
  const arb = genericTuple(arbs);
  return fc.assert(
    fc.property(fc.integer(), seed => {
      const mrng = stubRng.mutable.fastincrease(seed);
      const shrinkable = arb.generate(mrng);
      return shrinkable
        .shrink()
        .every(s => s.value.every((vv: string, idx: number) => vv.startsWith(`key${arbs[idx].id}_`)));
    })
  );
}

function assertNotSuggestInputInShrink(arbs: DummyArbitrary[]) {
  const arb = genericTuple(arbs);
  return fc.assert(
    fc.property(fc.integer(), seed => {
      const mrng = stubRng.mutable.fastincrease(seed);
      const shrinkable = arb.generate(mrng);
      return shrinkable.shrink().every(s => !s.value.every((vv: string, idx: number) => vv === shrinkable.value[idx]));
    })
  );
}

export { dummy, assertNotSuggestInputInShrink, assertSameTupleForSameSeed, assertShrinkInRange };
