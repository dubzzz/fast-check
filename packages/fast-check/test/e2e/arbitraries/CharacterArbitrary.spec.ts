import { describe, it, expect } from 'vitest';
import * as fc from '../../../src/fast-check';
import { seed } from '../seed';

describe(`CharacterArbitrary (seed: ${seed})`, () => {
  describe("string({ unit: 'binary' })", () => {
    it('should be able to shrink towards a string made of several code-units', () => {
      const out = fc.check(
        fc.property(fc.string({ unit: 'binary', minLength: 1, maxLength: 1 }), (s: string) => {
          return s.length === 1;
        }),
        { seed: seed },
      );
      expect(out.failed).toBe(true);
      expect(out.counterexample![0]).toHaveLength(2);
    });
  });

  describe("string({ unit: 'grapheme-composite' })", () => {
    it('should be able to shrink towards a string made of several code-units', () => {
      const out = fc.check(
        fc.property(fc.string({ unit: 'grapheme-composite', minLength: 1, maxLength: 1 }), (s: string) => {
          return s.length === 1;
        }),
        { seed: seed },
      );
      expect(out.failed).toBe(true);
      expect(out.counterexample![0]).toHaveLength(2);
    });
  });

  describe("string({ unit: 'grapheme' })", () => {
    it('should be able to shrink towards a string made of several code-points', () => {
      const out = fc.check(
        fc.property(fc.string({ unit: 'grapheme', minLength: 1, maxLength: 1 }), (s: string) => {
          return [...s].length === 1;
        }),
        { seed: seed },
      );
      expect(out.failed).toBe(true);
      expect(out.counterexample![0].length).toBeGreaterThan(1); // several code-units
      expect([...out.counterexample![0]].length).toBeGreaterThan(1); // several code-points
    });
  });
});
