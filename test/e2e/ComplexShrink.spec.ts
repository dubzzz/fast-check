import * as fc from '../../src/fast-check';
import { seed } from './seed';

describe(`ComplexShrink (seed: ${seed})`, () => {
  it('Should shrink two integers linked by a non-symmetric relation', () => {
    // In fast-check version 2.11.0 and before, this shrinking scenario
    // was causing barely infinite shrink. Some runs may take hours too end.
    //
    // The shrinker of integer was the root cause: it did not apply a full
    // dichotomy but instead starts with something close to a dichotomy then
    // stops. The main reason behind was that the context passed from one shrink level
    // to another was a simple boolean value only telling if we already shrunk once.
    //
    // Here are the first steps of the shrinker:
    //
    // × [2147483642,2147483641]        <--- shrinker tries to shrink 2147483642
    // . √ [0,2147483641]                    and knew that it never shrunk before
    // . √ [1073741821,2147483641]           so it tried with 0 on first try
    // . √ [1610612732,2147483641]
    // . √ [1879048187,2147483641]
    // . √ ...
    // . √ [2147482619,2147483641]
    // . × [2147483131,2147483641]      <--- shrinker tries to shrink 2147483131
    // . . √ [1073741566,2147483641]         but completely omit what has been discovered
    // . . √ [1610612349,2147483641]         during the first shrinks (the ones computed for 2147483642)
    // . . √ [1879047740,2147483641]
    // . . √ ...
    // . . √ [2147482620,2147483641]
    // . . × [2147482876,2147483641]
    // . . . √ [1073741438,2147483641]
    // . . . √ [1610612157,2147483641]
    // . . . √ [1879047517,2147483641]
    // . . . √ ...
    // . . . √ [2147482621,2147483641]
    // . . . × [2147482749,2147483641]
    // ...                              <--- and so on and so forth until we reach 1000,1010
    //
    // While it was able to reach and report the precise minimal failing case,
    // the shrinker was too slow to be useful (given the range of values generated).
    const MaximalValue = 1000000;
    const out = fc.check(
      fc.property(fc.nat(MaximalValue), fc.nat(MaximalValue), (a: number, b: number) => {
        if (a < 1000) return true;
        if (b < 1000) return true;
        if (b < a) return true;
        if (Math.abs(a - b) < 10) return true;
        return b - a >= 1000;
      }),
      // We increase numRuns to avoid flakiness in the CI
      { seed, numRuns: 5000 }
    );

    // > should find the failure
    expect(out.failed).toBe(true);

    // > should find a barely minimal failing case
    // Such failing case is a local minimum. Reaching a difference
    // of 10 already proves that the shrinker did part of the job.
    const minimal = out.counterexample!;
    expect(minimal[1] - minimal[0]).toBe(10);

    // > should find the minimal failing case
    // Reaching this minimal case requires advanced shrinker logic
    // It implies a shrinker able to shrink on two values at the same time
    expect(minimal).toEqual([1000, 1010]);
  });
  it('Should shrink two integers linked by a symmetric relation', () => {
    // Very similar to the case above except that this time
    // if (a, b) fails, (b, a) will also fail.
    const MaximalValue = 1000000;
    const out = fc.check(
      fc.property(fc.nat(MaximalValue), fc.nat(MaximalValue), (a: number, b: number) => {
        if (a < 1000) return true;
        if (b < 1000) return true;
        if (Math.abs(a - b) < 10) return true;
        return Math.abs(a - b) >= 1000;
      }),
      // We increase numRuns to avoid flakiness in the CI
      { seed, numRuns: 5000 }
    );

    // > should find the failure
    expect(out.failed).toBe(true);

    // > should find a barely minimal failing case
    // Such failing case is a local minimum. Reaching a difference
    // of 10 already proves that the shrinker did part of the job.
    const [a, b] = out.counterexample!;
    const minimal = a < b ? [a, b] : [b, a];
    expect(Math.abs(minimal[1] - minimal[0])).toBe(10);

    // > should find the minimal failing case
    // Reaching this minimal case requires advanced shrinker logic
    // It implies a shrinker able to shrink on two values at the same time
    expect(minimal).toEqual([1000, 1010]);
  });

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
