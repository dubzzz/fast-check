import * as assert from 'assert';
import fc from '../../../src/fast-check';

const seed = Date.now();
describe(`ArrayArbitrary (seed: ${seed})`, () => {
  describe('array', () => {
    it('Should shrink on the size of the array', () => {
      const out = fc.check(fc.property(fc.array(fc.nat()), (arr: number[]) => arr.length < 2), { seed: seed });
      assert.ok(out.failed, 'Should have failed');
      if (out.counterexample) {
        assert.deepEqual(out.counterexample[0].length, 2, 'Should shrink to counterexample an array of size 2');
      } else {
        assert.fail();
      }
    });
    it('Should shrink on the content of the array', () => {
      const out = fc.check(fc.property(fc.array(fc.integer(3, 10)), (arr: number[]) => arr.length < 2), { seed: seed });
      assert.ok(out.failed, 'Should have failed');
      assert.deepEqual(out.counterexample, [[3, 3]], 'Should shrink to counterexample [3,3]');
    });
    it('Should shrink removing unecessary entries in the array', () => {
      const out = fc.check(
        fc.property(fc.array(fc.integer(0, 10)), (arr: number[]) => arr.filter(v => v >= 5).length < 2),
        { seed: seed }
      );
      assert.ok(out.failed, 'Should have failed');
      assert.deepEqual(out.counterexample, [[5, 5]], 'Should shrink to counterexample [5,5]');
    });
    it('Should not suggest multiple times the empty array (after first failure)', () => {
      let failedOnce = false;
      let numSuggests = 0;
      const out = fc.check(
        fc.property(fc.array(fc.integer()), (arr: number[]) => {
          if (failedOnce && arr.length === 0) ++numSuggests;
          if (arr.length === 0) return true;
          failedOnce = true;
          return false;
        }),
        { seed }
      );
      assert.ok(out.failed, 'Should have failed');
      assert.equal(out.counterexample[0].length, 1, 'Should shrink to a counterexample having a single element');
      assert.equal(numSuggests, 1, 'Should have suggested [] only once');
    });
  });
});
