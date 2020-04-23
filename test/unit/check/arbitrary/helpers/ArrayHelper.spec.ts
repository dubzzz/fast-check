import * as fc from '../../../../../lib/fast-check';
import { findOrUndefined } from '../../../../../src/check/arbitrary/helpers/ArrayHelper';

describe('ArrayHelper', () => {
  describe('findOrUndefined', () => {
    it('should return undefined for empty array', () => {
      expect(
        findOrUndefined<number>([], () => {
          throw new Error('⊥');
        })
      ).toBe(undefined);
    });
    it('should return a matching element', () => {
      fc.assert(
        fc.property(fc.array(fc.integer()), fc.integer(), fc.array(fc.integer()), (prefix, e, suffix) => {
          expect(findOrUndefined<number>([...prefix, e, ...suffix], x => x === e)).toBe(e);
        })
      );
    });
    it('should return undefined when not present', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer(0, 100)),
          fc.integer(-100, -1),
          fc.array(fc.integer(0, 100)),
          (prefix, e, suffix) => {
            expect(findOrUndefined<number>([...prefix, ...suffix], x => x === e)).toBe(undefined);
          }
        )
      );
    });
    it('should pass some simple examples', () => {
      expect(findOrUndefined<number>([7, 8, 2, 1], x => x < 3)).toBe(2);
      expect(findOrUndefined<number>([12, 8, -1], x => x < 3)).toBe(-1);
      expect(findOrUndefined<number>([3], x => x > 10)).toBe(undefined);
      expect(findOrUndefined<number>([], x => x > 10)).toBe(undefined);
    });
    it('should be consistent with Array.prototype.indexOf', () => {
      fc.assert(
        fc.property(fc.array(fc.integer(1, 200)), fc.integer(1, 200), (xs, x) => {
          expect(findOrUndefined<number>(xs, a => a === x) === undefined).toBe(xs.indexOf(x) === -1);
        })
      );
    });
  });
});
