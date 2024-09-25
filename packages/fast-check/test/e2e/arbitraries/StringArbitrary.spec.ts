import { describe, it, expect } from 'vitest';
import * as fc from '../../../src/fast-check';
import { seed } from '../seed';

describe(`StringArbitrary (seed: ${seed})`, () => {
  describe('base64String', () => {
    it('Should shrink on base64 containing no equal signs', () => {
      const out = fc.check(
        fc.property(fc.base64String(), (s: string) => /^\w*$/.exec(s) == null),
        { seed: seed },
      );
      expect(out.failed).toBe(true);
      expect(out.counterexample).toEqual(['']);
    });
    it('Should shrink on base64 containing one equal signs', () => {
      const out = fc.check(
        fc.property(fc.base64String(), (s: string) => /^\w+=$/.exec(s) == null),
        { seed: seed },
      );
      expect(out.failed).toBe(true);
      expect(out.counterexample).toEqual(['AAA=']);
    });
    it('Should shrink on base64 containing two equal signs', () => {
      const out = fc.check(
        fc.property(fc.base64String(), (s: string) => /^\w+==$/.exec(s) == null),
        { seed: seed },
      );
      expect(out.failed).toBe(true);
      expect(out.counterexample).toEqual(['AA==']);
    });
  });
  describe('unicodeString', () => {
    it('Should produce valid UTF-16 strings', () => {
      fc.assert(
        fc.property(fc.unicodeString(), (s: string) => encodeURIComponent(s) !== null),
        { seed: seed },
      );
    });
  });
  describe.each([
    { unit: undefined },
    { unit: 'grapheme' as const },
    { unit: 'grapheme-composite' as const },
    { unit: 'grapheme-ascii' as const },
    { unit: 'binary' as const },
    { unit: 'binary-ascii' as const },
  ])('string(unit:$unit)', ({ unit }) => {
    it('Should produce valid UTF-16 strings', () => {
      fc.assert(
        fc.property(fc.string({ unit }), (s: string) => encodeURIComponent(s) !== null),
        { seed: seed },
      );
    });
  });
});
