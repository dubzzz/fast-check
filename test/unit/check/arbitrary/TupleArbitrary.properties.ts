import * as assert from 'assert';
import fc from '../../../../lib/fast-check';

import Arbitrary from '../../../../src/check/arbitrary/definition/Arbitrary';
import Shrinkable from '../../../../src/check/arbitrary/definition/Shrinkable';
import { integer } from '../../../../src/check/arbitrary/IntegerArbitrary';
import { tuple, genericTuple } from '../../../../src/check/arbitrary/TupleArbitrary';
import Random from '../../../../src/random/generator/Random';

import * as stubRng from '../../stubs/generators';

class DummyArbitrary extends Arbitrary<string> {
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

function propertySameTupleForSameSeed(arbs: DummyArbitrary[], isGeneric?: boolean) {
  const arb = isGeneric === true ? genericTuple(arbs) : tuple(arbs[0], ...arbs.slice(1));
  return fc.property(fc.integer(), seed => {
    const mrng1 = stubRng.mutable.fastincrease(seed);
    const mrng2 = stubRng.mutable.fastincrease(seed);
    const g1 = arb.generate(mrng1).value;
    assert.ok(g1.every((v, idx) => v.startsWith(`key${arbs[idx].id}_`)));
    assert.deepEqual(arb.generate(mrng2).value, g1);
    return true;
  });
}

function propertyShrinkInRange(arbs: DummyArbitrary[], isGeneric?: boolean) {
  const arb = isGeneric === true ? genericTuple(arbs) : tuple(arbs[0], ...arbs.slice(1));
  return fc.property(fc.integer(), seed => {
    const mrng = stubRng.mutable.fastincrease(seed);
    const shrinkable = arb.generate(mrng);
    return shrinkable.shrink().every(s => s.value.every((vv, idx) => vv.startsWith(`key${arbs[idx].id}_`)));
  });
}

function propertyNotSuggestInputInShrink(arbs: DummyArbitrary[], isGeneric?: boolean) {
  const arb = isGeneric === true ? genericTuple(arbs) : tuple(arbs[0], ...arbs.slice(1));
  return fc.property(fc.integer(), seed => {
    const mrng = stubRng.mutable.fastincrease(seed);
    const shrinkable = arb.generate(mrng);
    return shrinkable.shrink().every(s => !s.value.every((vv, idx) => vv === shrinkable.value[idx]));
  });
}

export { dummy, propertyNotSuggestInputInShrink, propertySameTupleForSameSeed, propertyShrinkInRange };
