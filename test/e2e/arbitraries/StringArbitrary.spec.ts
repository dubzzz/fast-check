import * as fc from '../../../src/fast-check';

const seed = Date.now();
describe(`StringArbitrary (seed: ${seed})`, () => {
  describe('base64String', () => {
    it('Should shrink on base64 containing no equal signs', () => {
      const out = fc.check(fc.property(fc.base64String(), (s: string) => /^\w*$/.exec(s) == null), { seed: seed });
      expect(out.failed).toBe(true);
      expect(out.counterexample).toEqual(['']);
    });
    it('Should shrink on base64 containing one equal signs', () => {
      const out = fc.check(fc.property(fc.base64String(), (s: string) => /^\w+=$/.exec(s) == null), { seed: seed });
      expect(out.failed).toBe(true);
      expect(out.counterexample).toEqual(['AAA=']);
    });
    it('Should shrink on base64 containing two equal signs', () => {
      const out = fc.check(fc.property(fc.base64String(), (s: string) => /^\w+==$/.exec(s) == null), { seed: seed });
      expect(out.failed).toBe(true);
      expect(out.counterexample).toEqual(['AA==']);
    });
  });
  describe('unicodeString', () => {
    it('Should produce valid UTF-16 strings', () => {
      fc.assert(fc.property(fc.unicodeString(), (s: string) => encodeURIComponent(s) !== null), { seed: seed });
    });
  });
  describe('fullUnicodeString', () => {
    it('Should produce valid UTF-16 strings', () => {
      fc.assert(fc.property(fc.fullUnicodeString(), (s: string) => encodeURIComponent(s) !== null), { seed: seed });
    });
  });
  describe('string16bits', () => {
    it('Should be able to produce invalid UTF-16 strings', () => {
      const out = fc.check(fc.property(fc.string16bits(), (s: string) => encodeURIComponent(s) !== null), {
        seed: seed
      });
      expect(out.failed).toBe(true);
      expect(out.counterexample).toEqual(['\ud800']);
    });
  });
  describe('string', () => {
    it('Should not suggest multiple times the empty string (after first failure)', () => {
      let failedOnce = false;
      let numEmptyStringSuggestedByShrink = 0;
      const out = fc.check(
        fc.property(fc.string(), (s: string) => {
          if (failedOnce && s === '') ++numEmptyStringSuggestedByShrink;
          if (s.length === 0) return true;
          failedOnce = true;
          return false;
        }),
        { seed }
      );
      expect(out.failed).toBe(true);
      expect(out.counterexample![0]).toHaveLength(1);
      expect(numEmptyStringSuggestedByShrink).toEqual(1);
    });
  });
});
