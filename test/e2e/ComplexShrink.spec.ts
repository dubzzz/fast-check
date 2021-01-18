import * as fc from '../../src/fast-check';
import { seed } from './seed';

describe(`ComplexShrink (seed: ${seed})`, () => {
  describe('Examples from jlink/shrinking-challenge', () => {
    // Those examples are taken from https://github.com/jlink/shrinking-challenge
    //
    // They have been added into the test suite in order to check that upcoming developments
    // do not introduce regressions on the shrinkers of fast-check.

    function flat<T>(arr: T[][]): T[] {
      return arr.reduce((acc, cur) => [...acc, ...cur], []);
    }

    it('distinct', () => {
      const out = fc.check(
        fc.property(fc.array(fc.integer()), (ls) => {
          return new Set(ls).size < 3;
        }),
        { seed }
      );

      // > should find the failure
      expect(out.failed).toBe(true);

      // > should find a barely minimal failing case
      const [minimal] = out.counterexample!;
      expect(minimal).toHaveLength(3);

      // > should find the minimal failing case
      // Either [0, 1, -1] or [0, 1, 2]
      const ordered = minimal.sort((a, b) => a - b);
      expect(ordered).toContain(0);
      for (let index = 1; index !== ordered.length; ++index) {
        expect(ordered[index]).toBe(ordered[index - 1] + 1);
      }
    });

    it('large_union_list', () => {
      const out = fc.check(
        fc.property(fc.array(fc.array(fc.integer())), (ls) => {
          return new Set(flat(ls)).size < 5;
        }),
        { seed }
      );

      // > should find the failure
      expect(out.failed).toBe(true);

      // > should find a barely minimal failing case
      const [minimal] = out.counterexample!;
      expect(flat(minimal)).toHaveLength(5);

      // > should find the minimal failing case
      // Either [0, 1, -1, 2, -2] or [0], [1], [-1], [2], [-2] or [0, 1, 2, 3, 4]
      const ordered = flat(minimal).sort((a, b) => a - b);
      expect(ordered).toContainEqual(0);
      for (let index = 1; index !== ordered.length; ++index) {
        expect(ordered[index]).toBe(ordered[index - 1] + 1);
      }
    });

    it('nestedlists', () => {
      const out = fc.check(
        fc.property(fc.array(fc.array(fc.constant(0))), (ls) => {
          return ls.map((l) => l.length).reduce((a, b) => a + b, 0) <= 10;
        }),
        { seed }
      );

      // > should find the failure
      expect(out.failed).toBe(true);

      // > should find a barely minimal failing case
      const [minimal] = out.counterexample!;
      expect(flat(minimal)).toHaveLength(11);

      // > should find the minimal failing case
      //expect(minimal).toHaveLength(1);
      //expect(minimal[0]).toHaveLength(11);
    });

    it('reverse', () => {
      const out = fc.check(
        fc.property(fc.array(fc.integer()), (ls) => {
          const rev = [...ls].reverse();
          expect(rev).toEqual(ls);
        }),
        { seed }
      );

      // > should find the failure
      expect(out.failed).toBe(true);

      // > should find a barely minimal failing case
      const [minimal] = out.counterexample!;
      expect(minimal).toHaveLength(2);

      // > should find a barely minimal failing case
      expect(minimal).toContain(0);
      expect(Math.abs(minimal[1] - minimal[0])).toEqual(1);

      // > should find the minimal failing case
      //expect(minimal).toEqual([0, 1]);
    });
  });
});
