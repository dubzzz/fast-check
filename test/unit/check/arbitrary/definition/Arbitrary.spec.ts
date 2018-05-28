import * as assert from 'assert';
import * as fc from '../../../../../lib/fast-check';

import Arbitrary from '../../../../../src/check/arbitrary/definition/Arbitrary';
import Shrinkable from '../../../../../src/check/arbitrary/definition/Shrinkable';
import { array } from '../../../../../src/check/arbitrary/ArrayArbitrary';
import { constant } from '../../../../../src/check/arbitrary/ConstantArbitrary';
import { integer, nat } from '../../../../../src/check/arbitrary/IntegerArbitrary';
import { string } from '../../../../../src/check/arbitrary/StringArbitrary';
import { tuple } from '../../../../../src/check/arbitrary/TupleArbitrary';
import Random from '../../../../../src/random/generator/Random';
import { Stream, stream } from '../../../../../src/stream/Stream';

import * as stubRng from '../../../stubs/generators';

class ForwardArbitrary extends Arbitrary<number> {
  private shrinkableFor(v: number): Shrinkable<number> {
    function* g(vv: number): IterableIterator<number> {
      yield* [...Array(50)].map((u, i) => i + vv);
    }
    return new Shrinkable(v, () => stream(g(v)).map(vv => this.shrinkableFor(vv)));
  }
  generate(mrng: Random): Shrinkable<number> {
    return this.shrinkableFor(mrng.nextInt());
  }
  withBias(freq: number) {
    const arb = this;
    return new class extends Arbitrary<number> {
      generate(mrng: Random): Shrinkable<number> {
        return mrng.nextInt(1, freq) === 1 ? new Shrinkable(42) : arb.generate(mrng);
      }
    }();
  }
}

class FakeNoBiasArbitrary extends Arbitrary<number> {
  generate(mrng: Random): Shrinkable<number> {
    return new ForwardArbitrary().generate(mrng);
  }
  withBias(freq: number) {
    return new ForwardArbitrary();
  }
}

class FakeTwoValuesBiasArbitrary extends Arbitrary<number> {
  generate(mrng: Random): Shrinkable<number> {
    return new Shrinkable(44);
  }
  withBias(freq: number) {
    return new class extends Arbitrary<number> {
      generate(mrng: Random): Shrinkable<number> {
        return mrng.nextInt(1, 2) === 1 ? new Shrinkable(42) : new Shrinkable(43);
      }
    }();
  }
}

