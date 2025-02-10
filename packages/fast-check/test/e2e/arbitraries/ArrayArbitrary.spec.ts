import { describe, it, expect } from 'vitest';
import * as fc from '../../../src/fast-check';
import { seed } from '../seed';

describe(`ArrayArbitrary (seed: ${seed})`, () => {
  describe('array', () => {
    it('Should shrink on the size of the array', () => {
      const out = fc.check(
        fc.property(fc.array(fc.nat()), (arr: number[]) => arr.length < 2),
        { seed: seed },
      );
      expect(out.failed).toBe(true);
      expect(out.counterexample).not.toBe(null);
      expect(out.counterexample![0]).toHaveLength(2);
    });
    it('Should shrink on the content of the array', () => {
      const out = fc.check(
        fc.property(fc.array(fc.integer({ min: 3, max: 10 })), (arr: number[]) => arr.length < 2),
        { seed: seed },
      );
      expect(out.failed).toBe(true);
      expect(out.counterexample).toEqual([[3, 3]]);
    });
    it('Should shrink removing unecessary entries in the array', () => {
      const out = fc.check(
        fc.property(fc.array(fc.integer({ min: 0, max: 10 })), (arr: number[]) => arr.filter((v) => v >= 5).length < 2),
        { seed: seed },
      );
      expect(out.failed).toBe(true);
      expect(out.counterexample).toEqual([[5, 5]]);
    });
    biasIts('integer', fc.integer());
    biasIts('bigint', fc.bigInt());
  });
});

function biasIts<T>(label: string, arb: fc.Arbitrary<T>) {
  it(`Should be biased by default and suggest extreme entries more often [${label}]`, () => {
    // When bias is toggled (default), there is a higher chance to geenrate values close to zero
    // but also close to min or max (for numeric types). Here arb is a numeric arbitrary.
    // Falsy implementation of removeDuplicates
    const removeDuplicates = (arr: T[]) => [...arr];
    // Expect a failure
    const out = fc.check(
      fc.property(fc.array(arb), (arr: T[]) => {
        const filtered = removeDuplicates(arr);
        expect(filtered).toHaveLength(new Set(filtered).size); // expect no duplicates (but will find some)
      }),
      { seed, numRuns: 10000 }, // increased numRuns to remove flakiness
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
        expect(filtered).toHaveLength(new Set(filtered).size); // expect no duplicates
      }),
      { seed, unbiased: true },
    );
    expect(out.failed).toBe(false);
  });
}
