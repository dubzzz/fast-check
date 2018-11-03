import * as assert from 'assert';
import * as fc from '../../../../lib/fast-check';

import { clonedConstant, constant, constantFrom } from '../../../../src/check/arbitrary/ConstantArbitrary';

import * as stubRng from '../../stubs/generators';
import { cloneMethod } from '../../../../src/fast-check';

const cloneable = { [cloneMethod]: () => cloneable };

describe('ConstantArbitrary', () => {
  describe('constant', () => {
    it('Should always return the constant', () => {
      const mrng = stubRng.mutable.nocall();
      const g = constant(42).generate(mrng).value;
      assert.equal(g, 42);
    });
    it('Should always return the original instance', () => {
      let instance = ['hello'];
      const mrng = stubRng.mutable.nocall();
      const g = constant(instance).generate(mrng).value;
      assert.deepEqual(g, ['hello']);
      instance.push('world');
      assert.deepEqual(g, ['hello', 'world']);
    });
    it('Should throw on cloneable instance', () => {
      assert.throws(() => constant(cloneable));
    });
  });
  describe('constantFrom', () => {
    it('Should throw when no parameters', () => {
      assert.throws(() => constantFrom());
    });
    it('Should always return one of the constants', () =>
      fc.assert(
        fc.property(fc.array(fc.string(), 1, 10), fc.integer(), (data, seed) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const g = constantFrom(...data).generate(mrng).value;
          return data.indexOf(g) !== -1;
        })
      ));
    it('Should be able to produce all the constants', () =>
      fc.assert(
        fc.property(fc.array(fc.string(), 1, 10), fc.integer(), fc.nat(), (data, seed, idx) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const arb = constantFrom(...data);
          for (let id = 0; id != 10000; ++id) {
            const g = arb.generate(mrng).value;
            if (g === data[idx % data.length]) return true;
          }
          return false;
        })
      ));
    it('Should throw on cloneable instance', () => {
      assert.throws(() => constantFrom(cloneable));
    });
    it('Should shrink any of the constants towards the first one', () =>
      fc.assert(
        fc.property(fc.set(fc.string(), 1, 10), fc.integer(), (data, seed) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const shrinkable = constantFrom(...data).generate(mrng);
          if (data.indexOf(shrinkable.value) === 0) assert.deepStrictEqual([...shrinkable.shrink()], []);
          else assert.deepStrictEqual([...shrinkable.shrink()].map(s => s.value), [data[0]]);
        })
      ));
  });
  describe('clonedConstant', () => {
    it('Should throw on cloneable instance with flag enabled', () => {
      assert.doesNotThrow(() => clonedConstant(cloneable));
    });
    it('Should clone cloneable on generate', () => {
      let clonedOnce = false;
      const mrng = stubRng.mutable.nocall();
      const g = clonedConstant({
        [cloneMethod]: function() {
          clonedOnce = true;
          return this;
        }
      }).generate(mrng).value;
      assert.ok(clonedOnce);
    });
  });
});
