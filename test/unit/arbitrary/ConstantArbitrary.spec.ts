import * as fc from '../../../lib/fast-check';

import { clonedConstant } from '../../../src/arbitrary/clonedConstant';
import { constant } from '../../../src/arbitrary/constant';
import { constantFrom } from '../../../src/arbitrary/constantFrom';
import { cloneMethod } from '../../../src/fast-check';

import * as stubRng from '../stubs/generators';

const cloneable = { [cloneMethod]: () => cloneable };

describe('ConstantArbitrary', () => {
  describe('constant', () => {
    it('Should always return the constant', () => {
      const mrng = stubRng.mutable.nocall();
      const g = constant(42).generate(mrng).value;
      expect(g).toEqual(42);
    });
    it('Should always return the original instance', () => {
      const instance = ['hello'];
      const mrng = stubRng.mutable.nocall();
      const g = constant(instance).generate(mrng).value;
      expect(g).toEqual(['hello']);
      instance.push('world');
      expect(g).toEqual(['hello', 'world']);
    });
    it('Should throw on cloneable instance', () => {
      expect(() => constant(cloneable)).toThrowError();
    });
  });
  describe('constantFrom', () => {
    it('Should throw when no parameters', () => {
      expect(() => constantFrom()).toThrowError();
    });
    it('Should always return one of the constants', () =>
      fc.assert(
        fc.property(fc.array(fc.string(), { minLength: 1 }), fc.integer(), (data, seed) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const g = constantFrom(...data).generate(mrng).value;
          return data.indexOf(g) !== -1;
        })
      ));
    it('Should be able to produce all the constants', () =>
      fc.assert(
        fc.property(fc.array(fc.string(), { minLength: 1 }), fc.integer(), fc.nat(), (data, seed, idx) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const arb = constantFrom(...data);
          for (let id = 0; id !== 10000; ++id) {
            const g = arb.generate(mrng).value;
            if (g === data[idx % data.length]) return true;
          }
          return false;
        })
      ));
    it('Should throw on cloneable instance', () => {
      expect(() => constantFrom(cloneable)).toThrowError();
    });
    it('Should shrink any of the constants towards the first one', () =>
      fc.assert(
        fc.property(fc.set(fc.string(), { minLength: 1 }), fc.integer(), (data, seed) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const shrinkable = constantFrom(...data).generate(mrng);
          if (data.indexOf(shrinkable.value) === 0) expect([...shrinkable.shrink()]).toEqual([]);
          else expect([...shrinkable.shrink()].map((s) => s.value)).toEqual([data[0]]);
        })
      ));
  });
  describe('clonedConstant', () => {
    it('Should throw on cloneable instance with flag enabled', () => {
      expect(() => clonedConstant(cloneable)).not.toThrow();
    });
    it('Should clone cloneable on generate', () => {
      let clonedOnce = false;
      const mrng = stubRng.mutable.nocall();
      const g = clonedConstant({
        [cloneMethod]() {
          clonedOnce = true;
          return this;
        },
      }).generate(mrng).value;
      expect(g).toBeDefined();
      expect(clonedOnce).toBe(true);
    });
  });
});
