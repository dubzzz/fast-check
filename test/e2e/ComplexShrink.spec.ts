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

    it('bound5', () => {
      const sum16 = (a: number, b: number): number => {
        let s = a + b;
        while (s > 32767) s -= 65536;
        while (s < -32768) s += 65536;
        return s;
      };
      const int16Arb = fc.integer({ min: -32768, max: 32767 });
      const boundedListsArb = fc.array(int16Arb, { maxLength: 1 }).filter((x) => x.reduce(sum16, 0) < 256);

      const out = fc.check(
        fc.property(
          fc.tuple(boundedListsArb, boundedListsArb, boundedListsArb, boundedListsArb, boundedListsArb),
          (p) => {
            return flat(p).reduce(sum16, 0) < 5 * 256;
          }
        ),
        { seed }
      );

      // > should find the failure
      expect(out.failed).toBe(true);

      // > should find a barely minimal failing case
      //const [minimal] = out.counterexample!;
      //expect(flat(minimal)).toHaveLength(2);
    });

    it('coupling', () => {
      const out = fc.check(
        fc.property(fc.array(fc.nat(10)), (ls) => {
          fc.pre(ls.every((v) => v < ls.length));
          for (let i = 0; i !== ls.length; ++i) {
            const j = ls[i];
            if (i !== j) {
              expect(ls[j]).not.toBe(i);
            }
          }
        }),
        { seed }
      );

      // > should find the failure
      expect(out.failed).toBe(true);

      // > should find a barely minimal failing case
      //const [minimal] = out.counterexample!;
      //expect(minimal).toHaveLength(2);

      // > should find the minimal failing case
      //expect(minimal).toEqual([1, 0]);
    });

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

    it('lengthlist', () => {
      const out = fc.check(
        fc.property(
          fc.integer(1, 100).chain((n) => fc.array(fc.nat(1000), { minLength: n, maxLength: n })),
          (ls) => {
            return ls.reduce((a, b) => Math.max(a, b), 0) < 900;
          }
        ),
        { seed }
      );

      // > should find the failure
      expect(out.failed).toBe(true);

      // > should find a barely minimal failing case
      //const [minimal] = out.counterexample!;
      //expect(minimal.reduce((a, b) => a + b)).toBe(900);

      // > should find the minimal failing case
      //expect(minimal).toEqual([900]);
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
