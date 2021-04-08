import * as fc from '../../../../lib/fast-check';

import { func, compareFunc, compareBooleanFunc } from '../../../../src/check/arbitrary/FunctionArbitrary';
import { context } from '../../../../src/check/arbitrary/ContextArbitrary';
import { integer } from '../../../../src/arbitrary/integer';
import { hasCloneMethod, cloneMethod } from '../../../../src/check/symbols';
import { hash } from '../../../../src/utils/hash';
import { stringify } from '../../../../src/utils/stringify';

import * as genericHelper from './generic/GenericArbitraryHelper';

import * as stubRng from '../../stubs/generators';

const forceClone = <T>(instance: T) => {
  if (!hasCloneMethod(instance)) throw new Error('Missing [cloneMethod]');
  return instance[cloneMethod]();
};

const assertToStringIsTheSameFunction = <T extends any[] | [any], TOut>(inputs: T[], f: (...args: T) => TOut) => {
  let assertionHasBeenExecuted = false;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (function (hash, stringify) {
    assertionHasBeenExecuted = true;
    try {
      // As the output of toString might be different if the function has been called
      // before or after toString, we assess both cases
      const dataFromToStringBefore = eval(`(function() { const f = ${f}; return inputs.map((ins) => f(...ins)); })()`);
      const data = inputs.map((ins) => f(...ins));
      const dataFromToString = eval(`(function() { const f = ${f}; return inputs.map((ins) => f(...ins)); })()`);

      expect(dataFromToStringBefore).toStrictEqual(data);
      expect(dataFromToString).toStrictEqual(data);
    } catch (err) {
      throw new Error(`Invalid toString representation encountered, got: ${f}\n\nFailed with: ${err}`);
    }
  })(hash, stringify);

  expect(assertionHasBeenExecuted).toBe(true);
};

