import * as assert from 'assert';
import * as fc from '../../../src/fast-check';

const seed = Date.now();
describe(`Arbitrary (seed: ${seed})`, () => {
  describe('chain', () => {
    it('Should bias nothing', () => {
      const out = fc.check(
        fc.property(
          fc.nat().chain(c => fc.tuple(fc.constant(c), fc.nat())),
          (v: [number, number]) => !(v[0] > 100 && v[1] > 100)
        ),
        { seed: seed }
      );
      assert.ok(out.failed, 'Should have failed');
    });
    it('Should bias source only', () => {
      const out = fc.check(
        fc.property(
          fc.nat().chain(c => fc.tuple(fc.constant(c), fc.nat())),
          (v: [number, number]) => !(v[0] <= 100 && v[1] > 100)
        ),
        { seed: seed }
      );
      assert.ok(out.failed, 'Should have failed');
    });
    it('Should bias destination only', () => {
      const out = fc.check(
        fc.property(
          fc.nat().chain(c => fc.tuple(fc.constant(c), fc.nat())),
          (v: [number, number]) => !(v[0] > 100 && v[1] <= 100)
        ),
        { seed: seed }
      );
      assert.ok(out.failed, 'Should have failed');
    });
    it('Should bias both source and destination', () => {
      const out = fc.check(
        fc.property(
          fc.nat().chain(c => fc.tuple(fc.constant(c), fc.nat())),
          (v: [number, number]) => !(v[0] <= 100 && v[1] <= 100)
        ),
        { seed: seed }
      );
      assert.ok(out.failed, 'Should have failed');
    });
  });
});
