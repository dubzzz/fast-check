import * as fc from '../../../lib/fast-check';

import { context } from '../../../src/arbitrary/context';
import { nat } from '../../../src/arbitrary/nat';
import { infiniteStream } from '../../../src/arbitrary/infiniteStream';
import { Stream } from '../../../src/stream/Stream';

import * as genericHelper from '../check/arbitrary/generic/GenericArbitraryHelper';

import * as stubRng from '../stubs/generators';
import { hasCloneMethod, cloneMethod, WithCloneMethod } from '../../../src/check/symbols';

describe('StreamArbitrary', () => {
  describe('infiniteStream', () => {
    it('Should produce a cloneable Stream', () => {
      const mrng = stubRng.mutable.counter(0);
      const s = infiniteStream(nat()).generate(mrng);
      expect(s.hasToBeCloned).toBe(true);
      expect(hasCloneMethod(s.value_)).toBe(true);
    });
    it('Should produce an independant cloned Stream', () => {
      const mrng = stubRng.mutable.counter(0);
      const g = infiniteStream(context()).generate(mrng).value_;
      const ctx1 = [...g.take(1)][0];
      ctx1.log('plop');
      const ctx2 = [...((g as any) as WithCloneMethod<typeof g>)[cloneMethod]().take(1)][0];
      expect(ctx1.size()).toEqual(1);
      expect(ctx2.size()).toEqual(0);
    });
    it('Should print correctly values even when cloneable', () => {
      const mrng = stubRng.mutable.counter(0);
      const g = infiniteStream(context()).generate(mrng).value_;
      const [ctx1, ctx2] = [...g.take(2)];
      ctx1.log('plop');
      ctx2.log('plip');
      ctx2.log('plap');
      expect(String(g)).toEqual('Stream({"logs":["plop"]},{"logs":["plip","plap"]},{"logs":[]}…)');
    });
    it('Should be able to generate any number of values', () =>
      fc.assert(
        fc.property(fc.integer(), fc.integer(10, 500), (seed, numberOfReadsBeforeToString) => {
          const mrng = stubRng.mutable.counter(seed);
          const g = infiniteStream(nat()).generate(mrng).value_;
          return [...g.take(numberOfReadsBeforeToString)].length === numberOfReadsBeforeToString;
        })
      ));
    /*it('Should print any of the seen values on toString', () =>
      fc.assert(
        fc.property(fc.integer(), fc.integer({ max: 500 }), (seed, numberOfReadsBeforeToString) => {
          const mrng = stubRng.mutable.counter(seed);
          const g = infiniteStream(nat()).generate(mrng).value_;
          const firstN = [...g.take(numberOfReadsBeforeToString)];
          const expectedToString = `Stream(${firstN.slice(0, numberOfReadsBeforeToString).join(',')}…)`;
          expect(g.toString()).toEqual(expectedToString);
        })
      ));*/
    it('Should be able to produce different values', () =>
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const mrng = stubRng.mutable.counter(seed);
          const g = infiniteStream(nat()).generate(mrng).value_;
          let first: number | null = null;
          for (const nextValue of g) {
            if (first == null) first = nextValue;
            else if (nextValue !== first) return true;
          }
          // cannot be reached as the stream is infinite
          // will timeout in the case of all items being equal to the first one
          return false;
        })
      ));
    describe('Should be a valid arbitrary', () => {
      genericHelper.isValidArbitrary(() => infiniteStream(nat()), {
        isEqual: (g1: Stream<number>, g2: Stream<number>) => {
          if (!hasCloneMethod(g1) || !hasCloneMethod(g2)) {
            throw new Error('No clone method detected');
          }
          expect([...g1[cloneMethod]().take(5)]).toEqual([...g2[cloneMethod]().take(5)]);
          return true;
        },
        isValidValue: (g: Stream<number>) => {
          if (!hasCloneMethod(g)) return false;
          const first5 = [...g.take(5)];
          return first5.length === 5 && first5.every((v) => typeof v === 'number');
        },
      });
    });
  });
});
