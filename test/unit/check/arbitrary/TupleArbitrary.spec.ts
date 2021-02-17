import * as fc from '../../../../lib/fast-check';
import * as prand from 'pure-rand';
import { dummy } from './TupleArbitrary.properties';

import { Arbitrary } from '../../../../src/check/arbitrary/definition/Arbitrary';
import { context } from '../../../../src/check/arbitrary/ContextArbitrary';
import { integer, nat } from '../../../../src/check/arbitrary/IntegerArbitrary';
import { tuple } from '../../../../src/check/arbitrary/TupleArbitrary';
import { Shrinkable } from '../../../../src/check/arbitrary/definition/Shrinkable';
import { hasCloneMethod, cloneMethod } from '../../../../src/check/symbols';
import { stream } from '../../../../src/stream/Stream';
import { Random } from '../../../../src/random/generator/Random';

import * as genericHelper from './generic/GenericArbitraryHelper';
import * as stubRng from '../../stubs/generators';

describe('TupleArbitrary', () => {
  describe('tuple', () => {
    genericHelper.isValidArbitrary((mins: number[]) => tuple(...mins.map((m) => integer(m, m + 10))), {
      seedGenerator: fc.array(fc.nat(1000)),
      isStrictlySmallerValue: (g1: number[], g2: number[]) => g1.findIndex((v, idx) => v < g2[idx]) !== -1,
      isValidValue: (g: number[], mins: number[]) => {
        // right size
        if (g.length !== mins.length) return false;
        // values in the right range
        for (let idx = 0; idx !== g.length; ++idx) {
          if (g[idx] < mins[idx]) return false;
          if (g[idx] > mins[idx] + 10) return false;
        }
        return true;
      },
    });
    it('Should throw on null arbitrary', () =>
      expect(() => tuple(dummy(1), dummy(2), (null as any) as Arbitrary<string>)).toThrowError());
    it('Should throw on invalid arbitrary', () =>
      expect(() => tuple(dummy(1), dummy(2), {} as Arbitrary<any>)).toThrowError());
    it('Should produce cloneable tuple if one cloneable children', () =>
      fc.assert(
        fc.property(fc.nat(50), fc.nat(50), (before, after) => {
          const arbsBefore = [...Array(before)].map(() => integer(0, 0));
          const arbsAfter = [...Array(after)].map(() => integer(0, 0));
          const mrng = stubRng.mutable.counter(0);
          const g = tuple(...arbsBefore, context(), ...arbsAfter).generate(mrng).value;
          return hasCloneMethod(g);
        })
      ));
    it('Should not produce cloneable tuple if no cloneable children', () =>
      fc.assert(
        fc.property(fc.nat(100), (num) => {
          const arbs = [...Array(num)].map(() => integer(0, 0));
          const mrng = stubRng.mutable.counter(0);
          const g = tuple(...arbs).generate(mrng).value;
          return !hasCloneMethod(g);
        })
      ));
    it('Should not clone on generate', () => {
      let numCallsToClone = 0;
      const withClonedAndCounter = new (class extends Arbitrary<any> {
        generate() {
          const v = {
            [cloneMethod]: () => {
              ++numCallsToClone;
              return v;
            },
          };
          return new Shrinkable(v);
        }
      })();
      const mrng = stubRng.mutable.counter(0);
      tuple(withClonedAndCounter).generate(mrng);
      expect(numCallsToClone).toEqual(0);
    });
  });
  it('Should use the cloneable instance for a single run only', () => {
    class CloneableInstance {
      static SharedId = 0;
      readonly id: number;
      constructor() {
        this.id = ++CloneableInstance.SharedId;
      }
      [cloneMethod] = () => new CloneableInstance();
    }
    const cloneableArbitrary = new (class extends Arbitrary<CloneableInstance> {
      generate() {
        function* g() {
          yield new Shrinkable(new CloneableInstance());
          yield new Shrinkable(new CloneableInstance());
        }
        return new Shrinkable(new CloneableInstance(), () => stream(g()));
      }
    })();
    const arbs = tuple(nat(16), cloneableArbitrary, nat(16));
    const extractId = (shrinkable: Shrinkable<[number, CloneableInstance, number]>) => shrinkable.value_[1].id;
    fc.assert(
      fc.property(fc.integer().noShrink(), fc.infiniteStream(fc.nat()), (seed, shrinkPath) => {
        // Reset SharedId in order to have reproducible runs
        CloneableInstance.SharedId = 0;

        // Generate the first shrinkable
        const it = shrinkPath[Symbol.iterator]();
        const mrng = new Random(prand.xorshift128plus(seed));
        let shrinkable: Shrinkable<[number, CloneableInstance, number]> | null = arbs.generate(mrng) as any;

        // Traverse the shrink tree in order to detect already seen ids
        const alreadySeenIds: { [id: number]: boolean } = {
          [extractId(shrinkable!)]: true,
        };
        while (shrinkable !== null) {
          shrinkable = shrinkable
            .shrink()
            .map((nextShrinkable) => {
              const id = extractId(nextShrinkable);
              if (alreadySeenIds[id]) throw new Error(`Already encountered id ${id}`);
              alreadySeenIds[id] = true;
              return nextShrinkable;
            })
            .getNthOrLast(it.next().value);
        }
      })
    );
  });
});
