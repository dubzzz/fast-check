import { describe, it, expect } from 'vitest';
import * as fc from '../../../src/fast-check';
import { seed } from '../seed';

describe(`SetArbitrary (seed: ${seed})`, () => {
  describe('set', () => {
    it('Should shrink on the size of the set', () => {
      const out = fc.check(
        fc.property(fc.set(fc.nat()), (s: Set<number>) => s.size < 2),
        { seed: seed },
      );
      expect(out.failed).toBe(true);
      expect(out.counterexample).not.toBe(null);
      expect(out.counterexample![0]).toBeInstanceOf(Set);
      expect(out.counterexample![0].size).toBe(2);
    });

    it('Should shrink on the content of the set', () => {
      const out = fc.check(
        fc.property(fc.set(fc.integer({ min: 3, max: 10 })), (s: Set<number>) => s.size < 2),
        { seed: seed },
      );
      expect(out.failed).toBe(true);
      expect(out.counterexample).not.toBe(null);
      expect(out.counterexample![0]).toBeInstanceOf(Set);
      const values = Array.from(out.counterexample![0]).sort();
      expect(values.length).toBe(2);
      expect(values[0]).toBe(3); // Should shrink to smallest value
    });

    it('Should shrink removing unnecessary entries in the set', () => {
      const out = fc.check(
        fc.property(
          fc.set(fc.integer({ min: 0, max: 10 })),
          (s: Set<number>) => Array.from(s).filter((v) => v >= 5).length < 2,
        ),
        { seed: seed },
      );
      expect(out.failed).toBe(true);
      expect(out.counterexample).not.toBe(null);
      expect(out.counterexample![0]).toBeInstanceOf(Set);
      const values = Array.from(out.counterexample![0]).sort();
      const valuesAbove5 = values.filter((v) => v >= 5);
      expect(valuesAbove5.length).toBe(2);
      expect(valuesAbove5[0]).toBe(5); // Should shrink to smallest values >= 5
    });

    it('Should generate sets with unique values using SameValueZero', () => {
      // NaN should be treated as equal to itself (SameValueZero)
      // -0 and +0 should be treated as equal (SameValueZero)
      const out = fc.check(
        fc.property(fc.set(fc.constantFrom(-0, 0, Number.NaN, 1, 2)), (s: Set<number>) => {
          const arr = Array.from(s);
          // Check that we don't have duplicates based on SameValueZero
          const uniqueSet = new Set(arr);
          return arr.length === uniqueSet.size;
        }),
        { seed: seed },
      );
      expect(out.failed).toBe(false);
    });

    it('Should respect minLength constraint', () => {
      const out = fc.check(
        fc.property(fc.set(fc.nat(), { minLength: 5 }), (s: Set<number>) => s.size >= 5),
        { seed: seed },
      );
      expect(out.failed).toBe(false);
    });

    it('Should respect maxLength constraint', () => {
      const out = fc.check(
        fc.property(fc.set(fc.nat(), { maxLength: 10 }), (s: Set<number>) => s.size <= 10),
        { seed: seed },
      );
      expect(out.failed).toBe(false);
    });

    it('Should respect both minLength and maxLength constraints', () => {
      const out = fc.check(
        fc.property(fc.set(fc.nat(), { minLength: 3, maxLength: 7 }), (s: Set<number>) => s.size >= 3 && s.size <= 7),
        { seed: seed },
      );
      expect(out.failed).toBe(false);
    });
  });
});
