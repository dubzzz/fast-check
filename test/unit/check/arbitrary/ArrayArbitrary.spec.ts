import * as fc from '../../../../lib/fast-check';

import { Arbitrary } from '../../../../src/check/arbitrary/definition/Arbitrary';
import { Shrinkable } from '../../../../src/check/arbitrary/definition/Shrinkable';
import { array } from '../../../../src/check/arbitrary/ArrayArbitrary';
import { context } from '../../../../src/check/arbitrary/ContextArbitrary';
import { nat } from '../../../../src/check/arbitrary/IntegerArbitrary';
import { Random } from '../../../../src/random/generator/Random';

import * as genericHelper from './generic/GenericArbitraryHelper';

import * as stubRng from '../../stubs/generators';
import { hasCloneMethod, cloneMethod } from '../../../../src/check/symbols';

class DummyArbitrary extends Arbitrary<{ key: number }> {
  constructor(public value: () => number) {
    super();
  }
  generate(mrng: Random): Shrinkable<{ key: number }> {
    return new Shrinkable({ key: this.value() });
  }
}

const isStrictlySmallerArray = (arr1: number[], arr2: number[]) => {
  if (arr1.length > arr2.length) return false;
  if (arr1.length === arr2.length) {
    return arr1.every((v, idx) => arr1[idx] <= arr2[idx]) && arr1.find((v, idx) => arr1[idx] < arr2[idx]) != null;
  }
  for (let idx1 = 0, idx2 = 0; idx1 < arr1.length && idx2 < arr2.length; ++idx1, ++idx2) {
    while (idx2 < arr2.length && arr1[idx1] > arr2[idx2]) ++idx2;
    if (idx2 === arr2.length) return false;
  }
  return true;
};

describe('ArrayArbitrary', () => {
  describe('array', () => {
    it('Should generate an array using specified arbitrary', () =>
      fc.assert(
        fc.property(fc.integer(), seed => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const g = array(new DummyArbitrary(() => 42)).generate(mrng).value;
          expect(g).toEqual([...Array(g.length)].map(() => ({ key: 42 })));
          return true;
        })
      ));
    it('Should generate an array calling multiple times arbitrary generator', () =>
      fc.assert(
        fc.property(fc.integer(), seed => {
          const mrng = stubRng.mutable.fastincrease(seed);
          let num = 0;
          const g = array(new DummyArbitrary(() => ++num)).generate(mrng).value;
          expect(g).toEqual([...Array(g.length)].map((v, idx) => ({ key: idx + 1 })));
          return true;
        })
      ));
    it('Should produce cloneable array if one cloneable children', () => {
      const mrng = stubRng.mutable.counter(0);
      let g = array(context(), 1, 10).generate(mrng).value;
      expect(hasCloneMethod(g)).toBe(true);
    });
    it('Should not produce cloneable tuple if no cloneable children', () => {
      const mrng = stubRng.mutable.counter(0);
      let g = array(nat(), 1, 10).generate(mrng).value;
      expect(hasCloneMethod(g)).toBe(false);
    });
    it('Should not clone on generate', () => {
      let numCallsToClone = 0;
      const withClonedAndCounter = new class extends Arbitrary<any> {
        generate() {
          const v = {
            [cloneMethod]: () => {
              ++numCallsToClone;
              return v;
            }
          };
          return new Shrinkable(v);
        }
      }();
      const mrng = stubRng.mutable.counter(0);
      array(withClonedAndCounter).generate(mrng);
      expect(numCallsToClone).toEqual(0);
    });
    describe('Given no length constraints', () => {
      genericHelper.isValidArbitrary(() => array(nat()), {
        isStrictlySmallerValue: isStrictlySmallerArray,
        isValidValue: (g: number[]) => Array.isArray(g) && g.every(v => typeof v === 'number')
      });
    });
    describe('Given maximal length only', () => {
      genericHelper.isValidArbitrary((maxLength: number) => array(nat(), maxLength), {
        seedGenerator: fc.nat(100),
        isStrictlySmallerValue: isStrictlySmallerArray,
        isValidValue: (g: number[], maxLength: number) =>
          Array.isArray(g) && g.length <= maxLength && g.every(v => typeof v === 'number')
      });
    });
    describe('Given minimal and maximal lengths', () => {
      genericHelper.isValidArbitrary(
        (constraints: { min: number; max: number }) => array(nat(), constraints.min, constraints.max),
        {
          seedGenerator: genericHelper.minMax(fc.nat(100)),
          isStrictlySmallerValue: isStrictlySmallerArray,
          isValidValue: (g: number[], constraints: { min: number; max: number }) =>
            Array.isArray(g) &&
            g.length >= constraints.min &&
            g.length <= constraints.max &&
            g.every(v => typeof v === 'number')
        }
      );
    });
  });
});
