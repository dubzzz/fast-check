import * as fc from '../../../src/fast-check';
import { seed } from '../seed';

describe(`CharacterArbitrary (seed: ${seed})`, () => {
  describe('fullUnicode', () => {
    it('Should shrink towards a character of size greater than one', () => {
      const out = fc.check(
        fc.property(fc.fullUnicode(), (s: string) => s.length === 1),
        { seed: seed }
      );
      expect(out.failed).toBe(true);
      expect(out.counterexample![0]).toHaveLength(2);
    });
  });
});
