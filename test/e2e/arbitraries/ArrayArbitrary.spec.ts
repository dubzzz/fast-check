import * as fc from '../../../src/fast-check';
declare function BigInt(n: number | bigint | string): bigint;

const seed = Date.now();
describe(`ArrayArbitrary (seed: ${seed})`, () => {
  describe('array', () => {
    it('Should shrink on the size of the array', () => {
      const out = fc.check(fc.property(fc.array(fc.nat()), (arr: number[]) => arr.length < 2), { seed: seed });
      expect(out.failed).toBe(true);
      expect(out.counterexample).not.toBe(null);
      expect(out.counterexample![0]).toHaveLength(2);
    });
    it('Should shrink on the content of the array', () => {
      const out = fc.check(fc.property(fc.array(fc.integer(3, 10)), (arr: number[]) => arr.length < 2), { seed: seed });
      expect(out.failed).toBe(true);
      expect(out.counterexample).toEqual([[3, 3]]);
    });
    it('Should shrink removing unecessary entries in the array', () => {
      const out = fc.check(
        fc.property(fc.array(fc.integer(0, 10)), (arr: number[]) => arr.filter(v => v >= 5).length < 2),
        { seed: seed }
      );
      expect(out.failed).toBe(true);
      expect(out.counterexample).toEqual([[5, 5]]);
    });
    it('Should not suggest multiple times the empty array (after first failure)', () => {
      let failedOnce = false;
      let numEmptyArrays = 0;
      const out = fc.check(
        fc.property(fc.array(fc.integer()), (arr: number[]) => {
          if (failedOnce && arr.length === 0) ++numEmptyArrays;
          if (arr.length === 0) return true;
          failedOnce = true;
          return false;
        }),
        { seed }
      );
      expect(out.failed).toBe(true);
      expect(out.counterexample![0]).toHaveLength(1);
      expect(numEmptyArrays).toEqual(1);
    });
    biasIts('integer', fc.integer());
    if (typeof BigInt !== 'undefined') {
      biasIts('bigint', fc.bigIntN(64));
    }
  });
});

function biasIts<T>(label: string, arb: fc.Arbitrary<T>) {
  it(`Should be biased by default and suggest small entries [${label}]`, () => {
    // Falsy implementation of removeDuplicates
    const removeDuplicates = (arr: T[]) => [...arr];
    // Expect a failure
    const out = fc.check(
      fc.property(fc.array(arb), (arr: T[]) => {
        const filtered = removeDuplicates(arr);
        for (const v of filtered) {
          if (filtered.filter(i => i === v).length > 1) return false; // duplicates detected
        }
        return true;
      }),
      { seed, numRuns: 5000 } // increased numRuns to remove flakiness
    );
    expect(out.failed).toBe(true);
    expect(out.counterexample![0]).toHaveLength(2);
    expect(out.counterexample![0][0]).toStrictEqual(out.counterexample![0][1]);
  });
  it(`Should not be able to find the issue if unbiased (barely impossible) [${label}]`, () => {
    // Falsy implementation of removeDuplicates
    const removeDuplicates = (arr: T[]) => [...arr];
    // Expect a failure
    const out = fc.check(
      fc.property(fc.array(arb), (arr: T[]) => {
        const filtered = removeDuplicates(arr);
        for (const v of filtered) {
          if (filtered.filter(i => i === v).length > 1) return false; // duplicates detected
        }
        return true;
      }),
      { seed, unbiased: true }
    );
    expect(out.failed).toBe(false);
  });
}
