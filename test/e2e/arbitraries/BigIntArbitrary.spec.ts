import * as assert from 'assert';
import * as fc from '../../../src/fast-check';
declare function BigInt(n: number | bigint | string): bigint;

const seed = Date.now();
describe(`BigIntArbitrary (seed: ${seed})`, () => {
  if (typeof BigInt === 'undefined') {
    return;
  }
  describe('bitIntN', () => {
    it('Should be able to generate bigint above the highest positive double', () => {
      const out = fc.check(fc.property(fc.bigIntN(1030), v => Number(v) !== Number.POSITIVE_INFINITY), { seed: seed });
      assert.ok(out.failed, 'Should have failed');

      const bInt = out.counterexample![0];
      assert.ok(Number(bInt) === Number.POSITIVE_INFINITY);
      assert.ok(Number(bInt - BigInt(1)) !== Number.POSITIVE_INFINITY);
    });
    it('Should be able to generate bigint below the smallest negative double', () => {
      const out = fc.check(fc.property(fc.bigIntN(1030), v => Number(v) !== Number.NEGATIVE_INFINITY), { seed: seed });
      assert.ok(out.failed, 'Should have failed');

      const bInt = out.counterexample![0];
      assert.ok(Number(bInt) === Number.NEGATIVE_INFINITY);
      assert.ok(Number(bInt + BigInt(1)) !== Number.NEGATIVE_INFINITY);
    });
    it('Should be able to generate small bigint (relatively to maximal bigint asked)', () => {
      const out = fc.check(
        fc.property(fc.bigIntN(1030), v => Number(v) < Number.MIN_SAFE_INTEGER || Number(v) > Number.MAX_SAFE_INTEGER),
        { seed: seed }
      );
      assert.ok(out.failed, 'Should have failed');
      assert.strictEqual(out.counterexample![0], BigInt(0));
    });
    it('Should not be able to generate small bigint if not biased (very improbable)', () => {
      const out = fc.check(
        fc.property(
          fc.bigIntN(1030).noBias(),
          v => Number(v) < Number.MIN_SAFE_INTEGER || Number(v) > Number.MAX_SAFE_INTEGER
        ),
        { seed: seed }
      );
      assert.ok(!out.failed, 'Should have succeeded');
    });
  });
});