describe('Arbitrary', () => {
  describe('filter', () => {
    it('Should filter unsuitable values from the underlying arbitrary', () =>
      fc.assert(
        fc.property(fc.integer(), (seed: number) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const g = new ForwardArbitrary().filter(v => v % 3 === 0).generate(mrng).value;
          assert.ok(g % 3 === 0);
          return true;
        })
      ));
    it('Should filter unsuitable values from shrink', () =>
      fc.assert(
        fc.property(fc.integer(), (seed: number) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const shrinkable = new ForwardArbitrary().filter(v => v % 3 === 0).generate(mrng);
          assert.ok(shrinkable.shrink().every(s => s.value % 3 === 0));
          return true;
        })
      ));
    it('Should filter unsuitable values from shrink of shrink', () =>
      fc.assert(
        fc.property(fc.integer(), (seed: number) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const shrinkable = new ForwardArbitrary().filter(v => v % 3 === 0).generate(mrng);
          assert.ok(
            shrinkable
              .shrink()
              .flatMap(s => s.shrink())
              .every(s => s.value % 3 === 0)
          );
          return true;
        })
      ));
    it('Should apply filter to the biased arbitrary', () =>
      fc.assert(
        fc.property(fc.integer(), (seed: number) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const arb = new FakeTwoValuesBiasArbitrary().filter(v => v !== 42);
          const biasedArb = arb.withBias(2); // this arbitrary is always 100% biased (see its code)
          const g = biasedArb.generate(mrng).value;
          assert.ok(g === 43);
          return true;
        })
      ));
    it('Should not lock on biased arbitrary not providing right entries', () =>
      fc.assert(
        fc.property(fc.integer(), (seed: number) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const arb = new ForwardArbitrary().filter(v => v !== 42);
          const biasedArb = arb.withBias(2);
          const g = biasedArb.generate(mrng).value;
          assert.notEqual(g, 42);
          return true;
        })
      ));
  });
  describe('map', () => {
    it('Should apply mapper to produced values', () =>
      fc.assert(
        fc.property(fc.integer(), (seed: number) => {
          const mrng1 = stubRng.mutable.fastincrease(seed);
          const mrng2 = stubRng.mutable.fastincrease(seed);
          const g = new ForwardArbitrary().map(v => `value = ${v}`).generate(mrng1).value;
          assert.equal(g, `value = ${new ForwardArbitrary().generate(mrng2).value}`);
          return true;
        })
      ));
    it('Should apply mapper to shrink values', () =>
      fc.assert(
        fc.property(fc.integer(), (seed: number) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const shrinkable = new ForwardArbitrary().map(v => `value = ${v}`).generate(mrng);
          assert.ok(shrinkable.shrink().every(s => s.value.startsWith('value = ')));
          return true;
        })
      ));
    it('Should apply mapper to shrink of shrink values', () =>
      fc.assert(
        fc.property(fc.integer(), (seed: number) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const shrinkable = new ForwardArbitrary().map(v => `value = ${v}`).generate(mrng);
          assert.ok(
            shrinkable
              .shrink()
              .flatMap(s => s.shrink())
              .every(s => s.value.startsWith('value = '))
          );
          return true;
        })
      ));
    it('Should apply mapper to the biased arbitrary', () =>
      fc.assert(
        fc.property(fc.integer(), (seed: number) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const arb = new ForwardArbitrary().map(v => `value = ${v}`);
          const biasedArb = arb.withBias(1); // 100% of bias - not recommended outside of tests
          const g = biasedArb.generate(mrng).value;
          assert.equal(g, `value = 42`);
          return true;
        })
      ));
  });

  describe('then', () => {
    it('Should apply fmapper to produced values', () =>
      fc.assert(
        fc.property(fc.integer(), (seed: number) => {
          const mrng1 = stubRng.mutable.fastincrease(seed);
          const mrng2 = stubRng.mutable.fastincrease(seed);
          const fmapper = (v: number) => {
            let c = Math.abs(v) % 1000 + 1;
            return tuple(string(c, c), constant(c));
          };
          const g: [string, number] = new ForwardArbitrary().then<[string, number]>(fmapper).generate(mrng1).value;
          assert.equal(g[0].length, g[1]);
          return true;
        })
      ));
    it('Should apply fmapper to shrink values', () =>
      fc.assert(
        fc.property(fc.integer(), (seed: number) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const fmapper = (v: number): Arbitrary<number[]> => {
            let c = Math.abs(v) % 10 + 1;
            return array(integer(), c);
          };
          const shrinkable = new ForwardArbitrary()
            .then(fmapper)
            .map(v => `value = ${v}`)
            .generate(mrng);
          assert.ok(shrinkable.shrink().every(s => s.value.startsWith('value = ')));
          return true;
        })
      ));
    it('Should apply fmapper to shrink of shrink values', () =>
      fc.assert(
        fc.property(fc.integer(), (seed: number) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const fmapper = (v: number): Arbitrary<number> => {
            let c = Math.abs(v) % 10 + 1;
            return nat(c);
          };
          const shrinkable = new ForwardArbitrary()
            .then(fmapper)
            .map(v => `value = ${v}`)
            .generate(mrng);
          assert.ok(
            shrinkable
              .shrink()
              .flatMap(s => s.shrink())
              .every(s => s.value.startsWith('value = '))
          );
          return true;
        })
      ));
    it('Should apply fmapper to the biased arbitrary', () =>
      fc.assert(
        fc.property(fc.integer(), (seed: number) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const fmapper = (v: number): Arbitrary<string> => {
            const possibilities = ['A', 'B', 'C', 'D'];
            return constant(possibilities[v % 4]);
          };
          const arb = new ForwardArbitrary().then(fmapper).map(v => `value = ${v}`);
          const biasedArb = arb.withBias(1); // 100% of bias - not recommended outside of tests
          const g = biasedArb.generate(mrng).value;
          assert.equal(g, `value = C`);
          return true;
        })
      ));
  });

  describe('noShrink', () => {
    it('Should remove the ability to shrink the arbitrary', () =>
      fc.assert(
        fc.property(fc.integer(), (seed: number) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const shrinkable = new ForwardArbitrary().noShrink().generate(mrng);
          assert.deepStrictEqual([...shrinkable.shrink()], []);
          return true;
        })
      ));
    it('Should apply noShrink to the biased arbitrary', () =>
      fc.assert(
        fc.property(fc.integer(), (seed: number) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const arb = new FakeNoBiasArbitrary().noShrink();
          const biasedArb = arb.withBias(1); // 100% of bias - not recommended outside of tests
          const shrinkable = biasedArb.generate(mrng);
          assert.deepStrictEqual([...shrinkable.shrink()], []);
          return true;
        })
      ));
  });
  describe('noBias', () => {
    it('Should not be able to bias a noBias', () => {
      const mrng = stubRng.mutable.fastincrease(0);
      const arb = new FakeTwoValuesBiasArbitrary().noBias();
      const biasedArb = arb.withBias(1);
      const g = biasedArb.generate(mrng).value;
      assert.equal(g, 44);
    });
  });
});