describe('FunctionArbitrary', () => {
  describe('func', () => {
    it('Should return the same value given the same input', () =>
      fc.assert(
        fc.property(fc.integer(), fc.integer(), (seed, a) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const f = func(integer()).generate(mrng).value;
          return f(a) === f(a);
        })
      ));
    it('Should not depend on the ordering of calls', () =>
      fc.assert(
        fc.property(fc.integer(), fc.integer(), fc.integer(), (seed, a, b) => {
          const mrng1 = stubRng.mutable.fastincrease(seed);
          const f1 = func(integer()).generate(mrng1).value;
          const va1 = f1(a);
          const vb1 = f1(b);
          const mrng2 = stubRng.mutable.fastincrease(seed);
          const f2 = func(integer()).generate(mrng2).value;
          const vb2 = f2(b);
          const va2 = f2(a);
          return va1 === va2 && vb1 === vb2;
        })
      ));
    it('Should give a re-usable string representation of the function', () => {
      fc.assert(
        fc.property(fc.integer(), fc.array(fc.array(fc.anything())), (seed, inputs) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const f = func(integer()).generate(mrng).value;
          assertToStringIsTheSameFunction(inputs, f);
        })
      );
    });
    it('Should clone produced values if they implement [fc.cloneMethod]', () => {
      const mrng = stubRng.mutable.fastincrease(0);
      const f = func(context()).generate(mrng).value;
      const ctx1 = f(0);
      ctx1.log('Logging some stuff');
      const ctx2 = f(0);
      expect(ctx1.size()).toEqual(1);
      expect(ctx2.size()).toEqual(0);
    });
    it('Should produce a cloneable function', () => {
      const mrng = stubRng.mutable.counter(0);
      const s = func(integer()).generate(mrng);
      expect(s.hasToBeCloned).toBe(true);
      expect(hasCloneMethod(s.value_)).toBe(true);
    });
    describe('Clone compared to the original function', () => {
      it('Should produce the same values', () =>
        fc.assert(
          fc.property(fc.integer(), fc.array(fc.integer()), (seed, inputs) => {
            const mrng = stubRng.mutable.counter(seed);
            const f1 = func(integer()).generate(mrng).value_;
            const f2 = forceClone(f1);
            expect(inputs.map(f1)).toEqual(inputs.map(f2));
          })
        ));
      it('Should handle history the same way (toString)', () =>
        fc.assert(
          fc.property(fc.integer(), fc.array(fc.integer()), (seed, inputs) => {
            const mrng = stubRng.mutable.counter(seed);
            const f1 = func(integer()).generate(mrng).value_;
            const f2 = forceClone(f1);
            inputs.forEach(f1);
            inputs.forEach(f2);
            expect(String(f1)).toEqual(String(f2));
          })
        ));
      it('Should not share history (toString)', () =>
        fc.assert(
          fc.property(fc.integer(), fc.array(fc.integer(), { minLength: 1 }), (seed, inputs) => {
            const mrng = stubRng.mutable.counter(seed);
            const f1 = func(integer()).generate(mrng).value_;
            const f2 = forceClone(f1);
            inputs.forEach(f1);
            expect(String(f1)).not.toEqual(String(f2));
          })
        ));
    });
    describe('Is valid arbitrary', () => {
      genericHelper.isValidArbitrary(() => func<[number, number], number>(integer()), {
        isEqual: (f1, f2) => f1(0, 42) === f2(0, 42),
        isValidValue: (f) => typeof f === 'function' && typeof f(0, 0) === 'number' && hasCloneMethod(f),
      });
    });
  });
  describe('compareFunc', () => {
    it('Should return the same value given the same input', () =>
      fc.assert(
        fc.property(fc.integer(), fc.anything(), fc.anything(), (seed, a, b) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const f = compareFunc().generate(mrng).value;
          return f(a, b) === f(a, b);
        })
      ));
    it('Should be transitive', () =>
      fc.assert(
        fc.property(fc.integer(), fc.anything(), fc.anything(), fc.anything(), (seed, a, b, c) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const f = compareFunc().generate(mrng).value;
          const ab = f(a, b);
          const bc = f(b, c);
          fc.pre(ab !== 0 && bc !== 0);

          if (ab < 0 && bc < 0) return f(a, c) < 0;
          else if (ab > 0 && bc > 0) return f(a, c) > 0;

          fc.pre(false);
        })
      ));
    it('Should be zero when called on a = b', () =>
      fc.assert(
        fc.property(fc.integer(), fc.anything(), (seed, a) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const f = compareFunc().generate(mrng).value;
          return f(a, a) === 0;
        })
      ));
    it('Should be consistent when called in reversed order', () =>
      fc.assert(
        fc.property(fc.integer(), fc.anything(), fc.anything(), (seed, a, b) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const f = compareFunc().generate(mrng).value;
          const ab = f(a, b);
          const ba = f(b, a);
          if (ab === 0) return ba === 0;
          else if (ab < 0) return ba > 0;
          else return ba < 0;
        })
      ));
    it('Should give a re-usable string representation of the function', () => {
      fc.assert(
        fc.property(fc.integer(), fc.array(fc.tuple(fc.anything(), fc.anything())), (seed, inputs) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const f = compareFunc().generate(mrng).value;
          assertToStringIsTheSameFunction(inputs, f);
        })
      );
    });
    it('Should produce a cloneable compare function', () => {
      const mrng = stubRng.mutable.counter(0);
      const s = compareFunc().generate(mrng);
      expect(s.hasToBeCloned).toBe(true);
      expect(hasCloneMethod(s.value_)).toBe(true);
    });
    describe('Clone compared to the original function', () => {
      it('Should produce the same values', () =>
        fc.assert(
          fc.property(fc.integer(), fc.array(fc.tuple(fc.nat(), fc.nat())), (seed, inputs) => {
            const mrng = stubRng.mutable.counter(seed);
            const f1 = compareFunc<number>().generate(mrng).value_;
            const f2 = forceClone(f1);
            expect(inputs.map(([a, b]) => f1(a, b))).toEqual(inputs.map(([a, b]) => f2(a, b)));
          })
        ));
      it('Should handle history the same way (toString)', () =>
        fc.assert(
          fc.property(fc.integer(), fc.array(fc.tuple(fc.nat(), fc.nat())), (seed, inputs) => {
            const mrng = stubRng.mutable.counter(seed);
            const f1 = compareFunc<number>().generate(mrng).value_;
            const f2 = forceClone(f1);
            inputs.forEach(([a, b]) => f1(a, b));
            inputs.forEach(([a, b]) => f2(a, b));
            expect(String(f1)).toEqual(String(f2));
          })
        ));
      it('Should not share history (toString)', () =>
        fc.assert(
          fc.property(fc.integer(), fc.array(fc.tuple(fc.nat(), fc.nat()), { minLength: 1 }), (seed, inputs) => {
            const mrng = stubRng.mutable.counter(seed);
            const f1 = compareFunc<number>().generate(mrng).value_;
            const f2 = forceClone(f1);
            inputs.forEach(([a, b]) => f1(a, b));
            expect(String(f1)).not.toEqual(String(f2));
          })
        ));
    });
    describe('Is valid arbitrary', () => {
      genericHelper.isValidArbitrary(() => compareFunc(), {
        isEqual: (f1, f2) => f1({ k: 0 }, { k: 42 }) === f2({ k: 0 }, { k: 42 }),
        isValidValue: (f) => typeof f === 'function' && typeof f({ k: 0 }, { k: 42 }) === 'number' && hasCloneMethod(f),
      });
    });
  });
  describe('compareBooleanFunc', () => {
    it('Should return the same value given the same input', () =>
      fc.assert(
        fc.property(fc.integer(), fc.anything(), fc.anything(), (seed, a, b) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const f = compareBooleanFunc().generate(mrng).value;
          return f(a, b) === f(a, b);
        })
      ));
    it('Should be transitive', () =>
      fc.assert(
        fc.property(fc.integer(), fc.anything(), fc.anything(), fc.anything(), (seed, a, b, c) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const f = compareBooleanFunc().generate(mrng).value;
          const ab = f(a, b);
          const bc = f(b, c);

          if (ab && bc) return f(a, c);
          else if (!ab && !bc) return !f(a, c);

          fc.pre(false);
        })
      ));
    it('Should be false when called on a = b', () =>
      fc.assert(
        fc.property(fc.integer(), fc.anything(), (seed, a) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const f = compareBooleanFunc().generate(mrng).value;
          return f(a, a) === false;
        })
      ));
    it('Should be equivalent to compareFunc(a, b) < 0', () =>
      fc.assert(
        fc.property(fc.integer(), fc.anything(), fc.anything(), (seed, a, b) => {
          const mrng1 = stubRng.mutable.fastincrease(seed);
          const mrng2 = stubRng.mutable.fastincrease(seed);
          const f1 = compareBooleanFunc().generate(mrng1).value;
          const f2 = compareFunc().generate(mrng2).value;
          return f1(a, b) === f2(a, b) < 0;
        })
      ));
    it('Should give a re-usable string representation of the function', () => {
      fc.assert(
        fc.property(fc.integer(), fc.array(fc.tuple(fc.anything(), fc.anything())), (seed, inputs) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const f = compareBooleanFunc().generate(mrng).value;
          assertToStringIsTheSameFunction(inputs, f);
        })
      );
    });
    it('Should produce a cloneable compare function', () => {
      const mrng = stubRng.mutable.counter(0);
      const s = compareBooleanFunc().generate(mrng);
      expect(s.hasToBeCloned).toBe(true);
      expect(hasCloneMethod(s.value_)).toBe(true);
    });
    describe('Clone compared to the original function', () => {
      it('Should produce the same values', () =>
        fc.assert(
          fc.property(fc.integer(), fc.array(fc.tuple(fc.nat(), fc.nat())), (seed, inputs) => {
            const mrng = stubRng.mutable.counter(seed);
            const f1 = compareBooleanFunc<number>().generate(mrng).value_;
            const f2 = forceClone(f1);
            expect(inputs.map(([a, b]) => f1(a, b))).toEqual(inputs.map(([a, b]) => f2(a, b)));
          })
        ));
      it('Should handle history the same way (toString)', () =>
        fc.assert(
          fc.property(fc.integer(), fc.array(fc.tuple(fc.nat(), fc.nat())), (seed, inputs) => {
            const mrng = stubRng.mutable.counter(seed);
            const f1 = compareBooleanFunc<number>().generate(mrng).value_;
            const f2 = forceClone(f1);
            inputs.forEach(([a, b]) => f1(a, b));
            inputs.forEach(([a, b]) => f2(a, b));
            expect(String(f1)).toEqual(String(f2));
          })
        ));
      it('Should not share history (toString)', () =>
        fc.assert(
          fc.property(fc.integer(), fc.array(fc.tuple(fc.nat(), fc.nat()), { minLength: 1 }), (seed, inputs) => {
            const mrng = stubRng.mutable.counter(seed);
            const f1 = compareBooleanFunc<number>().generate(mrng).value_;
            const f2 = forceClone(f1);
            inputs.forEach(([a, b]) => f1(a, b));
            expect(String(f1)).not.toEqual(String(f2));
          })
        ));
    });
    describe('Is valid arbitrary', () => {
      genericHelper.isValidArbitrary(() => compareBooleanFunc(), {
        isEqual: (f1, f2) => f1({ k: 0 }, { k: 42 }) === f2({ k: 0 }, { k: 42 }),
        isValidValue: (f) =>
          typeof f === 'function' && typeof f({ k: 0 }, { k: 42 }) === 'boolean' && hasCloneMethod(f),
      });
    });
  });
});
