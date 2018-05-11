import * as assert from 'assert';
import * as fc from '../../../src/fast-check';

const seed = Date.now();
describe(`ArrayArbitrary (seed: ${seed})`, () => {
  describe('array', () => {
    it('Should shrink on the size of the array', () => {
      const out = fc.check(fc.property(fc.array(fc.nat()), (arr: number[]) => arr.length < 2), { seed: seed });
      assert.ok(out.failed, 'Should have failed');
      assert.notEqual(out.counterexample, null, 'Should come with a counterexample');
      assert.deepEqual(out.counterexample![0].length, 2, 'Should shrink to counterexample an array of size 2');
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
      assert.equal(out.counterexample![0].length, 1, 'Should shrink to a counterexample having a single element');
      assert.equal(numSuggests, 1, 'Should have suggested [] only once');
    });
    it('Should be biased by default and suggest small entries', () => {
      // Falsy implementation of removeDuplicates
      const removeDuplicates = (arr: number[]) => [...arr];
      // Expect a failure
      const out = fc.check(
        fc.property(fc.array(fc.integer()), (arr: number[]) => {
          const filtered = removeDuplicates(arr);
          for (const v of filtered) {
            if (filtered.filter(i => i === v).length > 1) return false; // duplicates detected
          }
          return true;
        }),
        { seed, numRuns: 1000 } // increased numRuns to remove flakiness
      );
      assert.ok(out.failed, 'Should have failed');
      assert.equal(out.counterexample![0].length, 2, 'Should provide a counterexample having only two values');
      assert.strictEqual(
        out.counterexample![0][0],
        out.counterexample![0][1],
        'Should have equal values in counterexample'
      );
    });
    it('Should not be able to find the issue if unbiased (barely impossible)', () => {
      // Falsy implementation of removeDuplicates
      const removeDuplicates = (arr: number[]) => [...arr];
      // Expect a failure
      const out = fc.check(
        fc.property(fc.array(fc.integer()), (arr: number[]) => {
          const filtered = removeDuplicates(arr);
          for (const v of filtered) {
            if (filtered.filter(i => i === v).length > 1) return false; // duplicates detected
          }
          return true;
        }),
        { seed, unbiased: true }
      );
      assert.ok(!out.failed, 'Should not have failed');
    });
  });
});
