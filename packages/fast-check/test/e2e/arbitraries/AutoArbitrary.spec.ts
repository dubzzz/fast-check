import * as fc from '../../../src/fast-check';
import { seed } from '../seed';

describe(`AutoArbitrary (seed: ${seed})`, () => {
  describe('auto', () => {
    it('should be able to shrink a single arbitrary', () => {
      const integerArb = fc.integer();
      const out = fc.check(
        fc.property(fc.auto(), (auto) => {
          const v1 = auto(integerArb);
          expect(v1).toBeLessThanOrEqual(10);
        }),
        { seed: seed }
      );
      expect(out.failed).toBe(true);
      expect(out.counterexample![0].values()).toEqual([11]);
    });

    it('should be able to shrink two unrelated arbitraries', () => {
      const natArb = fc.nat();
      const out = fc.check(
        fc.property(fc.auto(), (auto) => {
          const v1 = auto(natArb);
          const v2 = auto(natArb); // unrelated because does not depend on v1
          expect(v1).toBeLessThanOrEqual(v2);
        }),
        { seed: seed }
      );
      expect(out.failed).toBe(true);
      expect(out.counterexample![0].values()).toEqual([1, 0]);
    });

    it('should be able to shrink two related arbitraries', () => {
      const natArb = fc.nat(100);
      const squareArbs = new Map<number, fc.Arbitrary<number[][]>>();
      const buildSquareArb = (size: number) => {
        if (squareArbs.has(size)) {
          return squareArbs.get(size)!;
        }
        const arb = fc.array(fc.array(fc.nat(), { minLength: size, maxLength: size }), {
          minLength: size,
          maxLength: size,
        });
        squareArbs.set(size, arb);
        return arb;
      };
      const out = fc.check(
        fc.property(fc.auto(), (auto) => {
          const v1 = auto(natArb);
          const v2 = auto(buildSquareArb(v1));
          const surface = v2.length !== 0 ? v2.length * v2[0].length : 0;
          expect(surface).toBeLessThanOrEqual(8);
        }),
        { seed: seed }
      );
      expect(out.failed).toBe(true);
      expect(out.counterexample![0].values()).toEqual([
        3,
        [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ],
      ]);
    });

    it('should be able to shrink two related arbitraries with changing branches', () => {
      const integerArb = fc.integer();
      const stringArb = fc.string();
      const out = fc.check(
        fc.property(fc.auto(), (auto) => {
          const v1 = auto(integerArb);
          if (v1 < 0) {
            const v2 = auto(integerArb);
            const v3 = auto(integerArb);
            return typeof v2 === 'number' && typeof v3 === 'number'; // success
          }
          const v2 = auto(stringArb);
          expect(v2.length).toBeGreaterThanOrEqual(v1);
        }),
        { seed: seed }
      );
      expect(out.failed).toBe(true);
      expect(out.counterexample![0].values()).toEqual([1, '']);
    });

    it('should be able to shrink arbitraries built out of for loops', () => {
      const natArb = fc.nat(10); // Maximum call stack size exceeded for 100
      const out = fc.check(
        fc.property(fc.auto(), (auto) => {
          const width = auto(natArb);
          const height = auto(natArb);
          const grid: number[][] = [];
          for (let i = 0; i !== width; ++i) {
            const line: number[] = [];
            for (let j = 0; j !== height; ++j) {
              line.push(auto(natArb));
            }
            grid.push(line);
          }
          const allValues = grid.flat();
          const allValuesUnique = [...new Set(allValues)];
          expect(allValuesUnique).toEqual(allValues);
        }),
        { seed: seed }
      );
      expect(out.failed).toBe(true);
      const values = out.counterexample![0].values() as number[];
      expect(values[0] * values[1]).toBe(2);
      expect(values.slice(2)).toEqual([0, 0]);
    });

    it('should be able to be used in conjonction with other arbitraries', () => {
      const integerArbs = new Map<string, fc.Arbitrary<number>>();
      const buildIntegerArb = (constraints: Pick<fc.IntegerConstraints, 'min' | 'max'>) => {
        const key = `min:${constraints.min},max:${constraints.max}`;
        if (integerArbs.has(key)) {
          return integerArbs.get(key)!;
        }
        const arb = fc.integer(constraints);
        integerArbs.set(key, arb);
        return arb;
      };
      const out = fc.check(
        fc.property(fc.integer({ min: 0, max: 1000 }), fc.auto(), fc.integer({ min: 0, max: 1000 }), (a, auto, b) => {
          const min = Math.min(a, b);
          const max = Math.max(a, b);
          const value = auto(buildIntegerArb({ min, max }));
          expect(value).toBeGreaterThanOrEqual((min + max) / 2);
        }),
        { seed: seed }
      );
      expect(out.failed).toBe(true);
      expect(out.counterexample![1].values()).toBe([Math.min(out.counterexample![0], out.counterexample![2])]);
    });
  });
});
